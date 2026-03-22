import { describe, it, expect } from 'vitest';
import { isEscapedLine, unescapeLine } from '../../src/parser/escape.js';

describe('escape', () => {
  it('detecta linha com \\', () => {
    expect(isEscapedLine('\\/>')).toBe(true);
    expect(isEscapedLine('\\---')).toBe(true);
  });

  it('remove o \\ e retorna o resto', () => {
    expect(unescapeLine('\\/>')).toBe('/>');
    expect(unescapeLine('\\---')).toBe('---');
  });

  it('não detecta linha sem \\', () => {
    expect(isEscapedLine('/>')).toBe(false);
    expect(isEscapedLine('---')).toBe(false);
  });
});
