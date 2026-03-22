import { describe, it, expect } from 'vitest';
import { isContentBlockStart, parseContentBlock } from '../../src/parser/content-block.js';
import { normalize, positionAt } from '../../src/parser/normalizer.js';
import { DiagnosticCode } from '../../src/types/index.js';

function parseBlock(raw: string) {
  const { lines, lineOffsets } = normalize(raw);
  return parseContentBlock(lines, 0, lineOffsets, 'test.tmd');
}

// ==================== isContentBlockStart ====================

describe('isContentBlockStart', () => {
  it('detecta |>!', () => {
    expect(isContentBlockStart('|>!')).toBe(true);
  });

  it('detecta |>## (não confunde com heading)', () => {
    expect(isContentBlockStart('|>##')).toBe(true);
  });

  it('não detecta |>*> (família imagem)', () => {
    expect(isContentBlockStart('|>*>')).toBe(false);
  });

  it('não detecta linha comum', () => {
    expect(isContentBlockStart('hello world')).toBe(false);
  });

  it('detecta |>@ com título', () => {
    expect(isContentBlockStart('|>@ [My Title]')).toBe(true);
  });

  it('detecta |>~~ com título', () => {
    expect(isContentBlockStart('|>~~ [Timeline]')).toBe(true);
  });

  it('detecta |>&', () => {
    expect(isContentBlockStart('|>&')).toBe(true);
  });
});

// ==================== parseContentBlock — geral ====================

describe('parseContentBlock — geral', () => {
  it('parseia explainer com título', () => {
    const raw = ['|>! [Meu Titulo]', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.type).toBe('ExplainerBlock');
    if (node.type === 'ExplainerBlock') {
      expect(node.title).toBe('Meu Titulo');
    }
  });

  it('parseia explainer sem título (title: null)', () => {
    const raw = ['|>!', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.type).toBe('ExplainerBlock');
    if (node.type === 'ExplainerBlock') {
      expect(node.title).toBeNull();
    }
  });

  it('parseia note, warning, aside, question, takeaway, concept', () => {
    const tokens: [string, string][] = [
      ['#',  'NoteBlock'],
      ['##', 'WarningBlock'],
      ['$',  'AsideBlock'],
      ['?',  'QuestionBlock'],
      ['+',  'TakeawayBlock'],
      ['&',  'ConceptBlock'],
    ];

    for (const [token, expectedType] of tokens) {
      const raw = [`|>${token}`, 'Conteúdo.', '<|'].join('\n');
      const { node } = parseBlock(raw);
      expect(node.type).toBe(expectedType);
    }
  });

  it('BLOCK_NOT_CLOSED → ErrorBlockNode com diagnostic', () => {
    const raw = ['|>!', 'Conteúdo sem fechar.'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.BLOCK_NOT_CLOSED)).toBe(true);
  });

  it('NESTED_BLOCK → ErrorBlockNode', () => {
    const raw = ['|>!', '|>@', '"citação"', '<|', '<|'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.NESTED_BLOCK)).toBe(true);
  });

  it('TITLE_BRACKET_NOT_CLOSED → ErrorBlockNode', () => {
    const raw = ['|>! [titulo aberto', 'Conteúdo.', '<|'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.TITLE_BRACKET_NOT_CLOSED)).toBe(true);
  });

  it('ErrorBlockNode.diagnostics contém o código correto', () => {
    const raw = ['|>!', 'sem fechamento'].join('\n');
    const { node } = parseBlock(raw);
    if (node.type === 'ErrorBlock') {
      expect(node.diagnostics.some(d => d.code === DiagnosticCode.BLOCK_NOT_CLOSED)).toBe(true);
    }
  });
});

// ==================== parseContentBlock — pullquote ====================

describe('parseContentBlock — pullquote', () => {
  it('parseia com citação e autor', () => {
    const raw = ['|>@', '"Uma citação."', '- Autor', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.type).toBe('PullQuoteBlock');
    if (node.type === 'PullQuoteBlock') {
      expect(node.quote).toBe('Uma citação.');
      expect(node.author).toBe('Autor');
    }
  });

  it('author: null quando sem autor', () => {
    const raw = ['|>@', '"Uma citação."', '<|'].join('\n');
    const { node } = parseBlock(raw);
    if (node.type === 'PullQuoteBlock') {
      expect(node.author).toBeNull();
    }
  });

  it('PULLQUOTE_NO_QUOTE → ErrorBlockNode', () => {
    const raw = ['|>@', '- Autor sem citação', '<|'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.PULLQUOTE_NO_QUOTE)).toBe(true);
  });

  it('PULLQUOTE_EMPTY → ErrorBlockNode', () => {
    const raw = ['|>@', '', '<|'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.PULLQUOTE_EMPTY)).toBe(true);
  });

  it('WARN_PULLQUOTE_MULTI_AUTHOR usa a última linha -', () => {
    const raw = ['|>@', '"Citação."', '- Autor 1', '- Autor 2', '<|'].join('\n');
    const { node, diagnostics } = parseBlock(raw);
    expect(node.type).toBe('PullQuoteBlock');
    if (node.type === 'PullQuoteBlock') {
      expect(node.author).toBe('Autor 2');
    }
    expect(diagnostics.some(d => d.code === DiagnosticCode.WARN_PULLQUOTE_MULTI_AUTHOR)).toBe(true);
  });
});

