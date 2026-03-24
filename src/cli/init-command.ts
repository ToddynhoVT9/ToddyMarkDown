import * as fs from 'node:fs';
import * as path from 'node:path';
import { printInitCreated, printInitExists } from './print-diagnostics.js';

export function runInitCommand(cwd?: string): void {
  const targetDir = cwd ?? process.cwd();
  const configPath = path.join(targetDir, '.config.tmd.json');

  if (fs.existsSync(configPath)) {
    printInitExists(configPath);
    return;
  }

  const defaultContent = {
    defaultTheme: "essay",
    defaultCompile: "standalone",
    themes: {}
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  printInitCreated(configPath);
}
