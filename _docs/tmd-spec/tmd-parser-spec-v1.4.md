# ToddyMarkDown (`.tmd`) — tmd-parser-spec v1.4

## Objetivo

Este documento define a especificação do parser de ToddyMarkDown (`.tmd`).

Ele cobre:

- ordem exata de leitura
- estratégia de parsing
- regex de reconhecimento
- estrutura de AST
- regras de erro
- regras de warning

O foco aqui não é o tema HTML nem o highlight do editor. O foco é transformar um arquivo `.tmd` em uma estrutura intermediária confiável.

---

## Visão geral do pipeline

O parser de ToddyMarkDown deve processar o arquivo em etapas bem separadas.

Ordem recomendada:

1. leitura bruta do arquivo
2. normalização básica de quebras de linha
3. detecção de frontmatter opcional
4. varredura linha a linha do corpo
5. detecção de blocos literais
6. detecção de escapes de linha
7. detecção de blocos especiais
8. parsing interno do conteúdo de cada bloco
9. parsing do markdown comum remanescente
10. construção da AST final
11. emissão de erros e warnings

Essa ordem importa. Se o parser detectar blocos especiais antes de respeitar bloco literal e escape, ele interpretará como sintaxe coisas que deveriam permanecer texto cru.

---

## Ordem exata de leitura

## 1. Leitura do arquivo

Entrada esperada:

- texto UTF-8
- extensão esperada: `.tmd`

O parser pode aceitar texto sem extensão, mas o ambiente de compilação deve tratar `.tmd` como formato oficial.

---

## 2. Normalização

Antes de qualquer parsing:

- converter `\r\n` para `\n`
- converter `\r` para `\n`
- preservar indentação e espaços internos
- não remover linhas vazias

Resultado: o parser trabalha sempre sobre uma sequência uniforme de linhas.

---

## 3. Detecção do frontmatter

O frontmatter é opcional e só é reconhecido se aparecer no topo do arquivo.

Forma:

```tmd
---
title: ...
subtitle: ...
kicker: ...
author: ...
theme: ...
---
```

### Regra

- se a primeira linha do arquivo for exatamente `---`, o parser tenta ler frontmatter
- o frontmatter termina no próximo `---` em linha isolada
- se não houver fechamento, isso gera erro estrutural
- linhas internas devem ser lidas como pares `chave: valor`
- chaves desconhecidas podem ser aceitas como metadado genérico ou gerar warning, conforme a política da implementação
- o campo `theme` define o tema padrão de exibição; valores válidos são `essay`, `ink`, `modern`, `amber` e quaisquer temas customizados definidos no `.config.tmd.json`; valores inválidos ou ausentes fazem o compilador usar `essay`
- o campo `compile` define o modo de saída; valores válidos são `standalone` e `fragment`; valores inválidos ou ausentes fazem o compilador usar `standalone`
- a precedência de configuração é: `.config.tmd.json` → frontmatter → padrão hardcoded

### Regex úteis

Abertura/fechamento do frontmatter:

```regex
^---$
```

Linha simples de chave-valor:

```regex
^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$
```

### Saída de AST

```json
{
  "type": "Frontmatter",
  "fields": {
    "title": "...",
    "subtitle": "...",
    "kicker": "...",
    "author": "...",
    "theme": "essay",
    "compile": "standalone"
  }
}
```

---

## 4. Blocos literais multilinha

Antes de interpretar qualquer sintaxe especial, o parser precisa reconhecer blocos literais.

Forma:

```tmd
/>
qualquer coisa aqui
|>! [não interpretar]
## nem isso
<\
```

### Regra

