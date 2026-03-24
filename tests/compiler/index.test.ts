import { describe, it, expect } from 'vitest';
import { compile, type CompileOptions } from '../../src/compiler/index.js';
import { EMPTY_CONFIG } from '../../src/compiler/config-loader.js';
import { DiagnosticCode } from '../../src/types/index.js';
import type { TMDConfig } from '../../src/types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-compile-'));
}

function writeTmd(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

const BASIC_TMD = `---
title: Teste Basico
author: Autor
theme: essay
compile: standalone
---

Parágrafo de teste.
`;

describe('compile — integração', () => {
  it('basico.tmd: exit 0, gera .html e .css', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'basico.tmd', BASIC_TMD);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });

    expect(result.slug).toBe('teste-basico');
    expect(fs.existsSync(result.htmlPath)).toBe(true);
    expect(fs.existsSync(result.cssPath)).toBe(true);
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([]);

    fs.rmSync(dir, { recursive: true });
  });

  it('frontmatter.theme sobrescreve config.defaultTheme', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\ntheme: ink\n---\nContent.\n`);
    const config: TMDConfig = { ...EMPTY_CONFIG, defaultTheme: 'modern' };

    const result = await compile({ tmdPath, outDir, config });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html).toContain('data-theme="ink"');

    fs.rmSync(dir, { recursive: true });
  });

  it('config.defaultTheme usado quando frontmatter.theme ausente', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\n---\nContent.\n`);
    const config: TMDConfig = { ...EMPTY_CONFIG, defaultTheme: 'amber' };

    const result = await compile({ tmdPath, outDir, config });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html).toContain('data-theme="amber"');

    fs.rmSync(dir, { recursive: true });
  });

  it('padrão essay quando ambos ausentes', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\n---\nContent.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html).toContain('data-theme="essay"');

    fs.rmSync(dir, { recursive: true });
  });

  it('modo fragment: HTML começa com <article>', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\ncompile: fragment\n---\nContent.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html.startsWith('<article')).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });

  it('modo standalone: HTML começa com <!DOCTYPE', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', BASIC_TMD);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });

  it('imagem não encontrada: diagnostic IMAGE_FILE_NOT_FOUND', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\n---\n![foto](./img/nonexist.jpg)\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });

    expect(result.diagnostics.some(d => d.code === DiagnosticCode.IMAGE_FILE_NOT_FOUND)).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });

  it('slug deriva do title do frontmatter', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: O Algoritmo Invisível\n---\nText.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });

    expect(result.slug).toBe('o-algoritmo-invisivel');

    fs.rmSync(dir, { recursive: true });
  });

  it('slug usa nome do arquivo quando title ausente', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'meu-artigo.tmd', `---\nauthor: Alguem\n---\nText.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });

    expect(result.slug).toBe('meu-artigo');

    fs.rmSync(dir, { recursive: true });
  });

  it('custom_css com allowExternalCSS=false → WARN_CUSTOM_CSS_NOT_ALLOWED', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\ncustom_css: ./custom.css\n---\nText.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG, allowExternalCSS: false } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(result.diagnostics.some(d => d.code === DiagnosticCode.WARN_CUSTOM_CSS_NOT_ALLOWED)).toBe(true);
    // No extra <link>
    const linkMatches = html.match(/<link\s/g) || [];
    expect(linkMatches.length).toBe(1);

    fs.rmSync(dir, { recursive: true });
  });

  it('custom_css com allowExternalCSS=true e arquivo existente → <link> extra', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    // Create the custom CSS file
    fs.writeFileSync(path.join(dir, 'custom.css'), 'body { color: red; }', 'utf-8');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\ncustom_css: ./custom.css\n---\nText.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG, allowExternalCSS: true } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    expect(html).toContain('href="./custom.css"');
    const linkMatches = html.match(/<link\s/g) || [];
    expect(linkMatches.length).toBe(2);

    fs.rmSync(dir, { recursive: true });
  });

  it('custom_css com allowExternalCSS=true e arquivo ausente → WARN_CUSTOM_CSS_NOT_FOUND', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', `---\ntitle: Test\ncustom_css: ./nonexist.css\n---\nText.\n`);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG, allowExternalCSS: true } });

    expect(result.diagnostics.some(d => d.code === DiagnosticCode.WARN_CUSTOM_CSS_NOT_FOUND)).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });

  it('ausência de custom_css → nenhum <link> extra, sem warnings', async () => {
    const dir = tmpDir();
    const outDir = path.join(dir, 'dist');
    const tmdPath = writeTmd(dir, 'test.tmd', BASIC_TMD);

    const result = await compile({ tmdPath, outDir, config: { ...EMPTY_CONFIG } });
    const html = fs.readFileSync(result.htmlPath, 'utf-8');

    const linkMatches = html.match(/<link\s/g) || [];
    expect(linkMatches.length).toBe(1);
    expect(result.diagnostics.filter(d =>
      d.code === DiagnosticCode.WARN_CUSTOM_CSS_NOT_FOUND ||
      d.code === DiagnosticCode.WARN_CUSTOM_CSS_NOT_ALLOWED
    )).toEqual([]);

    fs.rmSync(dir, { recursive: true });
  });
});
