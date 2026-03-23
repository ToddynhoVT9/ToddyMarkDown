import type { TMDConfigTheme } from '../types/index.js';
export interface ThemeVars {
    '--tmd-bg': string;
    '--tmd-surface': string;
    '--tmd-surface-soft': string;
    '--tmd-text': string;
    '--tmd-text-soft': string;
    '--tmd-border': string;
    '--tmd-accent': string;
    '--tmd-warning': string;
    '--tmd-note': string;
    '--tmd-radius': string;
    '--tmd-gap': string;
    '--tmd-font-body': string;
    '--tmd-font-heading': string;
    '--tmd-max-width': string;
    [key: string]: string;
}
/**
 * Os 4 temas base são internos ao compilador.
 * Valores extraídos de tmd-html-theme-spec-v1.5.
 */
export declare const BASE_THEMES: Record<string, ThemeVars>;
/**
 * Google Fonts @import URLs por tema base.
 */
export declare const THEME_FONT_IMPORTS: Record<string, string>;
/**
 * Mapeamento das chaves curtas do nível 1 (overrides) para vars CSS completas.
 */
export declare const OVERRIDE_KEY_MAP: Record<string, string>;
/**
 * Resolve variáveis globais (nível 1) de um tema.
 * - Se themeName é base → retorna BASE_THEMES[themeName]
 * - Se themeName é customizado → herda do BASE_THEMES[extends] + aplica overrides
 * - Se themeName desconhecido → fallback para essay
 * - Chaves em overrides fora de OVERRIDE_KEY_MAP são ignoradas silenciosamente
 */
export declare function resolveThemeVars(themeName: string, customThemes: Record<string, TMDConfigTheme>): ThemeVars;
