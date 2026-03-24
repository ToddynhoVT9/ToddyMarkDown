import type { CompileResult, Diagnostic } from '../types/index.js';

export function formatPosition(d: Diagnostic): string {
  if (d.position) {
    return `${d.position.start.line}:${d.position.start.column}`;
  }
  return '(sem posição)';
}

export function printCompileResult(result: CompileResult): void {
  // Always print OK for generated output (spec mentions HTML and CSS files are printed if it compiled,
  // but if it didn't write them due to a fatal, result wouldn't be returned.
  // Actually, compiler in compile() always writes them).
  for (const diag of result.diagnostics) {
    const pos = formatPosition(diag);
    if (diag.severity === 'error') {
      console.error(`[ERRO] ${diag.filePath} · ${pos} · ${diag.message}`);
    } else if (diag.severity === 'warning') {
      console.warn(`[WARN] ${diag.filePath} · ${pos} · ${diag.message}`);
    }
  }

  // Print OK lines
  console.log(`[OK]   ${result.htmlPath}`);
  console.log(`[OK]   ${result.cssPath}`);
}

export function printSlugCollision(slug: string, first: string, second: string): void {
  console.error(`[ERRO] Colisão de slug: "${slug}"`);
  console.error(`  → já compilado: ${first}`);
  console.error(`  → ignorado:     ${second}`);
}

export function printFatal(message: string): void {
  console.error(`[FATAL] ${message}`);
}

export function printWatchEvent(event: string, p: string): void {
  if (event === 'MUDANÇA') {
    console.log(`[MUDANÇA] ${p}`);
  } else {
    console.log(`[WATCH] ${event}: ${p}`);
  }
}
