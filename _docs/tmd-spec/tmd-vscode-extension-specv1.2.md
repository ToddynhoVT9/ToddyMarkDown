# ToddyMarkDown (`.tmd`) — tmd-vscode-extension-spec v1.2

## Objetivo

Este documento define a especificação da extensão de VS Code para ToddyMarkDown (`.tmd`).

Ele cobre:

- associação de arquivos `.tmd`
- syntax highlight
- grammar file
- escopos de tokenização
- tokens do editor
- temas de cor esperados
- estrutura mínima da extensão

O foco aqui não é o parser do compilador nem o HTML final. O foco é a experiência de edição no VS Code.

---

## Objetivo funcional da extensão

A extensão deve permitir que arquivos `.tmd` tenham:

- reconhecimento como linguagem própria
- highlight sintático consistente
- leitura visual clara dos blocos especiais
- convivência com marcação comum semelhante a Markdown
- base compatível com futuras features como snippets, folding, autocomplete e validação

Em linguagem menos pomposa: o editor precisa bater o olho em `.tmd` e entender que não é só um `.md` fantasiado.

---

# Identidade da linguagem

## Nome formal

**ToddyMarkDown**

## Extensão oficial

```txt
.tmd
```

## Identificadores sugeridos no VS Code

- `id`: `toddymarkdown`
- `aliases`: `ToddyMarkDown`, `tmd`
- `extensions`: `.tmd`

### Exemplo de contribuição de linguagem

```json
{
  "contributes": {
    "languages": [
      {
        "id": "toddymarkdown",
        "aliases": ["ToddyMarkDown", "tmd"],
        "extensions": [".tmd"],
        "configuration": "./language-configuration.json"
      }
    ]
  }
}
```

---

# Estrutura mínima da extensão

Estrutura sugerida:

```txt
tmd-vscode-extension/
├─ package.json
├─ language-configuration.json
├─ syntaxes/
│  └─ toddymarkdown.tmLanguage.json
├─ themes/
│  └─ toddymarkdown-color-theme.json
└─ README.md
```

Arquivos mínimos realmente necessários para o highlight:

- `package.json`
- `language-configuration.json`
- `syntaxes/toddymarkdown.tmLanguage.json`

Tema separado é opcional, mas recomendado para testar o highlight em estado puro.

---

# Associação de linguagem

## package.json

Exemplo mínimo:

```json
{
  "name": "toddymarkdown",
  "displayName": "ToddyMarkDown",
  "description": "Syntax highlighting for ToddyMarkDown (.tmd)",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [
      {
        "id": "toddymarkdown",
        "aliases": ["ToddyMarkDown", "tmd"],
        "extensions": [".tmd"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "toddymarkdown",
        "scopeName": "text.toddymarkdown",
        "path": "./syntaxes/toddymarkdown.tmLanguage.json"
      }
    ]
  }
}
```

---

# Regras visuais de highlight

## Regras definidas

### Tokens e delimitadores TMD

- delimitadores `|>` e `<|` → **magenta**
- tokens especiais → **dourado**
- título opcional `[ ... ]` → **laranja**

### Markdown comum

- `#` → azul claro
- `##` → azul médio
- `###` → azul escuro
- texto de parágrafo → cor padrão do editor
- marcador `-` de lista → dourado claro
- texto da lista → cor padrão
- marcador `>` de citação simples → vermelho
- texto da citação simples → cor padrão

Essa distinção é boa porque colore a estrutura, não o texto inteiro. Menos carro alegórico, mais legibilidade.

---

# Escopos semânticos recomendados

A gramática deve atribuir escopos bem separados para permitir customização posterior.

## Escopos TMD principais

- `punctuation.definition.block.begin.tmd`
- `punctuation.definition.block.end.tmd`
- `keyword.control.block.token.tmd`
- `entity.name.block.title.tmd`
- `meta.block.content.tmd`
- `meta.block.image.tmd`
- `markup.raw.literal.tmd`

## Escopos de frontmatter

- `meta.frontmatter.tmd`
- `punctuation.definition.frontmatter.tmd`
- `support.type.property-name.frontmatter.tmd`
- `string.unquoted.frontmatter.tmd`

## Escopos de markdown comum

Pode reutilizar padrões próximos de Markdown:

- `markup.heading.1.tmd`
- `markup.heading.2.tmd`
- `markup.heading.3.tmd`
- `punctuation.definition.list.begin.tmd`
- `punctuation.definition.quote.begin.tmd`
- `markup.quote.tmd`

---

# Tokens do editor

## Família 1 — tokens de conteúdo

```txt
!    explainer
@    pullquote
$    aside
#    note
##   warning
?    question
+    takeaway
~~   timeline
&    concept
```

