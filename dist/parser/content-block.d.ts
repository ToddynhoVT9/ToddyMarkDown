import type { BodyNode, Diagnostic } from '../types/index.js';
export declare const CONTENT_BLOCK_OPEN_RE: RegExp;
export declare const CONTENT_BLOCK_CLOSE_RE: RegExp;
export declare const TIMELINE_EVENT_RE: RegExp;
export interface ContentBlockParseResult {
    node: BodyNode;
    consumedLines: number;
    diagnostics: Diagnostic[];
}
export declare function isContentBlockStart(line: string): boolean;
export declare function parseContentBlock(lines: string[], startIndex: number, lineOffsets: number[], filePath: string): ContentBlockParseResult;
