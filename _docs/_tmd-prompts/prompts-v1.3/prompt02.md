# prompt02 — Parser: núcleo, frontmatter, blocos literais e escapes

## Leia primeiro
`prompt00.md` — em especial: parser preserva ausência, não resolve defaults.

## Depende de
`prompt01.md` — tipos `ParseResult`, `Diagnostic`, `DiagnosticCode`, `FrontmatterFields`.

---

## Objetivo

Implementar as etapas 1–5 do pipeline do parser conforme `tmd-parser-spec v1.4`.

---

## Não fazer

- Não substituir `theme` ausente por `'essay'` — preservar `undefined`
- Não substituir `compile` ausente por `'standalone'` — preservar `undefined`
- Não emitir warnings como `console.warn` — emitir como `Diagnostic` no array de retorno
- Não criar tipos novos de erro — usar `Diagnostic` e `DiagnosticCode` do prompt01
- Não implementar parsing de blocos especiais (`|>...`) ainda — isso é prompt03 e prompt04

---

## `src/parser/normalizer.ts`

```typescript
export interface NormalizeResult {
  lines:       string[];
  lineOffsets: number[];
  // lineOffsets[i] = offset de caractere do início de lines[i] no source normalizado
  // Exemplo: source "abc\ndef" → lineOffsets = [0, 4]
}

export function normalize(raw: string): NormalizeResult
// Converte \r\n e \r para \n, retorna lines e lineOffsets
// lineOffsets são calculados no source já normalizado (após conversão de quebras)
// Preserva linhas vazias e indentação
```

**Cálculo de position a partir de lineOffsets:**

```typescript
// Helper exportado — usado em todos os sub-parsers
export function positionAt(
  lineIndex: number,  // 0-based
  column:    number,  // 0-based
  lineOffsets: number[]
): Position {
  return {
    offset: lineOffsets[lineIndex] + column,
    line:   lineIndex + 1,
    column,
  };
}
```

**Contrato de `end` em todos os parsers:**

`end` é **exclusivo** — aponta para o offset imediatamente após o último caractere do range, seguindo a convenção de CM6, LSP e tree-sitter.

Na prática: `end` deve ser calculado como `positionAt(lastLine, lines[lastLine].length, lineOffsets)`, onde `lines[lastLine].length` é o offset do `\n` que termina a linha (ou do EOF se for a última linha sem quebra). Nunca usar `lines[lastLine].length - 1`.

---

## `src/parser/frontmatter.ts`

Regras da spec:
- Só reconhecido se a primeira linha for exatamente `---`
- Termina no próximo `---` isolado
- Sem fechamento → `Diagnostic` com `FRONTMATTER_NOT_CLOSED`, `recoverable: false`
- Campos desconhecidos → `Diagnostic` com `WARN_UNKNOWN_FRONTMATTER_KEY`, `recoverable: true`
- **Não aplicar defaults** — `theme` e `compile` ausentes ficam `undefined`

```typescript
export interface FrontmatterParseResult {
  fields:        FrontmatterFields;
  consumedLines: number;
  diagnostics:   Diagnostic[];
  position:      SourceRange;  // cobre o bloco frontmatter inteiro, incluindo os ---
}

export function parseFrontmatter(
  lines:       string[],
  lineOffsets: number[],
  filePath:    string
): FrontmatterParseResult
```

`position.start` aponta para o `---` de abertura (linha 0, coluna 0).
`position.end` aponta para o offset **exclusivo** do `---` de fechamento — ou seja, `positionAt(closingLine, '---'.length, lineOffsets)`. Se não fechado, `end` aponta para o final da última linha consumida.

Regex úteis (da spec):
```
^---$
^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$
```

---

## `src/parser/literal.ts`

```typescript
export interface LiteralBlockParseResult {
  node:          LiteralBlockNode;
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

export function isLiteralBlockStart(line: string): boolean  // ^/>$
export function parseLiteralBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): LiteralBlockParseResult
// Bloco sem fechamento → LITERAL_BLOCK_NOT_CLOSED, recoverable: false
// position.start: início da linha />, position.end: exclusivo — positionAt(closingLine, '<\\'.length, lineOffsets)
// Conteúdo capturado como raw (nada interpretado)
```

---

## `src/parser/escape.ts`

```typescript
export function isEscapedLine(line: string): boolean   // ^\\.*
export function unescapeLine(line: string):  string    // remove o primeiro \
```

---

## `src/parser/index.ts` — esqueleto do parser principal

