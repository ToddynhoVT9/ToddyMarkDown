import { describe, it, expect, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';

describe('compile fragment', () => {
  let tmpDirs: string[] = [];
  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('HTML não começa com <!DOCTYPE', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(html.trim().startsWith('<!DOCTYPE')).toBe(false);
  });

  it('HTML começa com <article class="tmd-document tmd-theme-modern">', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(html.trim().startsWith('<article class="tmd-document tmd-theme-modern">')).toBe(true);
  });

  it('HTML não contém .tmd-site-header', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(html).not.toContain('class="tmd-site-header"');
  });

  it('HTML não contém localStorage', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(html).not.toContain('localStorage.getItem');
  });

  it('CSS usa .tmd-theme-modern em vez de [data-theme="modern"]', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(css).toContain('.tmd-theme-modern {');
  });

  it('CSS não contém .tmd-theme-btn', async () => {
    const { css, tmpDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    tmpDirs.push(tmpDir);
    expect(css).not.toContain('.tmd-theme-btn');
  });
});
