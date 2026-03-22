# prompt03 — Parser: família de conteúdo

## Leia primeiro
`prompt00.md` — responsabilidade de módulo; sem duplicação de regex.

## Depende de
`prompt01.md` — todos os tipos AST de conteúdo.
`prompt02.md` — `parse()` com loop principal em uso.

---

## Objetivo

Implementar o parsing completo da família de conteúdo: 9 tokens, com regras especiais de `|>@` e `|>~~`.

---

## Não fazer

- Não modificar `FrontmatterFields` nem `Diagnostic` — usar os do prompt01
- Não implementar blocos de imagem (`|>*>` etc.) — isso é prompt04
- Não chamar `console.error` diretamente — emitir `Diagnostic` com código canônico
- Não criar tipo de erro próprio — `ErrorBlockNode` já existe nos tipos

---

## `src/parser/content-block.ts`

### Regex de abertura (da spec — guardar como constante exportada)

```typescript
export const CONTENT_BLOCK_OPEN_RE =
  /^\|>(!|@|\$|##|#|\?|\+|~~|&)(?:\s+\[(.*?)\])?$/;
// Atenção: ## deve ser testado antes de # no alternador — já está correto nesta ordem
```

```typescript
export const CONTENT_BLOCK_CLOSE_RE = /^<\|$/;
```

### Interface de resultado

```typescript
export interface ContentBlockParseResult {
  node:          BodyNode;   // pode ser qualquer nó de conteúdo ou ErrorBlockNode
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

export function isContentBlockStart(line: string): boolean
export function parseContentBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): ContentBlockParseResult
```

`position` de cada nó produzido:
- `start`: início da linha `|>token` de abertura — `positionAt(startIndex, 0, lineOffsets)`
- `end`: **exclusivo** — `positionAt(closingLine, '<|'.length, lineOffsets)`, onde `'<|'.length === 2`
- Para `ErrorBlockNode` sem fechamento: `end` aponta para o offset exclusivo da última linha consumida — `positionAt(lastConsumed, lines[lastConsumed].length, lineOffsets)`

`TimelineEventNode` e `TimelineMarkdownNode` também recebem `position` individual dentro da timeline:
- `start`/`end` cobrem apenas a linha (ou linhas, no caso de markdown acumulado) do item
- `end` é sempre exclusivo — `positionAt(lastLine, lines[lastLine].length, lineOffsets)`

### Fluxo de parsing (da spec)

1. extrair token e título opcional com `CONTENT_BLOCK_OPEN_RE`
2. acumular linhas até `<|` ou fim de arquivo
3. se surgir outro `|>` interno → `NESTED_BLOCK`, `recoverable: false`, retornar `ErrorBlockNode`
4. se chegar ao fim sem `<|` → `BLOCK_NOT_CLOSED`, `recoverable: false`, retornar `ErrorBlockNode`
5. token desconhecido → `UNKNOWN_TOKEN`, `recoverable: false`, retornar `ErrorBlockNode`
6. delegar conteúdo ao handler correto por token

### Markdown interno

Todos os blocos aceitam markdown completo (inline + block) como `MarkdownBlockNode` no `content`, **exceto `|>@`** que só aceita inline.

---

## Caso especial `@` — pullquote

Regras estritas (da spec):

```typescript
function parsePullQuote(
  lines:       string[],
  title:       string | null,
  lineOffsets: number[],
  filePath:    string,
  startLine:   number
): { node: PullQuoteBlockNode | ErrorBlockNode; diagnostics: Diagnostic[] }
```

- Linha de citação: **obrigatória**, deve começar e terminar com `"`
- Linha de autor: **opcional**, deve começar com `- `
- Sem linha de citação → `PULLQUOTE_NO_QUOTE`, `recoverable: false` → `ErrorBlockNode`
- Bloco vazio → `PULLQUOTE_EMPTY`, `recoverable: false` → `ErrorBlockNode`
- Múltiplas linhas candidatas a autor → `WARN_PULLQUOTE_MULTI_AUTHOR`, usar a última
- Aceita apenas markdown inline no `quote` (sem headings, listas)

AST sem autor (válido):
```json
{ "type": "PullQuoteBlock", "title": null, "quote": "...", "author": null }
```

