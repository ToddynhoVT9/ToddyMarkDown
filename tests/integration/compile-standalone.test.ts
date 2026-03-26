import { describe, it, expect, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';
import fs from 'fs';

describe('compile standalone', () => {
  let tmpDirs: string[] = [];
  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('gera slug.html e slug.css em outDir/slug/', async () => {
    const { html, css, tmpDir, result } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(fs.existsSync(result.htmlPath!)).toBe(true);
    expect(fs.existsSync(result.cssPath!)).toBe(true);
    expect(result.slug).toBe('essay-completo');
  });

  it('HTML começa com <!DOCTYPE html>', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('HTML tem data-theme igual ao tema resolvido', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('data-theme="essay"');
  });

  it('HTML tem switcher com 4 botões', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('class="tmd-theme-btn" data-theme-target="essay"');
    expect(html).toContain('class="tmd-theme-btn" data-theme-target="ink"');
    expect(html).toContain('class="tmd-theme-btn" data-theme-target="modern"');
    expect(html).toContain('class="tmd-theme-btn" data-theme-target="amber"');
  });

  it('HTML tem script de localStorage', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('localStorage.getItem');
  });

  it('CSS tem [data-theme="essay"]', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('[data-theme="essay"]');
  });

  it('CSS tem [data-theme] para todos os 4 temas base', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('[data-theme="essay"]');
    expect(css).toContain('[data-theme="ink"]');
    expect(css).toContain('[data-theme="modern"]');
    expect(css).toContain('[data-theme="amber"]');
  });

  it('frontmatter.kicker aparece como .tmd-kicker', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('class="tmd-kicker"');
    expect(html).toContain('Tudo num lugar');
  });

  it('campo ausente não gera elemento vazio no HTML', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/sem-frontmatter.tmd'); 
    tmpDirs.push(tmpDir);
    expect(html).not.toContain('class="tmd-kicker"');
  });

  it('essay-completo.tmd: diagnostics vazio', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(result.diagnostics).toEqual([]);
  });

  it('sem-frontmatter.tmd: usa nome do arquivo como slug', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/valid/sem-frontmatter.tmd');
    tmpDirs.push(tmpDir);
    expect(result.slug).toBe('sem-frontmatter');
  });

  it('sem-frontmatter.tmd: tema padrão = essay', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/sem-frontmatter.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('data-theme="essay"');
  });
});
