# Codex — o que entendi do projeto (`md-html` / ToddyMarkDown)

## Escopo que li em `_docs/`

- `tmd-spec/`
  - `tmd-spec-v1.3.md`
  - `tmd-parser-spec-v1.4.md`
  - `tmd-html-theme-spec-v1.4.md`
  - `tmd-cli-spec-v1.1.md`
  - `tmd-vscode-extension-specv1.2.md`
- `_tmd-prompts/prompts-v1.0/`
  - `prompt00.md` até `prompt12.md`
- `example-tmd-compilation/`
  - `README.md`
  - `fonte/custom-markdown-example-refatorado.tmd`
  - `saida/saida.html` e `saida/saida.css`
- `example-theme/`
  - `theme-essay.html`, `theme-ink.html`, `theme-modern.html`, `theme-amber.html`

---

## 1) Visão geral do projeto

Meu entendimento é que este repositório define um ecossistema chamado **ToddyMarkDown (TMD)**: uma extensão semântica de Markdown para escrita editorial. A proposta não é substituir Markdown, mas **manter Markdown como base** e adicionar blocos estruturados que o Markdown puro não cobre bem (pullquote, timeline, mídia lateral, etc.).

Arquiteturalmente, o projeto se divide em:

1. **Linguagem `.tmd`** (spec da sintaxe)
2. **Parser** (transforma `.tmd` em AST + diagnostics)
3. **Compilador/render** (AST -> HTML/CSS)
4. **CLI** (`tmd compile`, `tmd init`, `--watch`)
5. **Extensão VS Code** (highlight e ergonomia de edição)

A filosofia recorrente nos docs é: **separação forte de responsabilidades + previsibilidade**.

---

## 2) Modelo mental da linguagem TMD

### Estrutura de um arquivo `.tmd`

- Frontmatter opcional no topo (`--- ... ---`)
- Markdown comum
- Blocos especiais delimitados por `|>` (abertura) e `<|` (fechamento)
- Escape de linha com `\`
- Bloco literal multilinha com `/>` ... `<\`

### Frontmatter

Campos previstos:

- `title`, `subtitle`, `kicker`, `author`, `theme`, `compile`

Ponto arquitetural crítico (muito repetido nos prompts):

- O **parser não resolve defaults**
- Valores ausentes ficam `undefined`
- Defaults são resolvidos depois, no `config-resolver`

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

Regras importantes:

- `|>#` e `|>##` devem ser token, não heading Markdown
- Não pode haver aninhamento de blocos especiais
- Pullquote (`|>@`) é especial:
  - citação entre aspas é obrigatória
  - autor é opcional (`- ...`)
  - sem citação -> erro de parsing
- Timeline mistura eventos (`~~ evento ~~`) com markdown intermediário

### Família 2: blocos de imagem

Modos oficiais:

- `|>*>`
- `|>*>wrap`
- `|>*<`
- `|>*<wrap`

Regras:

- imagem obrigatória na linha de abertura
- legenda e caminho obrigatórios
- apenas uma imagem por abertura
- parser só registra `src`; não verifica arquivo no disco

---

## 3) Parser: o que ele deve fazer

Com base em `tmd-parser-spec-v1.4.md` e prompts, o parser ideal:

1. normaliza quebras de linha
2. lê frontmatter opcional
3. trata bloco literal
4. trata escape de linha
5. reconhece blocos especiais (imagem e conteúdo)
6. acumula markdown restante
7. produz AST final (`DocumentNode`) + `Diagnostic[]`

### AST prevista

O documento possui:

- `frontmatter`
- `children` (nós semânticos)
- `assets` (lista de imagens detectadas)

Nó de erro relevante:

- `ErrorBlock` preserva raw + diagnostics

### Diagnóstico e tolerância a erro

O projeto adota um sistema de diagnostics canônico (`severity`, `code`, `message`, `line`, `filePath`, `recoverable`).

Comportamento esperado para erro de parsing:

- erro aparece no terminal
- compilação continua quando possível
- HTML recebe bloco visual de erro (`--ERROR BLOC--`)

Isso mostra uma decisão de produto importante: **resiliência editorial** (não abortar tudo por um bloco ruim).

---

## 4) Compilação HTML/CSS

### Modos de saída

- `standalone`
  - HTML completo (`<!DOCTYPE>`, `<head>`, `<body>`)
  - switcher de tema no header
  - script de persistência de tema (`localStorage`)
  - CSS com seletores `[data-theme="..."]`
- `fragment`
  - só `<article class="tmd-document tmd-theme-{tema}"> ...`
  - sem head/switcher/script
  - CSS escopado por `.tmd-theme-{tema}`

### Temas

Temas base: `essay`, `ink`, `modern`, `amber`.

Conceito central:

