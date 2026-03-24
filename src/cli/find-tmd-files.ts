import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Busca recursivamente todos os arquivos .tmd em um diretório.
 * Lança error se o diretório não existir ou não for um diretório.
 */
export async function findTmdFiles(dirPath: string): Promise<string[]> {
  const stat = fs.statSync(dirPath, { throwIfNoEntry: false });
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Directory not found or not a directory: ${dirPath}`);
  }

  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // Recursion
      const subFiles = await findTmdFiles(fullPath);
      results.push(...subFiles);
    } else if (entry.isFile() && fullPath.endsWith('.tmd')) {
      results.push(fullPath);
    }
  }

  return results;
}
