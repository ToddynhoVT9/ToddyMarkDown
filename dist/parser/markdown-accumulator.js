import { positionAt } from './normalizer.js';
const IMAGE_REF_RE = /!\[.*?\]\((.*?)\)/g;
/**
 * Accumulates lines as markdown until encountering |>, />, or end of file.
 * Extracts image references from the accumulated raw text.
 */
export function accumulateMarkdown(lines, startIndex, lineOffsets) {
    const accumulatedLines = [];
    let cursor = startIndex;
    while (cursor < lines.length) {
        const line = lines[cursor];
        // Stop at block openers
        if (line.startsWith('|>') || line === '/>' || line === '<|') {
            break;
        }
        accumulatedLines.push(line);
        cursor++;
    }
    // If nothing accumulated (shouldn't happen in practice), push at least one line
    if (accumulatedLines.length === 0) {
        accumulatedLines.push(lines[startIndex]);
        cursor = startIndex + 1;
    }
    const raw = accumulatedLines.join('\n');
    const lastLine = startIndex + accumulatedLines.length - 1;
    // Extract image references
    const imageRefs = [];
    let match;
    while ((match = IMAGE_REF_RE.exec(raw)) !== null) {
        if (match[1]) {
            imageRefs.push(match[1]);
        }
    }
    return {
        node: {
            type: 'MarkdownBlock',
            raw,
            position: {
                start: positionAt(startIndex, 0, lineOffsets),
                end: positionAt(lastLine, accumulatedLines[accumulatedLines.length - 1].length, lineOffsets),
            },
        },
        consumedLines: accumulatedLines.length,
        imageRefs,
    };
}