- tema é conjunto de variáveis CSS
- estrutura HTML permanece estável
- `.config.tmd.json` pode adicionar temas customizados via `extends`

### Resolução de defaults (regra de ouro)

`resolveConfig` aplica hierarquia:

1. frontmatter válido
2. config (`defaultTheme`, `defaultCompile`)
3. hardcoded (`essay`, `standalone`)

Esse ponto é explicitamente tratado como a decisão arquitetural mais crítica dos prompts.

---

## 5) Assets de imagem

Pipeline esperado:

1. parser coleta caminhos (`DocumentNode.assets`)
2. compilador resolve cada caminho relativo ao `.tmd`
3. copia encontrados para `dist/{slug}/img/`
4. reescreve `src` no HTML para `./img/{arquivo}`
5. se não encontrar:
   - gera diagnostic `IMAGE_FILE_NOT_FOUND`
   - substitui imagem por bloco visual de erro
   - exit code final vira `1`, mas segue compilando

Ou seja: validação de existência é do compilador/asset-handler, **não do parser**.

---

## 6) CLI e comportamento operacional

Comandos descritos:

- `tmd compile <arquivo|diretorio> [--out] [--config] [--watch]`
- `tmd init`

Comportamentos importantes:

- saída padrão em `dist/{slug}/{slug}.html` e `.css`
- compilação de diretório é recursiva, mas saída é achatada
- colisão de slug: mantém primeiro, ignora segundo, segue restante
- watch recompila em mudança (`.tmd` e config), não processa arquivos novos adicionados depois

Exit codes:

- `0`: sem erros
- `1`: compilou com erros recuperáveis/parciais
- `2`: erro fatal de I/O/config

---

## 7) Extensão VS Code

A extensão é tratada como **pacote paralelo** (independente do compilador).

Objetivo:

- reconhecer `.tmd`
- aplicar grammar TextMate
- destacar delimitadores, tokens e markdown comum
- fornecer folding para blocos

Limite explícito:

- highlight não tenta virar parser semântico completo

---

## 8) O que os prompts (`prompt00..12`) revelam sobre a estratégia do projeto

Os prompts formam um plano incremental de implementação, com forte disciplina de engenharia:

1. setup + tipos base
2. parser em etapas
3. render, CSS, temas
4. assets e orquestração
5. CLI e watch
6. extensão VS Code
7. integração e relatório final

Padrões de governança muito claros:

- responsabilidade única por módulo
- compatibilidade de interfaces públicas
- sem duplicação de lógica de parsing
- testes em Vitest desde o início
- resumo de entrega obrigatório ao final de cada etapa

Meu entendimento: não é só uma spec de linguagem, é um **playbook de implementação completo**.

---

## 9) O que os exemplos em `_docs` comprovam na prática

### `example-tmd-compilation/fonte/custom-markdown-example-refatorado.tmd`

Mostra praticamente todas as features:

- frontmatter
- escape e bloco literal
- todos os blocos de conteúdo
- 4 modos de imagem
- markdown comum com imagem e código

### `example-tmd-compilation/saida/saida.html` e `saida.css`

Mostram a versão compilada esperada em modo standalone, com:

- header editorial
- switch de tema
- classes semânticas por bloco
- layout responsivo
- tokens TMD convertidos para estrutura HTML consistente

### `example-theme/*.html`

Parecem estudos visuais/protótipos dos quatro temas (`essay`, `ink`, `modern`, `amber`), reforçando a direção editorial e tipográfica do produto.

---

## 10) Pontos de atenção e inconsistências que percebi na documentação

1. Os cabeçalhos das specs principais estão alinhados com as versões indicadas nos nomes dos arquivos.
2. A spec de VS Code (`tmd-vscode-extension-specv1.2.md`) está alinhada com a notação consolidada dos modos de imagem (`*>`, `*>wrap`, `*<`, `*<wrap`).
3. Em `prompt04`, a constante `IMAGE_MODES` aparece com valor repetido (`*>wrap` duas vezes), indicando provável typo no prompt.
4. No estado atual do disco, não localizei `_docs/custom-markdown-example.md` nem `_docs/tmd-spec-v1_1/tmd-spec.md`.

Nada disso invalida o projeto, mas vale tratar como checklist de saneamento documental.

---

## 11) Conclusão objetiva

O projeto é um **compilador editorial orientado a AST** para transformar `.tmd` em HTML/CSS com temas, mantendo Markdown como linguagem-base e adicionando semântica onde faz diferença de composição.

A qualidade da documentação está alta: ela cobre linguagem, parser, render, CLI, extensão, testes e até plano de execução por fases. O diferencial técnico mais forte é a combinação de:

- sintaxe editorial clara
- separação estrita de responsabilidades
- recuperação de erro com saída útil
- pipeline completo de publicação (incluindo assets, temas e CLI)



