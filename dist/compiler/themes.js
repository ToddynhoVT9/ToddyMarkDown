/**
 * Os 4 temas base são internos ao compilador.
 * Valores extraídos de tmd-html-theme-spec-v1.5.
 */
export const BASE_THEMES = {
    essay: {
        '--tmd-bg': '#121212',
        '--tmd-surface': '#1b1b1b',
        '--tmd-surface-soft': '#202020',
        '--tmd-text': '#f5f1e8',
        '--tmd-text-soft': '#b6aea3',
        '--tmd-border': '#353535',
        '--tmd-accent': '#8c7b68',
        '--tmd-warning': '#8a5a5a',
        '--tmd-note': '#5f738d',
        '--tmd-radius': '16px',
        '--tmd-gap': '1.25rem',
        '--tmd-font-body': "'Lora', Georgia, serif",
        '--tmd-font-heading': "'Playfair Display', Georgia, serif",
        '--tmd-max-width': '760px',
    },
    ink: {
        '--tmd-bg': '#faf6f0',
        '--tmd-surface': '#f0ebe3',
        '--tmd-surface-soft': '#e8e2d8',
        '--tmd-text': '#2c2420',
        '--tmd-text-soft': '#6b5e52',
        '--tmd-border': '#d4ccc0',
        '--tmd-accent': '#a0522d',
        '--tmd-warning': '#a0522d',
        '--tmd-note': '#5a7a9a',
        '--tmd-radius': '8px',
        '--tmd-gap': '1.25rem',
        '--tmd-font-body': "'Libre Baskerville', Georgia, serif",
        '--tmd-font-heading': "'Playfair Display', Georgia, serif",
        '--tmd-max-width': '760px',
    },
    modern: {
        '--tmd-bg': '#0e0e10',
        '--tmd-surface': '#18181c',
        '--tmd-surface-soft': '#1e1e24',
        '--tmd-text': '#e8e8ee',
        '--tmd-text-soft': '#9090a0',
        '--tmd-border': '#2a2a34',
        '--tmd-accent': '#7c6aff',
        '--tmd-warning': '#d9534f',
        '--tmd-note': '#5b8dd9',
        '--tmd-radius': '12px',
        '--tmd-gap': '1.25rem',
        '--tmd-font-body': "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
        '--tmd-font-heading': "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
        '--tmd-max-width': '760px',
    },
    amber: {
        '--tmd-bg': '#141210',
        '--tmd-surface': '#1c1a16',
        '--tmd-surface-soft': '#22201a',
        '--tmd-text': '#e8e0d0',
        '--tmd-text-soft': '#a09880',
        '--tmd-border': '#3a3428',
        '--tmd-accent': '#c8913a',
        '--tmd-warning': '#b85c3a',
        '--tmd-note': '#6a8a70',
        '--tmd-radius': '10px',
        '--tmd-gap': '1.25rem',
        '--tmd-font-body': "'Raleway', 'Helvetica Neue', sans-serif",
        '--tmd-font-heading': "'Cormorant Garamond', Georgia, serif",
        '--tmd-max-width': '760px',
    },
};
/**
 * Google Fonts @import URLs por tema base.
 */
export const THEME_FONT_IMPORTS = {
    essay: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap',
    ink: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;700&display=swap',
    modern: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap',
    amber: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant:wght@400;600&family=Raleway:wght@400;500;600&display=swap',
};
/**
 * Mapeamento das chaves curtas do nível 1 (overrides) para vars CSS completas.
 */
export const OVERRIDE_KEY_MAP = {
    'bg': '--tmd-bg',
    'surface': '--tmd-surface',
    'text': '--tmd-text',
    'text-soft': '--tmd-text-soft',
    'accent': '--tmd-accent',
    'border': '--tmd-border',
    'font-body': '--tmd-font-body',
    'font-heading': '--tmd-font-heading',
    'radius': '--tmd-radius',
};
/**
 * Resolve variáveis globais (nível 1) de um tema.
 * - Se themeName é base → retorna BASE_THEMES[themeName]
 * - Se themeName é customizado → herda do BASE_THEMES[extends] + aplica overrides
 * - Se themeName desconhecido → fallback para essay
 * - Chaves em overrides fora de OVERRIDE_KEY_MAP são ignoradas silenciosamente
 */
export function resolveThemeVars(themeName, customThemes) {
    // Tema base direto
    if (BASE_THEMES[themeName]) {
        return { ...BASE_THEMES[themeName] };
    }
    // Tema customizado
    const custom = customThemes[themeName];
    if (!custom) {
        return { ...BASE_THEMES['essay'] };
    }
    // Herda do tema base declarado em extends
    const base = BASE_THEMES[custom.extends] ?? BASE_THEMES['essay'];
    const vars = { ...base };
    // Aplica overrides
    if (custom.overrides) {
        for (const [key, value] of Object.entries(custom.overrides)) {
            const cssVar = OVERRIDE_KEY_MAP[key];
            if (cssVar && value !== undefined) {
                vars[cssVar] = value;
            }
            // Chaves não mapeadas são ignoradas silenciosamente
        }
    }
    return vars;
}
