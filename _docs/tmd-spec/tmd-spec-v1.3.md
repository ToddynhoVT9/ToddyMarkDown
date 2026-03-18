# ToddyMarkDown (`.tmd`) — tmd-spec v1.3

## Visão geral

ToddyMarkDown é uma extensão semântica de Markdown pensada para escrita editorial, ensaística, documentação técnica e textos com composição visual mais rica.

Um arquivo `.tmd` pode conter:

- frontmatter opcional
- markdown comum
- blocos especiais

ToddyMarkDown organiza seus blocos em **duas famílias principais**:

- **família de conteúdo**
- **família de imagem**

Essa separação é importante porque as duas famílias possuem regras de parsing diferentes.

---

## Frontmatter opcional

```tmd
---
title: O Algoritmo Invisível que Governa o Mundo
subtitle: Ela não tem nome famoso, não aparece nos livros do ensino médio...
kicker: Ciência & Tecnologia
author: Matheus Toddy
theme: essay
---
```

### Campos possíveis

- `title`
- `subtitle`
- `kicker`
- `author`
- `theme`

Todos opcionais.

### Campo `theme`

O campo `theme` define o **tema padrão** carregado na primeira abertura do documento compilado. O compilador sempre gera os quatro temas embutidos no HTML de saída; o usuário pode alternar entre eles via switcher no header.

Temas disponíveis:

```txt
essay    padrão — ensaio literário, austero, escuro
ink      editorial clássico inspirado em jornal impresso
modern   leitura digital contemporânea
amber    editor literário, íntimo e quente
```

Se o campo `theme` estiver ausente ou for inválido, o compilador usa `essay` como padrão.

---

## Markdown comum

Markdown tradicional continua válido fora e dentro dos blocos especiais.

```tmd
## seção
parágrafo normal

- item de lista

> citação simples
```

---

# Família 1 — Tokens de conteúdo

Esses blocos criam componentes editoriais baseados principalmente em estrutura semântica textual.

## Forma geral

```tmd
|>token [título opcional]
conteúdo em markdown normal
<|
```

## Regras gerais

- `|>` abre o bloco
- `<|` fecha o bloco
- token obrigatório
- `[título opcional]` opcional
- conteúdo interno aceita markdown completo — inline (bold, itálico, código) e block (listas, headings)
- exceção: `|>@` aceita apenas markdown inline (ver seção Pullquote)
- blocos não podem ser aninhados

## Tokens oficiais

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

**Nota sobre `|>##` e `|>#`:** o token `##` e `#` vem colado imediatamente após `|>`, o que o distingue de um heading Markdown comum. O parser deve tratar `|>##` e `|>#` como token de warning e note, respectivamente, e nunca como heading.

---

## Exemplos

### Explainer

```tmd
|>! [O que é FFT?]
FFT é um método eficiente para calcular transformadas discretas.
<|
```

### Pullquote

O token `|>@` possui estrutura própria e regras específicas:

- A linha de citação é **obrigatória** e deve estar entre aspas duplas
- A linha de autor é **opcional** e deve começar com `-`
- Aceita apenas markdown **inline** no texto da citação (bold, itálico, código inline)
- Block markdown (listas, headings) não é permitido dentro de `|>@`
- Um bloco sem citação entre aspas é **inválido** e gera erro de parsing
- Um bloco sem linha de autor é **válido** — renderiza sem `<cite>`

```tmd
|>@
"O algoritmo numérico mais importante de nossa vida."
- Gilbert Strang
<|
```

```tmd
|>@
"O melhor texto-fonte é o que continua legível mesmo antes da renderização."
<|
```

Inválido — ausência de citação:

```tmd
|>@
- Gilbert Strang
<|
```

### Aside

```tmd
|>$
Gauss chegou perto disso muito antes do século XX.
<|
```

### Note

```tmd
|># [Nota]
A implementação prática depende de discretização.
<|
```

### Warning

```tmd
|>## [Aviso]
FFT não substitui Fourier; apenas acelera o cálculo.
<|
```

### Question

```tmd
|>?
Por que certas ideias corretas demoram tanto a mudar o mundo?
<|
```

### Takeaway

```tmd
|>+
A computação tornou a teoria historicamente útil.
<|
```

### Concept

```tmd
|>& [Domínio da frequência]
Representação por frequências componentes.
<|
```

### Timeline

```tmd
|>~~ [Linha do tempo]
~~ 1805 — Gauss formula algo equivalente ~~
Texto intermediário em markdown normal.
~~ 1965 — Cooley e Tukey publicam FFT ~~
<|
```

## Exemplo de caso de uso — família conteúdo

```tmd
## Fourier e o tempo histórico

|>! [O salto computacional]
FFT tornou viável aquilo que antes era teoricamente elegante mas operacionalmente caro.
<|

|>@
"O algoritmo numérico mais importante de nossa vida."
- Gilbert Strang
<|

|>+
A teoria existia; faltava máquina.
<|
```

