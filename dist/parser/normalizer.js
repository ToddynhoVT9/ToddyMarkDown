/**
 * Converte \r\n e \r para \n, retorna lines e lineOffsets.
 * lineOffsets são calculados no source já normalizado (após conversão de quebras).
 * Preserva linhas vazias e indentação.
 */
export function normalize(raw) {
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    const lineOffsets = [];
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
        lineOffsets.push(offset);
        offset += lines[i].length + 1; // +1 for the \n
    }
    return { lines, lineOffsets };
}
/**
 * Helper exportado — usado em todos os sub-parsers.
 * Calcula uma Position a partir de lineIndex (0-based) e column (0-based).
 */
export function positionAt(lineIndex, // 0-based
column, // 0-based
lineOffsets) {
    return {
        offset: lineOffsets[lineIndex] + column,
        line: lineIndex + 1,
        column,
    };
}
