import type { Position } from '../types/index.js';
export interface NormalizeResult {
    lines: string[];
    lineOffsets: number[];
}
/**
 * Converte \r\n e \r para \n, retorna lines e lineOffsets.
 * lineOffsets são calculados no source já normalizado (após conversão de quebras).
 * Preserva linhas vazias e indentação.
 */
export declare function normalize(raw: string): NormalizeResult;
/**
 * Helper exportado — usado em todos os sub-parsers.
 * Calcula uma Position a partir de lineIndex (0-based) e column (0-based).
 */
export declare function positionAt(lineIndex: number, // 0-based
column: number, // 0-based
lineOffsets: number[]): Position;
