import { normalize, positionAt } from './normalizer.js';
import { parseFrontmatter } from './frontmatter.js';
import { isLiteralBlockStart, parseLiteralBlock } from './literal.js';
import { isEscapedLine } from './escape.js';
import { isContentBlockStart, parseContentBlock, CONTENT_BLOCK_CLOSE_RE } from './content-block.js';
import { isImageBlockStart, parseImageBlock } from './image-block.js';
import { accumulateMarkdown } from './markdown-accumulator.js';
import { DiagnosticCode } from '../types/index.js';
export function parse(raw, filePath) {
    const { lines, lineOffsets } = normalize(raw);
    const diagnostics = [];
    const children = [];
    const assets = [];
    let cursor = 0;
    // etapa 3 — frontmatter
    let frontmatter = {};
    if (lines.length > 0 && lines[0] === '---') {
        const result = parseFrontmatter(lines, lineOffsets, filePath);
        frontmatter = result.fields;
        cursor = result.consumedLines;
        diagnostics.push(...result.diagnostics);
    }
    // etapas 4–5 — varredura completa
    while (cursor < lines.length) {
        const line = lines[cursor];
        // 1. bloco literal
        if (isLiteralBlockStart(line)) {
            const result = parseLiteralBlock(lines, cursor, lineOffsets, filePath);
            children.push(result.node);
            diagnostics.push(...result.diagnostics);
            cursor += result.consumedLines;
            continue;
        }
        // 2. escape
        if (isEscapedLine(line)) {
            cursor++;
            continue;
        }
        // 3. família IMAGEM (antes de conteúdo)
        if (line.startsWith('|>') && isImageBlockStart(line)) {
            const result = parseImageBlock(lines, cursor, lineOffsets, filePath);
            children.push(result.node);
            diagnostics.push(...result.diagnostics);
            if (result.node.type === 'ImageBlock')
                assets.push(result.node.src);
            cursor += result.consumedLines;
            continue;
        }
        // 4. família conteúdo
        if (line.startsWith('|>') && isContentBlockStart(line)) {
            const result = parseContentBlock(lines, cursor, lineOffsets, filePath);
            children.push(result.node);
            diagnostics.push(...result.diagnostics);
            cursor += result.consumedLines;
            continue;
        }
        // 5. fechamento solto <|
        if (CONTENT_BLOCK_CLOSE_RE.test(line)) {
            diagnostics.push({
                severity: 'error',
                code: DiagnosticCode.STRAY_CLOSE,
                message: 'Stray closing tag <| without matching opening block',
                position: {
                    start: positionAt(cursor, 0, lineOffsets),
                    end: positionAt(cursor, 2, lineOffsets),
                },
                filePath,
                recoverable: false,
            });
            cursor++;
            continue;
        }
        // 6. markdown comum
        const result = accumulateMarkdown(lines, cursor, lineOffsets);
        children.push(result.node);
        assets.push(...result.imageRefs);
        cursor += result.consumedLines;
    }
    const document = {
        type: 'Document',
        frontmatter,
        children,
        assets,
    };
    return {
        document,
        diagnostics,
    };
}