Este arquivo crescerá nos prompts 03 e 04. Por agora, implementar apenas as etapas 1–5:

```typescript
import { normalize, positionAt } from './normalizer.js';
import { parseFrontmatter }       from './frontmatter.js';
import { isLiteralBlockStart, parseLiteralBlock } from './literal.js';
import { isEscapedLine, unescapeLine } from './escape.js';
import type { ParseResult, DocumentNode, BodyNode, Diagnostic } from '../types/index.js';

export function parse(raw: string, filePath: string): ParseResult {
  const { lines, lineOffsets } = normalize(raw);
  const diagnostics: Diagnostic[] = [];
  const children:    BodyNode[]   = [];
  let cursor = 0;

  // etapa 3 — frontmatter
  let frontmatter = {};
  if (lines[0] === '---') {
    const result = parseFrontmatter(lines, lineOffsets, filePath);
    frontmatter  = result.fields;
    cursor       = result.consumedLines;
    diagnostics.push(...result.diagnostics);
  }

  // etapas 4–5 — varredura (blocos especiais chegam em prompts 03 e 04)
  while (cursor < lines.length) {
    const line = lines[cursor];

    if (isLiteralBlockStart(line)) {
      const result = parseLiteralBlock(lines, cursor, lineOffsets, filePath);
      children.push(result.node);
      diagnostics.push(...result.diagnostics);
      cursor += result.consumedLines;
      continue;
    }

    if (isEscapedLine(line)) {
      cursor++;
      continue;
    }

    // placeholder: acumula como markdown (será substituído em prompt04)
    cursor++;
  }
  // ...
}
```

---

## Testes

### `tests/parser/normalizer.test.ts`

```typescript
describe('normalize', () => {
  it('converte \\r\\n para \\n', ...)
  it('converte \\r para \\n', ...)
  it('preserva linhas vazias', ...)
  it('preserva indentação', ...)
  it('retorna array de linhas', ...)
  it('lineOffsets[0] === 0 sempre', ...)
  it('lineOffsets[1] === comprimento da linha 0 + 1 (o \\n)', ...)
  it('source de uma linha → lineOffsets com um elemento', ...)
  it('positionAt deriva offset, line e column corretamente', ...)
  // convenção exclusiva
  it('positionAt com column === line.length aponta para o \\n (end exclusivo)', ...)
  it('positionAt(0, 0) + positionAt(0, line.length) formam range [start, end) válido para CM6', ...)
})
```

### `tests/parser/frontmatter.test.ts`

```typescript
describe('parseFrontmatter', () => {
  it('extrai todos os campos válidos', ...)
  it('theme ausente → fields.theme === undefined', ...)
  it('compile ausente → fields.compile === undefined', ...)
  it('theme presente → fields.theme === valor original', ...)
  it('campo desconhecido → WARN_UNKNOWN_FRONTMATTER_KEY', ...)
  it('frontmatter sem fechamento → FRONTMATTER_NOT_CLOSED, recoverable false', ...)
  it('consumedLines correto', ...)
  it('sem frontmatter → consumedLines === 0', ...)
  it('position.start.offset === 0 para frontmatter na primeira linha', ...)
  it('position.end cobre o --- de fechamento', ...)
  it('diagnostic.position aponta para a linha do campo problemático', ...)
})
```

### `tests/parser/literal.test.ts`

```typescript
describe('parseLiteralBlock', () => {
  it('captura conteúdo bruto entre /> e <\\', ...)
  it('não interpreta sintaxe TMD dentro do bloco', ...)
  it('bloco sem fechamento → LITERAL_BLOCK_NOT_CLOSED', ...)
  it('recoverable: false quando não fechado', ...)
})
```

### `tests/parser/escape.test.ts`

```typescript
describe('escape', () => {
  it('detecta linha com \\', ...)
  it('remove o \\ e retorna o resto', ...)
  it('não detecta linha sem \\', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes novos passam, `tests/types.test.ts` continua passando
- `parseFrontmatter` retorna `fields.theme === undefined` quando `theme` está ausente
- `parseFrontmatter` retorna `fields.compile === undefined` quando `compile` está ausente
- Diagnostics de frontmatter e bloco literal usam `DiagnosticCode` canônicos
- Nenhum `console.warn` ou `console.error` diretamente nos módulos parser (só via Diagnostic)

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: src/parser/index.ts (esqueleto)
Interfaces públicas novas: NormalizeResult, FrontmatterParseResult, LiteralBlockParseResult, positionAt
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: loop principal do parser ainda usa placeholder para blocos especiais
```
