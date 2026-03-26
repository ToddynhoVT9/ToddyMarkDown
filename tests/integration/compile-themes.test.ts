import { describe, it, expect, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';
import fs from 'fs';
import { loadConfig } from '../../src/compiler/config-loader.js';

describe('compile com temas', () => {
  let tmpDirs: string[] = [];
  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('tema ink: CSS contém fundo claro #faf6f0', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-bg: #faf6f0');
  });

  it('tema modern: CSS contém acento violeta #7c6aff', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-accent: #7c6aff');
  });

  it('tema amber: CSS contém acento âmbar #c8913a', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-accent: #c8913a');
  });

  it('frontmatter.theme sobrescreve config.defaultTheme', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd', { defaultTheme: 'essay' });
    tmpDirs.push(tmpDir);
    expect(html).toContain('tmd-theme-modern');
  });

  it('config.defaultTheme usado quando frontmatter.theme ausente', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/sem-frontmatter.tmd', { defaultTheme: 'ink' });
    tmpDirs.push(tmpDir);
    expect(html).toContain('data-theme="ink"');
  });

  it('tema inválido no frontmatter → usa essay', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { tmpDir: fixtureDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    const p = path.join(fixtureDir, 'invalid-theme.tmd');
    fs.writeFileSync(p, '---\ntheme: invalid_theme_xyz\n---\nBla\n');
    
    const { html, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    expect(html).toContain('data-theme="essay"');
  });

  it('tema customizado: CSS gerado com [data-theme="midnight"]', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('[data-theme="midnight"]');
  });

  it('tema customizado: overrides.bg refletido em --tmd-bg no CSS', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-bg: #080810');
  });

  it('tema customizado: overrides.accent refletido em --tmd-accent no CSS', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-accent: #a78bfa');
  });

  it('tema customizado herda vars não sobrescritas do base extends', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-text: #f5f1e8'); 
  });

  it('tema customizado com blocks.warning: CSS contém [data-theme="midnight"] .tmd-block-warning', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toMatch(/\[data-theme="midnight"\]\s+\.tmd-block-warning/);
  });

  it('blocks.warning.border-color gera --tmd-block-border-color no seletor correto', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('--tmd-block-border-color: #e07b3a');
  });

  it('blocks.timeline.marker-color gera background: #c8913a no seletor correto', async () => {
    const rawConfig = loadConfig('./fixtures/valid/tema-custom/.config.tmd.json');
    const { css, tmpDir } = await compileFixture('./fixtures/valid/tema-custom/artigo.tmd', rawConfig);
    tmpDirs.push(tmpDir);
    expect(css).toContain('background: #c8913a;');
  });
});
