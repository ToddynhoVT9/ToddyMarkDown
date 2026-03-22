import type { MarkdownBlockNode } from '../types/index.js';
export interface MarkdownAccumulateResult {
    node: MarkdownBlockNode;
    consumedLines: number;
    imageRefs: string[];
}
/**
 * Accumulates lines as markdown until encountering |>, />, or end of file.
 * Extracts image references from the accumulated raw text.
 */
export declare function accumulateMarkdown(lines: string[], startIndex: number, lineOffsets: number[]): MarkdownAccumulateResult;
