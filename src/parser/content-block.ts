import type {
  BodyNode, Diagnostic, SourceRange,
  ContentBlockNode, PullQuoteBlockNode, TimelineBlockNode,
  ErrorBlockNode, TimelineEventNode, TimelineMarkdownNode,
  MarkdownBlockNode,
} from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';
import { positionAt } from './normalizer.js';

export const CONTENT_BLOCK_OPEN_RE =
  /^\|>(!|@|\$|##|#|\?|\+|~~|&)(?:\s+\[(.*?)\])?$/;

// Matches content block opening with an unclosed title bracket, e.g. |>! [unclosed title
const CONTENT_BLOCK_UNCLOSED_BRACKET_RE =
  /^\|>(!|@|\$|##|#|\?|\+|~~|&)\s+\[(?!.*\]).*$/;

export const CONTENT_BLOCK_CLOSE_RE = /^<\|$/;

export const TIMELINE_EVENT_RE = /^~~\s+(.*?)\s+~~$/;

export interface ContentBlockParseResult {
  node:          BodyNode;
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

const TOKEN_TO_TYPE: Record<string, ContentBlockNode['type']> = {
  '!':  'ExplainerBlock',
  '$':  'AsideBlock',
  '#':  'NoteBlock',
  '##': 'WarningBlock',
  '?':  'QuestionBlock',
  '+':  'TakeawayBlock',
  '&':  'ConceptBlock',
};

export function isContentBlockStart(line: string): boolean {
  return CONTENT_BLOCK_OPEN_RE.test(line) || CONTENT_BLOCK_UNCLOSED_BRACKET_RE.test(line);
}

export function parseContentBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): ContentBlockParseResult {
  const diagnostics: Diagnostic[] = [];
  const line = lines[startIndex];

  // Check for unclosed title bracket first (before the main regex, which won't match)
  if (CONTENT_BLOCK_UNCLOSED_BRACKET_RE.test(line)) {
    return makeErrorResult(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.TITLE_BRACKET_NOT_CLOSED, 'Title bracket was not closed');
  }

  const match = CONTENT_BLOCK_OPEN_RE.exec(line);

  if (!match) {
    // Should not happen if isContentBlockStart was checked, but handle gracefully
    return makeErrorResult(lines, startIndex, startIndex, lineOffsets, filePath, diagnostics,
      DiagnosticCode.UNKNOWN_TOKEN, 'Failed to parse content block opening');
  }

  const token = match[1];
  let title: string | null = match[2] !== undefined ? match[2] : null;

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
    if (CONTENT_BLOCK_OPEN_RE.test(lines[i]) || /^\|>\*[><]/.test(lines[i])) {
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
    return makeErrorResult(lines, startIndex, lastLine, lineOffsets, filePath, diagnostics,
      DiagnosticCode.BLOCK_NOT_CLOSED, 'Content block was not closed with <|');
  }

  const position: SourceRange = {
    start: positionAt(startIndex, 0, lineOffsets),
    end:   positionAt(closingLine, '<|'.length, lineOffsets),
  };

  // Dispatch by token
  if (token === '@') {
    const { node: pqNode, diagnostics: pqDiags } = parsePullQuote(
      bodyLines, title, lineOffsets, filePath, startIndex, bodyStartIndex, position
    );
    diagnostics.push(...pqDiags);
    return { node: pqNode, consumedLines: closingLine - startIndex + 1, diagnostics };
  }

  if (token === '~~') {
    const { node: tlNode, diagnostics: tlDiags } = parseTimeline(
      bodyLines, title, lineOffsets, filePath, bodyStartIndex, position
    );
    diagnostics.push(...tlDiags);
    return { node: tlNode, consumedLines: closingLine - startIndex + 1, diagnostics };
  }

  const blockType = TOKEN_TO_TYPE[token];
  if (!blockType) {
    return makeErrorResult(lines, startIndex, closingLine, lineOffsets, filePath, diagnostics,
      DiagnosticCode.UNKNOWN_TOKEN, `Unknown content block token: "${token}"`);
  }

  // Standard content block — body becomes MarkdownBlockNode content
  const content: BodyNode[] = [];
  if (bodyLines.length > 0) {
    const rawContent = bodyLines.join('\n');
    const mdPosition: SourceRange = {
      start: positionAt(bodyStartIndex, 0, lineOffsets),
      end:   positionAt(bodyStartIndex + bodyLines.length - 1, bodyLines[bodyLines.length - 1].length, lineOffsets),
    };
    content.push({ type: 'MarkdownBlock', raw: rawContent, position: mdPosition } as MarkdownBlockNode);
  }

  const node: ContentBlockNode = {
    type: blockType,
    title,
    content,
    position,
  };

  return { node, consumedLines: closingLine - startIndex + 1, diagnostics };
}

// --- Pullquote ---

function parsePullQuote(
  bodyLines:      string[],
  title:          string | null,
  lineOffsets:    number[],
  filePath:       string,
  startLine:      number,
  bodyStartIndex: number,
  position:       SourceRange
): { node: PullQuoteBlockNode | ErrorBlockNode; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];

  // Empty pullquote
  const nonEmpty = bodyLines.filter(l => l.trim() !== '');
  if (nonEmpty.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: DiagnosticCode.PULLQUOTE_EMPTY,
      message: 'Pullquote block is empty',
      position,
      filePath,
      recoverable: false,
    });
    return {
      node: {
        type: 'ErrorBlock',
        raw: bodyLines.join('\n'),
        diagnostics: [...diagnostics],
        position,
      },
      diagnostics,
    };
  }

  // Find quote line (starts and ends with ")
  let quoteLine: string | null = null;
  for (const line of nonEmpty) {
    if (line.trim().startsWith('"') && line.trim().endsWith('"')) {
      quoteLine = line.trim();
      break;
    }
  }

  if (!quoteLine) {
    diagnostics.push({
      severity: 'error',
      code: DiagnosticCode.PULLQUOTE_NO_QUOTE,
      message: 'Pullquote block has no quoted text (must start and end with ")',
      position,
      filePath,
      recoverable: false,
    });
    return {
      node: {
        type: 'ErrorBlock',
        raw: bodyLines.join('\n'),
        diagnostics: [...diagnostics],
        position,
      },
      diagnostics,
    };
  }

  // Extract quote (remove surrounding quotes)
  const quote = quoteLine.slice(1, -1);

  // Find author lines (start with "- ")
  const authorLines = nonEmpty.filter(l => l.trim().startsWith('- '));
  let author: string | null = null;

  if (authorLines.length > 1) {
    diagnostics.push({
      severity: 'warning',
      code: DiagnosticCode.WARN_PULLQUOTE_MULTI_AUTHOR,
      message: 'Multiple author lines found in pullquote; using the last one',
      position,
      filePath,
      recoverable: true,
    });
  }

  if (authorLines.length > 0) {
    author = authorLines[authorLines.length - 1].trim().slice(2); // remove "- "
  }

  return {
    node: {
      type: 'PullQuoteBlock',
      title,
      quote,
      author,
      position,
    },
    diagnostics,
  };
}

