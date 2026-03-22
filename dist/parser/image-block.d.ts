import type { ImageBlockNode, ErrorBlockNode, Diagnostic } from '../types/index.js';
export declare const IMAGE_MODES: readonly ["*>wrap", "*>", "*<wrap", "*<"];
export declare const IMAGE_BLOCK_OPEN_RE: RegExp;
export interface ImageBlockParseResult {
    node: ImageBlockNode | ErrorBlockNode;
    consumedLines: number;
    diagnostics: Diagnostic[];
}
export declare function isImageBlockStart(line: string): boolean;
export declare function parseImageBlock(lines: string[], startIndex: number, lineOffsets: number[], filePath: string): ImageBlockParseResult;
