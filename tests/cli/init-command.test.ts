import { describe, it, expect, vi } from 'vitest';
import { runInitCommand } from '../../src/cli/init-command.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-init-'));
}

describe('runInitCommand', () => {
  it('cria .config.tmd.json com conteúdo padrão', () => {
    const dir = tmpDir();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      runInitCommand(dir);
      const configPath = path.join(dir, '.config.tmd.json');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const raw = fs.readFileSync(configPath, 'utf-8');
      const data = JSON.parse(raw);
      
      expect(data.defaultTheme).toBe('essay');
      expect(data.defaultCompile).toBe('standalone');
      expect(data.themes).toEqual({});
      
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[OK]'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      logSpy.mockRestore();
    }
  });

  it('não sobrescreve se já existir e emite aviso', () => {
    const dir = tmpDir();
    
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const configPath = path.join(dir, '.config.tmd.json');
    fs.writeFileSync(configPath, '{"defaultTheme":"ink"}', 'utf-8');

    try {
      runInitCommand(dir);
      const raw = fs.readFileSync(configPath, 'utf-8');
      const data = JSON.parse(raw);
      
      expect(data.defaultTheme).toBe('ink'); // não sobrescreveu
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[AVISO]'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      warnSpy.mockRestore();
    }
  });
});
