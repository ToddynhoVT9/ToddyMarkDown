#!/usr/bin/env node
import { printFatal } from './print-diagnostics.js';

const [,, command, ...rest] = process.argv;

async function main() {
  if (command === 'compile') {
    const target = rest[0];
    if (!target) {
      printFatal('Uso: tmd compile <arquivo|dir> [--out <dir>] [--config <path>]');
      process.exit(2);
    }

    const out    = argAfter('--out',    rest) ?? 'dist';
    const config = argAfter('--config', rest);
    const watch  = rest.includes('--watch');

    if (watch) {
      const { runWatchCommand } = await import('./watch-command.js');
      runWatchCommand({ target, out, config }); // não chama process.exit — fica vivo
    } else {
      const { runCompileCommand } = await import('./compile-command.js');
      const result = await runCompileCommand({ target, out, config });
      if (result.fatalError) printFatal(result.fatalError);
      process.exit(result.exitCode);
    }
  }
  else if (command === 'init') {
    const { runInitCommand } = await import('./init-command.js');
    runInitCommand();
    process.exit(0);
  }
  else {
    printFatal(`Comando desconhecido: ${command ?? '(nenhum)'}. Use: compile, init`);
    process.exit(2);
  }
}

function argAfter(flag: string, args: string[]): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}

main().catch(err => {
  printFatal(err.message);
  process.exit(2);
});