Todos esses tokens devem receber o mesmo escopo-base:

```txt
keyword.control.block.token.tmd
```

Se desejar mais granularidade futura, pode-se dividir:

- `keyword.control.block.explainer.tmd`
- `keyword.control.block.pullquote.tmd`
- etc.

Mas para a v1, um escopo-base já resolve bem.

---

## Família 2 — tokens de imagem

```txt
*>      imagem à direita, sem abraço
*>wrap  imagem à direita, com abraço
*<      imagem à esquerda, sem abraço
*<wrap  imagem à esquerda, com abraço
```

Esses modos também podem receber:

```txt
keyword.control.block.token.tmd
```

ou escopo mais específico:

```txt
keyword.control.block.image-mode.tmd
```

Recomendação: usar escopo específico para facilitar diferenciação futura.

---

# Grammar file — estratégia geral

A gramática pode ser implementada em **TextMate grammar** (`.tmLanguage.json`).

Isso já basta para:

- highlight
- escopos semânticos
- integração padrão com VS Code

Tree-sitter seria mais poderoso, mas é exagero na v1. O bicho ainda está aprendendo a andar; não precisa de exoesqueleto.

---

# language-configuration.json

Esse arquivo define comportamento de comentários, pares automáticos e folding básico.

Exemplo sugerido:

```json
{
  "comments": {
    "lineComment": null,
    "blockComment": ["/*", "*/"]
  },
  "brackets": [
    ["[", "]"],
    ["(", ")"],
    ["{", "}"]
  ],
  "autoClosingPairs": [
    ["[", "]"],
    ["(", ")"],
    ["{", "}"],
    ["`", "`"],
    [""", """]
  ],
  "surroundingPairs": [
    ["[", "]"],
    ["(", ")"],
    ["{", "}"],
    [""", """],
    ["`", "`"]
  ],
  "folding": {
    "markers": {
      "start": "^\|>",
      "end": "^<\|$"
    }
  }
}
```

## Observação

`folding.markers` pode ajudar, mas blocos multilineares com sintaxe heterogênea às vezes pedem ajustes. Mesmo assim, essa base já é útil.

---

# Grammar file — estrutura recomendada

Arquivo:

```txt
syntaxes/toddymarkdown.tmLanguage.json
```

Estrutura-base:

```json
{
  "scopeName": "text.toddymarkdown",
  "name": "ToddyMarkDown",
  "patterns": [
    { "include": "#frontmatter" },
    { "include": "#literal-block" },
    { "include": "#escaped-line" },
    { "include": "#content-block" },
    { "include": "#image-block" },
    { "include": "#markdown-headings" },
    { "include": "#markdown-list" },
    { "include": "#markdown-blockquote" }
  ],
  "repository": {
  }
}
```

A ordem importa. Bloco literal e linha escapada devem ser reconhecidos antes de blocos especiais.

---

# Grammar file — regras principais

## 1. Frontmatter

### Padrão

```json
"frontmatter": {
  "begin": "^---$",
  "beginCaptures": {
    "0": { "name": "punctuation.definition.frontmatter.tmd" }
  },
  "end": "^---$",
  "endCaptures": {
    "0": { "name": "punctuation.definition.frontmatter.tmd" }
  },
  "name": "meta.frontmatter.tmd",
  "patterns": [
    {
      "match": "^([A-Za-z_][A-Za-z0-9_-]*)(\s*:\s*)(.*)$",
      "captures": {
        "1": { "name": "support.type.property-name.frontmatter.tmd" },
        "2": { "name": "punctuation.separator.key-value.frontmatter.tmd" },
        "3": { "name": "string.unquoted.frontmatter.tmd" }
      }
    }
  ]
}
```

---

## 2. Linha escapada

Qualquer linha iniciada por `\`.

```json
"escaped-line": {
  "match": "^\\.*$",
  "name": "markup.raw.literal.tmd"
}
```

---

## 3. Bloco literal multilinha

Começa em `/>` e termina em `<\`.

```json
"literal-block": {
  "begin": "^/>$",
  "beginCaptures": {
    "0": { "name": "punctuation.definition.literal.begin.tmd" }
  },
  "end": "^<\\$",
  "endCaptures": {
    "0": { "name": "punctuation.definition.literal.end.tmd" }
  },
  "name": "markup.raw.block.tmd"
}
```

---

## 4. Blocos de conteúdo

### Abertura

Reconhece:

```txt
|>token [título opcional]
```

### Exemplo de regra

```json
"content-block": {
  "begin": "^(\|>)(!|@|\$|##|#|\?|\+|~~|&)(?:\s+(\[.*?\]))?$",
  "beginCaptures": {
    "1": { "name": "punctuation.definition.block.begin.tmd" },
    "2": { "name": "keyword.control.block.token.tmd" },
    "3": { "name": "entity.name.block.title.tmd" }
  },
  "end": "^(<\|)$",
  "endCaptures": {
    "1": { "name": "punctuation.definition.block.end.tmd" }
  },
  "name": "meta.block.content.tmd",
  "patterns": [
    { "include": "#markdown-headings" },
    { "include": "#markdown-list" },
    { "include": "#markdown-blockquote" }
  ]
}
```

### Observação importante

Na regex, `##` deve ser capturado antes de `#`. A ordem do alternador importa. Pequena armadilha clássica.