---

## Caso especial `~~` — timeline

```typescript
export const TIMELINE_EVENT_RE = /^~~\s+(.*?)\s+~~$/;
```

- Linhas que casam com `TIMELINE_EVENT_RE` → `TimelineEventNode`
- Demais linhas → `TimelineMarkdownNode`
- Timeline sem eventos → `WARN_TIMELINE_NO_EVENTS`

---

## Atualizar `src/parser/index.ts`

Substituir o placeholder do loop principal pelo parsing real de família conteúdo. Família imagem ainda virá em prompt04.

```typescript
if (line.startsWith('|>') && isContentBlockStart(line)) {
  const result = parseContentBlock(lines, cursor, lineOffsets, filePath);
  children.push(result.node);
  diagnostics.push(...result.diagnostics);
  cursor += result.consumedLines;
  continue;
}
```

---

## Fixtures a criar

### `fixtures/valid/todos-os-blocos-conteudo.tmd`

Um exemplo de cada token: `!`, `@` (com e sem autor), `$`, `#`, `##`, `?`, `+`, `~~`, `&`.

### `fixtures/invalid/pullquote-aninhado.tmd`

```tmd
---
title: Aninhado
---
|>!
|>@
"citação"
<|
<|
```

---

## Testes

### `tests/parser/content-block.test.ts`

```typescript
describe('isContentBlockStart', () => {
  it('detecta |>!', ...)
  it('detecta |>## (não confunde com heading)', ...)
  it('não detecta |>*>', ...)  // família imagem
  it('não detecta linha comum', ...)
})

describe('parseContentBlock — geral', () => {
  it('parseia explainer com título', ...)
  it('parseia explainer sem título (title: null)', ...)
  it('parseia note, warning, aside, question, takeaway, concept', ...)
  it('BLOCK_NOT_CLOSED → ErrorBlockNode com diagnostic', ...)
  it('NESTED_BLOCK → ErrorBlockNode', ...)
  it('UNKNOWN_TOKEN → ErrorBlockNode', ...)
  it('TITLE_BRACKET_NOT_CLOSED → ErrorBlockNode', ...)
  it('ErrorBlockNode.diagnostics contém o código correto', ...)
})

describe('parseContentBlock — pullquote', () => {
  it('parseia com citação e autor', ...)
  it('author: null quando sem autor', ...)
  it('PULLQUOTE_NO_QUOTE → ErrorBlockNode', ...)
  it('PULLQUOTE_EMPTY → ErrorBlockNode', ...)
  it('WARN_PULLQUOTE_MULTI_AUTHOR usa a última linha -', ...)
})

describe('parseContentBlock — position', () => {
  it('position.start.line === linha do |>token (1-based)', ...)
  it('position.start.offset === lineOffsets[startIndex]', ...)
  it('position.end.line === linha do <| de fechamento', ...)
  it('position.end.offset === lineOffsets[closingLine] + 2 (exclusivo após "<|")', ...)
  it('ErrorBlockNode sem fechamento: position.end.offset === lineOffsets[last] + lines[last].length', ...)
  it('TimelineEventNode.position cobre apenas sua linha', ...)
  it('TimelineEventNode.position.end é exclusivo (aponta após o último char da linha)', ...)
  it('TimelineMarkdownNode.position.end é exclusivo na última linha acumulada', ...)
})
  it('parseia eventos e markdown intermediário', ...)
  it('WARN_TIMELINE_NO_EVENTS quando sem eventos', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes (incluindo prompt01 e prompt02) passam
- `|>##` gera `WarningBlock`, nunca heading
- `|>#` gera `NoteBlock`, nunca heading
- `ErrorBlockNode.diagnostics` sempre usa `DiagnosticCode` canônicos
- `ParseResult.diagnostics` acumula corretamente de todos os sub-parsers
- Nenhum `console.*` nos módulos parser

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: src/parser/index.ts (loop principal atualizado)
Interfaces públicas novas: ContentBlockParseResult, CONTENT_BLOCK_OPEN_RE, TIMELINE_EVENT_RE
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: família imagem ainda não reconhecida no loop
```
