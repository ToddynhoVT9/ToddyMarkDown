# prompt04 — Parser: família de imagem, markdown comum e parser finalizado

## Leia primeiro
`prompt00.md` — ordem de detecção no loop principal (imagem antes de conteúdo).

## Depende de
`prompt01.md` — `ImageBlockNode`, `ImageMode`, `DocumentNode.assets`.
`prompt03.md` — loop principal com família conteúdo funcionando.

---

## Objetivo

Implementar parsing da família de imagem (4 modos), acumulador de markdown comum e finalizar o parser com AST completa.

---

## Não fazer

- Não duplicar `CONTENT_BLOCK_OPEN_RE` do prompt03 — não se sobrepõem, mas evitar confusão
- Não verificar existência de arquivos de imagem no disco — isso é responsabilidade do `asset-handler` (prompt07)
- Não resolver defaults de tema ou modo de compilação
- Não modificar `DiagnosticCode` — usar os já definidos no prompt01

---

## `src/parser/image-block.ts`

### Modos válidos e regex (da spec — exportar como constante)

```typescript
export const IMAGE_MODES = ['*>wrap', '*>', '*<wrap', '*<'] as const;
// Atenção crítica: *>wrap e *<wrap DEVEM ser testados antes de *> e *<
// A ordem deste array é a ordem de tentativa no parser

export const IMAGE_BLOCK_OPEN_RE =
  /^\|>(\*>wrap|\*>|\*<wrap|\*<)(?:\s+\[(.*?)\])?\s+!\[(.*?)\]\((.*?)\)$/;
```

### Estratégia de parsing (da spec)

Em vez de depender de uma única regex, dividir em etapas:

1. confirmar prefixo `|>`
2. tentar extrair modo na ordem: `*>wrap`, `*>`, `*<wrap`, `*<`
3. tentar ler título opcional `[...]`
4. localizar `![legenda](caminho)`
5. verificar que não há segunda imagem na linha

```typescript
export interface ImageBlockParseResult {
  node:          ImageBlockNode | ErrorBlockNode;
  consumedLines: number;
  diagnostics:   Diagnostic[];
}

export function isImageBlockStart(line: string): boolean
export function parseImageBlock(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
  filePath:    string
): ImageBlockParseResult
```

### Erros mapeados

```
modo inválido        → IMAGE_INVALID_MODE,  recoverable: false
sem imagem na linha  → IMAGE_MISSING,       recoverable: false
legenda vazia        → IMAGE_NO_CAPTION,    recoverable: false
caminho vazio        → IMAGE_NO_SRC,        recoverable: false
segunda imagem       → IMAGE_MULTIPLE,      recoverable: false
bloco não fechado    → BLOCK_NOT_CLOSED,    recoverable: false
bloco aninhado       → NESTED_BLOCK,        recoverable: false
```

Todos resultam em `ErrorBlockNode`.

### Resolução de caminho

O parser registra o caminho **como fornecido** no `.tmd`. Não resolve relative paths, não verifica existência. Isso é feito pelo `asset-handler`.

---

## `src/parser/markdown-accumulator.ts`

```typescript
export interface MarkdownAccumulateResult {
  node:          MarkdownBlockNode;
  consumedLines: number;
  imageRefs:     string[];  // caminhos ![alt](src) encontrados no raw
}

export function accumulateMarkdown(
  lines:       string[],
  startIndex:  number,
  lineOffsets: number[],
): MarkdownAccumulateResult
// Acumula linhas até encontrar |>, />, ou fim do arquivo
// node.position.start: positionAt(startIndex, 0, lineOffsets)
// node.position.end: exclusivo — positionAt(lastLine, lines[lastLine].length, lineOffsets)
//   onde lastLine é a última linha acumulada antes do próximo |>, /> ou EOF
// Extrai referências de imagem via regex simples: /!\[.*?\]\((.*?)\)/g
```

---

## Finalizar `src/parser/index.ts`

Ordem de detecção no loop (da spec — a ordem importa):

```typescript
while (cursor < lines.length) {
  const line = lines[cursor];

  // 1. bloco literal
  if (isLiteralBlockStart(line)) {
    const result = parseLiteralBlock(lines, cursor, lineOffsets, filePath);
    // ...
  }

  // 2. escape
  if (isEscapedLine(line)) { cursor++; continue; }

  // 3. família IMAGEM
  if (line.startsWith('|>') && isImageBlockStart(line)) {
    const result = parseImageBlock(lines, cursor, lineOffsets, filePath);
    children.push(result.node);
    diagnostics.push(...result.diagnostics);
    if (result.node.type === 'ImageBlock') assets.push(result.node.src);
    cursor += result.consumedLines; continue;
  }

  // 4. família conteúdo
  if (line.startsWith('|>') && isContentBlockStart(line)) {
    const result = parseContentBlock(lines, cursor, lineOffsets, filePath);
    // ...
  }

  // 5. fechamento solto <|
  if (CONTENT_BLOCK_CLOSE_RE.test(line)) {
    diagnostics.push({
      severity: 'error',
      code: DiagnosticCode.STRAY_CLOSE,
      // end exclusivo: offset após os 2 chars de "<|"
      position: { start: positionAt(cursor, 0, lineOffsets), end: positionAt(cursor, 2, lineOffsets) },
      // ...
    });
    cursor++; continue;
  }

  // 6. markdown comum
  const result = accumulateMarkdown(lines, cursor, lineOffsets);
  children.push(result.node);
  assets.push(...result.imageRefs);
  cursor += result.consumedLines;
}
```