---

## 5. Blocos de imagem

### Abertura

Reconhece:

```txt
|>*modo [título opcional] ![legenda](caminho)
```

### Regra sugerida

```json
"image-block": {
  "begin": "^(\|>)(\*>wrap|\*>|\*<wrap|\*<)(?:\s+(\[.*?\]))?\s+(!\[.*?\]\(.*?\))$",
  "beginCaptures": {
    "1": { "name": "punctuation.definition.block.begin.tmd" },
    "2": { "name": "keyword.control.block.image-mode.tmd" },
    "3": { "name": "entity.name.block.title.tmd" },
    "4": { "name": "meta.block.image.tmd" }
  },
  "end": "^(<\|)$",
  "endCaptures": {
    "1": { "name": "punctuation.definition.block.end.tmd" }
  },
  "name": "meta.block.image-wrapper.tmd",
  "patterns": [
    { "include": "#markdown-headings" },
    { "include": "#markdown-list" },
    { "include": "#markdown-blockquote" }
  ]
}
```

### Escopos internos da imagem

Idealmente, a parte `![legenda](caminho)` deveria ter subcapturas:

- `punctuation.definition.image.begin.tmd`
- `entity.name.image.caption.tmd`
- `string.other.link.description.tmd`
- `markup.underline.link.tmd`

Uma alternativa é quebrar isso em padrões internos adicionais.

---

## 6. Headings Markdown

### Heading 1

```json
"markdown-heading-1": {
  "match": "^(#)(\s+.*)$",
  "captures": {
    "1": { "name": "markup.heading.1.marker.tmd" },
    "2": { "name": "markup.heading.1.tmd" }
  }
}
```

### Heading 2

```json
"markdown-heading-2": {
  "match": "^(##)(\s+.*)$",
  "captures": {
    "1": { "name": "markup.heading.2.marker.tmd" },
    "2": { "name": "markup.heading.2.tmd" }
  }
}
```

### Heading 3

```json
"markdown-heading-3": {
  "match": "^(###)(\s+.*)$",
  "captures": {
    "1": { "name": "markup.heading.3.marker.tmd" },
    "2": { "name": "markup.heading.3.tmd" }
  }
}
```

### Recomendação

Na implementação real, reconhecer do mais específico para o menos específico. `###` antes de `##`, `##` antes de `#`.

---

## 7. Lista Markdown

```json
"markdown-list": {
  "match": "^(\s*[-])(\s+.*)$",
  "captures": {
    "1": { "name": "punctuation.definition.list.begin.tmd" },
    "2": { "name": "meta.list.item.tmd" }
  }
}
```

---

## 8. Blockquote Markdown

```json
"markdown-blockquote": {
  "match": "^(\s*>)(\s+.*)$",
  "captures": {
    "1": { "name": "punctuation.definition.quote.begin.tmd" },
    "2": { "name": "markup.quote.tmd" }
  }
}
```

---

# Cores sugeridas no tema

## Mapeamento de intenção visual

### Delimitadores

Escopos:

- `punctuation.definition.block.begin.tmd`
- `punctuation.definition.block.end.tmd`
- `punctuation.definition.literal.begin.tmd`
- `punctuation.definition.literal.end.tmd`

Cor:
- **magenta**

### Tokens especiais

Escopos:

- `keyword.control.block.token.tmd`
- `keyword.control.block.image-mode.tmd`

Cor:
- **dourado**

### Título opcional

Escopo:
- `entity.name.block.title.tmd`

Cor:
- **laranja**

### Headings Markdown

- `markup.heading.1.tmd` → azul claro
- `markup.heading.2.tmd` → azul médio
- `markup.heading.3.tmd` → azul escuro

### Lista

- `punctuation.definition.list.begin.tmd` → dourado claro
- `meta.list.item.tmd` → cor padrão

### Blockquote

- `punctuation.definition.quote.begin.tmd` → vermelho
- `markup.quote.tmd` → cor padrão

### Texto comum

Sem escopo de cor especial; usar cor padrão do tema ativo.

---

# Exemplo de theme token colors

Arquivo opcional:

