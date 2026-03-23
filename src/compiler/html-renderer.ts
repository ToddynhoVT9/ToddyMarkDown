import MarkdownIt from 'markdown-it';
import type {
  DocumentNode, BodyNode, ResolvedConfig, FrontmatterFields,
  ContentBlockNode, PullQuoteBlockNode, TimelineBlockNode,
  ImageBlockNode, ErrorBlockNode, MarkdownBlockNode, LiteralBlockNode,
} from '../types/index.js';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export interface RenderOptions {
  resolvedConfig:   ResolvedConfig;
  title:            string;          // slug ou title do frontmatter
  cssFileName:      string;          // ex: 'meu-artigo.css'
  customThemeNames: string[];        // nomes de temas customizados para o switcher
  customCssFile?:   string;          // nível 3 — caminho relativo para <link> extra
}

const BASE_THEMES = ['essay', 'ink', 'modern', 'amber'] as const;

/**
 * Transforma DocumentNode + ResolvedConfig em string HTML.
 * Sem I/O. Sem efeitos colaterais.
 */
export function renderHTML(
  doc:     DocumentNode,
  options: RenderOptions
): string {
  if (options.resolvedConfig.compile === 'fragment') {
    return renderFragment(doc, options);
  }
  return renderStandalone(doc, options);
}

// ==================== Standalone ====================

function renderStandalone(doc: DocumentNode, options: RenderOptions): string {
  const { resolvedConfig, title, cssFileName, customThemeNames, customCssFile } = options;
  const theme = resolvedConfig.theme;

  const customCssLink = customCssFile
    ? `\n  <link rel="stylesheet" href="${escapeAttr(customCssFile)}" />`
    : '';

  const header = renderHeader(doc.frontmatter);
  const body = renderChildren(doc.children);
  const switcher = renderSwitcher(customThemeNames);

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${escapeAttr(theme)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(title)}</title>
  <link rel="stylesheet" href="${escapeAttr(cssFileName)}" />${customCssLink}
</head>
<body>
  <header class="tmd-site-header">
    <div class="tmd-theme-switcher">
      ${switcher}
    </div>
  </header>
  <article class="tmd-document">
    ${header}<main class="tmd-body">${body}</main>
  </article>
  <script>
    const saved = localStorage.getItem('tmd-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('.tmd-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.themeTarget;
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('tmd-theme', t);
      });
    });
  </script>
</body>
</html>`;
}

// ==================== Fragment ====================

function renderFragment(doc: DocumentNode, options: RenderOptions): string {
  const theme = options.resolvedConfig.theme;
  const header = renderHeader(doc.frontmatter);
  const body = renderChildren(doc.children);

  return `<article class="tmd-document tmd-theme-${escapeAttr(theme)}">
  ${header}<main class="tmd-body">${body}</main>
</article>`;
}

// ==================== Switcher ====================

function renderSwitcher(customThemeNames: string[]): string {
  const allThemes = [...BASE_THEMES, ...customThemeNames];
  return allThemes
    .map(t => `<button class="tmd-theme-btn" data-theme-target="${escapeAttr(t)}">${escapeHTML(t)}</button>`)
    .join('\n      ');
}

// ==================== Header ====================

function renderHeader(fm: FrontmatterFields): string {
  const parts: string[] = [];
  if (fm.kicker)   parts.push(`<p class="tmd-kicker">${escapeHTML(fm.kicker)}</p>`);
  if (fm.title)    parts.push(`<h1 class="tmd-title">${escapeHTML(fm.title)}</h1>`);
  if (fm.subtitle) parts.push(`<p class="tmd-subtitle">${escapeHTML(fm.subtitle)}</p>`);
  if (fm.author)   parts.push(`<p class="tmd-author">${escapeHTML(fm.author)}</p>`);
  if (parts.length === 0) return '';
  return `<header class="tmd-header">\n      ${parts.join('\n      ')}\n    </header>\n    `;
}

// ==================== Children ====================

function renderChildren(children: BodyNode[]): string {
  return children.map(renderNode).join('\n');
}

// ==================== renderNode ====================

function renderNode(node: BodyNode): string {
  switch (node.type) {
    case 'MarkdownBlock':   return renderMarkdownBlock(node);
    case 'LiteralBlock':    return renderLiteralBlock(node);
    case 'PullQuoteBlock':  return renderPullQuote(node);
    case 'TimelineBlock':   return renderTimeline(node);
    case 'ImageBlock':      return renderImageBlock(node);
    case 'ErrorBlock':      return renderErrorBlock(node);
    default:                return renderContentBlock(node as ContentBlockNode);
  }
}

// ==================== MarkdownBlock ====================

function renderMarkdownBlock(node: MarkdownBlockNode): string {
  return `<section class="tmd-markdown">${md.render(node.raw)}</section>`;
}

// ==================== LiteralBlock ====================

function renderLiteralBlock(node: LiteralBlockNode): string {
  return `<pre class="tmd-literal">${escapeHTML(node.raw)}</pre>`;
}

// ==================== ContentBlock (7 types) ====================

const TYPE_TO_CSS: Record<string, string> = {
  ExplainerBlock: 'explainer',
  AsideBlock:     'aside',
  NoteBlock:      'note',
  WarningBlock:   'warning',
  QuestionBlock:  'question',
  TakeawayBlock:  'takeaway',
  ConceptBlock:   'concept',
};

function renderContentBlock(node: ContentBlockNode): string {
  const cssType = TYPE_TO_CSS[node.type] ?? 'unknown';
  const titleHtml = node.title !== null
    ? `\n  <h3 class="tmd-block-title">${escapeHTML(node.title)}</h3>`
    : '';
  const contentHtml = node.content.map(renderNode).join
('');

  return `<section class="tmd-block tmd-block-${cssType}">${titleHtml}
  <div class="tmd-block-content">${contentHtml}</div>
