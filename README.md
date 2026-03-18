# ToddyMarkDown (`.tmd`) — `md-html`

ToddyMarkDown (TMD) é uma extensão semântica de Markdown voltada para escrita editorial: ensaios, documentação curada e conteúdo técnico com composição visual rica.

Este repositório está organizado como **base de documentação e especificação** do ecossistema TMD (linguagem, parser, compilador, CLI, temas HTML/CSS e extensão VS Code).

## Status do projeto

- Escopo atual do repositório: **specs + exemplos**
- Implementação (compilador/CLI/extensão): descrita em prompts de implementação em `_docs/_tmd-prompts/`

## Estrutura do repositório

```txt
_docs/
  tmd-spec/
    tmd-spec-v1.3.md
    tmd-parser-spec-v1.4.md
    tmd-html-theme-spec-v1.4.md
    tmd-cli-spec-v1.1.md
    tmd-vscode-extension-specv1.2.md
  example-tmd-compilation/
    fonte/custom-markdown-example-refatorado.tmd
    saida/saida.html
    saida/saida.css
  example-theme/
    theme-essay.html
    theme-ink.html
    theme-modern.html
    theme-amber.html
  _tmd-prompts/prompts-v1.0/
    prompt00.md ... prompt12.md
```

## O que é TMD (resumo rápido)

Um arquivo `.tmd` pode conter:

- frontmatter opcional (`--- ... ---`)
- markdown comum
- blocos especiais delimitados por `|>` e `<|`

### Família 1: blocos de conteúdo

Tokens:

- `!` explainer
- `@` pullquote
- `$` aside
- `#` note
- `##` warning
- `?` question
- `+` takeaway
- `~~` timeline
- `&` concept

### Família 2: blocos de imagem

Modos:

- `|>*>`
- `|>*>wrap`
- `|>*<`
- `|>*<wrap`

## Exemplo mínimo de sintaxe

```tmd
---
title: Exemplo TMD
theme: essay
compile: standalone
---

## Introdução

|>! [O que é TMD?]
Uma extensão semântica de Markdown para composição editorial.
<|

|>*> [Gauss] ![Retrato](./img/gauss.svg)
Texto ao lado da imagem.
<|
```

## Pipeline especificado

1. `.tmd` -> parser estrutural -> AST
2. AST -> render HTML
3. geração de CSS por tema
4. cópia/rewrite de assets
5. saída final em `dist/{slug}/`

## Comportamento de CLI (especificado)

Comandos previstos:

- `tmd compile <alvo> [--out <dir>] [--config <path>] [--watch]`
- `tmd init`

Saída prevista:

- `dist/{slug}/{slug}.html`
- `dist/{slug}/{slug}.css`

Exit codes previstos:

- `0` sem erros
- `1` com erros recuperáveis (compilação parcial)
- `2` erro fatal (I/O/config)

## Exemplos prontos para consulta

- Fonte TMD completa: `_docs/example-tmd-compilation/fonte/custom-markdown-example-refatorado.tmd`
- Saída HTML/CSS de referência:
  - `_docs/example-tmd-compilation/saida/saida.html`
  - `_docs/example-tmd-compilation/saida/saida.css`
- Estudos visuais de temas:
  - `_docs/example-theme/theme-essay.html`
  - `_docs/example-theme/theme-ink.html`
  - `_docs/example-theme/theme-modern.html`
  - `_docs/example-theme/theme-amber.html`

## Leitura recomendada

1. `_docs/tmd-spec/tmd-spec-v1.3.md`
2. `_docs/tmd-spec/tmd-parser-spec-v1.4.md`
3. `_docs/tmd-spec/tmd-html-theme-spec-v1.4.md`
4. `_docs/tmd-spec/tmd-cli-spec-v1.1.md`
5. `_docs/tmd-spec/tmd-vscode-extension-specv1.2.md`

## Roadmap de implementação

Para implementar o ecossistema do zero, siga a sequência guiada:

- `_docs/_tmd-prompts/prompts-v1.0/prompt00.md` até `prompt12.md`

Esses prompts definem arquitetura, responsabilidades de módulos, testes e validação final.
