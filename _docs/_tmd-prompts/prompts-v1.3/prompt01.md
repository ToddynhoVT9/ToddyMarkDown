# prompt01 — Setup do projeto

## Leia primeiro
`prompt00.md` — contrato de comportamento do agente.

---

## Objetivo

Criar a estrutura inicial do projeto com todas as dependências, tipos centrais e fixtures base. Esta é a fundação — todos os prompts seguintes dependem dos tipos definidos aqui.

---

## Não fazer

- Não criar lógica de parsing, renderização ou CLI ainda
- Não resolver defaults de frontmatter nos tipos (campos são `string | undefined`)
- Não criar tipos `Diagnostic` ad-hoc fora de `src/types/index.ts`
- Não usar Jest — usar Vitest (ver prompt00)

---

## Estrutura de diretórios

```
tmd/
├── src/
│   ├── parser/
│   ├── compiler/
│   ├── cli/
│   └── types/
├── tests/
│   ├── parser/
│   ├── compiler/
│   └── cli/
├── fixtures/
│   ├── valid/
│   └── invalid/
├── package.json
├── tsconfig.json
└── README.md
```

---

## package.json

```json
{
  "name": "tmd",
  "version": "1.0.0",
  "description": "ToddyMarkDown compiler",
  "type": "module",
  "bin": { "tmd": "./dist/cli/index.js" },
  "scripts": {
    "build": "tsc",
    "dev":   "tsc --watch",
    "test":  "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "markdown-it": "^14.0.0",
    "chokidar":    "^3.5.3"
  },
  "devDependencies": {
    "typescript":       "^5.0.0",
    "@types/node":      "^20.0.0",
    "@types/markdown-it": "^14.0.0",
    "vitest":           "^1.0.0"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir":  "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## `src/types/index.ts` — tipos centrais

Este é o arquivo mais importante do projeto. Todos os outros módulos importam daqui. **Nunca redefina esses tipos em outro arquivo.**

### Diagnostic

```typescript
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  severity:    DiagnosticSeverity;
  code:        string;
  message:     string;
  position:    SourceRange | null;  // null para diagnósticos sem localização no source
  filePath:    string;
  recoverable: boolean;
}

export interface Position {
  offset: number;  // offset de caractere desde o início do source normalizado (0-based)
  line:   number;  // linha (1-based)
  column: number;  // coluna (0-based)
}

export interface SourceRange {
  start: Position;  // inclusive — aponta para o primeiro caractere do range
  end:   Position;  // exclusive — aponta para o caractere imediatamente após o fim do range
                    // convenção adotada por CM6, LSP e tree-sitter
                    // ex: linha "<|\n" → end.offset = offset do '\n', não do '|'
}

