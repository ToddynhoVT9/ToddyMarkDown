import * as fs from 'node:fs';
import * as path from 'node:path';
import chokidar from 'chokidar';
import { runCompileCommand } from './compile-command.js';
import { printWatchEvent } from './print-diagnostics.js';

export interface WatchOptions {
  target:  string;
  out:     string;
  config?: string;
}

export function runWatchCommand({ target, out, config }: WatchOptions): void {
  console.log(`[WATCH] Monitorando ${target} — Ctrl+C para encerrar`);

  // compilação inicial
  // We use the async response inside this setup without crashing process since watch lives on
  runCompileCommand({ target, out, config }).catch(console.error);

  const isFile    = target.endsWith('.tmd');
  const patterns  = isFile ? [target] : [path.join(target, '**/*.tmd')];
  
  const configFile = config ?? path.join(process.cwd(), '.config.tmd.json');
  if (fs.existsSync(configFile)) patterns.push(configFile);

  const watcher = chokidar.watch(patterns, {
    ignoreInitial: true,
    persistent:    true,
  });

  watcher.on('change', async (changedPath) => {
    printWatchEvent('MUDANÇA', changedPath);
    const isConfigChange = changedPath.endsWith('.config.tmd.json');
    
    try {
      await runCompileCommand({
        target: isConfigChange ? target : changedPath,
        out,
        config,
      });
    } catch (e) {
      console.error(e);
      // erro de parsing ou runtime não encerra o processo
    }
  });

  // NÃO ouvir 'add' — arquivos novos são ignorados na spec atual
  // process.on handlers should be registered so Ctrl+C gracefully cleans up the process
  process.on('SIGINT', () => {
    watcher.close().then(() => {
      console.log('\n[WATCH] Encerrado.');
      process.exit(0);
    });
  });
}
