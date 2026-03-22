import type { LiteralBlockNode, Diagnostic } from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';
import { positionAt } from './normalizer.js';

export interface LiteralBlockParseResult {
  node:          LiteralBlockNode;
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

const LITERAL_OPEN  = /^\/\>$/;
const LITERAL_CLOSE = /^<\\$/;

/**
 * Check if a line starts a literal block: exactly `/>`
 */
export function isLiteralBlockStart(line: string): boolean {
  return LITERAL_OPEN.test(line);
}

/**
 * Parses a literal block starting at startIndex.
 * Content between /> and <\ is captured as raw text (nothing interpreted).
 * Block without closing → LITERAL_BLOCK_NOT_CLOSED, recoverable: false.
 */
export function parseLiteralBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): LiteralBlockParseResult {
  const diagnostics: Diagnostic[] = [];
  const contentLines: string[] = [];

  let closingLine = -1;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (LITERAL_CLOSE.test(lines[i])) {
      closingLine = i;
      break;
    }
    contentLines.push(lines[i]);
  }

  if (closingLine === -1) {
    // Not closed — consume everything from startIndex to end
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (!contentLines.includes(lines[i])) {
        contentLines.push(lines[i]);
      }
    }

    const lastLine = lines.length - 1;
    diagnostics.push({
      severity:    'error',
      code:        DiagnosticCode.LITERAL_BLOCK_NOT_CLOSED,
      message:     'Literal block was not closed with <\\',
      position: {
        start: positionAt(startIndex, 0, lineOffsets),
        end:   positionAt(lastLine, lines[lastLine].length, lineOffsets),
      },
      filePath,
      recoverable: false,
    });

    return {
      node: {
        type: 'LiteralBlock',
        raw:  contentLines.join('\n'),
        position: {
          start: positionAt(startIndex, 0, lineOffsets),
          end:   positionAt(lastLine, lines[lastLine].length, lineOffsets),
        },
      },
      consumedLines: lines.length - startIndex,
      diagnostics,
    };
  }

  return {
    node: {
      type: 'LiteralBlock',
      raw:  contentLines.join('\n'),
      position: {
        start: positionAt(startIndex, 0, lineOffsets),
        end:   positionAt(closingLine, '<\\'.length, lineOffsets),
      },
    },
    consumedLines: closingLine - startIndex + 1,
    diagnostics,
  };
}
