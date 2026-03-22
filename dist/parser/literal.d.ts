import type { LiteralBlockNode, Diagnostic } from '../types/index.js';
export interface LiteralBlockParseResult {
    node: LiteralBlockNode;
    consumedLines: number;
    diagnostics: Diagnostic[];
}
/**
 * Check if a line starts a literal block: exactly `/>`
 */
export declare function isLiteralBlockStart(line: string): boolean;
/**
 * Parses a literal block starting at startIndex.
 * Content between /> and <\ is captured as raw text (nothing interpreted).
 * Block without closing → LITERAL_BLOCK_NOT_CLOSED, recoverable: false.
 */
export declare function parseLiteralBlock(lines: string[], startIndex: number, lineOffsets: number[], filePath: string): LiteralBlockParseResult;
