import { describe, it, expect } from 'vitest';
import { normalize, positionAt } from '../../src/parser/normalizer.js';

describe('normalize', () => {
  it('converte \\r\\n para \\n', () => {
    const { lines } = normalize('a\r\nb');
    expect(lines).toEqual(['a', 'b']);
  });

  it('converte \\r para \\n', () => {
    const { lines } = normalize('a\rb');
    expect(lines).toEqual(['a', 'b']);
  });

  it('preserva linhas vazias', () => {
    const { lines } = normalize('a\n\nb');
    expect(lines).toEqual(['a', '', 'b']);
  });

  it('preserva indentação', () => {
    const { lines } = normalize('  a\n\tb');
    expect(lines).toEqual(['  a', '\tb']);
  });

  it('retorna array de linhas', () => {
    const { lines } = normalize('a\nb\nc');
    expect(lines).toEqual(['a', 'b', 'c']);
  });

  it('lineOffsets[0] === 0 sempre', () => {
    const { lineOffsets } = normalize('abc');
    expect(lineOffsets[0]).toBe(0);
  });

  it('lineOffsets[1] === comprimento da linha 0 + 1 (o \\n)', () => {
    const { lines, lineOffsets } = normalize('abc\ndef');
    expect(lineOffsets[1]).toBe(lines[0].length + 1);
  });

  it('source de uma linha → lineOffsets com um elemento', () => {
    const { lineOffsets } = normalize('abc');
    expect(lineOffsets.length).toBe(1);
  });

  it('positionAt deriva offset, line e column corretamente', () => {
    const { lineOffsets } = normalize('abc\ndef');
    const pos = positionAt(1, 1, lineOffsets);
    expect(pos).toEqual({
      offset: 5, // 'abc\n' is 4 chars. 'd' is offset 4, 'e' is 5.
      line: 2,
      column: 1
    });
  });

  it('positionAt com column === line.length aponta para o \\n (end exclusivo)', () => {
    const { lineOffsets } = normalize('abc\ndef');
    const pos = positionAt(0, 3, lineOffsets);
    expect(pos.offset).toBe(3); // offset 3 is the '\n'
  });

  it('positionAt(0, 0) + positionAt(0, line.length) formam range [start, end) válido para CM6', () => {
    const { lines, lineOffsets } = normalize('abc\ndef');
    const start = positionAt(0, 0, lineOffsets);
    const end = positionAt(0, lines[0].length, lineOffsets);
    expect(start.offset).toBe(0);
    expect(end.offset).toBe(3);
  });
});
