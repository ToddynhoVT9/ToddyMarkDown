import { compile }     from '../../src/compiler/index.js';
import { loadConfig, EMPTY_CONFIG } from '../../src/compiler/config-loader.js';
import type { TMDConfig } from '../../src/types/index.js';
import fs   from 'fs';
import path from 'path';
import os   from 'os';

export async function compileFixture(
  fixturePath:  string,
  configOverride?: Partial<TMDConfig>
) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-test-'));
  const config = { ...EMPTY_CONFIG, ...configOverride };

  const result = await compile({
    tmdPath: path.resolve(fixturePath),
    outDir:  tmpDir,
    config,
  });

  const html = result.htmlPath ? fs.readFileSync(result.htmlPath, 'utf-8') : '';
  const css  = result.cssPath  ? fs.readFileSync(result.cssPath,  'utf-8') : '';

  return { result, html, css, tmpDir };
}

export function cleanup(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
