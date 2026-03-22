export function isEscapedLine(line) {
    return /^\\.*/.test(line);
}
export function unescapeLine(line) {
    if (isEscapedLine(line)) {
        return line.substring(1);
    }
    return line;
}
