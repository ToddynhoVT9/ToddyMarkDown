import { describe, it, expect } from 'vitest';
import { isImageBlockStart, parseImageBlock } from '../../src/parser/image-block.js';
import { normalize, positionAt } from '../../src/parser/normalizer.js';
import { DiagnosticCode } from '../../src/types/index.js';

function parseImage(raw: string) {
  const { lines, lineOffsets } = normalize(raw);
  return parseImageBlock(lines, 0, lineOffsets, 'test.tmd');
}

// ==================== isImageBlockStart ====================

describe('isImageBlockStart', () => {
  it('detecta |>*>', () => {
    expect(isImageBlockStart('|>*> ![caption](path.jpg)')).toBe(true);
  });

  it('detecta |>*>wrap', () => {
    expect(isImageBlockStart('|>*>wrap ![caption](path.jpg)')).toBe(true);
  });

  it('detecta |>*< e |>*<wrap', () => {
    expect(isImageBlockStart('|>*< ![caption](path.jpg)')).toBe(true);
    expect(isImageBlockStart('|>*<wrap ![caption](path.jpg)')).toBe(true);
  });

  it('não detecta |>! (família conteúdo)', () => {
    expect(isImageBlockStart('|>!')).toBe(false);
  });
});

// ==================== parseImageBlock ====================

describe('parseImageBlock', () => {
  it('parseia *> com título e imagem', () => {
    const raw = ['|>*> [Titulo] ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    expect(node.type).toBe('ImageBlock');
    if (node.type === 'ImageBlock') {
      expect(node.mode).toBe('*>');
      expect(node.title).toBe('Titulo');
      expect(node.caption).toBe('Caption');
      expect(node.src).toBe('img.jpg');
    }
  });

  it('parseia *>wrap', () => {
    const raw = ['|>*>wrap ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    expect(node.type).toBe('ImageBlock');
    if (node.type === 'ImageBlock') {
      expect(node.mode).toBe('*>wrap');
    }
  });

  it('parseia *< e *<wrap', () => {
    const raw1 = ['|>*< ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node: n1 } = parseImage(raw1);
    expect(n1.type).toBe('ImageBlock');
    if (n1.type === 'ImageBlock') expect(n1.mode).toBe('*<');

    const raw2 = ['|>*<wrap ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node: n2 } = parseImage(raw2);
    expect(n2.type).toBe('ImageBlock');
    if (n2.type === 'ImageBlock') expect(n2.mode).toBe('*<wrap');
  });

  it('IMAGE_INVALID_MODE → ErrorBlockNode', () => {
    const raw = ['|>*invalid ![Foto](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.IMAGE_INVALID_MODE)).toBe(true);
  });

  it('IMAGE_MISSING → ErrorBlockNode', () => {
    const raw = ['|>*> sem imagem', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.IMAGE_MISSING)).toBe(true);
  });

  it('IMAGE_NO_CAPTION → ErrorBlockNode', () => {
    const raw = ['|>*> ![](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.IMAGE_NO_CAPTION)).toBe(true);
  });

  it('IMAGE_NO_SRC → ErrorBlockNode', () => {
    const raw = ['|>*> ![Caption]()', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.IMAGE_NO_SRC)).toBe(true);
  });

  it('IMAGE_MULTIPLE → ErrorBlockNode', () => {
    const raw = ['|>*> ![C1](a.jpg) ![C2](b.jpg)', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.IMAGE_MULTIPLE)).toBe(true);
  });

  it('BLOCK_NOT_CLOSED → ErrorBlockNode', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Texto sem fechar'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ErrorBlock');
    expect(diagnostics.some(d => d.code === DiagnosticCode.BLOCK_NOT_CLOSED)).toBe(true);
  });

  it('src registrado corretamente no nó', () => {
    const raw = ['|>*> ![Cap](./img/foto.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    if (node.type === 'ImageBlock') {
      expect(node.src).toBe('./img/foto.jpg');
    }
  });

  it('não verifica existência do arquivo no disco', () => {
    // Just verifies that a non-existent path doesn't cause an error
    const raw = ['|>*> ![Cap](./nonexistent/path.jpg)', 'Texto.', '<|'].join('\n');
    const { node, diagnostics } = parseImage(raw);
    expect(node.type).toBe('ImageBlock');
    expect(diagnostics.length).toBe(0);
  });
});

// ==================== parseImageBlock — position ====================

describe('parseImageBlock — position', () => {
  it('position.start.line === linha do |>mode', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    expect(node.position.start.line).toBe(1);
  });

  it('position.start.offset === lineOffsets[startIndex]', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    expect(node.position.start.offset).toBe(0);
  });

  it('position.end.line === linha do <|', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { node } = parseImage(raw);
    expect(node.position.end.line).toBe(3);
  });

  it('position.end.offset === lineOffsets[closingLine] + 2 (exclusivo após "<|")', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Texto.', '<|'].join('\n');
    const { lineOffsets } = normalize(raw);
    const { node } = parseImage(raw);
    expect(node.position.end.offset).toBe(lineOffsets[2] + 2);
  });

  it('ErrorBlockNode position.end exclusivo na última linha consumida', () => {
    const raw = ['|>*> ![Caption](img.jpg)', 'Sem fechar'].join('\n');
    const { lines, lineOffsets } = normalize(raw);
    const { node } = parseImage(raw);
    const lastLine = lines.length - 1;
    expect(node.position.end.offset).toBe(lineOffsets[lastLine] + lines[lastLine].length);
  });
});
