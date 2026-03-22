import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/parser/frontmatter.js';
import { normalize } from '../../src/parser/normalizer.js';
import { DiagnosticCode } from '../../src/types/index.js';

function parseFM(raw: string) {
  const { lines, lineOffsets } = normalize(raw);
  return parseFrontmatter(lines, lineOffsets, 'test.tmd');
}

describe('parseFrontmatter', () => {
  it('extrai todos os campos válidos', () => {
    const raw = ['---', 'title: My Title', 'author: Me', '---'].join('\n');
    const { fields } = parseFM(raw);
    expect(fields.title).toBe('My Title');
    expect(fields.author).toBe('Me');
  });

  it('theme ausente → fields.theme === undefined', () => {
    const raw = ['---', 'title: test', '---'].join('\n');
    const { fields } = parseFM(raw);
    expect(fields.theme).toBeUndefined();
  });

  it('compile ausente → fields.compile === undefined', () => {
    const raw = ['---', 'title: test', '---'].join('\n');
    const { fields } = parseFM(raw);
    expect(fields.compile).toBeUndefined();
  });

  it('theme presente → fields.theme === valor original', () => {
    const raw = ['---', 'theme: dark', '---'].join('\n');
    const { fields } = parseFM(raw);
    expect(fields.theme).toBe('dark');
  });

  it('campo desconhecido → WARN_UNKNOWN_FRONTMATTER_KEY', () => {
    const raw = ['---', 'unknown: test', '---'].join('\n');
    const { diagnostics } = parseFM(raw);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].code).toBe(DiagnosticCode.WARN_UNKNOWN_FRONTMATTER_KEY);
    expect(diagnostics[0].recoverable).toBe(true);
  });

  it('frontmatter sem fechamento → FRONTMATTER_NOT_CLOSED, recoverable false', () => {
    const raw = ['---', 'title: test'].join('\n');
    const { diagnostics } = parseFM(raw);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].code).toBe(DiagnosticCode.FRONTMATTER_NOT_CLOSED);
    expect(diagnostics[0].recoverable).toBe(false);
  });

  it('consumedLines correto', () => {
    const raw = ['---', 'title: test', '---', 'content'].join('\n');
    const { consumedLines } = parseFM(raw);
    expect(consumedLines).toBe(3);
  });

  it('sem frontmatter → consumedLines === 0', () => {
    const raw = ['not frontmatter', '---'].join('\n');
    const { consumedLines } = parseFM(raw);
    expect(consumedLines).toBe(0);
  });

  it('position.start.offset === 0 para frontmatter na primeira linha', () => {
    const raw = ['---', 'title: test', '---'].join('\n');
    const { position } = parseFM(raw);
    expect(position.start.offset).toBe(0);
  });

  it('position.end cobre o --- de fechamento', () => {
    const raw = ['---', 'title: test', '---'].join('\n');
    const { position } = parseFM(raw);
    // '---' is 3 characters. Line 0(4), Line 1(12), Line 2 Starts at 16. End is at 19.
    expect(position.end.offset).toBe(19);
  });

  it('diagnostic.position aponta para a linha do campo problemático', () => {
    const raw = ['---', 'unknown: 1', '---'].join('\n');
    const { diagnostics } = parseFM(raw);
    expect(diagnostics[0].position?.start.line).toBe(2);
    expect(diagnostics[0].position?.end.line).toBe(2);
  });
});
