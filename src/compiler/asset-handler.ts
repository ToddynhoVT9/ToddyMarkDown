import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Diagnostic } from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';

export interface AssetResult {
  originalSrc:  string;
  resolvedSrc:  string;    // caminho relativo ao HTML de saída, ex: './img/foto.jpg'
  found:        boolean;
  diagnostic:   Diagnostic | null;  // IMAGE_FILE_NOT_FOUND se não encontrado
}

/**
 * Processa assets de imagem: verifica existência e copia para outputDir/img/.
 */
export async function processAssets(
  assetPaths:  string[],   // DocumentNode.assets
  tmdFilePath: string,     // caminho absoluto do .tmd
  outputDir:   string,     // ex: /projeto/dist/meu-artigo/
  filePath:    string,     // para Diagnostic.filePath
): Promise<AssetResult[]> {
  const tmdDir = path.dirname(tmdFilePath);
  const results: AssetResult[] = [];
  const seen = new Set<string>();

  for (const assetPath of assetPaths) {
    // Deduplicate
    if (seen.has(assetPath)) continue;
    seen.add(assetPath);

    const absoluteSrc = path.resolve(tmdDir, assetPath);
    const basename = path.basename(assetPath);
    const resolvedSrc = `./img/${basename}`;

    if (fs.existsSync(absoluteSrc)) {
      // Copy to outputDir/img/
      const destDir = path.join(outputDir, 'img');
      const destPath = path.join(destDir, basename);

      try {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(absoluteSrc, destPath);
      } catch {
        // Ignore copy errors silently, file may be locked
      }

      results.push({
        originalSrc: assetPath,
        resolvedSrc,
        found:       true,
        diagnostic:  null,
      });
    } else {
      results.push({
        originalSrc: assetPath,
        resolvedSrc,
        found:       false,
        diagnostic: {
          severity:    'error',
          code:        DiagnosticCode.IMAGE_FILE_NOT_FOUND,
          message:     `Image file not found: ${assetPath}`,
          position:    null,
          filePath,
          recoverable: false,
        },
      });
    }
  }

  return results;
}

/**
 * Reescreve caminhos de assets no HTML gerado.
 * - Asset encontrado: substitui src="originalSrc" → src="resolvedSrc"
 * - Asset não encontrado: substitui <img ...> pelo ErrorBlock HTML de imagem
 */
export function rewriteAssetPaths(
  html:         string,
  assetResults: AssetResult[],
): string {
  let result = html;

  for (const asset of assetResults) {
    if (asset.found) {
      // Replace src attribute value
      result = result.split(`src="${asset.originalSrc}"`).join(`src="${asset.resolvedSrc}"`);
    } else {
      // Replace entire <img> tag with error block
      const imgRegex = new RegExp(
        `<img\\s+[^>]*src="${escapeRegex(asset.originalSrc)}"[^>]*/?>`,
        'g'
      );
      const errorHtml = `<div class="tmd-error-block tmd-error-block-image">
  <span class="tmd-error-marker">--ERROR BLOC--</span>
  <pre class="tmd-error-raw">${escapeHTML(asset.originalSrc)}</pre>
  <span class="tmd-error-marker">--ERROR BLOC--</span>
</div>`;
      result = result.replace(imgRegex, errorHtml);
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
