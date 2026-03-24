import type { Diagnostic } from '../types/index.js';
export interface AssetResult {
    originalSrc: string;
    resolvedSrc: string;
    found: boolean;
    diagnostic: Diagnostic | null;
}
/**
 * Processa assets de imagem: verifica existência e copia para outputDir/img/.
 */
export declare function processAssets(assetPaths: string[], // DocumentNode.assets
tmdFilePath: string, // caminho absoluto do .tmd
outputDir: string, // ex: /projeto/dist/meu-artigo/
filePath: string): Promise<AssetResult[]>;
/**
 * Reescreve caminhos de assets no HTML gerado.
 * - Asset encontrado: substitui src="originalSrc" → src="resolvedSrc"
 * - Asset não encontrado: substitui <img ...> pelo ErrorBlock HTML de imagem
 */
export declare function rewriteAssetPaths(html: string, assetResults: AssetResult[]): string;
