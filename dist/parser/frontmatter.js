import { DiagnosticCode } from '../types/index.js';
import { positionAt } from './normalizer.js';
const FRONTMATTER_DELIMITER = /^---$/;
const FRONTMATTER_FIELD = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/;
const KNOWN_KEYS = new Set([
    'title', 'subtitle', 'kicker', 'author', 'theme', 'compile', 'custom_css',
]);
/**
 * Parses the frontmatter block from the beginning of a TMD document.
 * Only recognized if the first line is exactly `---`.
 * Does NOT apply defaults — theme and compile absent remain undefined.
 */
export function parseFrontmatter(lines, lineOffsets, filePath) {
    const diagnostics = [];
    const fields = {};
    // The first line must be '---' (caller should verify, but we handle gracefully)
    if (lines.length === 0 || !FRONTMATTER_DELIMITER.test(lines[0])) {
        return {
            fields,
            consumedLines: 0,
            diagnostics,
            position: {
                start: positionAt(0, 0, lineOffsets),
                end: positionAt(0, 0, lineOffsets),
            },
        };
    }
    // Search for the closing ---
    let closingLine = -1;
    for (let i = 1; i < lines.length; i++) {
        if (FRONTMATTER_DELIMITER.test(lines[i])) {
            closingLine = i;
            break;
        }
    }
    if (closingLine === -1) {
        // Frontmatter not closed — consume all lines
        // Parse whatever fields we can find
        for (let i = 1; i < lines.length; i++) {
            parseFrontmatterLine(lines[i], i, fields, diagnostics, lineOffsets, filePath);
        }
        const lastLine = lines.length - 1;
        diagnostics.push({
            severity: 'error',
            code: DiagnosticCode.FRONTMATTER_NOT_CLOSED,
            message: 'Frontmatter block was not closed with ---',
            position: {
                start: positionAt(0, 0, lineOffsets),
                end: positionAt(lastLine, lines[lastLine].length, lineOffsets),
            },
            filePath,
            recoverable: false,
        });
        return {
            fields,
            consumedLines: lines.length,
            diagnostics,
            position: {
                start: positionAt(0, 0, lineOffsets),
                end: positionAt(lastLine, lines[lastLine].length, lineOffsets),
            },
        };
    }
    // Parse fields between the two ---
    for (let i = 1; i < closingLine; i++) {
        parseFrontmatterLine(lines[i], i, fields, diagnostics, lineOffsets, filePath);
    }
    return {
        fields,
        consumedLines: closingLine + 1,
        diagnostics,
        position: {
            start: positionAt(0, 0, lineOffsets),
            end: positionAt(closingLine, '---'.length, lineOffsets),
        },
    };
}
function parseFrontmatterLine(line, lineIndex, fields, diagnostics, lineOffsets, filePath) {
    // Skip empty lines inside frontmatter
    if (line.trim() === '')
        return;
    const match = FRONTMATTER_FIELD.exec(line);
    if (!match)
        return; // Silently ignore malformed lines
    const key = match[1];
    const value = match[2].trim();
    if (!KNOWN_KEYS.has(key)) {
        diagnostics.push({
            severity: 'warning',
            code: DiagnosticCode.WARN_UNKNOWN_FRONTMATTER_KEY,
            message: `Unknown frontmatter key: "${key}"`,
            position: {
                start: positionAt(lineIndex, 0, lineOffsets),
                end: positionAt(lineIndex, line.length, lineOffsets),
            },
            filePath,
            recoverable: true,
        });
        return;
    }
    // Set the field value (don't apply defaults)
    fields[key] = value;
}
