import { describe, it, expect } from 'vitest';
import { runCompileCommand } from '../../src/cli/compile-command.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-cli-'));
}

function writeTmd(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('runCompileCommand — arquivo único', () => {
  it('compila basico.tmd → exitCode 0', async () => {
    const dir = tmpDir();
    const tmdPath = writeTmd(dir, 'basico.tmd', `---\ntitle: Basico\n---\nConteudo.`);
    const out = path.join(dir, 'dist');
    
    // Suppress console locally
    const log = console.log;
    console.log = () => {};

    try {
      const res = await runCompileCommand({ target: tmdPath, out });
      expect(res.exitCode).toBe(0);
      expect(res.fatalError).toBeNull();
      expect(res.filesProcessed).toBe(1);
      expect(fs.existsSync(path.join(out, 'basico', 'basico.html'))).toBe(true);
    } finally {
      console.log = log;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('arquivo inexistente → fatalError + exitCode 2', async () => {
    const res = await runCompileCommand({ target: '/nonexistent/file.tmd', out: 'dist' });
    expect(res.exitCode).toBe(2);
    expect(res.fatalError).toContain('Objeto não encontrado');
  });

  it('não .tmd → fatalError + exitCode 2', async () => {
    const dir = tmpDir();
    const txtPath = writeTmd(dir, 'basico.txt', 'Text');
    const out = path.join(dir, 'dist');

    try {
      const res = await runCompileCommand({ target: txtPath, out });
      expect(res.exitCode).toBe(2);
      expect(res.fatalError).toContain('Arquivo não é .tmd');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('runCompileCommand — diretório', () => {
  it('compila todos os .tmd do diretório recursivamente e sai achatado', async () => {
    const dir = tmpDir();
    const out = path.join(dir, 'dist');
    const targetDir = path.join(dir, 'src');
    const subDir = path.join(targetDir, 'sub');
    fs.mkdirSync(subDir, { recursive: true });

    writeTmd(targetDir, 'um.tmd', '---\ntitle: Um\n---\n1');
    writeTmd(subDir, 'dois.tmd', '---\ntitle: Dois\n---\n2');
    
    // Some noise
    fs.writeFileSync(path.join(targetDir, 'noise.txt'), 'noise');

    const log = console.log;
    console.log = () => {};

    try {
      const res = await runCompileCommand({ target: targetDir, out });
      expect(res.exitCode).toBe(0);
      expect(res.fatalError).toBeNull();
      expect(res.filesProcessed).toBe(2);
      
      // Flattened outputs
      expect(fs.existsSync(path.join(out, 'um', 'um.html'))).toBe(true);
      expect(fs.existsSync(path.join(out, 'dois', 'dois.html'))).toBe(true);
    } finally {
      console.log = log;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('colisão de slug: pula segundo, continua, exitCode 1', async () => {
    const dir = tmpDir();
    const out = path.join(dir, 'dist');
    const targetDir = path.join(dir, 'src');
    fs.mkdirSync(targetDir, { recursive: true });

    writeTmd(targetDir, 'arquivo1.tmd', '---\ntitle: Mesmo Slug\n---\n1');
    writeTmd(targetDir, 'arquivo2.tmd', '---\ntitle: Mesmo Slug\n---\n2');

    const log = console.log;
    const err = console.error;
    console.log = () => {};
    console.error = () => {};

    try {
      const res = await runCompileCommand({ target: targetDir, out });
      expect(res.exitCode).toBe(1);
      expect(res.filesProcessed).toBe(1);
      expect(res.filesWithErrors).toBe(1);
      expect(fs.existsSync(path.join(out, 'mesmo-slug', 'mesmo-slug.html'))).toBe(true);
    } finally {
      console.log = log;
      console.error = err;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('diretório inexistente → fatalError + exitCode 2', async () => {
    const res = await runCompileCommand({ target: '/nonexistent/dir/', out: 'dist' });
    expect(res.exitCode).toBe(2);
    expect(res.fatalError).toContain('Objeto não encontrado');
  });
});
