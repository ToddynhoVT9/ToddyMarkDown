import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../../src/compiler/config-resolver.js';
import type { FrontmatterFields, TMDConfig } from '../../src/types/index.js';

function makeConfig(overrides: Partial<TMDConfig> = {}): TMDConfig {
  return {
    defaultTheme:   overrides.defaultTheme   ?? 'essay',
    defaultCompile: overrides.defaultCompile ?? 'standalone',
    themes:         overrides.themes         ?? {},
    allowExternalCSS: overrides.allowExternalCSS,
  };
}

describe('resolveConfig', () => {
  it('frontmatter.theme válido → usado', () => {
    const result = resolveConfig({ theme: 'ink' }, makeConfig());
    expect(result.theme).toBe('ink');
  });

  it('frontmatter.theme ausente → config.defaultTheme', () => {
    const result = resolveConfig({}, makeConfig({ defaultTheme: 'modern' }));
    expect(result.theme).toBe('modern');
  });

  it('frontmatter.theme ausente + config sem default → essay', () => {
    const result = resolveConfig({}, makeConfig({ defaultTheme: '' }));
    expect(result.theme).toBe('essay');
  });

  it('frontmatter.theme inválido → config.defaultTheme', () => {
    const result = resolveConfig({ theme: 'invalid-theme' }, makeConfig({ defaultTheme: 'amber' }));
    expect(result.theme).toBe('amber');
  });

  it('frontmatter.compile = fragment → compile: fragment', () => {
    const result = resolveConfig({ compile: 'fragment' }, makeConfig());
    expect(result.compile).toBe('fragment');
  });

  it('frontmatter.compile ausente → config.defaultCompile', () => {
    const result = resolveConfig({}, makeConfig({ defaultCompile: 'fragment' }));
    expect(result.compile).toBe('fragment');
  });

  it('frontmatter.compile ausente + config ausente → standalone', () => {
    const result = resolveConfig({}, makeConfig({ defaultCompile: '' }));
    expect(result.compile).toBe('standalone');
  });

  it('tema customizado de config.themes é válido', () => {
    const config = makeConfig({
      themes: {
        midnight: { extends: 'essay' },
      },
    });
    const result = resolveConfig({ theme: 'midnight' }, config);
    expect(result.theme).toBe('midnight');
  });

  it('customThemes vem de config.themes', () => {
    const config = makeConfig({
      themes: {
        midnight: { extends: 'essay' },
        clean:    { extends: 'modern' },
      },
    });
    const result = resolveConfig({}, config);
    expect(result.customThemes).toEqual(config.themes);
  });
});
