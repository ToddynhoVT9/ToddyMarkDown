import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/compiler/slugify.js';

describe('slugify', () => {
  it('"O Algoritmo Invisível que Governa o Mundo" → slug correto', () => {
    expect(slugify('O Algoritmo Invisível que Governa o Mundo'))
      .toBe('o-algoritmo-invisivel-que-governa-o-mundo');
  });

  it('"Gauss & Fourier: Uma História" → sem caracteres especiais', () => {
    expect(slugify('Gauss & Fourier: Uma História'))
      .toBe('gauss-fourier-uma-historia');
  });

  it('colapsa múltiplos hífens', () => {
    expect(slugify('já---muitos---hífens'))
      .toBe('ja-muitos-hifens');
  });

  it('remove hífens nas bordas', () => {
    expect(slugify('  espaços nas bordas  '))
      .toBe('espacos-nas-bordas');
  });

  it('nome de arquivo como input', () => {
    expect(slugify('fourier_moderno'))
      .toBe('fourier-moderno');
  });
});
