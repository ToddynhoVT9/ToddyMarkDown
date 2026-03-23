import { describe, it, expect } from 'vitest';
import { generateCSS, type CSSGeneratorOptions } from '../../src/compiler/css-generator.js';
import type { ResolvedConfig, TMDConfigTheme } from '../../src/types/index.js';

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    theme:            overrides.theme            ?? 'essay',
    compile:          overrides.compile          ?? 'standalone',
    customThemes:     overrides.customThemes     ?? {},
    allowExternalCSS: overrides.allowExternalCSS ?? false,
  };
}

function gen(config: Partial<ResolvedConfig> = {}): string {
  return generateCSS({ resolvedConfig: makeConfig(config) });
}

// ==================== Standalone ====================

describe('generateCSS — standalone', () => {
  it('[data-theme="essay"] presente para tema essay', () => {
    const css = gen();
    expect(css).toContain('[data-theme="essay"]');
  });

  it('[data-theme] presente para todos os 4 temas base', () => {
    const css = gen();
    expect(css).toContain('[data-theme="essay"]');
    expect(css).toContain('[data-theme="ink"]');
    expect(css).toContain('[data-theme="modern"]');
    expect(css).toContain('[data-theme="amber"]');
  });

  it('[data-theme="midnight"] presente para tema customizado', () => {
    const css = gen({
      customThemes: {
        midnight: { extends: 'essay', overrides: { bg: '#080810' } },
      },
    });
    expect(css).toContain('[data-theme="midnight"]');
  });

  it('tema customizado herda vars do base no CSS gerado', () => {
    const css = gen({
      customThemes: {
        midnight: { extends: 'essay' },
      },
    });
    // The midnight block should contain essay's accent value
    const midnightBlock = extractBlock(css, '[data-theme="midnight"]');
    expect(midnightBlock).toContain('#8c7b68'); // essay accent
  });

  it('tema customizado sobrescreve via overrides no CSS gerado', () => {
    const css = gen({
      customThemes: {
        midnight: { extends: 'essay', overrides: { accent: '#a78bfa' } },
      },
    });
    const midnightBlock = extractBlock(css, '[data-theme="midnight"]');
    expect(midnightBlock).toContain('#a78bfa');
  });

  it('inclui .tmd-theme-btn', () => {
    const css = gen();
    expect(css).toContain('.tmd-theme-btn');
  });

  it('@import correto para as fontes', () => {
    const css = gen();
    expect(css).toContain("@import url('https://fonts.googleapis.com/css2");
    expect(css).toContain('Playfair+Display');
  });

  // Nível 2 — blocks
  it('tema com blocks.warning gera [data-theme="x"] .tmd-block-warning com --tmd-block-border-color', () => {
    const css = gen({
      customThemes: {
        midnight: {
          extends: 'essay',
          blocks: {
            warning: { 'border-color': '#e07b3a', bg: '#1f1508' },
          },
        },
      },
    });
    expect(css).toContain('[data-theme="midnight"] .tmd-block-warning');
    expect(css).toContain('--tmd-block-border-color: #e07b3a');
    expect(css).toContain('--tmd-block-bg: #1f1508');
  });

  it('tema com blocks.timeline gera .tmd-timeline-marker com background direto', () => {
    const css = gen({
      customThemes: {
        midnight: {
          extends: 'essay',
          blocks: {
            timeline: { 'marker-color': '#c8913a' },
          },
        },
      },
    });
    expect(css).toContain('[data-theme="midnight"] .tmd-timeline-marker');
    expect(css).toContain('background: #c8913a');
  });

  it('blocks.pullquote com bg → ignorado no CSS gerado', () => {
    const css = gen({
      customThemes: {
        midnight: {
          extends: 'essay',
          blocks: {
            pullquote: { bg: '#ff0000', 'border-color': '#a78bfa' },
          },
        },
      },
    });
    const pullquoteBlock = extractBlock(css, '[data-theme="midnight"] .tmd-block-pullquote');
    // bg should NOT be present for pullquote
    expect(pullquoteBlock).not.toContain('--tmd-block-bg');
    // but border-color should be
    expect(pullquoteBlock).toContain('--tmd-block-border-color: #a78bfa');
  });

  it('blocks.timeline com bg → ignorado no CSS gerado', () => {
    const css = gen({
      customThemes: {
        midnight: {
          extends: 'essay',
          blocks: {
            timeline: { bg: '#ff0000', 'marker-color': '#c8913a' },
          },
        },
      },
    });
    // bg for timeline should not generate --tmd-block-bg
    expect(css).not.toContain('[data-theme="midnight"] .tmd-block-timeline');
    // but marker should still work
    expect(css).toContain('[data-theme="midnight"] .tmd-timeline-marker');
  });

  // CSS base
  it('.tmd-block-warning usa var(--tmd-block-border-color, var(--tmd-warning)) no CSS base', () => {
    const css = gen();
    expect(css).toContain('var(--tmd-block-border-color, var(--tmd-warning))');
  });

  it('.tmd-timeline-marker usa var(--tmd-block-marker-color, var(--tmd-accent)) no CSS base', () => {
    const css = gen();
    expect(css).toContain('var(--tmd-block-marker-color, var(--tmd-accent))');
  });
});

// ==================== Fragment ====================

describe('generateCSS — fragment', () => {
  it('.tmd-theme-essay em vez de [data-theme="essay"]', () => {
    const css = gen({ compile: 'fragment' });
    expect(css).toContain('.tmd-theme-essay');
    expect(css).not.toContain('[data-theme="essay"]');
  });

  it('não contém .tmd-theme-btn', () => {
    const css = gen({ compile: 'fragment' });
    expect(css).not.toContain('.tmd-theme-btn');
  });

  it('não contém .tmd-site-header', () => {
    const css = gen({ compile: 'fragment' });
    expect(css).not.toContain('.tmd-site-header');
  });

  it('tema com blocks gera .tmd-theme-x .tmd-block-warning no modo fragment', () => {
    const css = gen({
      compile: 'fragment',
      customThemes: {
        midnight: {
          extends: 'essay',
          blocks: {
            warning: { 'border-color': '#e07b3a' },
          },
        },
      },
    });
    expect(css).toContain('.tmd-theme-midnight .tmd-block-warning');
  });
});

// ==================== Helper ====================

/** Extract a CSS block by its selector from the full CSS output */
function extractBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's');
  const match = regex.exec(css);
  return match ? match[1] : '';
}