---

# Família 2 — Tokens de imagem

Esses blocos criam composição editorial com imagem lateral.

## Forma geral

```tmd
|>*modo [título opcional] ![legenda](URL_ou_caminho)
conteúdo em markdown normal
<|
```

## Regras gerais

- imagem obrigatoriamente na linha de abertura
- apenas uma imagem por bloco
- `alt` obrigatório
- caminho obrigatório
- conteúdo interno aceita markdown completo (inline e block)

## Modos oficiais

```txt
|>*>       imagem à direita, sem abraço
|>*>wrap   imagem à direita, com abraço de texto
|>*<       imagem à esquerda, sem abraço
|>*<wrap   imagem à esquerda, com abraço de texto
```

**Sem abraço:** o texto fica como bloco ao lado da imagem, sem fluir ao redor dela.
**Com abraço:** o texto flui ao redor da imagem (float), aproximando-se do efeito de revistas diagramadas.

## Exemplos

### Direita sem abraço

```tmd
|>*> [Gauss] ![Retrato de Gauss](./img/gauss.jpg)
Gauss desenvolveu técnicas matemáticas extraordinárias.
<|
```

### Direita com abraço

```tmd
|>*>wrap [Gauss] ![Retrato de Gauss](./img/gauss.jpg)
Gauss desenvolveu técnicas matemáticas extraordinárias muito antes da computação moderna.
<|
```

### Esquerda sem abraço

```tmd
|>*< [Espectro] ![Diagrama de frequências](./img/espectro.png)
A visualização ajuda a entender a decomposição espectral.
<|
```

### Esquerda com abraço

```tmd
|>*<wrap [Espectro] ![Diagrama de frequências](./img/espectro.png)
A visualização ajuda a entender a decomposição espectral e o fluxo frequencial.
<|
```

## Exemplo de caso de uso — família imagem

```tmd
## Fourier visual

|>*> [Transformada] ![Esquema espectral](./img/fourier.png)
A imagem lateral organiza visualmente o conceito sem interromper o fluxo principal do texto.
<|

|>*<wrap [Gauss] ![Retrato histórico](./img/gauss.jpg)
Quando o texto abraça a imagem, o efeito editorial se aproxima de revistas e ensaios diagramados.
<|
```

---

# Comportamento de erro

Quando o parser encontra um bloco mal-formado, três coisas acontecem:

1. **Terminal** — o erro é reportado no terminal com a linha e o motivo
2. **Bloco cru** — o conteúdo original é preservado como texto cru no HTML de saída
3. **Marcação visual** — o bloco cru é envolto em um container com fundo vermelho semitransparente e delimitadores `--ERROR BLOC--` acima e abaixo

Representação visual do bloco de erro no HTML compilado:

```
┌─────────────────────────────────────────┐  ← fundo vermelho semitransparente
  --ERROR BLOC--
  |>@ texto sem aspas
  - autor
  --ERROR BLOC--
└─────────────────────────────────────────┘
```

Exemplos de erros que geram este comportamento:

- `|>@` sem linha de citação entre aspas
- bloco aberto com `|>` sem `<|` de fechamento correspondente
- token de imagem sem caminho de imagem na linha de abertura
- token desconhecido

---

# Compilador — comportamento de saída

O compilador gera um único arquivo `.html` com os quatro temas embutidos.

- Os quatro temas são carregados como conjuntos de variáveis CSS ativados por `data-theme` no elemento `<html>`
- O tema padrão é definido pelo campo `theme` no frontmatter; na ausência do campo, usa `essay`
- O tema ativo é persistido em `localStorage` entre sessões
- O header do documento compilado contém um switcher com quatro botões (`essay`, `ink`, `modern`, `amber`)
- O switcher herda as variáveis CSS do tema ativo (`var(--accent)`, `var(--text)`, `var(--border)` etc.) e se adapta automaticamente

---

# Escape

Linha iniciada por `\` literal:

```tmd
\|>!
```

# Bloco literal multilinha

```tmd
/>
|>! [Isso não interpreta]
## nem isso
<\
```

---

# Changelog

## v1.2
- Sintaxe da família imagem atualizada: `|>*>`, `|>*>wrap`, `|>*<`, `|>*<wrap`
- Regras do pullquote `|>@` detalhadas: citação obrigatória, autor opcional, inline-only
- Markdown interno nos blocos de conteúdo: inline e block permitidos (exceto `|>@`)
- Temas definidos: `essay`, `ink`, `modern`, `amber`
- Campo `theme` no frontmatter passa a definir tema padrão (não único)
- Comportamento de erro documentado: terminal + bloco cru + marcação visual
- Compilador documentado: saída única com 4 temas embutidos e switcher no header

## v1.1
- Versão inicial
