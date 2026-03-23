import type { ResolvedConfig } from '../types/index.js';
export interface CSSGeneratorOptions {
    resolvedConfig: ResolvedConfig;
}
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
export declare function generateCSS(options: CSSGeneratorOptions): string;