```txt
themes/toddymarkdown-color-theme.json
```

Exemplo parcial:

```json
{
  "name": "ToddyMarkDown Theme",
  "type": "dark",
  "colors": {},
  "tokenColors": [
    {
      "scope": [
        "punctuation.definition.block.begin.tmd",
        "punctuation.definition.block.end.tmd",
        "punctuation.definition.literal.begin.tmd",
        "punctuation.definition.literal.end.tmd"
      ],
      "settings": {
        "foreground": "#ff4fd8"
      }
    },
    {
      "scope": [
        "keyword.control.block.token.tmd",
        "keyword.control.block.image-mode.tmd"
      ],
      "settings": {
        "foreground": "#d9a441"
      }
    },
    {
      "scope": [
        "entity.name.block.title.tmd"
      ],
      "settings": {
        "foreground": "#ff9b42"
      }
    },
    {
      "scope": [
        "markup.heading.1.tmd",
        "markup.heading.1.marker.tmd"
      ],
      "settings": {
        "foreground": "#7ec8ff"
      }
    },
    {
      "scope": [
        "markup.heading.2.tmd",
        "markup.heading.2.marker.tmd"
      ],
      "settings": {
        "foreground": "#3fa9ff"
      }
    },
    {
      "scope": [
        "markup.heading.3.tmd",
        "markup.heading.3.marker.tmd"
      ],
      "settings": {
        "foreground": "#1f6fe5"
      }
    },
    {
      "scope": [
        "punctuation.definition.list.begin.tmd"
      ],
      "settings": {
        "foreground": "#e3c77a"
      }
    },
    {
      "scope": [
        "punctuation.definition.quote.begin.tmd"
      ],
      "settings": {
        "foreground": "#e05757"
      }
    }
  ]
}
```

---

# Folding e comportamento do editor

## Folding

Blocos especiais podem usar abertura e fechamento como marcadores de folding:

- começo: `^\|>`
- fim: `^<\|$`

Blocos literais também podem ser dobráveis:

- começo: `^/>$`
- fim: `^<\\$`

## Auto close

A extensão pode futuramente oferecer snippets ou completions, mas na v1 não é obrigatório.

---

# Snippets recomendados para o futuro

Não são obrigatórios na v1, mas fazem muito sentido.

## Explainer

```txt
|>! [${1:Título}]
${2:conteúdo}
<|
```

## Pullquote

```txt
|>@
"${1:citação}"
- ${2:autor}
<|
```

## Note

```txt
|># [${1:Nota}]
${2:conteúdo}
<|
```

## Timeline

```txt
|>~~ [${1:Linha do tempo}]
~~ ${2:evento} ~~
${3:markdown intermediário}
<|
```

## Imagem direita sem abraço

```txt
|>*> [${1:Título}] ![${2:Legenda}](${3:./img/imagem.png})
${4:conteúdo}
<|
```

---

# Limites da gramática v1

A grammar do VS Code é para **highlight**, não para validação semântica completa.

Ela não deve tentar resolver perfeitamente:

- AST real
- múltiplas imagens inválidas
- erro estrutural profundo
- aninhamento semântico
- warnings de compilação

Isso é trabalho do parser real.

A gramática do editor deve priorizar:

- clareza visual
- consistência
- simplicidade de manutenção

Se ela tentar virar parser completo, vira um pequeno caos ornamental de regex. E regex caótica costuma morder o próprio autor seis semanas depois.

---

# Exemplo completo de tokenização esperada

## Entrada

```tmd
---
title: Fourier
author: Matheus Toddy
---

## Introdução

|>! [O que é FFT?]
FFT é um método eficiente.
<|

|>*> [Gauss] ![Retrato de Gauss](./img/gauss.jpg)
Gauss desenvolveu técnicas extraordinárias.
<|

> citação simples
- item
```

## Highlight esperado

- `---` do frontmatter com escopo de pontuação de frontmatter
- `title`, `author` como property names
- `##` em azul médio
- `|>` e `<|` em magenta
- `!` em dourado
- `*>` em dourado
- `[O que é FFT?]` em laranja
- `[Gauss]` em laranja
- `![Retrato de Gauss](...)` com escopo de imagem
- `>` em vermelho
- `-` em dourado claro
- texto comum em cor padrão

---

# Princípio de projeto da extensão

A extensão de VS Code para ToddyMarkDown deve ser leve, previsível e claramente separada do compilador.

O papel dela é:

- reconhecer `.tmd`
- destacar estrutura
- tornar a escrita confortável

Não é função dela tentar adivinhar semântica profunda, corrigir o universo ou competir com o parser real como se fosse um pequeno deus lexical. Ela só precisa iluminar bem o terreno.


