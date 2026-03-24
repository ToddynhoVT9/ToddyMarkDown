export function formatPosition(d) {
    if (d.position) {
        return `${d.position.start.line}:${d.position.start.column}`;
    }
    return '(sem posição)';
}
export function printCompileResult(result) {
    // Always print OK for generated output (spec mentions HTML and CSS files are printed if it compiled,
    // but if it didn't write them due to a fatal, result wouldn't be returned.
    // Actually, compiler in compile() always writes them).
    for (const diag of result.diagnostics) {
        const pos = formatPosition(diag);
        if (diag.severity === 'error') {
            console.error(`[ERRO] ${diag.filePath} · ${pos} · ${diag.message}`);
        }
        else if (diag.severity === 'warning') {
            console.warn(`[WARN] ${diag.filePath} · ${pos} · ${diag.message}`);
        }
    }
    // Print OK lines
    console.log(`[OK]   ${result.htmlPath}`);
    console.log(`[OK]   ${result.cssPath}`);
}
export function printSlugCollision(slug, first, second) {
    console.error(`[ERRO] Colisão de slug: "${slug}"`);
    console.error(`  → já compilado: ${first}`);
    console.error(`  → ignorado:     ${second}`);
}
export function printFatal(message) {
    console.error(`[FATAL] ${message}`);
}
export function printWatchEvent(event, p) {
    if (event === 'MUDANÇA') {
        console.log(`[MUDANÇA] ${p}`);
    }
    else {
        console.log(`[WATCH] ${event}: ${p}`);
    }
}
export function printInitCreated(path) {
    console.log(`[OK]   ${path} criado`);
}
export function printInitExists(path) {
    console.warn(`[AVISO] ${path} já existe`);
}
