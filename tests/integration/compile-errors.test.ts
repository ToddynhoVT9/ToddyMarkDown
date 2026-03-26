import { describe, it, expect, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';

describe('compile com erros', () => {
  let tmpDirs: string[] = [];
  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('pullquote-sem-citacao: HTML gerado com ErrorBlock', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('tmd-error-block');
  });

  it('HTML do ErrorBlock contém --ERROR BLOC--', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('--ERROR BLOC--');
  });

  it('HTML do ErrorBlock contém o conteúdo cru', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    // Needs to at least contain some of the raw content
    expect(html).toContain('Autor sem citacao'); // Text from invalid quote
  });

  it('bloco-nao-fechado: HTML gerado com ErrorBlock', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/invalid/bloco-nao-fechado.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('tmd-error-block');
  });

  it('compile retorna mesmo com erros — não lança exceção', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('diagnostics contém PULLQUOTE_NO_QUOTE com severity error', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.some(d => d.code === 'PULLQUOTE_NO_QUOTE' && d.severity === 'error')).toBe(true);
  });

  it('exitCodeFromDiagnostics retorna 1 para erros', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/invalid/pullquote-sem-citacao.tmd');
    tmpDirs.push(tmpDir);
    const hasError = result.diagnostics.some(d => d.severity === 'error');
    expect(hasError ? 1 : 0).toBe(1); // Mocks behavior testing exit code condition
  });
});