`DocumentNode.assets` deve conter todos os caminhos de imagem encontrados no documento, incluindo dentro de markdown comum.

---

## Fixtures a criar

### `fixtures/valid/com-imagens.tmd`

```tmd
---
title: Com Imagens
---

|>*> [Gauss] ![Retrato de Gauss](./img/gauss.jpg)
Gauss desenvolveu técnicas extraordinárias.
<|

|>*<wrap [Espectro] ![Diagrama](./img/espectro.png)
Texto que abraça a imagem à esquerda.
<|

Parágrafo com imagem inline: ![diagrama inline](./img/inline.png)
```

### `fixtures/invalid/imagem-modo-invalido.tmd`

```tmd
---
title: Modo Inválido
---
|>*invalid [Teste] ![Foto](./img/foto.jpg)
Texto.
<|
```

---

## Testes

### `tests/parser/image-block.test.ts`

```typescript
describe('isImageBlockStart', () => {
  it('detecta |>*>', ...)
  it('detecta |>*>wrap', ...)
  it('detecta |>*< e |>*<wrap', ...)
  it('não detecta |>! (família conteúdo)', ...)
})

describe('parseImageBlock', () => {
  it('parseia *> com título e imagem', ...)
  it('parseia *>wrap', ...)
  it('parseia *< e *<wrap', ...)
  it('IMAGE_INVALID_MODE → ErrorBlockNode', ...)
  it('IMAGE_MISSING → ErrorBlockNode', ...)
  it('IMAGE_NO_CAPTION → ErrorBlockNode', ...)
  it('IMAGE_NO_SRC → ErrorBlockNode', ...)
  it('IMAGE_MULTIPLE → ErrorBlockNode', ...)
  it('BLOCK_NOT_CLOSED → ErrorBlockNode', ...)
  it('src registrado em assets do Document', ...)
  it('não verifica existência do arquivo no disco', ...)
})
```

describe('parseImageBlock — position', () => {
  it('position.start.line === linha do |>mode', ...)
  it('position.start.offset === lineOffsets[startIndex]', ...)
  it('position.end.line === linha do <|', ...)
  it('position.end.offset === lineOffsets[closingLine] + 2 (exclusivo após "<|")', ...)
  it('ErrorBlockNode position.end exclusivo na última linha consumida', ...)
})

describe('accumulateMarkdown — position', () => {
  it('position.start aponta para startIndex (offset === lineOffsets[startIndex])', ...)
  it('position.end é exclusivo — offset === lineOffsets[last] + lines[last].length', ...)
})
  it('acumula linhas até |>', ...)
  it('acumula linhas até />', ...)
  it('acumula até fim do arquivo', ...)
  it('extrai imageRefs de ![alt](src) no raw', ...)
  it('imageRefs vazio quando não há imagens', ...)
})
```

### `tests/parser/index.test.ts`

```typescript
describe('parse — integração', () => {
  it('basico.tmd: diagnostics vazio', ...)
  it('basico.tmd: frontmatter preservado como está', ...)
  it('basico.tmd: children contém os nós corretos', ...)
  it('pullquote-sem-citacao.tmd: gera ErrorBlockNode com PULLQUOTE_NO_QUOTE', ...)
  it('bloco-nao-fechado.tmd: gera ErrorBlockNode com BLOCK_NOT_CLOSED', ...)
  it('com-imagens.tmd: assets contém os 3 caminhos de imagem', ...)
  it('imagens em markdown comum aparecem em assets', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–04 passam
- `parse()` é determinístico: mesma entrada → mesma AST
- `DocumentNode.assets` acumula imagens de blocos de imagem E de markdown comum
- Família imagem detectada antes da família conteúdo no loop
- `*>wrap` e `*<wrap` capturados antes de `*>` e `*<`
- Parser não verifica existência de imagens no disco
- Parser não resolve defaults de tema ou compile

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: src/parser/index.ts (finalizado)
Interfaces públicas novas: ImageBlockParseResult, MarkdownAccumulateResult, IMAGE_MODES
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: nenhuma — parser está completo
```
