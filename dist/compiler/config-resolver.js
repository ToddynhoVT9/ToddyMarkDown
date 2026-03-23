export const VALID_THEMES = ['essay', 'ink', 'modern', 'amber'];
export const VALID_COMPILES = ['standalone', 'fragment'];
/**
 * Resolve a hierarquia de defaults para theme e compile.
 * Esta é a ÚNICA camada no projeto que substitui undefined por defaults.
 *
 * Hierarquia para theme:
 *   1. frontmatter.theme se presente e válido (base ou customizado)
 *   2. config.defaultTheme se presente e válido
 *   3. 'essay'
 *
 * Hierarquia para compile:
 *   1. frontmatter.compile se 'standalone' ou 'fragment'
 *   2. config.defaultCompile se 'standalone' ou 'fragment'
 *   3. 'standalone'
 */
export function resolveConfig(frontmatter, config) {
    const customThemeNames = Object.keys(config.themes ?? {});
    const allValidThemes = [...VALID_THEMES, ...customThemeNames];
    // Resolve theme
    let theme = 'essay';
    if (frontmatter.theme && allValidThemes.includes(frontmatter.theme)) {
        theme = frontmatter.theme;
    }
    else if (config.defaultTheme && allValidThemes.includes(config.defaultTheme)) {
        theme = config.defaultTheme;
    }
    // Resolve compile
    let compile = 'standalone';
    if (frontmatter.compile && isValidCompile(frontmatter.compile)) {
        compile = frontmatter.compile;
    }
    else if (config.defaultCompile && isValidCompile(config.defaultCompile)) {
        compile = config.defaultCompile;
    }
    return {
        theme,
        compile,
        customThemes: config.themes ?? {},
        allowExternalCSS: config.allowExternalCSS ?? false,
    };
}
function isValidCompile(value) {
    return VALID_COMPILES.includes(value);
}
