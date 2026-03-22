import type {
  ImageBlockNode, ErrorBlockNode, Diagnostic, SourceRange, BodyNode, ImageMode,
} from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';
import { positionAt } from './normalizer.js';
import { CONTENT_BLOCK_CLOSE_RE } from './content-block.js';

export const IMAGE_MODES = ['*>wrap', '*>', '*<wrap', '*<'] as const;
// Atenção crítica: *>wrap e *<wrap DEVEM ser testados antes de *> e *<
// A ordem deste array é a ordem de tentativa no parser

export const IMAGE_BLOCK_OPEN_RE =
  /^\|>(\*>wrap|\*>|\*<wrap|\*<)(?:\s+\[(.*?)\])?\s+!\[(.*?)\]\((.*?)\)$/;

export interface ImageBlockParseResult {
  node:          ImageBlockNode | ErrorBlockNode;
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

export function isImageBlockStart(line: string): boolean {
  // Quick prefix check, then try the full regex
  if (!line.startsWith('|>*')) return false;
  return IMAGE_BLOCK_OPEN_RE.test(line) || isImageBlockWithErrors(line);
}

/**
 * Detect image block lines that have valid mode prefix but may have errors
 * (missing image, invalid mode, etc.)
 */
function isImageBlockWithErrors(line: string): boolean {
  if (!line.startsWith('|>*')) return false;
  // Check if any valid mode prefix matches
  for (const mode of IMAGE_MODES) {
    if (line.startsWith('|>' + mode)) return true;
  }
  // Has |>* prefix but no valid mode → IMAGE_INVALID_MODE
  return true;
}

export function parseImageBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): ImageBlockParseResult {
  const diagnostics: Diagnostic[] = [];
  const line = lines[startIndex];

  // Step 1: confirm prefix |>
  // Step 2: extract mode in order: *>wrap, *>, *<wrap, *<
  let mode: ImageMode | null = null;
  let rest = '';

  for (const m of IMAGE_MODES) {
    const prefix = '|>' + m;
    if (line.startsWith(prefix)) {
      mode = m as ImageMode;
      rest = line.slice(prefix.length);
      break;
    }
  }

  if (!mode) {
    // Has |>* but no valid mode
    return makeImageError(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.IMAGE_INVALID_MODE, 'Invalid image mode');
  }

  // Step 3: try to read optional title [...]
  let title: string | null = null;
  let afterTitle = rest.trimStart();

  const titleMatch = /^\[(.*?)\](.*)$/.exec(afterTitle);
  if (titleMatch) {
    title = titleMatch[1];
    afterTitle = titleMatch[2].trimStart();
  }

  // Step 4: locate ![caption](path)
  const imageMatch = /^!\[(.*?)\]\((.*?)\)(.*)$/.exec(afterTitle);
  if (!imageMatch) {
    return makeImageError(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.IMAGE_MISSING, 'Image block has no image reference ![caption](path)');
  }

  const caption = imageMatch[1];
  const src = imageMatch[2];
  const trailing = imageMatch[3].trim();

  // Validate caption
  if (caption === '') {
    return makeImageError(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.IMAGE_NO_CAPTION, 'Image block has empty caption');
  }

  // Validate src
  if (src === '') {
    return makeImageError(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.IMAGE_NO_SRC, 'Image block has empty src path');
  }

  // Step 5: check no second image on the line
  if (/!\[.*?\]\(.*?\)/.test(trailing)) {
    return makeImageError(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.IMAGE_MULTIPLE, 'Image block has multiple images on the same line');
  }

  // Collect body lines until <| or end of file
  const bodyLines: string[] = [];
  const bodyStartIndex = startIndex + 1;
  let closingLine = -1;

  for (let i = bodyStartIndex; i < lines.length; i++) {
    if (CONTENT_BLOCK_CLOSE_RE.test(lines[i])) {
      closingLine = i;
      break;
    }
    // Check for nested block
    if (lines[i].startsWith('|>')) {
      diagnostics.push({
        severity:    'error',
        code:        DiagnosticCode.NESTED_BLOCK,
        message:     'Nested blocks are not allowed',
        position: {
          start: positionAt(i, 0, lineOffsets),
          end:   positionAt(i, lines[i].length, lineOffsets),
        },
        filePath,
        recoverable: false,
      });
      const raw = lines.slice(startIndex, i + 1).join('\n');
      return {
        node: {
          type: 'ErrorBlock',
          raw,
          diagnostics: [...diagnostics],
          position: {
            start: positionAt(startIndex, 0, lineOffsets),
            end:   positionAt(i, lines[i].length, lineOffsets),
          },
        },
        consumedLines: i - startIndex + 1,
        diagnostics,
      };
    }
    bodyLines.push(lines[i]);
  }

  // Block not closed
  if (closingLine === -1) {
    const lastLine = lines.length - 1;
    return makeImageError(lines, startIndex, lastLine, lineOffsets, filePath, diagnostics,
      DiagnosticCode.BLOCK_NOT_CLOSED, 'Image block was not closed with <|');
  }

  const position: SourceRange = {
    start: positionAt(startIndex, 0, lineOffsets),
    end:   positionAt(closingLine, '<|'.length, lineOffsets),
  };

  // Build content from body lines
  const content: BodyNode[] = [];
  if (bodyLines.length > 0) {
    const rawContent = bodyLines.join('\n');
    content.push({
      type: 'MarkdownBlock',
      raw: rawContent,
      position: {
        start: positionAt(bodyStartIndex, 0, lineOffsets),
        end:   positionAt(bodyStartIndex + bodyLines.length - 1, bodyLines[bodyLines.length - 1].length, lineOffsets),
      },
    });
  }

  const node: ImageBlockNode = {
    type: 'ImageBlock',
    mode,
    title,
    caption,
    src,
    content,
    position,
  };

  return {
    node,
    consumedLines: closingLine - startIndex + 1,
    diagnostics,
  };
}

function makeImageError(
  lines:       string[],
  startIndex:  number,
  endIndex:    number,
  lineOffsets: number[],
  filePath:    string,
  diagnostics: Diagnostic[],
  code:        string,
  message:     string
): ImageBlockParseResult {
  const raw = lines.slice(startIndex, endIndex + 1).join('\n');
  const position: SourceRange = {
    start: positionAt(startIndex, 0, lineOffsets),
    end:   positionAt(endIndex, lines[endIndex].length, lineOffsets),
  };

  diagnostics.push({
    severity:    'error',
    code,
    message,
    position,
    filePath,
    recoverable: false,
  });

  return {
    node: {
      type: 'ErrorBlock',
      raw,
      diagnostics: [...diagnostics],
      position,
    },
    consumedLines: endIndex - startIndex + 1,
    diagnostics,
  };
}