</section>`;
}

// ==================== PullQuote ====================

function renderPullQuote(node: PullQuoteBlockNode): string {
  const authorHtml = node.author !== null
    ? `\n  <figcaption class="tmd-pullquote-author">${escapeHTML(node.author)}</figcaption>`
    : '';

  return `<figure class="tmd-block tmd-block-pullquote">
  <blockquote class="tmd-pullquote-text">
    <p>${escapeHTML(node.quote)}</p>
  </blockquote>${authorHtml}
</figure>`;
}

// ==================== Timeline ====================

function renderTimeline(node: TimelineBlockNode): string {
  const titleHtml = node.title !== null
    ? `\n  <h3 class="tmd-block-title">${escapeHTML(node.title)}</h3>`
    : '';

  const items = node.items.map(item => {
    if (item.type === 'TimelineEvent') {
      return `<div class="tmd-timeline-item">
      <div class="tmd-timeline-marker"></div>
      <div class="tmd-timeline-content">
        <p class="tmd-timeline-event">${escapeHTML(item.text)}</p>
      </div>
    </div>`;
    }
    // TimelineMarkdown
    return `<div class="tmd-timeline-item tmd-timeline-item-markdown">
      <div class="tmd-timeline-marker"></div>
      <div class="tmd-timeline-content">${md.render(item.raw)}</div>
    </div>`;
  }).join('\n    ');

  return `<section class="tmd-block tmd-block-timeline">${titleHtml}
  <div class="tmd-timeline">
    ${items}
  </div>
</section>`;
}

// ==================== ImageBlock ====================

function renderImageBlock(node: ImageBlockNode): string {
  const titleHtml = node.title !== null
    ? `<h3 class="tmd-block-title">${escapeHTML(node.title)}</h3>\n  `
    : '';

  const figure = `<figure class="tmd-media-figure${isWrapMode(node.mode) ? ` tmd-media-float-${getDirection(node.mode)}` : ''}">
    <img src="${escapeAttr(node.src)}" alt="${escapeAttr(node.caption)}" class="tmd-media-image" />
    <figcaption class="tmd-media-caption">${escapeHTML(node.caption)}</figcaption>
  </figure>`;

  const contentHtml = node.content.length > 0
    ? `<div class="tmd-media-content">${node.content.map(renderNode).join('')}</div>`
    : '';

  if (isWrapMode(node.mode)) {
    // *>wrap or *<wrap
    const dir = getDirection(node.mode);
    return `<section class="tmd-media-wrap tmd-media-wrap-${dir}">
  ${titleHtml}${figure}
  ${contentHtml}
  <div class="tmd-clearfix"></div>
</section>`;
  }

  // *> or *<
  const dir = getDirection(node.mode);
  return `<section class="tmd-media-block tmd-media-block-${dir}">
  ${titleHtml}<div class="tmd-media-block-inner">
    ${contentHtml}
    ${figure}
  </div>
</section>`;
}

function isWrapMode(mode: string): boolean {
  return mode === '*>wrap' || mode === '*<wrap';
}

function getDirection(mode: string): 'right' | 'left' {
  return mode.includes('>') ? 'right' : 'left';
}

// ==================== ErrorBlock ====================

function renderErrorBlock(node: ErrorBlockNode): string {
  return `<div class="tmd-error-block">
  <span class="tmd-error-marker">--ERROR BLOC--</span>
  <pre class="tmd-error-raw">${escapeHTML(node.raw)}</pre>
  <span class="tmd-error-marker">--ERROR BLOC--</span>
</div>`;
}

// ==================== Helpers ====================

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
