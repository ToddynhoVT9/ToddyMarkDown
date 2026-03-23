# prompt05 — Compilador: config-resolver e renderizador HTML

## Leia primeiro
`prompt00.md` — hierarquia de defaults; responsabilidade do config-resolver.

## Depende de
`prompt01.md` — `ResolvedConfig`, `TMDConfig`, `FrontmatterFields`.
`prompt04.md` — parser completo e funcional.

---

## Objetivo

Implementar a etapa de resolução de config (hierarquia de defaults) e o renderizador HTML para o modo `standalone`. O config-resolver é a única camada que substitui `undefined` por defaults.

---

## Não fazer

- Não acessar `frontmatter.theme` diretamente no renderer — consumir `ResolvedConfig`
- Não fazer I/O no renderer (ler/escrever arquivos) — receber tudo por parâmetro
- Não duplicar a regex de detecção de imagem do parser
- Não emitir `console.*` no renderer — erros são tratados na camada de orquestração

---

## `src/compiler/config-resolver.ts`

Este módulo é a **única camada** que resolve defaults. Recebe frontmatter e config carregado, retorna `ResolvedConfig` com campos nunca `undefined`.

```typescript
import type { FrontmatterFields, TMDConfig, ResolvedConfig } from '../types/index.js';

const VALID_THEMES  = ['essay', 'ink', 'modern', 'amber'] as const;
const VALID_COMPILES = ['standalone', 'fragment'] as const;

export function resolveConfig(
  frontmatter: FrontmatterFields,
  config:      TMDConfig
): ResolvedConfig

// Hierarquia para theme:
//   1. frontmatter.theme se presente e válido (base ou customizado)
//   2. config.defaultTheme se presente e válido
//   3. 'essay'
//
// Hierarquia para compile:
//   1. frontmatter.compile se 'standalone' ou 'fragment'
//   2. config.defaultCompile se 'standalone' ou 'fragment'
//   3. 'standalone'
//
// customThemes: sempre config.themes (pode ser {})
```

Tema é válido se for um dos 4 base ou uma chave de `config.themes`.

---

## `src/compiler/html-renderer.ts`

Transforma `DocumentNode` + `ResolvedConfig` em string HTML. Sem I/O. Sem efeitos colaterais.

```typescript
import MarkdownIt from 'markdown-it';
import type { DocumentNode, BodyNode, ResolvedConfig } from '../types/index.js';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export interface RenderOptions {
  resolvedConfig:   ResolvedConfig;
  title:            string;   // slug já processado ou title do frontmatter
  cssFileName:      string;   // ex: 'meu-artigo.css'
  customThemeNames: string[]; // nomes de temas customizados para o switcher
  customCssFile?:   string;   // nível 3 — caminho relativo para <link> extra (só standalone)
}

export function renderHTML(
  doc:     DocumentNode,
  options: RenderOptions
): string
```

### Modo standalone (da spec)

```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="{resolvedConfig.theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <link rel="stylesheet" href="{cssFileName}" />
  <!-- se customCssFile estiver presente: -->
  <link rel="stylesheet" href="{customCssFile}" />
</head>
```

`customCssFile` só é injetado quando presente em `options` — o orquestrador é responsável por validar se `allowExternalCSS` está ativo antes de passar o valor. O renderer não verifica a flag, apenas injeta se receber o campo.
<body>
  <header class="tmd-site-header">
    <div class="tmd-theme-switcher">
      <!-- 4 temas base + temas customizados -->
    </div>
  </header>
  <article class="tmd-document">
    {renderHeader(doc.frontmatter)}
    <main class="tmd-body">{renderChildren(doc.children)}</main>
  </article>
  <script>/* localStorage switcher */</script>
</body>
</html>
```

### Modo fragment (da spec)

```html
<article class="tmd-document tmd-theme-{resolvedConfig.theme}">
  {renderHeader(doc.frontmatter)}
  <main class="tmd-body">{renderChildren(doc.children)}</main>
