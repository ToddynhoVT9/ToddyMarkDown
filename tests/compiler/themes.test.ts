import { describe, it, expect } from 'vitest';
import { BASE_THEMES, OVERRIDE_KEY_MAP, resolveThemeVars } from '../../src/compiler/themes.js';

describe('resolveThemeVars', () => {
  it('retorna vars corretas para os 4 temas base', () => {
    for (const name of ['essay', 'ink', 'modern', 'amber']) {
      const vars = resolveThemeVars(name, {});
      expect(vars['--tmd-bg']).toBeDefined();
      expect(vars['--tmd-accent']).toBeDefined();
      expect(vars['--tmd-font-body']).toBeDefined();
      expect(vars['--tmd-max-width']).toBeDefined();
    }
  });

  it('tema customizado herda todas as vars do extends', () => {
    const vars = resolveThemeVars('midnight', {
      midnight: { extends: 'essay' },
    });
    // Should have all essay vars
    expect(vars['--tmd-bg']).toBe(BASE_THEMES['essay']['--tmd-bg']);
    expect(vars['--tmd-font-body']).toBe(BASE_THEMES['essay']['--tmd-font-body']);
  });

  it('tema customizado com overrides sobrescreve apenas as vars mapeadas', () => {
    const vars = resolveThemeVars('midnight', {
      midnight: {
        extends: 'essay',
        overrides: {
          bg: '#080810',
          accent: '#a78bfa',
        },
      },
    });
    expect(vars['--tmd-bg']).toBe('#080810');
    expect(vars['--tmd-accent']).toBe('#a78bfa');
    // Other vars unchanged
    expect(vars['--tmd-font-body']).toBe(BASE_THEMES['essay']['--tmd-font-body']);
  });

  it('chave em overrides não presente em OVERRIDE_KEY_MAP é ignorada', () => {
    const vars = resolveThemeVars('midnight', {
      midnight: {
        extends: 'essay',
        overrides: {
          bg: '#080810',
          'unknown-key': '#ff0000',
        } as any,
      },
    });
    expect(vars['--tmd-bg']).toBe('#080810');
    expect(vars['--unknown-key']).toBeUndefined();
  });

  it('tema desconhecido → fallback para essay', () => {
    const vars = resolveThemeVars('nonexistent', {});
    expect(vars['--tmd-bg']).toBe(BASE_THEMES['essay']['--tmd-bg']);
  });
});

describe('OVERRIDE_KEY_MAP', () => {
  it('contém 9 chaves mapeadas', () => {
    expect(Object.keys(OVERRIDE_KEY_MAP).length).toBe(9);
  });

  it('mapeia chave curta para var CSS completa', () => {
    expect(OVERRIDE_KEY_MAP['bg']).toBe('--tmd-bg');
    expect(OVERRIDE_KEY_MAP['accent']).toBe('--tmd-accent');
    expect(OVERRIDE_KEY_MAP['font-body']).toBe('--tmd-font-body');
  });
});
