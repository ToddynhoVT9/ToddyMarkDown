import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CompileResult, Diagnostic, TMDConfig } from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';
import { parse } from '../parser/index.js';
import { resolveConfig } from './config-resolver.js';
import { renderHTML } from './html-renderer.js';
import { generateCSS } from './css-generator.js';
import { processAssets, rewriteAssetPaths } from './asset-handler.js';
import { slugify } from './slugify.js';

export interface CompileOptions {
  tmdPath:  string;     // caminho absoluto do .tmd
  outDir:   string;     // diretório base de saída, ex: /projeto/dist
  config:   TMDConfig;
}

/**
 * Orquestrador principal do compilador.
 * Conecta todos os módulos e produz .html + .css em disco.
 *
 * Nunca chama process.exit — erros fatais propagam como Error.
 * Retorna CompileResult mesmo quando há erros de parsing.
 */
export async function compile(options: CompileOptions): Promise<CompileResult> {
  const { tmdPath, outDir, config } = options;
  const allDiagnostics: Diagnostic[] = [];

  // 1. Ler arquivo .tmd
  const raw = fs.readFileSync(tmdPath, 'utf-8');

  // 2. Parse
  const parseResult = parse(raw, tmdPath);
  allDiagnostics.push(...parseResult.diagnostics);
  const doc = parseResult.document;

  // 3. Resolve config
  const resolvedConfig = resolveConfig(doc.frontmatter, config);

  // 4. Slugify
  const titleSource = doc.frontmatter.title ?? path.basename(tmdPath, '.tmd');
  const slug = slugify(titleSource);

  // 5. Criar outputDir/slug/
  const slugDir = path.join(outDir, slug);
  fs.mkdirSync(slugDir, { recursive: true });

  // 6. Process assets
  const assetResults = await processAssets(doc.assets, tmdPath, slugDir, tmdPath);

  // 7. Coletar diagnostics de assets
  for (const r of assetResults) {
    if (r.diagnostic) allDiagnostics.push(r.diagnostic);
  }

  // 8. Resolver custom_css (nível 3)
  let customCssFile: string | undefined;
  if (doc.frontmatter.custom_css) {
    if (resolvedConfig.allowExternalCSS) {
      const tmdDir = path.dirname(tmdPath);
      const cssAbsolute = path.resolve(tmdDir, doc.frontmatter.custom_css);
      if (fs.existsSync(cssAbsolute)) {
        customCssFile = doc.frontmatter.custom_css;
      } else {
        allDiagnostics.push({
          severity:    'warning',
          code:        DiagnosticCode.WARN_CUSTOM_CSS_NOT_FOUND,
          message:     `Custom CSS file not found: ${doc.frontmatter.custom_css}`,
          position:    null,
          filePath:    tmdPath,
          recoverable: true,
        });
      }
    } else {
      allDiagnostics.push({
        severity:    'warning',
        code:        DiagnosticCode.WARN_CUSTOM_CSS_NOT_ALLOWED,
        message:     'custom_css is present but allowExternalCSS is false in config',
        position:    null,
        filePath:    tmdPath,
        recoverable: true,
      });
    }
  }

  // 9. Render HTML
  const cssFileName = `${slug}.css`;
  const customThemeNames = Object.keys(resolvedConfig.customThemes);
  let html = renderHTML(doc, {
    resolvedConfig,
    title: doc.frontmatter.title ?? slug,
    cssFileName,
    customThemeNames,
    customCssFile,
  });

  // 10. Rewrite asset paths
  html = rewriteAssetPaths(html, assetResults);

  // 11. Generate CSS
  const css = generateCSS({ resolvedConfig });

  // 12-13. Write output files
  const htmlPath = path.join(slugDir, `${slug}.html`);
  const cssPath  = path.join(slugDir, `${slug}.css`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  fs.writeFileSync(cssPath, css, 'utf-8');

  // 14. Return CompileResult
  return {
    slug,
    htmlPath,
    cssPath,
    diagnostics: allDiagnostics,
  };
}