// ==================== parseContentBlock — timeline ====================

describe('parseContentBlock — timeline', () => {
  it('parseia eventos e markdown intermediário', () => {
    const raw = ['|>~~', '~~ Evento 1 ~~', 'Descrição.', '~~ Evento 2 ~~', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.type).toBe('TimelineBlock');
    if (node.type === 'TimelineBlock') {
      expect(node.items.length).toBe(3);
      expect(node.items[0].type).toBe('TimelineEvent');
      expect(node.items[1].type).toBe('TimelineMarkdown');
      expect(node.items[2].type).toBe('TimelineEvent');
    }
  });

  it('WARN_TIMELINE_NO_EVENTS quando sem eventos', () => {
    const raw = ['|>~~', 'Apenas texto.', '<|'].join('\n');
    const { diagnostics } = parseBlock(raw);
    expect(diagnostics.some(d => d.code === DiagnosticCode.WARN_TIMELINE_NO_EVENTS)).toBe(true);
  });
});

// ==================== parseContentBlock — position ====================

describe('parseContentBlock — position', () => {
  it('position.start.line === linha do |>token (1-based)', () => {
    const raw = ['|>!', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.position.start.line).toBe(1);
  });

  it('position.start.offset === lineOffsets[startIndex]', () => {
    const raw = ['|>!', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.position.start.offset).toBe(0);
  });

  it('position.end.line === linha do <| de fechamento', () => {
    const raw = ['|>!', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    expect(node.position.end.line).toBe(3);
  });

  it('position.end.offset === lineOffsets[closingLine] + 2 (exclusivo após "<|")', () => {
    const { lineOffsets } = normalize(['|>!', 'Conteúdo.', '<|'].join('\n'));
    const raw = ['|>!', 'Conteúdo.', '<|'].join('\n');
    const { node } = parseBlock(raw);
    // <| is at line 2 (0-based), offset = lineOffsets[2] + 2
    expect(node.position.end.offset).toBe(lineOffsets[2] + 2);
  });

  it('ErrorBlockNode sem fechamento: position.end.offset === lineOffsets[last] + lines[last].length', () => {
    const raw = ['|>!', 'sem fechamento'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const { node } = parseBlock(raw);
    const lastLine = lines.length - 1;
    expect(node.position.end.offset).toBe(lineOffsets[lastLine] + lines[lastLine].length);
  });

  it('TimelineEventNode.position cobre apenas sua linha', () => {
    const raw = ['|>~~', '~~ Evento 1 ~~', '<|'].join('\n');
    const { node } = parseBlock(raw);
    if (node.type === 'TimelineBlock') {
      const event = node.items[0];
      expect(event.type).toBe('TimelineEvent');
      expect(event.position.start.line).toBe(2); // 1-based, line 1 (0-based)
      expect(event.position.end.line).toBe(2);
    }
  });

  it('TimelineEventNode.position.end é exclusivo (aponta após o último char da linha)', () => {
    const raw = ['|>~~', '~~ Evento 1 ~~', '<|'].join('\n');
    const { lineOffsets } = normalize(raw);
    const { node } = parseBlock(raw);
    if (node.type === 'TimelineBlock') {
      const event = node.items[0];
      expect(event.position.end.offset).toBe(lineOffsets[1] + '~~ Evento 1 ~~'.length);
    }
  });

  it('TimelineMarkdownNode.position.end é exclusivo na última linha acumulada', () => {
    const raw = ['|>~~', '~~ Evento ~~', 'Markdown line 1', 'Markdown line 2', '<|'].join('\n');
    const { lineOffsets } = normalize(raw);
    const { node } = parseBlock(raw);
    if (node.type === 'TimelineBlock') {
      const md = node.items.find(i => i.type === 'TimelineMarkdown');
      expect(md).toBeDefined();
      if (md) {
        expect(md.position.end.offset).toBe(lineOffsets[3] + 'Markdown line 2'.length);
      }
    }
  });
});
