import { describe, it, expect } from 'vitest';
import { parse } from '../../src/parser/index.js';
import { accumulateMarkdown } from '../../src/parser/markdown-accumulator.js';
import { normalize } from '../../src/parser/normalizer.js';
import { DiagnosticCode } from '../../src/types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

function readFixture(name: string): string {
  return fs.readFileSync(path.join('fixtures', name), 'utf-8');
}

// ==================== accumulateMarkdown ====================

describe('accumulateMarkdown', () => {
  it('acumula linhas até |>', () => {
    const raw = ['Linha 1', 'Linha 2', '|>!', 'Conteúdo'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.consumedLines).toBe(2);
    expect(result.node.raw).toBe('Linha 1\nLinha 2');
  });

  it('acumula linhas até />', () => {
    const raw = ['Linha 1', '/>', 'literal'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.consumedLines).toBe(1);
    expect(result.node.raw).toBe('Linha 1');
  });

  it('acumula até fim do arquivo', () => {
    const raw = ['Linha 1', 'Linha 2', 'Linha 3'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.consumedLines).toBe(3);
    expect(result.node.raw).toBe('Linha 1\nLinha 2\nLinha 3');
  });

  it('extrai imageRefs de ![alt](src) no raw', () => {
    const raw = ['Texto com ![foto](img.jpg) e ![outra](img2.png)'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.imageRefs).toEqual(['img.jpg', 'img2.png']);
  });

  it('imageRefs vazio quando não há imagens', () => {
    const raw = ['Texto puro sem imagens'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.imageRefs).toEqual([]);
  });
});

describe('accumulateMarkdown — position', () => {
  it('position.start aponta para startIndex (offset === lineOffsets[startIndex])', () => {
    const raw = ['Linha 1', 'Linha 2'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    expect(result.node.position.start.offset).toBe(0);
  });

  it('position.end é exclusivo — offset === lineOffsets[last] + lines[last].length', () => {
    const raw = ['Linha 1', 'Linha 2'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const result = accumulateMarkdown(lines, 0, lineOffsets);
    const lastLine = lines.length - 1;
    expect(result.node.position.end.offset).toBe(lineOffsets[lastLine] + lines[lastLine].length);
  });
});

// ==================== parse — integração ====================

describe('parse — integração', () => {
  it('basico.tmd: diagnostics vazio', () => {
    const raw = readFixture('valid/basico.tmd');
    const { diagnostics } = parse(raw, 'fixtures/valid/basico.tmd');
    expect(diagnostics.filter(d => d.severity === 'error')).toEqual([]);
  });

  it('basico.tmd: frontmatter preservado como está', () => {
    const raw = readFixture('valid/basico.tmd');
    const { document } = parse(raw, 'fixtures/valid/basico.tmd');
    expect(document.frontmatter.title).toBe('Teste Basico');
    expect(document.frontmatter.author).toBe('Autor Teste');
    expect(document.frontmatter.theme).toBe('essay');
    expect(document.frontmatter.compile).toBe('standalone');
  });

  it('basico.tmd: children contém os nós corretos', () => {
    const raw = readFixture('valid/basico.tmd');
    const { document } = parse(raw, 'fixtures/valid/basico.tmd');
    const types = document.children.map(c => c.type);
    expect(types).toContain('ExplainerBlock');
    expect(types).toContain('PullQuoteBlock');
    expect(types).toContain('TakeawayBlock');
  });

  it('pullquote-sem-citacao.tmd: gera ErrorBlockNode com PULLQUOTE_NO_QUOTE', () => {
    const raw = readFixture('invalid/pullquote-sem-citacao.tmd');
    const { document, diagnostics } = parse(raw, 'fixtures/invalid/pullquote-sem-citacao.tmd');
    expect(diagnostics.some(d => d.code === DiagnosticCode.PULLQUOTE_NO_QUOTE)).toBe(true);
    expect(document.children.some(c => c.type === 'ErrorBlock')).toBe(true);
  });

  it('bloco-nao-fechado.tmd: gera ErrorBlockNode com BLOCK_NOT_CLOSED', () => {
    const raw = readFixture('invalid/bloco-nao-fechado.tmd');
    const { document, diagnostics } = parse(raw, 'fixtures/invalid/bloco-nao-fechado.tmd');
    expect(diagnostics.some(d => d.code === DiagnosticCode.BLOCK_NOT_CLOSED)).toBe(true);
    expect(document.children.some(c => c.type === 'ErrorBlock')).toBe(true);
  });

  it('com-imagens.tmd: assets contém os 3 caminhos de imagem', () => {
    const raw = readFixture('valid/com-imagens.tmd');
    const { document } = parse(raw, 'fixtures/valid/com-imagens.tmd');
    expect(document.assets).toContain('./img/gauss.jpg');
    expect(document.assets).toContain('./img/espectro.png');
    expect(document.assets).toContain('./img/inline.png');
    expect(document.assets.length).toBe(3);
  });

  it('imagens em markdown comum aparecem em assets', () => {
    const raw = 'Texto com ![foto](img.jpg) aqui.\n';
    const { document } = parse(raw, 'test.tmd');
    expect(document.assets).toContain('img.jpg');
  });
});
