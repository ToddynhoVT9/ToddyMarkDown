import type { DocumentNode, ResolvedConfig } from '../types/index.js';
export interface RenderOptions {
    resolvedConfig: ResolvedConfig;
    title: string;
    cssFileName: string;
    customThemeNames: string[];
    customCssFile?: string;
}
/**
 * Transforma DocumentNode + ResolvedConfig em string HTML.
 * Sem I/O. Sem efeitos colaterais.
 */
export declare function renderHTML(doc: DocumentNode, options: RenderOptions): string;