// --- Timeline ---

function parseTimeline(
  bodyLines:      string[],
  title:          string | null,
  lineOffsets:    number[],
  filePath:       string,
  bodyStartIndex: number,
  position:       SourceRange
): { node: TimelineBlockNode; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const items: (TimelineEventNode | TimelineMarkdownNode)[] = [];

  let mdAccum: string[] = [];
  let mdStartLine = -1;

  function flushMarkdown(beforeLine: number) {
    if (mdAccum.length > 0) {
      const mdNode: TimelineMarkdownNode = {
        type: 'TimelineMarkdown',
        raw: mdAccum.join('\n'),
        position: {
          start: positionAt(mdStartLine, 0, lineOffsets),
          end:   positionAt(mdStartLine + mdAccum.length - 1, mdAccum[mdAccum.length - 1].length, lineOffsets),
        },
      };
      items.push(mdNode);
      mdAccum = [];
      mdStartLine = -1;
    }
  }

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const absLine = bodyStartIndex + i;
    const eventMatch = TIMELINE_EVENT_RE.exec(line);

    if (eventMatch) {
      flushMarkdown(absLine);
      const eventNode: TimelineEventNode = {
        type: 'TimelineEvent',
        text: eventMatch[1],
        position: {
          start: positionAt(absLine, 0, lineOffsets),
          end:   positionAt(absLine, line.length, lineOffsets),
        },
      };
      items.push(eventNode);
    } else {
      if (mdAccum.length === 0) {
        mdStartLine = absLine;
      }
      mdAccum.push(line);
    }
  }
  flushMarkdown(bodyStartIndex + bodyLines.length);

  // Check for no events
  const hasEvents = items.some(it => it.type === 'TimelineEvent');
  if (!hasEvents) {
    diagnostics.push({
      severity: 'warning',
      code: DiagnosticCode.WARN_TIMELINE_NO_EVENTS,
      message: 'Timeline block has no events',
      position,
      filePath,
      recoverable: true,
    });
  }

  return {
    node: {
      type: 'TimelineBlock',
      title,
      items,
      position,
    },
    diagnostics,
  };
}

// --- Error helper ---

function makeErrorResult(
  lines:       string[],
  startIndex:  number,
  endIndex:    number,
  lineOffsets: number[],
  filePath:    string,
  diagnostics: Diagnostic[],
  code:        string,
  message:     string
): ContentBlockParseResult {
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

  const errorNode: ErrorBlockNode = {
    type: 'ErrorBlock',
    raw,
    diagnostics: [...diagnostics],
    position,
  };

  return {
    node: errorNode,
    consumedLines: endIndex - startIndex + 1,
    diagnostics,
  };
}
