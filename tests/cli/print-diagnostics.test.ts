import { describe, it, expect, vi } from 'vitest';
import { formatPosition, printCompileResult, printSlugCollision } from '../../src/cli/print-diagnostics.js';
import type { Diagnostic, CompileResult } from '../../src/types/index.js';

describe('print-diagnostics', () => {
  it('formatPosition retorna "linha:coluna" quando position está presente', () => {
    const diag: Diagnostic = {
      severity: 'error',
      code: 'ERR',
      message: 'msg',
      position: { start: { line: 12, column: 0, offset: 0 }, end: { line: 12, column: 5, offset: 5 } },
      filePath: 'test.tmd',
      recoverable: false
    };
    expect(formatPosition(diag)).toBe('12:0');
  });

  it('formatPosition retorna "(sem posição)" quando position é null', () => {
    const diag: Diagnostic = {
      severity: 'error',
      code: 'ERR',
      message: 'msg',
      position: null,
      filePath: 'test.tmd',
      recoverable: false
    };
    expect(formatPosition(diag)).toBe('(sem posição)');
  });

  it('printCompileResult emite [OK] para html e css', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const res: CompileResult = {
      slug: 'test',
      htmlPath: 'dist/test.html',
      cssPath: 'dist/test.css',
      diagnostics: []
    };
    
    printCompileResult(res);
    expect(logSpy).toHaveBeenCalledWith('[OK]   dist/test.html');
    expect(logSpy).toHaveBeenCalledWith('[OK]   dist/test.css');
    
    logSpy.mockRestore();
  });

  it('printCompileResult emite [ERRO] para diagnostics de erro', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const res: CompileResult = {
      slug: 'test',
      htmlPath: 'test.html',
      cssPath: 'test.css',
      diagnostics: [{
        severity: 'error',
        code: 'ERR',
        message: 'erro fatal ai',
        position: { start: { line: 1, column: 5, offset: 0 }, end: { line: 1, column: 5, offset: 0 } },
        filePath: 'test.tmd',
        recoverable: true
      }]
    };
    
    printCompileResult(res);
    expect(errSpy).toHaveBeenCalledWith('[ERRO] test.tmd · 1:5 · erro fatal ai');
    
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('printSlugCollision emite os dois caminhos', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    printSlugCollision('meu-slug', 'primeiro.tmd', 'segundo.tmd');
    
    expect(errSpy).toHaveBeenCalledWith('[ERRO] Colisão de slug: "meu-slug"');
    expect(errSpy).toHaveBeenCalledWith('  → já compilado: primeiro.tmd');
    expect(errSpy).toHaveBeenCalledWith('  → ignorado:     segundo.tmd');
    
    errSpy.mockRestore();
  });
});
