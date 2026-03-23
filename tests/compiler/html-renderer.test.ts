import { describe, it, expect } from 'vitest';
import { renderHTML, type RenderOptions } from '../../src/compiler/html-renderer.js';
import type { DocumentNode, ResolvedConfig, BodyNode, ImageBlockNode } from '../../src/types/index.js';

// ==================== Helpers ====================

function makeResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    theme:            overrides.theme            ?? 'essay',
    compile:          overrides.compile          ?? 'standalone',
    customThemes:     overrides.customThemes     ?? {},
    allowExternalCSS: overrides.allowExternalCSS ?? false,
  };
}

function makeDoc(children: BodyNode[] = [], frontmatter: Record<string, string> = {}): DocumentNode {
  return {
    type: 'Document',
    frontmatter: {
      title:    frontmatter.title,
      subtitle: frontmatter.subtitle,
      kicker:   frontmatter.kicker,
      author:   frontmatter.author,
    },
    children,
    assets: [],
  };
}

function makeOptions(overrides: Partial<RenderOptions> = {}): RenderOptions {
  return {
    resolvedConfig:   overrides.resolvedConfig   ?? makeResolvedConfig(),
    title:            overrides.title            ?? 'Test Title',
    cssFileName:      overrides.cssFileName      ?? 'test.css',
    customThemeNames: overrides.customThemeNames ?? [],
    customCssFile:    overrides.customCssFile,
  };
}

const dummyPos = {
  start: { offset: 0, line: 1, column: 0 },
  end:   { offset: 10, line: 1, column: 10 },
};

// ==================== Standalone ====================

describe('renderHTML — standalone', () => {
  it('começa com <!DOCTYPE html>', () => {
    const html = renderHTML(makeDoc(), makeOptions());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('data-theme no <html> igual ao resolvedConfig.theme', () => {
    const html = renderHTML(makeDoc(), makeOptions({
      resolvedConfig: makeResolvedConfig({ theme: 'ink' }),
    }));
    expect(html).toContain('data-theme="ink"');
  });

  it('inclui link para cssFileName', () => {
    const html = renderHTML(makeDoc(), makeOptions({ cssFileName: 'artigo.css' }));
    expect(html).toContain('href="artigo.css"');
  });

  it('inclui switcher com 4 temas base', () => {
    const html = renderHTML(makeDoc(), makeOptions());
    expect(html).toContain('data-theme-target="essay"');
    expect(html).toContain('data-theme-target="ink"');
    expect(html).toContain('data-theme-target="modern"');
    expect(html).toContain('data-theme-target="amber"');
  });

  it('inclui script de localStorage', () => {
    const html = renderHTML(makeDoc(), makeOptions());
    expect(html).toContain('localStorage');
    expect(html).toContain('tmd-theme');
  });

  it('kicker ausente → sem .tmd-kicker no HTML', () => {
    const html = renderHTML(makeDoc([], { title: 'T' }), makeOptions());
    expect(html).not.toContain('tmd-kicker');
  });

  it('author ausente → sem .tmd-author no HTML', () => {
    const html = renderHTML(makeDoc([], { title: 'T' }), makeOptions());
    expect(html).not.toContain('tmd-author');
  });

  it('customCssFile injetado como segundo <link> quando presente', () => {
    const html = renderHTML(makeDoc(), makeOptions({ customCssFile: './custom.css' }));
    expect(html).toContain('href="./custom.css"');
  });

  it('customCssFile ausente → sem <link> extra', () => {
    const html = renderHTML(makeDoc(), makeOptions());
    // Only one <link> for the main CSS
    const linkCount = (html.match(/<link /g) || []).length;
    expect(linkCount).toBe(1);
  });

  it('PullQuoteBlock sem author → sem figcaption', () => {
    const doc = makeDoc([{
      type: 'PullQuoteBlock',
      title: null,
      quote: 'Quote text',
      author: null,
      position: dummyPos,
    }]);
    const html = renderHTML(doc, makeOptions());
    expect(html).not.toContain('tmd-pullquote-author');
    expect(html).toContain('Quote text');
  });

  it('ContentBlockNode sem title → sem h3', () => {
    const doc = makeDoc([{
      type: 'ExplainerBlock',
      title: null,
      content: [],
      position: dummyPos,
    }]);
    const html = renderHTML(doc, makeOptions());
    expect(html).toContain('tmd-block-explainer');
    expect(html).not.toContain('<h3');
  });

  it('ErrorBlock contém --ERROR BLOC-- acima e abaixo do raw', () => {
    const doc = makeDoc([{
      type: 'ErrorBlock',
      raw: '|>@ no quote',
      diagnostics: [],
      position: dummyPos,
    }]);
    const html = renderHTML(doc, makeOptions());
    const markers = (html.match(/--ERROR BLOC--/g) || []);
    expect(markers.length).toBe(2);
    expect(html).toContain('tmd-error-block');
  });

  it('ImageBlock *> gera tmd-media-block-right', () => {
    const doc = makeDoc([{
      type: 'ImageBlock',
      mode: '*>',
      title: 'Gauss',
      caption: 'Photo',
      src: './img/gauss.jpg',
      content: [],
      position: dummyPos,
    } as ImageBlockNode]);
    const html = renderHTML(doc, makeOptions());
    expect(html).toContain('tmd-media-block-right');
    expect(html).not.toContain('tmd-media-wrap');
  });

  it('ImageBlock *>wrap gera tmd-media-wrap-right com float', () => {
    const doc = makeDoc([{
      type: 'ImageBlock',
      mode: '*>wrap',
      title: null,
      caption: 'Photo',
      src: './img/gauss.jpg',
      content: [],
      position: dummyPos,
    } as ImageBlockNode]);
    const html = renderHTML(doc, makeOptions());
    expect(html).toContain('tmd-media-wrap-right');
    expect(html).toContain('tmd-media-float-right');
  });

  it('TimelineBlock gera eventos e markdown intermediário', () => {
    const doc = makeDoc([{
      type: 'TimelineBlock',
      title: 'Linha do tempo',
      items: [
        { type: 'TimelineEvent', text: '1805 — Gauss', position: dummyPos },
        { type: 'TimelineMarkdown', raw: 'Texto intermediário.', position: dummyPos },
        { type: 'TimelineEvent', text: '1965 — Cooley', position: dummyPos },
      ],
      position: dummyPos,
    }]);
    const html = renderHTML(doc, makeOptions());
    expect(html).toContain('tmd-block-timeline');
    expect(html).toContain('tmd-timeline-event');
    expect(html).toContain('1805');
    expect(html).toContain('tmd-timeline-item-markdown');
  });
});

// ==================== Fragment ====================

describe('renderHTML — fragment', () => {
  const fragmentOpts = makeOptions({
    resolvedConfig: makeResolvedConfig({ compile: 'fragment', theme: 'modern' }),
  });

  it('não começa com <!DOCTYPE', () => {
    const html = renderHTML(makeDoc(), fragmentOpts);
    expect(html.startsWith('<!DOCTYPE')).toBe(false);
  });

  it('começa com <article class="tmd-document tmd-theme-{tema}">', () => {
    const html = renderHTML(makeDoc(), fragmentOpts);
    expect(html).toContain('<article class="tmd-document tmd-theme-modern">');
  });

  it('não contém .tmd-site-header', () => {
    const html = renderHTML(makeDoc(), fragmentOpts);
    expect(html).not.toContain('tmd-site-header');
  });

  it('não contém script de localStorage', () => {
    const html = renderHTML(makeDoc(), fragmentOpts);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('localStorage');
  });
});
