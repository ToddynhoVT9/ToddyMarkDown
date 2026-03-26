import { describe, it, expect, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';

describe('compile com custom_css', () => {
  let tmpDirs: string[] = [];
  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('custom_css + allowExternalCSS=false → WARN_CUSTOM_CSS_NOT_ALLOWED em diagnostics', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/valid/custom-css.tmd', { allowExternalCSS: false });
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.some(d => d.code === 'WARN_CUSTOM_CSS_NOT_ALLOWED')).toBe(true);
  });

  it('custom_css + allowExternalCSS=false → HTML sem segundo <link>', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/custom-css.tmd', { allowExternalCSS: false });
    tmpDirs.push(tmpDir);
    const links = html.match(/<link/g) || [];
    expect(links.length).toBe(1);
  });

  it('custom_css + allowExternalCSS=true + arquivo existente → HTML com segundo <link>', async () => {
    const fs = await import('fs');
    fs.writeFileSync('./fixtures/valid/extra.css', 'body { color: red; }');
    const { html, tmpDir } = await compileFixture('./fixtures/valid/custom-css.tmd', { allowExternalCSS: true });
    tmpDirs.push(tmpDir);
    fs.unlinkSync('./fixtures/valid/extra.css');
    
    expect(html).toContain('href="./extra.css"');
  });

  it('custom_css + allowExternalCSS=true + arquivo ausente → WARN_CUSTOM_CSS_NOT_FOUND', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/valid/custom-css.tmd', { allowExternalCSS: true });
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.some(d => d.code === 'WARN_CUSTOM_CSS_NOT_FOUND')).toBe(true);
  });

  it('custom_css + allowExternalCSS=true + arquivo ausente → HTML sem segundo <link>', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/custom-css.tmd', { allowExternalCSS: true });
    tmpDirs.push(tmpDir);
    expect(html).not.toContain('href="./extra.css"');
  });

  it('sem custom_css → sem warnings e sem <link> extra', async () => {
    const { html, result, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.some(d => d.code === 'WARN_CUSTOM_CSS_NOT_ALLOWED' || d.code === 'WARN_CUSTOM_CSS_NOT_FOUND')).toBe(false);
    expect(html).not.toContain('href="./extra.css"');
  });
});
