import { describe, it, expect } from 'vitest';
import { processAssets, rewriteAssetPaths } from '../../src/compiler/asset-handler.js';
import { DiagnosticCode } from '../../src/types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-asset-'));
}

describe('processAssets', () => {
  it('copia imagem existente para outputDir/img/', async () => {
    const dir = tmpDir();
    const tmdDir = path.join(dir, 'src');
    const outDir = path.join(dir, 'out');
    fs.mkdirSync(tmdDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Create a fake image
    const imgDir = path.join(tmdDir, 'img');
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(imgDir, 'foto.jpg'), 'fake image data');

    const tmdPath = path.join(tmdDir, 'test.tmd');
    const results = await processAssets(['./img/foto.jpg'], tmdPath, outDir, 'test.tmd');

    expect(results[0].found).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'img', 'foto.jpg'))).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });

  it('resolvedSrc começa com ./img/', async () => {
    const dir = tmpDir();
    const tmdDir = path.join(dir, 'src');
    const outDir = path.join(dir, 'out');
    fs.mkdirSync(tmdDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    const imgDir = path.join(tmdDir, 'img');
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(imgDir, 'foto.jpg'), 'data');

    const tmdPath = path.join(tmdDir, 'test.tmd');
    const results = await processAssets(['./img/foto.jpg'], tmdPath, outDir, 'test.tmd');

    expect(results[0].resolvedSrc).toBe('./img/foto.jpg');

    fs.rmSync(dir, { recursive: true });
  });

  it('IMAGE_FILE_NOT_FOUND quando imagem inexistente', async () => {
    const dir = tmpDir();
    const tmdDir = path.join(dir, 'src');
    const outDir = path.join(dir, 'out');
    fs.mkdirSync(tmdDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    const tmdPath = path.join(tmdDir, 'test.tmd');
    const results = await processAssets(['./img/nonexist.jpg'], tmdPath, outDir, 'test.tmd');

    expect(results[0].found).toBe(false);
    expect(results[0].diagnostic?.code).toBe(DiagnosticCode.IMAGE_FILE_NOT_FOUND);
  });

  it('resolve caminho relativo ao tmdFilePath', async () => {
    const dir = tmpDir();
    const tmdDir = path.join(dir, 'nested', 'dir');
    const outDir = path.join(dir, 'out');
    fs.mkdirSync(tmdDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    const imgDir = path.join(tmdDir, 'img');
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(imgDir, 'test.png'), 'data');

    const tmdPath = path.join(tmdDir, 'test.tmd');
    const results = await processAssets(['./img/test.png'], tmdPath, outDir, 'test.tmd');

    expect(results[0].found).toBe(true);

    fs.rmSync(dir, { recursive: true });
  });
});

describe('rewriteAssetPaths', () => {
  it('substitui src original pelo resolvedSrc no HTML', () => {
    const html = '<img src="./old/path.jpg" alt="test" />';
    const result = rewriteAssetPaths(html, [{
      originalSrc: './old/path.jpg',
      resolvedSrc: './img/path.jpg',
      found: true,
      diagnostic: null,
    }]);
    expect(result).toContain('src="./img/path.jpg"');
  });

  it('substitui <img> por ErrorBlock quando not found', () => {
    const html = '<img src="./missing.jpg" alt="test" class="tmd-media-image" />';
    const result = rewriteAssetPaths(html, [{
      originalSrc: './missing.jpg',
      resolvedSrc: './img/missing.jpg',
      found: false,
      diagnostic: null,
    }]);
    expect(result).toContain('tmd-error-block-image');
    expect(result).toContain('--ERROR BLOC--');
    expect(result).not.toContain('<img');
  });
});
