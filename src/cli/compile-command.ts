import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CompileResult } from '../types/index.js';
import { exitCodeFromDiagnostics } from '../types/index.js';
import { loadConfig } from '../compiler/config-loader.js';
import { compile } from '../compiler/index.js';
import { findTmdFiles } from './find-tmd-files.js';
import { printCompileResult, printFatal, printSlugCollision } from './print-diagnostics.js';
import { parseFrontmatter } from '../parser/frontmatter.js';
import { slugify } from '../compiler/slugify.js';
import { normalize } from '../parser/normalizer.js';

export interface CompileCommandOptions {
  target: string;
  out:    string;
  config?: string;
}

export interface CompileCommandResult {
  filesProcessed:   number;
  filesWithErrors:  number;
  fatalError:       string | null;
  exitCode:         0 | 1 | 2;
}

/**
 * Executa o fluxo principal do comando tmd compile.
 * Agnóstico de process.exit, retorna exitCode explícito.
 */
export async function runCompileCommand(
  options: CompileCommandOptions
): Promise<CompileCommandResult> {
  const { target, out, config: configPath } = options;

  const result: CompileCommandResult = {
    filesProcessed:  0,
    filesWithErrors: 0,
    fatalError:      null,
    exitCode:        0,
  };

  // 1. Validar Alvo
  if (!fs.existsSync(target)) {
    result.fatalError = `Objeto não encontrado: ${target}`;
    result.exitCode = 2;
    return result;
  }

  const stat = fs.statSync(target);

  // 2. Load Config
  let config;
  try {
    config = loadConfig(configPath);
  } catch (err: any) {
    result.fatalError = err.message;
    result.exitCode = 2;
    return result;
  }

  // Se Target for arquivo individual:
  if (stat.isFile()) {
    if (!target.endsWith('.tmd')) {
      result.fatalError = `Arquivo não é .tmd: ${target}`;
      result.exitCode = 2;
      return result;
    }

    const compileRes = await compile({
      tmdPath: path.resolve(target),
      outDir: path.resolve(out),
      config,
    });
    printCompileResult(compileRes);

    result.filesProcessed = 1;
    const errors = compileRes.diagnostics.filter(d => d.severity === 'error');
    if (errors.length > 0) result.filesWithErrors++;
    result.exitCode = exitCodeFromDiagnostics(compileRes.diagnostics);
    return result;
  }

  // Se Target for Diretório:
  let files: string[];
  try {
    files = await findTmdFiles(target);
  } catch (err: any) {
    result.fatalError = err.message;
    result.exitCode = 2;
    return result;
  }

  const slugRegistry = new Map<string, string>(); // slug -> absolute tmdPath

  for (const file of files) {
    // Resolver title sem parse profundo
    const raw = fs.readFileSync(file, 'utf-8');
    const { lines, lineOffsets } = normalize(raw);
    const fmResult = parseFrontmatter(lines, lineOffsets, file);
    const titleSource = fmResult.fields.title ?? path.basename(file, '.tmd');
    const slug = slugify(titleSource);

    // Checar colisões
    if (slugRegistry.has(slug)) {
      const first = slugRegistry.get(slug)!;
      printSlugCollision(slug, first, file);
      result.filesWithErrors++;
      continue;
    }

    // Marca como registrado e compila normal
    slugRegistry.set(slug, file);

    const compileRes = await compile({
      tmdPath: path.resolve(file),
      outDir: path.resolve(out),
      config,
    });
    printCompileResult(compileRes);

    result.filesProcessed++;
    const errors = compileRes.diagnostics.filter(d => d.severity === 'error');
    if (errors.length > 0) result.filesWithErrors++;
  }

  if (result.filesWithErrors > 0) result.exitCode = 1;
  return result;
}
