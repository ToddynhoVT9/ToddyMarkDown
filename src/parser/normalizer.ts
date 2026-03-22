import type { Position } from '../types/index.js';

export interface NormalizeResult {
  lines:       string[];
  lineOffsets: number[];
  // lineOffsets[i] = offset de caractere do início de lines[i] no source normalizado
  // Exemplo: source "abc\ndef" → lineOffsets = [0, 4]
}

/**
 * Converte \r\n e \r para \n, retorna lines e lineOffsets.
 * lineOffsets são calculados no source já normalizado (após conversão de quebras).
 * Preserva linhas vazias e indentação.
 */
export function normalize(raw: string): NormalizeResult {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const lineOffsets: number[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(offset);
    offset += lines[i].length + 1; // +1 for the \n
  }
  return { lines, lineOffsets };
}

/**
 * Helper exportado — usado em todos os sub-parsers.
 * Calcula uma Position a partir de lineIndex (0-based) e column (0-based).
 */
export function positionAt(
  lineIndex:   number,  // 0-based
  column:      number,  // 0-based
  lineOffsets: number[]
): Position {
  return {
    offset: lineOffsets[lineIndex] + column,
    line:   lineIndex + 1,
    column,
  };
}
