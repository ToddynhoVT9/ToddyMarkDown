export function isEscapedLine(line: string): boolean {
  return /^\\.*/.test(line);
}

export function unescapeLine(line: string): string {
  if (isEscapedLine(line)) {
    return line.substring(1);
  }
  return line;
}