</article>
```

Sem DOCTYPE, sem `<head>`, sem switcher, sem script.

### renderHeader

Campos ausentes não geram elementos vazios:

```typescript
function renderHeader(fm: FrontmatterFields): string
// kicker   → <p class="tmd-kicker">
// title    → <h1 class="tmd-title">
// subtitle → <p class="tmd-subtitle">
// author   → <p class="tmd-author">
// Retorna '' se todos ausentes
```

### renderNode — switch por tipo

Implementar para cada `BodyNode`:

- `MarkdownBlock` → `<section class="tmd-markdown">{md.render(raw)}</section>`
- `LiteralBlock` → `<pre class="tmd-literal">{raw}</pre>`
- `ContentBlockNode` (7 tipos) → seção base com `tmd-block tmd-block-{tipo}`, omitir `<h3>` se `title === null`
- `PullQuoteBlock` → `<figure>` + `<blockquote>` + `<figcaption>` (omitir figcaption se `author === null`)
- `TimelineBlock` → estrutura com eventos e markdown intermediário
- `ImageBlock` → 4 modos conforme a spec (ver html-theme-spec v1.4)
- `ErrorBlock` → `<div class="tmd-error-block">--ERROR BLOC--...</div>`

Para `ErrorBlock` de imagem (quando `ImageBlock` não pode ser renderizado por src inválido — tratado em prompt07), usar classe adicional `tmd-error-block-image`.

---

## Testes

### `tests/compiler/config-resolver.test.ts`

```typescript
describe('resolveConfig', () => {
  it('frontmatter.theme válido → usado', ...)
  it('frontmatter.theme ausente → config.defaultTheme', ...)
  it('frontmatter.theme ausente + config sem default → essay', ...)
  it('frontmatter.theme inválido → config.defaultTheme', ...)
  it('frontmatter.compile = fragment → compile: fragment', ...)
  it('frontmatter.compile ausente → config.defaultCompile', ...)
  it('frontmatter.compile ausente + config ausente → standalone', ...)
  it('tema customizado de config.themes é válido', ...)
  it('customThemes vem de config.themes', ...)
})
```

### `tests/compiler/html-renderer.test.ts`

```typescript
describe('renderHTML — standalone', () => {
  it('começa com <!DOCTYPE html>', ...)
  it('data-theme no <html> igual ao resolvedConfig.theme', ...)
  it('inclui link para cssFileName', ...)
  it('inclui switcher com 4 temas base', ...)
  it('inclui script de localStorage', ...)
  it('kicker ausente → sem .tmd-kicker no HTML', ...)
  it('author ausente → sem .tmd-author no HTML', ...)
  it('customCssFile injetado como segundo <link> quando presente', ...)
  it('customCssFile ausente → sem <link> extra', ...)
  it('PullQuoteBlock sem author → sem figcaption', ...)
  it('ContentBlockNode sem title → sem h3', ...)
  it('ErrorBlock contém --ERROR BLOC-- acima e abaixo do raw', ...)
  it('ImageBlock *> gera tmd-media-block-right', ...)
  it('ImageBlock *>wrap gera tmd-media-wrap-right com float', ...)
  it('TimelineBlock gera eventos e markdown intermediário', ...)
})

describe('renderHTML — fragment', () => {
  it('não começa com <!DOCTYPE', ...)
  it('começa com <article class="tmd-document tmd-theme-{tema}">', ...)
  it('não contém .tmd-site-header', ...)
  it('não contém script de localStorage', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–05 passam
- `resolveConfig` é a **única** função no projeto que substitui `undefined` por defaults
- `renderHTML` não faz nenhum I/O
- `renderHTML` produz HTML válido para todos os tipos de nó
- Modo `fragment` não contém DOCTYPE nem switcher
- Campos ausentes no frontmatter não geram elementos HTML vazios

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: nenhum
Interfaces públicas novas: RenderOptions (com customCssFile)
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: CSS não gerado ainda; assets não copiados
```