export const DiagnosticCode = {
  // Erros estruturais
  FRONTMATTER_NOT_CLOSED:       'FRONTMATTER_NOT_CLOSED',
  LITERAL_BLOCK_NOT_CLOSED:     'LITERAL_BLOCK_NOT_CLOSED',
  BLOCK_NOT_CLOSED:             'BLOCK_NOT_CLOSED',
  STRAY_CLOSE:                  'STRAY_CLOSE',
  NESTED_BLOCK:                 'NESTED_BLOCK',
  UNKNOWN_TOKEN:                'UNKNOWN_TOKEN',
  TITLE_BRACKET_NOT_CLOSED:     'TITLE_BRACKET_NOT_CLOSED',
  EXTRA_TEXT_AFTER_TOKEN:       'EXTRA_TEXT_AFTER_TOKEN',
  // Erros de pullquote
  PULLQUOTE_NO_QUOTE:           'PULLQUOTE_NO_QUOTE',
  PULLQUOTE_EMPTY:              'PULLQUOTE_EMPTY',
  // Erros de imagem
  IMAGE_INVALID_MODE:           'IMAGE_INVALID_MODE',
  IMAGE_MISSING:                'IMAGE_MISSING',
  IMAGE_NO_CAPTION:             'IMAGE_NO_CAPTION',
  IMAGE_NO_SRC:                 'IMAGE_NO_SRC',
  IMAGE_MULTIPLE:               'IMAGE_MULTIPLE',
  IMAGE_FILE_NOT_FOUND:         'IMAGE_FILE_NOT_FOUND',
  // Warnings
  WARN_UNKNOWN_FRONTMATTER_KEY: 'WARN_UNKNOWN_FRONTMATTER_KEY',
  WARN_EMPTY_TITLE:             'WARN_EMPTY_TITLE',
  WARN_EMPTY_BLOCK:             'WARN_EMPTY_BLOCK',
  WARN_PULLQUOTE_MULTI_AUTHOR:  'WARN_PULLQUOTE_MULTI_AUTHOR',
  WARN_TIMELINE_NO_EVENTS:      'WARN_TIMELINE_NO_EVENTS',
  // Warnings de temas e CSS externo
  WARN_CUSTOM_CSS_NOT_ALLOWED:  'WARN_CUSTOM_CSS_NOT_ALLOWED',  // custom_css presente mas allowExternalCSS é false
  WARN_CUSTOM_CSS_NOT_FOUND:    'WARN_CUSTOM_CSS_NOT_FOUND',    // arquivo referenciado não encontrado
  WARN_THEME_NAME_COLLISION:    'WARN_THEME_NAME_COLLISION',    // tema customizado com mesmo nome de tema base
} as const;
```

### FrontmatterFields

**Todos os campos são `string | undefined`.** O parser preserva ausência como ausência. Defaults são resolvidos pelo `config-resolver`, nunca pelo parser.

```typescript
export interface FrontmatterFields {
  title?:      string;
  subtitle?:   string;
  kicker?:     string;
  author?:     string;
  theme?:      string;   // undefined se ausente — NÃO substituir por 'essay' aqui
  compile?:    string;   // undefined se ausente — NÃO substituir por 'standalone' aqui
  custom_css?: string;   // nível 3 — ignorado se allowExternalCSS não estiver ativo no config
}
```

### Nós AST

```typescript
export type ImageMode = '*>' | '*>wrap' | '*<' | '*<wrap';

export interface MarkdownBlockNode    { type: 'MarkdownBlock';   raw: string;  position: SourceRange }
export interface LiteralBlockNode     { type: 'LiteralBlock';    raw: string;  position: SourceRange }
export interface TimelineEventNode    { type: 'TimelineEvent';   text: string; position: SourceRange }
export interface TimelineMarkdownNode { type: 'TimelineMarkdown'; raw: string; position: SourceRange }

export interface ContentBlockNode {
  type: 'ExplainerBlock' | 'AsideBlock' | 'NoteBlock' | 'WarningBlock'
       | 'QuestionBlock' | 'TakeawayBlock' | 'ConceptBlock';
  title:    string | null;
  content:  BodyNode[];
  position: SourceRange;
}

export interface PullQuoteBlockNode {
  type:     'PullQuoteBlock';
  title:    string | null;
  quote:    string;
  author:   string | null;
  position: SourceRange;
}

export interface TimelineBlockNode {
  type:     'TimelineBlock';
  title:    string | null;
  items:    (TimelineEventNode | TimelineMarkdownNode)[];
  position: SourceRange;
}

export interface ImageBlockNode {
  type:     'ImageBlock';
  mode:     ImageMode;
  title:    string | null;
  caption:  string;
  src:      string;
  content:  BodyNode[];
  position: SourceRange;
}

export interface ErrorBlockNode {
  type:        'ErrorBlock';
  raw:         string;
  diagnostics: Diagnostic[];
  position:    SourceRange;
}

export type BodyNode =
  | MarkdownBlockNode
  | LiteralBlockNode
  | ContentBlockNode
  | PullQuoteBlockNode
  | TimelineBlockNode
  | ImageBlockNode
  | ErrorBlockNode;

export interface DocumentNode {
  type:        'Document';
  frontmatter: FrontmatterFields;  // campos opcionais, sem defaults aplicados
  children:    BodyNode[];
  assets:      string[];           // caminhos originais de todas as imagens
}
```

### ParseResult

```typescript
export interface ParseResult {
  document:    DocumentNode;
  diagnostics: Diagnostic[];
}
```

> **Nota de roadmap:** o parser atual é de passagem única e não incremental. A semântica de `SourceRange` (offsets exclusivos, convenção CM6) foi escolhida deliberadamente para facilitar uma futura integração com `@lezer/lr` ou `@codemirror/language`, onde `startParse` e suporte a `fragments` permitirão reparsing incremental por keystroke. Ao implementar `@toddy/tmd-codemirror`, o `ParseResult` e os `position` dos nós mapeiam diretamente para `Decoration`, `RangeSet` e `@codemirror/lint` sem conversão.

### ResolvedConfig

O config após resolução de hierarquia — campos nunca `undefined`. Produzido pelo `config-resolver`, consumido pelo compilador.

```typescript
// Nível 1 — whitelist de chaves permitidas em overrides (sem prefixo --tmd-)
export type ThemeOverrideKey =
  | 'bg' | 'surface' | 'text' | 'text-soft' | 'accent'
  | 'border' | 'font-body' | 'font-heading' | 'radius';

