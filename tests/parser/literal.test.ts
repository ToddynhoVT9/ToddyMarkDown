import { describe, it, expect } from 'vitest';
import { parseLiteralBlock } from '../../src/parser/literal.js';
import { normalize } from '../../src/parser/normalizer.js';
import { DiagnosticCode } from '../../src/types/index.js';

function parseLiteral(raw: string) {
  const { lines, lineOffsets } = normalize(raw);
  return parseLiteralBlock(lines, 0, lineOffsets, 'test.tmd');
}

describe('parseLiteralBlock', () => {
  it('captura conteúdo bruto entre /> e <\\', () => {
    const raw = ['/>', 'some content', 'more content', '<\\'].join('\n');
    const { node } = parseLiteral(raw);
    expect(node.raw).toBe('some content\nmore content');
  });

  it('não interpreta sintaxe TMD dentro do bloco', () => {
    const raw = ['/>', '---', 'title: oops', '---', '<\\'].join('\n');
    const { node } = parseLiteral(raw);
    expect(node.raw).toBe('---\ntitle: oops\n---');
  });

  it('bloco sem fechamento → LITERAL_BLOCK_NOT_CLOSED', () => {
    const raw = ['/>', 'content'].join('\n');
    const { diagnostics } = parseLiteral(raw);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].code).toBe(DiagnosticCode.LITERAL_BLOCK_NOT_CLOSED);
  });

  it('recoverable: false quando não fechado', () => {
    const raw = ['/>', 'content'].join('\n');
    const { diagnostics } = parseLiteral(raw);
    expect(diagnostics[0].recoverable).toBe(false);
  });
});
