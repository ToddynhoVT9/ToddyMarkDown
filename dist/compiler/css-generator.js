import { BASE_THEMES, THEME_FONT_IMPORTS, resolveThemeVars } from './themes.js';
/**
 * Gera CSS completo. Sem I/O. Sem efeitos colaterais.
 *
 * Estrutura do CSS gerado (nesta ordem):
 * 1. @import Google Fonts
 * 2. Reset e base
 * 3. Bloco de variáveis globais para cada tema (nível 1)
 * 4. Blocos de variáveis por tipo de bloco para temas customizados (nível 2)
 * 5. CSS estrutural de componentes usando var()
 * 6. @media responsividade
 */
export function generateCSS(options) {
    const { resolvedConfig } = options;
    const mode = resolvedConfig.compile;
    const parts = [];
    // 1. @import Google Fonts
    parts.push(generateFontImports(resolvedConfig));
    // 2. Reset e base
    parts.push(generateReset());
    // 3–4. Theme variables (base + custom)
    parts.push(generateAllThemeCSS(resolvedConfig, mode));
    // 5. Structural CSS
    parts.push(generateStructuralCSS(mode));
    // 6. Responsive
    parts.push(generateResponsiveCSS());
    return parts.filter(Boolean).join('\n\n');
}
// ==================== 1. Font Imports ====================
function generateFontImports(config) {
    // Collect unique font imports from all themes in play
    const fontUrls = new Set();
    // All base themes are always included
    for (const name of Object.keys(BASE_THEMES)) {
        if (THEME_FONT_IMPORTS[name])
            fontUrls.add(THEME_FONT_IMPORTS[name]);
    }
    // Custom themes inherit from base, so their base fonts are already included
    // No additional font imports needed for custom themes
    return [...fontUrls].map(url => `@import url('${url}');`).join('\n');
}
// ==================== 2. Reset ====================
function generateReset() {
    return `/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}`;
}
// ==================== 3–4. Theme CSS ====================
function generateAllThemeCSS(config, mode) {
    const parts = [];
    // Base themes
    for (const name of Object.keys(BASE_THEMES)) {
        const vars = BASE_THEMES[name];
        parts.push(generateThemeVarsBlock(name, vars, mode));
    }
    // Custom themes
    for (const [name, themeDef] of Object.entries(config.customThemes)) {
        const vars = resolveThemeVars(name, config.customThemes);
        parts.push(generateThemeVarsBlock(name, vars, mode));
        // Nível 2 — blocks
        if (themeDef.blocks) {
            parts.push(generateBlockOverrides(name, themeDef, mode));
        }
    }
    return parts.filter(Boolean).join('\n\n');
}
function themeSelector(name, mode) {
    return mode === 'standalone'
        ? `[data-theme="${name}"]`
        : `.tmd-theme-${name}`;
}
function generateThemeVarsBlock(name, vars, mode) {
    const sel = themeSelector(name, mode);
    const entries = Object.entries(vars)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n');
    return `${sel} {\n${entries}\n}`;
}
// ==================== Nível 2 — Block Overrides ====================
const BLOCK_CSS_CLASS = {
    explainer: '.tmd-block-explainer',
    note: '.tmd-block-note',
    warning: '.tmd-block-warning',
    concept: '.tmd-block-concept',
    aside: '.tmd-block-aside',
    question: '.tmd-block-question',
    takeaway: '.tmd-block-takeaway',
    pullquote: '.tmd-block-pullquote',
    timeline: '.tmd-block-timeline',
};
// Blocos que aceitam bg no nível 2
const BLOCKS_WITH_BG = new Set(['explainer', 'note', 'warning', 'concept', 'aside']);
function generateBlockOverrides(name, theme, mode) {
    if (!theme.blocks)
        return '';
    const sel = themeSelector(name, mode);
    const parts = [];
    for (const [blockName, blockProps] of Object.entries(theme.blocks)) {
        if (!blockProps)
            continue;
        const blockClass = BLOCK_CSS_CLASS[blockName];
        if (!blockClass)
            continue;
        // timeline com marker-color → regra direta em .tmd-timeline-marker
        if (blockName === 'timeline' && blockProps['marker-color']) {
            parts.push(`${sel} .tmd-timeline-marker {\n  background: ${blockProps['marker-color']};\n}`);
        }
        // timeline e pullquote não aceitam bg
        const acceptsBg = BLOCKS_WITH_BG.has(blockName);
        const vars = [];
        if (blockProps['border-color'] && blockName !== 'timeline') {
            vars.push(`  --tmd-block-border-color: ${blockProps['border-color']};`);
        }
        if (blockProps['bg'] && acceptsBg) {
            vars.push(`  --tmd-block-bg: ${blockProps['bg']};`);
        }
        if (vars.length > 0) {
            parts.push(`${sel} ${blockClass} {\n${vars.join('\n')}\n}`);
        }
    }
    return parts.join('\n\n');
}
// ==================== 5. Structural CSS ====================
function generateStructuralCSS(mode) {
    const parts = [];
    // Body
    parts.push(`body {
  margin: 0;
  background: var(--tmd-bg);
  color: var(--tmd-text);
  font-family: var(--tmd-font-body);
  line-height: 1.85;
}`);
    // Site header and switcher — standalone only
    if (mode === 'standalone') {
        parts.push(`/* Site Header & Switcher */
.tmd-site-header {
  background: var(--tmd-bg);
  border-bottom: 1px solid var(--tmd-border);
  padding: 0.75rem clamp(1rem, 4vw, 2rem);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tmd-theme-switcher {
  display: flex;
  gap: 0.4rem;
}

.tmd-theme-btn {
  font-size: 0.7rem;
  font-family: var(--tmd-font-body);
  letter-spacing: 0.1em;
  text-transform: lowercase;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid var(--tmd-border);
  background: transparent;
  color: var(--tmd-text-soft);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tmd-theme-btn:hover,
.tmd-theme-btn[data-active] {
  color: var(--tmd-accent);
  border-color: var(--tmd-accent);
}`);
    }
    // Document
    parts.push(`.tmd-document {
  max-width: var(--tmd-max-width);
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}`);
    // Header
    parts.push(`.tmd-header {
  margin-bottom: 2.5rem;
}

.tmd-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--tmd-text-soft);
}

.tmd-title {
  font-family: var(--tmd-font-heading);
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.1;
  margin: 0.4rem 0;
}

.tmd-subtitle {
  color: var(--tmd-text-soft);
  font-style: italic;
  margin: 0 0 1rem;
}

.tmd-author {
  color: var(--tmd-text-soft);
  font-size: 0.95rem;
}`);
    // Markdown
    parts.push(`.tmd-markdown {
  margin: 1rem 0;
}

.tmd-literal {
  background: var(--tmd-surface);
  border: 1px solid var(--tmd-border);
  border-radius: var(--tmd-radius);
  padding: 1rem 1.2rem;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9rem;
  margin: 1.5rem 0;
}`);
    // Blocks base
    parts.push(`.tmd-block {
  margin: 1.75rem 0;
}

.tmd-block-title {
  margin: 0 0 0.8rem;
  font-size: 1.2rem;
}

.tmd-block-content {
  line-height: 1.8;
}`);
    // Explainer / Note / Warning / Concept
    parts.push(`.tmd-block-explainer,
.tmd-block-note,
.tmd-block-warning,
.tmd-block-concept {
  padding: 1rem 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
  border-radius: 0 var(--tmd-radius) var(--tmd-radius) 0;
  background: var(--tmd-block-bg, var(--tmd-surface-soft));
}

.tmd-block-note {
  border-left-color: var(--tmd-block-border-color, var(--tmd-note));
}

.tmd-block-warning {
  border-left-color: var(--tmd-block-border-color, var(--tmd-warning));
}`);
    // Aside / Question / Takeaway
    parts.push(`.tmd-block-aside {
  padding: 1rem 1.2rem;
  border-left: 2px dashed var(--tmd-block-border-color, var(--tmd-border));
  border-radius: 0 var(--tmd-radius) var(--tmd-radius) 0;
  background: var(--tmd-block-bg, var(--tmd-surface-soft));
}

.tmd-block-question {
  padding: 1rem 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
  font-style: italic;
}

.tmd-block-takeaway {
  padding: 1rem 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
  background: var(--tmd-block-bg, var(--tmd-surface-soft));
}`);
    // Pullquote
    parts.push(`.tmd-block-pullquote {
  margin: 2.5rem 0;
  padding-left: 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
}

.tmd-pullquote-text {
  margin: 0;
  font-family: var(--tmd-font-heading);
  font-size: 1.35rem;
  font-style: italic;
}

.tmd-pullquote-author {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--tmd-text-soft);
}`);
    // Timeline
    parts.push(`.tmd-timeline {
  position: relative;
  padding-left: 1.4rem;
}

.tmd-timeline::before {
  content: "";
  position: absolute;
  left: 0.35rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--tmd-border);
}

.tmd-timeline-item {
  position: relative;
  margin-bottom: 1rem;
}

.tmd-timeline-marker {
  position: absolute;
  left: -1.05rem;
  top: 0.45rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--tmd-block-marker-color, var(--tmd-accent));
}

.tmd-timeline-content {
  padding-left: 0.75rem;
}`);
    // Error block
    parts.push(`.tmd-error-block {
  background: rgba(180, 40, 40, 0.15);
  border: 1px solid rgba(180, 40, 40, 0.4);
  border-radius: 6px;
  padding: 1rem 1.2rem;
  margin: 1.5rem 0;
}

.tmd-error-marker {
  display: block;
  font-family: monospace;
  font-size: 0.75rem;
  color: rgba(220, 80, 80, 0.8);
  letter-spacing: 0.1em;
}

.tmd-error-raw {
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.88rem;
  color: inherit;
  white-space: pre-wrap;
}

.tmd-error-block-image {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}`);
    // Media blocks (image)
    parts.push(`/* Media blocks — sem abraço */
.tmd-media-block-inner {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 260px);
  gap: var(--tmd-gap);
  align-items: start;
}

.tmd-media-block-left .tmd-media-block-inner {
  grid-template-columns: minmax(180px, 260px) 1fr;
}

/* Media blocks — com abraço */
.tmd-media-float-right {
  float: right;
  margin: 0 0 1rem 1rem;
  width: min(260px, 42%);
}

.tmd-media-float-left {
  float: left;
  margin: 0 1rem 1rem 0;
  width: min(260px, 42%);
}

.tmd-clearfix {
  clear: both;
}

/* Figure e imagem */
.tmd-media-figure {
  margin: 0;
}

.tmd-media-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.tmd-media-caption {
  margin-top: 0.45rem;
  font-size: 0.82rem;
  color: var(--tmd-text-soft);
}`);
    return parts.join('\n\n');
}
// ==================== 6. Responsive ====================
function generateResponsiveCSS() {
    return `@media (max-width: 720px) {
  .tmd-media-block-inner {
    grid-template-columns: 1fr !important;
  }

  .tmd-media-float-right,
  .tmd-media-float-left {
    float: none;
    width: 100%;
    margin: 0 0 1rem 0;
  }
}`;
}
