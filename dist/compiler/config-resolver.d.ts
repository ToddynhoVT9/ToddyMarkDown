import type { FrontmatterFields, TMDConfig, ResolvedConfig } from '../types/index.js';
export declare const VALID_THEMES: readonly ["essay", "ink", "modern", "amber"];
export declare const VALID_COMPILES: readonly ["standalone", "fragment"];
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
export declare function resolveConfig(frontmatter: FrontmatterFields, config: TMDConfig): ResolvedConfig;
