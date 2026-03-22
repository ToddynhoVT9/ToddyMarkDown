import type { FrontmatterFields, Diagnostic, SourceRange } from '../types/index.js';
export interface FrontmatterParseResult {
    fields: FrontmatterFields;
    consumedLines: number;
    diagnostics: Diagnostic[];
    position: SourceRange;
}
/**
 * Parses the frontmatter block from the beginning of a TMD document.
 * Only recognized if the first line is exactly `---`.
 * Does NOT apply defaults — theme and compile absent remain undefined.
 */
export declare function parseFrontmatter(lines: string[], lineOffsets: number[], filePath: string): FrontmatterParseResult;
