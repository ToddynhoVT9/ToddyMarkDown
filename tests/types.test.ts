import { describe, it, expect } from 'vitest';
import { exitCodeFromDiagnostics } from '../src/types/index.js';
import type { Diagnostic } from '../src/types/index.js';

describe('exitCodeFromDiagnostics', () => {
  it('retorna 0 quando não há erros', () => {
    expect(exitCodeFromDiagnostics([])).toBe(0);
  });

  it('retorna 1 quando há erro com severity error', () => {
    const diagnostics: Diagnostic[] = [
      {
        severity: 'warning',
        code: 'WARN_EMPTY_TITLE',
        message: 'title is empty',
        position: {
          start: { offset: 0, line: 1, column: 0 },
          end:   { offset: 5, line: 1, column: 5 },
        },
        filePath: 'fixtures/valid/basico.tmd',
        recoverable: true,
      },
      {
        severity: 'error',
        code: 'BLOCK_NOT_CLOSED',
        message: 'block not closed',
        position: {
          start: { offset: 50, line: 10, column: 0 },
          end:   { offset: 70, line: 10, column: 20 },
        },
        filePath: 'fixtures/invalid/bloco-nao-fechado.tmd',
        recoverable: false,
      },
    ];
    expect(exitCodeFromDiagnostics(diagnostics)).toBe(1);
  });

  it('retorna 0 quando há apenas warnings', () => {
    const diagnostics: Diagnostic[] = [
      {
        severity: 'warning',
        code: 'WARN_EMPTY_BLOCK',
        message: 'empty block',
        position: null,
        filePath: 'fixtures/valid/basico.tmd',
        recoverable: true,
      },
    ];
    expect(exitCodeFromDiagnostics(diagnostics)).toBe(0);
  });
});
