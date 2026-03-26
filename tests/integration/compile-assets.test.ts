import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { compileFixture, cleanup } from '../helpers/test-utils.js';
import fs from 'fs';
import path from 'path';

describe('compile com assets', () => {
  let tmpDirs: string[] = [];

  beforeAll(() => {
    const imgDir = path.resolve('./fixtures/valid/img');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    fs.writeFileSync(path.join(imgDir, 'default.jpg'), Buffer.from('fake image'));
    fs.writeFileSync(path.join(imgDir, 'wide.jpg'), Buffer.from('fake image'));
    fs.writeFileSync(path.join(imgDir, 'full.jpg'), Buffer.from('fake image'));
    fs.writeFileSync(path.join(imgDir, 'float.jpg'), Buffer.from('fake image'));
  });

  afterEach(() => {
    tmpDirs.forEach(cleanup);
    tmpDirs = [];
  });

  it('imagem existente copiada para outDir/slug/img/', async () => {
    const { result, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    const slugDir = path.dirname(result.htmlPath!);
    expect(fs.existsSync(path.join(slugDir, 'img', 'default.jpg'))).toBe(true);
  });

  it('src reescrito no HTML para ./img/{filename}', async () => {
    const { html, tmpDir } = await compileFixture('./fixtures/valid/essay-completo.tmd');
    tmpDirs.push(tmpDir);
    expect(html).toContain('src="./img/default.jpg"');
  });

  it('imagem em markdown comum também copiada', async () => {
    const p = path.resolve('./fixtures/valid/markdown-img.tmd');
    fs.writeFileSync(p, '---\ntitle: MD Img\n---\n![Alt text](img/default.jpg)\n');
    
    const { result, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    fs.unlinkSync(p);
    const slugDir = path.dirname(result.htmlPath!);
    expect(fs.existsSync(path.join(slugDir, 'img', 'default.jpg'))).toBe(true);
  });

  it('imagem não encontrada → ErrorBlock de imagem no HTML', async () => {
    const { tmpDir: fixtureDir } = await compileFixture('./fixtures/valid/fragment.tmd'); 
    const p = path.join(fixtureDir, 'missing-img.tmd');
    fs.writeFileSync(p, '---\ntitle: Missing\n---\n![missing](img/not-found.jpg)\n');
    
    const { html, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    expect(html).toContain('tmd-error-block');
  });

  it('ErrorBlock de imagem tem classe tmd-error-block-image', async () => {
    const { tmpDir: fixtureDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    const p = path.join(fixtureDir, 'missing-img.tmd');
    fs.writeFileSync(p, '---\ntitle: Missing\n---\n![missing](img/not-found.jpg)\n');
    
    const { html, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    expect(html).toContain('class="tmd-error-block tmd-error-block-image"');
  });

  it('IMAGE_FILE_NOT_FOUND em diagnostics quando imagem ausente', async () => {
    const { tmpDir: fixtureDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    const p = path.join(fixtureDir, 'missing-img.tmd');
    fs.writeFileSync(p, '---\ntitle: Missing\n---\n![missing](img/not-found.jpg)\n');
    
    const { result, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    expect(result.diagnostics.some(d => d.code === 'IMAGE_FILE_NOT_FOUND')).toBe(true);
  });

  it('compile continua após imagem ausente — gera HTML parcial', async () => {
    const { tmpDir: fixtureDir } = await compileFixture('./fixtures/valid/fragment.tmd');
    const p = path.join(fixtureDir, 'missing-img.tmd');
    fs.writeFileSync(p, '---\ntitle: Missing\n---\n![missing](img/not-found.jpg)\nTexto final.\n');
    
    const { html, tmpDir } = await compileFixture(p);
    tmpDirs.push(tmpDir);
    expect(html).toContain('Texto final.');
  });
});