// Nível 2 — tipos de bloco válidos para customização
export type BlockType =
  | 'explainer' | 'note' | 'warning' | 'concept' | 'aside'
  | 'pullquote' | 'question' | 'takeaway' | 'timeline';

// Nível 2 — propriedades permitidas por bloco
export interface TMDConfigThemeBlock {
  'border-color'?:  string;  // todos os blocos de conteúdo
  'bg'?:            string;  // explainer, note, warning, concept, aside apenas
  'marker-color'?:  string;  // timeline apenas
}

export interface TMDConfigTheme {
  extends:   string;
  overrides?: Partial<Record<ThemeOverrideKey, string>>;  // nível 1
  blocks?:    Partial<Record<BlockType, TMDConfigThemeBlock>>;  // nível 2
}

export interface TMDConfig {
  defaultTheme:     string;
  defaultCompile:   string;
  themes:           Record<string, TMDConfigTheme>;
  allowExternalCSS?: boolean;  // nível 3 — opt-in explícito
}

export interface ResolvedConfig {
  theme:            string;                  // sempre string válida
  compile:          'standalone' | 'fragment';
  customThemes:     Record<string, TMDConfigTheme>;
  allowExternalCSS: boolean;
}
```

### CompileResult e exit code

```typescript
export interface CompileResult {
  slug:        string;
  htmlPath:    string;
  cssPath:     string;
  diagnostics: Diagnostic[];
}

// Exit code derivado de diagnostics — nunca calculado ad-hoc em outros módulos
export function exitCodeFromDiagnostics(diagnostics: Diagnostic[]): 0 | 1 {
  return diagnostics.some(d => d.severity === 'error') ? 1 : 0;
  // Nota: exit code 2 é emitido apenas pela CLI para erros fatais de I/O
}
```

---

## Fixtures base

### `fixtures/valid/basico.tmd`

```tmd
---
title: Teste Básico
author: Autor Teste
theme: essay
compile: standalone
---

## Introdução

Parágrafo de texto normal.

|>! [O que é isso?]
Um explainer simples.
<|

|>@
"Uma citação de teste."
- Autor da Citação
<|

|>+
Um takeaway de síntese.
<|
```

### `fixtures/invalid/pullquote-sem-citacao.tmd`

```tmd
---
title: Inválido Pullquote
---

|>@
- Autor sem citação
<|
```

### `fixtures/invalid/bloco-nao-fechado.tmd`

```tmd
---
title: Bloco Não Fechado
---

|>! [Explainer]
Este bloco nunca fecha.
```

---

## Testes a criar: `tests/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { exitCodeFromDiagnostics } from '../src/types/index.js';

describe('exitCodeFromDiagnostics', () => {
  it('retorna 0 quando não há erros', ...)
  it('retorna 1 quando há erro com severity error', ...)
  it('retorna 0 quando há apenas warnings', ...)
})
```

---

## Critério de aceite

- `npm install` completa sem erros
- `npm run build` completa sem erros TypeScript
- `FrontmatterFields` — todos os campos `string | undefined`, sem defaults
- `Diagnostic` usa `DiagnosticCode` canônicos exportados
- `exitCodeFromDiagnostics` implementada, exportada e testada
- Nenhum módulo de lógica criado ainda

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: []
Interfaces públicas novas: DocumentNode, ParseResult, CompileResult, Diagnostic,
                           DiagnosticCode, ResolvedConfig, FrontmatterFields,
                           TMDConfigTheme, TMDConfigThemeBlock, TMDConfig,
                           ThemeOverrideKey, BlockType,
                           Position, SourceRange,
                           todos os nós AST, exitCodeFromDiagnostics
Interfaces públicas alteradas: nenhuma (baseline)
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: nenhuma
```