- linha exata `/>` inicia bloco literal
- linha exata `<\` fecha bloco literal
- tudo entre essas linhas vira texto literal bruto
- nada dentro deve ser interpretado como sintaxe TMD

### Regex úteis

Abertura:

```regex
^/>$
```

Fechamento:

```regex
^<\\$
```

### Saída de AST

```json
{
  "type": "LiteralBlock",
  "raw": "conteúdo bruto preservado"
}
```

---

## 5. Escape de linha

Qualquer linha iniciada por `\` deve ser tratada como texto literal de linha única.

Exemplo:

```tmd
\|>!
```

### Regra

- se a linha começar com `\`, remover o primeiro caractere `\`
- a linha resultante entra como texto comum
- essa linha não pode abrir bloco especial nem bloco literal

### Regex útil

```regex
^\\(.*)$
```

### Saída de AST

Essa linha não precisa de um nó especial obrigatório. Ela pode ser incorporada a um nó de markdown bruto.

---

## 6. Famílias de blocos especiais

ToddyMarkDown possui duas famílias de blocos especiais:

- família de conteúdo
- família de imagem

As duas começam com `|>` e terminam com `<|`, mas a linha de abertura tem formato diferente.

---

# Família 1 — parsing de tokens de conteúdo

## Forma geral

```tmd
|>token [título opcional]
conteúdo
<|
```

## Tokens válidos

```txt
!
@
$
#
##
?
+
~~
&
```

### Regex conceitual da abertura

```regex
^\|>(!|@|\$|##|#|\?|\+|~~|&)(?:\s+\[(.*?)\])?$
```

### Observações

- o grupo do token deve capturar `##` antes de `#`
- o mesmo vale para `#` e `##` em relação a headings Markdown: `|>#` e `|>##` vêm colados logo após `|>` e nunca podem ser confundidos com headings Markdown comuns (`# título`)
- o título é opcional
- se houver colchete de abertura sem fechamento, erro
- nenhum texto extra é permitido após o título opcional

### Fechamento

```regex
^<\|$
```

## Regras de parsing

1. detectar abertura
2. capturar token
3. capturar título opcional
4. acumular linhas até `<|`
5. verificar se surge outro `|>` interno
6. se surgir, erro de bloco aninhado
7. enviar conteúdo acumulado para parser interno

### Markdown interno

O conteúdo interno de todos os blocos de conteúdo aceita markdown completo — inline (bold, itálico, código) e block (listas, headings). A única exceção é `|>@` (pullquote), que aceita apenas markdown inline.

---

## Casos especiais da família conteúdo

### `@` pullquote

Regras:

- a linha de citação é **obrigatória** e deve estar entre aspas duplas (`"`)
- a linha de autor é **opcional** e deve começar com `- `
- aceita apenas markdown **inline** no texto da citação (bold, itálico, código inline)
- block markdown (listas, headings) não é permitido
- bloco sem linha de citação entre aspas → **erro**
- bloco sem linha de autor → **válido**, renderiza sem `<cite>`

Estratégia de parsing:

1. percorrer o conteúdo do bloco
2. identificar a primeira linha que comece e termine com aspas duplas → `quote`
3. identificar a última linha que combine com `^-\s+` → `author`
4. se não houver linha de citação → erro estrutural

Regex útil para autoria:

```regex
^-\s+(.*)$
```

AST sugerida:

```json
{
  "type": "PullQuoteBlock",
  "title": null,
  "quote": "texto da citação",
  "author": "Gilbert Strang"
}
```

AST sem autor (válido):

```json
{
  "type": "PullQuoteBlock",
  "title": null,
  "quote": "texto da citação",
  "author": null
}
```

---

### `~~` timeline

Dentro de um bloco timeline, existem dois tipos de linha:

1. evento de timeline
2. markdown intermediário

Evento de timeline:

```tmd
~~ 1805 — acontecimento ~~
```

Regex:

```regex
^~~\s+(.*?)\s+~~$
```

Regra:
- linhas que casem com esse padrão viram eventos
- linhas que não casem continuam como markdown normal associado à timeline

AST sugerida:

```json
{
  "type": "TimelineBlock",
  "title": "Linha do tempo",
  "items": [
    {
      "type": "TimelineEvent",
      "text": "1805 — acontecimento"
    },
    {
      "type": "TimelineMarkdown",
      "raw": "markdown intermediário"
    },
    {
      "type": "TimelineEvent",
      "text": "1965 — acontecimento"
    }
  ]
}
```

---

# Família 2 — parsing de tokens de imagem

## Forma geral

```tmd
|>*modo [título opcional] ![legenda](URL_ou_caminho)
conteúdo
<|
```

## Modos válidos

```txt
*>        imagem à direita, sem abraço
*>wrap    imagem à direita, com abraço de texto
*<        imagem à esquerda, sem abraço
*<wrap    imagem à esquerda, com abraço de texto
```

## Regex conceitual da abertura

```regex
^\|>(\*>wrap|\*>|\*<wrap|\*<)(?:\s+\[(.*?)\])?\s+!\[(.*?)\]\((.*?)\)$
```

### Observação crítica

A ordem do alternador importa. `*>wrap` e `*<wrap` devem ser capturados antes de `*>` e `*<` respectivamente, para evitar captura parcial.

Estratégia mais robusta — dividir em partes em vez de depender de uma regex única:

1. confirmar prefixo `|>`
2. extrair modo válido (verificar `*>wrap`, `*<wrap`, `*>`, `*<` nessa ordem)
3. tentar ler título opcional `[ ... ]`
4. localizar a sintaxe de imagem `![...](...)`
5. verificar se não há segunda imagem na mesma linha

## Regras de parsing

- imagem obrigatória na primeira linha
- apenas uma imagem por bloco
- legenda obrigatória
- caminho obrigatório
- modo obrigatório
- conteúdo interno aceita markdown completo (inline e block)
- blocos especiais não podem ser aninhados

## AST sugerida

```json
{
  "type": "ImageBlock",
  "mode": "*>",
  "title": "Gauss",
  "caption": "Retrato de Gauss",
  "src": "./img/gauss.jpg",
  "content": [
    {
      "type": "MarkdownBlock",
      "raw": "Gauss desenvolveu técnicas matemáticas extraordinárias."
    }
  ]
}
```

---

## Parsing do markdown comum

Tudo o que não for:

- frontmatter
- bloco literal
- escape de linha
- bloco especial

deve ser acumulado como markdown comum.

Estratégia recomendada:
- juntar sequências contíguas de linhas comuns
- gerar nós `MarkdownBlock`

AST sugerida:

```json
{
  "type": "MarkdownBlock",
  "raw": "## seção\nparágrafo\n- item"
}
```

---

# AST global

## Estrutura do documento

AST sugerida de alto nível:

```json
{
  "type": "Document",
  "frontmatter": {
    "title": "...",
    "subtitle": "...",
    "kicker": "...",
    "author": "...",
    "theme": "essay"
  },
  "children": [
    {
      "type": "MarkdownBlock",
      "raw": "texto inicial"
    },
    {
      "type": "ExplainerBlock",
      "title": "O que é FFT?",
      "content": [
        {
          "type": "MarkdownBlock",
          "raw": "FFT é um método eficiente..."
        }
      ]
    },
    {
      "type": "ImageBlock",
      "mode": "*>",
      "title": "Gauss",
      "caption": "Retrato de Gauss",
      "src": "./img/gauss.jpg",
      "content": [
        {
          "type": "MarkdownBlock",
          "raw": "texto do bloco"
        }
      ]
    }
  ]
}
```

## Tipos mínimos de nó

- `Document`
- `Frontmatter`
- `MarkdownBlock`
- `LiteralBlock`
- `ExplainerBlock`
- `PullQuoteBlock`
- `AsideBlock`
- `NoteBlock`
- `WarningBlock`
- `QuestionBlock`
- `TakeawayBlock`
- `ConceptBlock`
- `TimelineBlock`
- `TimelineEvent`
- `TimelineMarkdown`
- `ImageBlock`
- `ErrorBlock`

---

# Mapeamento de tokens para nós AST

## Família conteúdo

- `!`  → `ExplainerBlock`
- `@`  → `PullQuoteBlock`
- `$`  → `AsideBlock`
- `#`  → `NoteBlock`
- `##` → `WarningBlock`
- `?`  → `QuestionBlock`
- `+`  → `TakeawayBlock`
- `~~` → `TimelineBlock`
- `&`  → `ConceptBlock`

## Família imagem

- `*>`      → `ImageBlock` com `mode = "*>"`
- `*>wrap`  → `ImageBlock` com `mode = "*>wrap"`
- `*<`      → `ImageBlock` com `mode = "*<"`
- `*<wrap`  → `ImageBlock` com `mode = "*<wrap"`

---

# Erros

Erros devem impedir compilação normal ou marcar o documento como inválido.

## Comportamento de erro

Quando o parser encontra um bloco mal-formado, três coisas acontecem:

1. **Terminal** — o erro é reportado no terminal com o número da linha e o motivo
2. **Bloco cru** — o conteúdo original é preservado como texto cru no HTML de saída via nó `ErrorBlock`
3. **Marcação visual** — o nó `ErrorBlock` renderiza sobre fundo vermelho semitransparente com delimitadores `--ERROR BLOC--` acima e abaixo do texto cru

Representação visual no HTML compilado:

```
┌─────────────────────────────────────────┐  ← fundo vermelho semitransparente
  --ERROR BLOC--
  |>@ texto sem aspas
  - autor
  --ERROR BLOC--
└─────────────────────────────────────────┘
```

## AST do nó de erro

```json
{
  "type": "ErrorBlock",
  "raw": "conteúdo original preservado",
  "error": "PullQuote sem linha de citação entre aspas",
  "line": 42
}
```

## Erros estruturais gerais

1. frontmatter aberto sem fechamento
2. bloco especial aberto sem fechamento
3. fechamento `<|` sem bloco aberto
4. bloco literal aberto sem fechamento
5. fechamento `<\` sem bloco literal aberto
6. bloco especial aninhado

## Erros de abertura de bloco de conteúdo

7. token ausente
8. token desconhecido
9. título com `[` sem `]`
10. texto extra inválido após token/título

## Erros de pullquote

11. bloco `@` sem linha de citação entre aspas
12. bloco `@` vazio

## Erros de timeline

13. linha iniciada com `~~ ` mas sem fechamento ` ~~` dentro de bloco timeline, quando a implementação decidir validar estritamente esse caso como evento malformado

## Erros de imagem

14. modo de imagem inválido
15. sintaxe de imagem ausente na abertura
16. legenda ausente
17. caminho ausente
18. mais de uma imagem na linha de abertura
19. título de bloco de imagem malformado
20. bloco de imagem vazio e sem imagem válida
21. caminho de imagem referenciado não encontrado no sistema de arquivos — gera `ErrorBlock` visual no lugar da imagem, reporta no terminal, exit code `1`, continua compilação

---

# Warnings

Warnings não precisam impedir compilação.

1. frontmatter com campos desconhecidos
2. título vazio `[]`
3. bloco vazio
4. pullquote com múltiplas linhas candidatas a autor; usar a última
5. legenda de imagem vazia
6. caminho de imagem suspeito (ex: URL absoluta sem protocolo reconhecido)
7. timeline sem eventos, contendo apenas markdown intermediário

## Resolução de caminhos de imagem

O parser registra o caminho de cada imagem encontrada — seja na linha de abertura de blocos da família imagem ou em markdown comum (`![alt](caminho)`) em qualquer ponto do documento.

O caminho é sempre resolvido **relativo ao arquivo `.tmd`** de origem. A verificação de existência e a cópia dos assets são responsabilidade do compilador, não do parser. O parser apenas emite o nó com o caminho original; o compilador resolve e copia.

---

# Estratégia de implementação recomendada

## Parsing em dois níveis

### Nível 1 — parser estrutural TMD

Reconhece:

- frontmatter
- blocos literais
- escapes
- blocos especiais
- markdown bruto

Produz AST estrutural TMD.

### Nível 2 — parser de markdown comum

Processa os nós `MarkdownBlock` ou os conteúdos internos dos blocos.

Isso evita reinventar o markdown inteiro dentro do parser principal.

---

# Pseudofluxo de parsing

```txt
ler arquivo
normalizar quebras de linha
se topo começa com ---:
  ler frontmatter

enquanto houver linhas:
  se linha == />:
    ler bloco literal
  senão se linha começa com \:
    tratar como texto literal
  senão se linha começa com |>:
    tentar reconhecer família conteúdo ou família imagem
    ler até <|
    validar bloco
    se inválido: gerar ErrorBlock, reportar no terminal
    se válido: gerar nó AST correspondente
  senão:
    acumular como markdown comum
```

---

# Exemplo de parsing

## Entrada `.tmd`

```tmd
---
title: Fourier
author: Matheus Toddy
---

## Introdução

|>! [O que é FFT?]
FFT é um método eficiente.
<|

|>@
"O algoritmo numérico mais importante de nossa vida."
- Gilbert Strang
<|

|>*> [Gauss] ![Retrato de Gauss](./img/gauss.jpg)
Gauss desenvolveu técnicas extraordinárias.
<|
```

## AST resumida esperada

```json
{
  "type": "Document",
  "frontmatter": {
    "title": "Fourier",
    "author": "Matheus Toddy"
  },
  "children": [
    {
      "type": "MarkdownBlock",
      "raw": "## Introdução"
    },
    {
      "type": "ExplainerBlock",
      "title": "O que é FFT?",
      "content": [
        {
          "type": "MarkdownBlock",
          "raw": "FFT é um método eficiente."
        }
      ]
    },
    {
      "type": "PullQuoteBlock",
      "title": null,
      "quote": "\"O algoritmo numérico mais importante de nossa vida.\"",
      "author": "Gilbert Strang"
    },
    {
      "type": "ImageBlock",
      "mode": "*>",
      "title": "Gauss",
      "caption": "Retrato de Gauss",
      "src": "./img/gauss.jpg",
      "content": [
        {
          "type": "MarkdownBlock",
          "raw": "Gauss desenvolveu técnicas extraordinárias."
        }
      ]
    }
  ]
}
```

---

# Princípio de projeto do parser

O parser de ToddyMarkDown não deve tentar ser esperto demais.

Ele deve ser:

- previsível
- determinístico
- estrito nas bordas estruturais
- tolerante no conteúdo markdown interno
- claro nos erros
- econômico nas regras

Em linguagem menos pomposa: a criatura precisa funcionar como ferramenta, não como oráculo temperamental.

---

# Changelog

## v1.4
- Erro 21 adicionado: caminho de imagem não encontrado no sistema de arquivos → `ErrorBlock` + terminal + exit 1 + continua
- Escopo de detecção de imagens explicitado: todos os `![](caminho)` no documento, incluindo markdown comum e interior de blocos
- Seção de resolução de caminhos adicionada: relativo ao arquivo `.tmd`; cópia é responsabilidade do compilador
- Warning de "imagem não encontrada" removido dos warnings (promovido a erro)

## v1.3
- Campo `compile` adicionado ao frontmatter: valores `standalone` e `fragment`; ausente ou inválido → `standalone`
- Campo `compile` adicionado à AST do nó `Frontmatter`
- Regra de `theme` atualizada: aceita também temas customizados do `.config.tmd.json`
- Precedência de configuração documentada nas regras do frontmatter

## v1.2
- Sintaxe da família imagem atualizada: `*>`, `*>wrap`, `*<`, `*<wrap`
- Regex da família imagem atualizada para nova sintaxe; `*>wrap` e `*<wrap` devem ser capturados antes de `*>` e `*<`
- Mapeamento AST da família imagem atualizado
- Regras do pullquote detalhadas: citação obrigatória entre aspas, autor opcional com `- `, inline-only, AST com `author: null` quando ausente
- Markdown interno explicitado: inline e block em todos os blocos, exceto `|>@` (inline-only)
- `ErrorBlock` adicionado aos tipos de nó da AST
- Comportamento de erro documentado: terminal + `ErrorBlock` + marcação visual com `--ERROR BLOC--`
- AST do nó de erro documentada
- Pseudofluxo de parsing atualizado com tratamento de erro
- Nota sobre `|>#` e `|>##` adicionada para distinguir dos headings Markdown

## v1.1
- Versão inicial
