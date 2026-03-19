# ToddyMarkDown (`.tmd`) — tmd-html-theme-spec v1.5

## Objetivo

Este documento define a especificação da saída HTML/CSS de ToddyMarkDown (`.tmd`).

Ele cobre:

- estrutura HTML esperada
- classes CSS sugeridas
- comportamento visual dos blocos
- relação entre AST e HTML
- temas visuais e princípios de composição
- switcher de temas no header
- convenções para responsividade
- sistema de customização em níveis

O foco aqui não é o parser nem o syntax highlight do editor. O foco é a camada de apresentação final.

---

## Princípio geral

ToddyMarkDown separa:

- **estrutura semântica** no `.tmd`
- **interpretação estrutural** no parser/AST
- **apresentação visual** no tema HTML/CSS

Isso significa que o compilador não deve misturar semântica de bloco com decisão ornamental arbitrária.

O HTML gerado deve ser:

- semântico
- previsível
- fácil de estilizar
- acessível
- legível mesmo sem CSS

---

## Pipeline de renderização

Fluxo recomendado:

1. arquivo `.tmd`
2. parser TMD
3. AST TMD
4. renderizador HTML
5. tema CSS (4 temas embutidos + temas customizados)
6. saída final `.html`

O parser decide **o que o bloco é**.
O tema decide **como esse bloco aparece**.

---

# Estrutura global do documento

## Comportamento de saída do compilador

O compilador sempre gera **dois arquivos**: `title.html` e `title.css`.

O modo de saída é controlado pelo campo `compile` no frontmatter (ou por `defaultCompile` no `.config.tmd.json`). Ausente ou inválido → `standalone`.

### Modo `standalone`

- `title.html` — documento completo: `<html>`, `<head>` com `<link>` para o `.css`, switcher no header, script de persistência em `localStorage`
- `title.css` — CSS com escopo via `[data-theme]` no `<html>`; contém os quatro temas base e os temas customizados do `.config.tmd.json`

### Modo `fragment`

- `title.html` — apenas o fragmento `<article class="tmd-document tmd-theme-{tema}">` e seu conteúdo; sem `<html>`, sem `<head>`, sem switcher, sem script
- `title.css` — CSS com escopo via `.tmd-theme-{nome}` no `<article>` para evitar vazamento no CSS do site que o embute

### Diferença de escopo CSS entre os modos

```css
/* standalone */
[data-theme="essay"] { --tmd-accent: #8c7b68; }

/* fragment */
.tmd-theme-essay { --tmd-accent: #8c7b68; }
```

Toda a lógica de variáveis e blocos é idêntica entre os dois modos. Só o seletor raiz muda.

## HTML mínimo — modo `standalone`

```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="essay">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Título do documento</title>
  <link rel="stylesheet" href="./titulo.css" />
</head>
<body>
  <header class="tmd-site-header">
    <div class="tmd-theme-switcher">
      <button class="tmd-theme-btn" data-theme-target="essay">essay</button>
      <button class="tmd-theme-btn" data-theme-target="ink">ink</button>
      <button class="tmd-theme-btn" data-theme-target="modern">modern</button>
      <button class="tmd-theme-btn" data-theme-target="amber">amber</button>
    </div>
  </header>

  <article class="tmd-document">
    <header class="tmd-header">...</header>
    <main class="tmd-body">...</main>
  </article>

  <script>
    const saved = localStorage.getItem('tmd-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('.tmd-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.themeTarget;
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('tmd-theme', t);
      });
    });
  </script>
</body>
</html>
```

## HTML mínimo — modo `fragment`

```html
<article class="tmd-document tmd-theme-essay">
  <header class="tmd-header">
    <p class="tmd-kicker">Ciência &amp; Tecnologia</p>
    <h1 class="tmd-title">O Algoritmo Invisível que Governa o Mundo</h1>
    <p class="tmd-subtitle">Ela não tem nome famoso...</p>
    <p class="tmd-author">Matheus Toddy</p>
  </header>
  <main class="tmd-body">
    <!-- blocos renderizados -->
  </main>
</article>
```

O site que embute este fragmento é responsável por incluir o `titulo.css` e por trocar a classe `.tmd-theme-{nome}` no `<article>` se quiser suporte a múltiplos temas.

---

## Temas disponíveis

Os quatro temas são definidos como blocos de variáveis CSS scoped por `[data-theme]`.

```css
[data-theme="essay"] { /* variáveis do tema essay */ }
[data-theme="ink"]   { /* variáveis do tema ink   */ }
[data-theme="modern"]{ /* variáveis do tema modern */ }
[data-theme="amber"] { /* variáveis do tema amber  */ }
```

### Personalidades

```txt
essay    ensaio literário — Playfair Display + Lora, escuro neutro
ink      editorial clássico — Playfair Display + Libre Baskerville, papel creme, acento ferrugem
modern   leitura digital — IBM Plex Sans, escuro, acento violeta #7c6aff
amber    editor literário — Cormorant Garamond + Raleway, escuro quente, acento âmbar #c8913a
```

### Switcher adaptativo

O switcher no header usa `var(--tmd-accent)`, `var(--tmd-text)` e `var(--tmd-border)` para herdar a identidade do tema ativo automaticamente. Não possui estilo fixo próprio.

```css
.tmd-theme-btn {
  color: var(--tmd-text-soft);
  border: 1px solid var(--tmd-border);
  background: transparent;
}

.tmd-theme-btn:hover,
.tmd-theme-btn[data-active] {
  color: var(--tmd-accent);
  border-color: var(--tmd-accent);
}
```

---

# Sistema de customização em níveis

ToddyMarkDown define quatro níveis de customização visual. A restrição aumenta conforme o escopo diminui: o nível de projeto tem mais liberdade que o nível de bloco; o CSS externo não tem restrição nenhuma, mas exige opt-in explícito.

```
Nível 0 — temas base (imutáveis)
Nível 1 — variáveis globais de aparência (.config.tmd.json)
Nível 2 — propriedades por tipo de bloco (.config.tmd.json)
Nível 3 — CSS externo, opt-in explícito no config
```

Os níveis 1 e 2 coexistem no mesmo arquivo e no mesmo bloco de tema. O usuário não precisa pensar em "níveis" — escreve um tema com duas seções (`overrides` e `blocks`) e o compilador trata cada uma com sua whitelist correspondente.

---

## Nível 0 — Temas base

Os quatro temas embutidos (`essay`, `ink`, `modern`, `amber`) são imutáveis. O compilador sempre os gera no CSS de saída. Não podem ser removidos, renomeados ou alterados via configuração.

---

## Nível 1 — Variáveis globais de tema

Definido na chave `overrides` de cada tema em `.config.tmd.json`. Permite sobrescrever variáveis CSS globais de aparência herdadas do tema base declarado em `extends`.

### Whitelist do nível 1

| Propriedade | Tipo | Restrição de valor |
|---|---|---|
| `bg` | cor | `hex`, `rgb()`, `hsl()` |
| `surface` | cor | `hex`, `rgb()`, `hsl()` |
| `text` | cor | `hex`, `rgb()`, `hsl()` |
| `text-soft` | cor | `hex`, `rgb()`, `hsl()` |
| `accent` | cor | `hex`, `rgb()`, `hsl()` |
| `border` | cor | `hex`, `rgb()`, `hsl()` |
| `font-body` | font-stack | string CSS válida |
| `font-heading` | font-stack | string CSS válida |
| `radius` | tamanho | `px` ou `rem` apenas |

### Propriedades bloqueadas no nível 1

| Propriedade | Motivo |
|---|---|
| `--tmd-max-width` | legibilidade tipográfica, não é estética |
| `--tmd-gap` | consistência estrutural de layout |
| `--tmd-warning` | cor semântica funcional |
| `--tmd-note` | cor semântica funcional |

### Exemplo

```json
{
  "themes": {
    "midnight": {
      "extends": "essay",
      "overrides": {
        "bg":          "#080810",
        "surface":     "#10101a",
        "text":        "#e8e8f0",
        "text-soft":   "#9090a8",
        "accent":      "#a78bfa",
        "border":      "#2a2a3a",
        "font-body":   "Inter, sans-serif",
        "font-heading":"Inter, sans-serif",
        "radius":      "8px"
      }
    }
  }
}
```

### CSS gerado (modo standalone)

```css
[data-theme="midnight"] {
  --tmd-bg:          #080810;
  --tmd-surface:     #10101a;
  --tmd-text:        #e8e8f0;
  --tmd-text-soft:   #9090a8;
  --tmd-accent:      #a78bfa;
  --tmd-border:      #2a2a3a;
  --tmd-font-body:   Inter, sans-serif;
  --tmd-font-heading:Inter, sans-serif;
  --tmd-radius:      8px;
}
```

Propriedades ausentes em `overrides` herdam o valor do tema base declarado em `extends`.

---

## Nível 2 — Propriedades por tipo de bloco

Definido na chave `blocks` do mesmo tema em `.config.tmd.json`. Permite customizar a aparência de blocos individuais sem afetar as variáveis globais.

A whitelist do nível 2 é mais estreita que a do nível 1: apenas propriedades com impacto visual localizado no bloco são permitidas.

### Whitelist do nível 2

| Propriedade | Blocos que aceitam | Tipo |
|---|---|---|
| `border-color` | todos os blocos de conteúdo | cor |
| `bg` | `explainer`, `note`, `warning`, `concept`, `aside` | cor |
| `marker-color` | `timeline` apenas | cor |

### Blocos de conteúdo válidos para `blocks`

```txt
explainer  note  warning  question  takeaway  concept  aside  pullquote  timeline
```

### Propriedades ausentes da whitelist do nível 2 e motivos

| Propriedade | Motivo |
|---|---|
| `text-color` por bloco | risco de acessibilidade; controlado globalmente |
| `font` por bloco | caos tipográfico; controlado globalmente |
| `radius` por bloco | variável global já cobre; granularidade desnecessária |
| `padding`, `margin` | estrutural; fora do escopo de tema |

### Exemplo

```json
{
  "themes": {
    "midnight": {
      "extends": "essay",
      "overrides": {
        "bg":     "#080810",
        "accent": "#a78bfa"
      },
      "blocks": {
        "warning":  { "border-color": "#e07b3a", "bg": "#1f1508" },
        "note":     { "border-color": "#5b8dd9", "bg": "#0d1520" },
        "concept":  { "border-color": "#6dbf8a", "bg": "#0b1a10" },
        "pullquote":{ "border-color": "#a78bfa" },
        "timeline": { "marker-color": "#c8913a" }
      }
    }
  }
}
```

### CSS gerado (modo standalone)

O compilador gera variáveis CSS com escopo por seletor de tema e classe de bloco:

```css
[data-theme="midnight"] .tmd-block-warning {
  --tmd-block-border-color: #e07b3a;
  --tmd-block-bg:           #1f1508;
}

[data-theme="midnight"] .tmd-block-note {
  --tmd-block-border-color: #5b8dd9;
  --tmd-block-bg:           #0d1520;
}

[data-theme="midnight"] .tmd-block-concept {
  --tmd-block-border-color: #6dbf8a;
  --tmd-block-bg:           #0b1a10;
}

[data-theme="midnight"] .tmd-block-pullquote {
  --tmd-block-border-color: #a78bfa;
}

[data-theme="midnight"] .tmd-timeline-marker {
  background: #c8913a;
}
```

### Variáveis CSS de bloco usadas no CSS base

Os blocos de conteúdo devem referenciar as variáveis de bloco quando disponíveis, com fallback para as variáveis globais:

```css
.tmd-block-explainer,
.tmd-block-note,
.tmd-block-warning,
.tmd-block-concept {
  border-left-color: var(--tmd-block-border-color, var(--tmd-accent));
  background:        var(--tmd-block-bg, var(--tmd-surface-soft));
}

.tmd-block-pullquote {
  border-left-color: var(--tmd-block-border-color, var(--tmd-accent));
}

.tmd-timeline-marker {
  background: var(--tmd-block-marker-color, var(--tmd-accent));
}
```

Esse padrão garante que blocos sem `blocks` definidos no tema continuem funcionando corretamente via fallback.

### Tema com apenas `overrides` (nível 2 opcional)

A chave `blocks` é opcional. Um tema válido pode ter apenas `overrides`:

```json
{
  "themes": {
    "simples": {
      "extends": "modern",
      "overrides": {
        "accent": "#e8a045"
      }
    }
  }
}
```

---

## Nível 3 — CSS externo

Para autores que precisam de controle total sobre a apresentação, o compilador suporta injeção de um arquivo CSS externo. Este nível não tem whitelist nem validação de conteúdo.

### Habilitação

O nível 3 requer opt-in explícito no `.config.tmd.json`:

```json
{
  "allowExternalCSS": true
}
```

Sem essa chave, o campo `custom_css` no frontmatter é **ignorado com warning** no output do compilador. Nenhum CSS externo é injetado silenciosamente.

### Uso no frontmatter

Com `allowExternalCSS: true` habilitado no config:

```yaml
---
title: Meu Artigo
author: Fulano
theme: essay
custom_css: ./themes/meu-tema.css
---
```

### Comportamento do compilador

O arquivo referenciado em `custom_css` é injetado como `<link>` adicional **após** o CSS gerado, no modo `standalone`:

```html
<head>
  <link rel="stylesheet" href="./titulo.css" />
  <link rel="stylesheet" href="./themes/meu-tema.css" />
</head>
```

No modo `fragment`, o compilador emite um comentário no HTML indicando que um CSS externo foi referenciado mas não pode ser embutido automaticamente.

### Responsabilidades do autor no nível 3

- compatibilidade com o HTML gerado pelo compilador
- acessibilidade e contraste
- comportamento em múltiplos temas, se aplicável
- qualquer conflito com o CSS base gerado

O compilador não valida, não sanitiza e não reporta erros de CSS externo.

---

## Exemplo completo de `.config.tmd.json`

```json
{
  "defaultCompile": "standalone",
  "allowExternalCSS": false,
  "themes": {
    "midnight": {
      "extends": "essay",
      "overrides": {
        "bg":          "#080810",
        "surface":     "#10101a",
        "text":        "#e8e8f0",
        "text-soft":   "#9090a8",
        "accent":      "#a78bfa",
        "border":      "#2a2a3a",
        "font-body":   "Inter, sans-serif",
        "font-heading":"Inter, sans-serif",
        "radius":      "8px"
      },
      "blocks": {
        "warning":  { "border-color": "#e07b3a", "bg": "#1f1508" },
        "note":     { "border-color": "#5b8dd9", "bg": "#0d1520" },
        "concept":  { "border-color": "#6dbf8a", "bg": "#0b1a10" },
        "pullquote":{ "border-color": "#a78bfa" },
        "timeline": { "marker-color": "#c8913a" }
      }
    },
    "clean": {
      "extends": "modern",
      "overrides": {
        "accent": "#e8a045",
        "radius": "4px"
      }
    }
  }
}
```

---

## Validação pelo compilador

O compilador valida os temas customizados no momento da compilação e emite erros claros.

### Erros fatais (compilação interrompida)

- `extends` ausente ou referenciando tema inexistente
- propriedade em `overrides` fora da whitelist do nível 1
- propriedade em `blocks` fora da whitelist do nível 2
- bloco em `blocks` com nome inválido (fora da lista de tipos reconhecidos)
- valor de cor com formato inválido (não é `hex`, `rgb()` ou `hsl()`)
- valor de `radius` com unidade inválida (não é `px` ou `rem`)

### Warnings (compilação continua)

- `custom_css` no frontmatter com `allowExternalCSS: false` → warning + campo ignorado
- arquivo referenciado em `custom_css` não encontrado → warning + `<link>` omitido
- tema customizado com nome igual a um tema base → warning + tema customizado ignorado

---

# Estrutura global sugerida

## Container principal

```html
<article class="tmd-document">
```

A classe de tema é controlada pelo `data-theme` no `<html>`, não por classe no `article`.

---

## Header do documento

Quando houver frontmatter, os campos podem gerar:

- `kicker` → `.tmd-kicker`
- `title` → `.tmd-title`
- `subtitle` → `.tmd-subtitle`
- `author` → `.tmd-author`

### Exemplo

```html
<header class="tmd-header">
  <p class="tmd-kicker">Ciência &amp; Tecnologia</p>
  <h1 class="tmd-title">O Algoritmo Invisível que Governa o Mundo</h1>
  <p class="tmd-subtitle">Ela não tem nome famoso...</p>
  <p class="tmd-author">Matheus Toddy</p>
</header>
```

### Regra

Campos ausentes não geram elementos vazios.

---

# Markdown comum → HTML

O conteúdo markdown comum pode ser entregue ao renderizador markdown tradicional e inserido no documento com classes de escopo TMD.

Exemplo:

```html
<section class="tmd-markdown">
  <h2>Seção</h2>
  <p>Parágrafo normal.</p>
  <ul>
    <li>Item</li>
  </ul>
  <blockquote>
    <p>Citação simples</p>
  </blockquote>
</section>
```

## Regra recomendada

Cada `MarkdownBlock` pode renderizar como:

```html
<section class="tmd-markdown">
  ...
</section>
```

ou ser mesclado ao fluxo principal quando isso simplificar a saída.

---

# Família 1 — HTML dos blocos de conteúdo

## Convenção geral

Todos os blocos de conteúdo podem usar a base:

```html
<section class="tmd-block tmd-block-{tipo}">
  <h3 class="tmd-block-title">Título opcional</h3>
  <div class="tmd-block-content">
    ...
  </div>
</section>
```

Onde `{tipo}` é:

- explainer
- pullquote
- aside
- note
- warning
- question
- takeaway
- concept
- timeline

### Regra

- se não houver título, o `<h3>` não deve ser renderizado
- o conteúdo interno vira HTML via parser de markdown comum, exceto quando o bloco exigir estrutura própria

---

## `!` Explainer

### HTML sugerido

```html
<section class="tmd-block tmd-block-explainer">
  <h3 class="tmd-block-title">O que é FFT?</h3>
  <div class="tmd-block-content">
    <p>FFT é um método eficiente para calcular transformadas discretas.</p>
  </div>
</section>
```

### CSS sugerido

- fundo suavemente contrastante
- borda lateral destacada
- padding interno confortável
- cantos arredondados moderados

---

## `@` Pullquote

### HTML sugerido

Com autor:

```html
<figure class="tmd-block tmd-block-pullquote">
  <blockquote class="tmd-pullquote-text">
    <p>"O algoritmo numérico mais importante de nossa vida."</p>
  </blockquote>
  <figcaption class="tmd-pullquote-author">Gilbert Strang</figcaption>
</figure>
```

Sem autor (válido):

```html
<figure class="tmd-block tmd-block-pullquote">
  <blockquote class="tmd-pullquote-text">
    <p>"O melhor texto-fonte é o que continua legível mesmo antes da renderização."</p>
  </blockquote>
</figure>
```

### Observação

Pullquote não usa o wrapper padrão com `.tmd-block-content`. A estrutura `figure` + `blockquote` + `figcaption` é mais semântica.

### CSS sugerido

- tipografia maior
- itálico opcional
- borda lateral
- autor em corpo menor e caixa alta opcional

---

## `$` Aside

### HTML sugerido

```html
<aside class="tmd-block tmd-block-aside">
  <div class="tmd-block-content">
    <p>Gauss chegou perto disso muito antes do século XX.</p>
  </div>
</aside>
```

### CSS sugerido

- tom mais discreto que `note`
- borda tracejada opcional
- contraste menor que warning/note

---

## `#` Note

### HTML sugerido

```html
<section class="tmd-block tmd-block-note">
  <h3 class="tmd-block-title">Nota</h3>
  <div class="tmd-block-content">
    <p>A implementação prática depende de discretização.</p>
  </div>
</section>
```

### CSS sugerido

- fundo levemente colorido
- borda lateral visível
- tom informativo, não alarmista

---

## `##` Warning

### HTML sugerido

```html
<section class="tmd-block tmd-block-warning">
  <h3 class="tmd-block-title">Aviso</h3>
  <div class="tmd-block-content">
    <p>FFT não substitui Fourier; apenas acelera o cálculo.</p>
  </div>
</section>
```

### CSS sugerido

- contraste maior
- tom visual de alerta
- borda mais forte

---

## `?` Question

### HTML sugerido

```html
<section class="tmd-block tmd-block-question">
  <div class="tmd-block-content">
    <p>Por que certas ideias corretas demoram tanto a mudar o mundo?</p>
  </div>
</section>
```

### CSS sugerido

- tipografia destacada
- pode usar serif/itálico
- mais leve que warning, mais enfático que texto comum

---

## `+` Takeaway

### HTML sugerido

```html
<section class="tmd-block tmd-block-takeaway">
  <div class="tmd-block-content">
    <p>A computação tornou a teoria historicamente útil.</p>
  </div>
</section>
```

### CSS sugerido

- bloco compacto
- sensação de síntese
- bom contraste
- pode usar rótulo visual implícito no CSS

---

## `&` Concept

### HTML sugerido

```html
<section class="tmd-block tmd-block-concept">
  <h3 class="tmd-block-title">Domínio da frequência</h3>
  <div class="tmd-block-content">
    <p>Representação por frequências componentes.</p>
  </div>
</section>
```

### CSS sugerido

- aparência de cartão conceitual
- forte separação entre termo e definição

---

## `~~` Timeline

Timeline exige estrutura própria.

### HTML sugerido

```html
<section class="tmd-block tmd-block-timeline">
  <h3 class="tmd-block-title">Linha do tempo</h3>
  <div class="tmd-timeline">
    <div class="tmd-timeline-item">
      <div class="tmd-timeline-marker"></div>
      <div class="tmd-timeline-content">
        <p class="tmd-timeline-event">1805 — Gauss formula algo equivalente</p>
      </div>
    </div>

    <div class="tmd-timeline-item tmd-timeline-item-markdown">
      <div class="tmd-timeline-marker"></div>
      <div class="tmd-timeline-content">
        <p>Texto intermediário em markdown normal.</p>
      </div>
    </div>

    <div class="tmd-timeline-item">
      <div class="tmd-timeline-marker"></div>
      <div class="tmd-timeline-content">
        <p class="tmd-timeline-event">1965 — Cooley e Tukey publicam FFT</p>
      </div>
    </div>
  </div>
</section>
```

### Regra visual

- a linha vertical da timeline deve parecer contínua
- eventos ganham marcador próprio
- conteúdo markdown intermediário aparece recuado
- o markdown intermediário continua ligado visualmente à linha

---

# Bloco de erro

Nós `ErrorBlock` da AST renderizam como um container visual de erro.

### HTML sugerido

```html
<div class="tmd-error-block">
  <span class="tmd-error-marker">--ERROR BLOC--</span>
  <pre class="tmd-error-raw">|>@ texto sem aspas
- autor</pre>
  <span class="tmd-error-marker">--ERROR BLOC--</span>
</div>
```

### CSS sugerido

```css
.tmd-error-block {
  background: rgba(180, 40, 40, 0.15);
  border: 1px solid rgba(180, 40, 40, 0.4);
  border-radius: 6px;
  padding: 1rem 1.2rem;
  margin: 1.5rem 0;
}

.tmd-error-marker {
  display: block;
  font-family: monospace;
  font-size: 0.75rem;
  color: rgba(220, 80, 80, 0.8);
  letter-spacing: 0.1em;
}

.tmd-error-raw {
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.88rem;
  color: inherit;
  white-space: pre-wrap;
}
```

---

## Bloco de erro de imagem

Quando uma imagem referenciada não é encontrada no sistema de arquivos, o compilador substitui o elemento `<img>` por um bloco de erro visual no lugar exato onde a imagem apareceria.

### HTML sugerido

```html
<div class="tmd-error-block tmd-error-block-image">
  <span class="tmd-error-marker">--ERROR BLOC--</span>
  <pre class="tmd-error-raw">./img/gauss.jpg</pre>
  <span class="tmd-error-marker">--ERROR BLOC--</span>
</div>
```

### CSS sugerido

Herda o mesmo estilo de `.tmd-error-block` já definido. A classe adicional `.tmd-error-block-image` permite customização específica se necessário — por exemplo, dimensionar o placeholder para ocupar o espaço que a imagem ocuparia.

```css
.tmd-error-block-image {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

---

Os blocos de imagem geram estrutura diferente dos blocos de conteúdo.

Eles possuem:

- modo de posicionamento
- título opcional do bloco
- imagem obrigatória
- legenda obrigatória
- conteúdo markdown interno

## Modos e classes correspondentes

```txt
*>        → .tmd-media-block  .tmd-media-block-right
*>wrap    → .tmd-media-wrap   .tmd-media-wrap-right
*<        → .tmd-media-block  .tmd-media-block-left
*<wrap    → .tmd-media-wrap   .tmd-media-wrap-left
```

## Modo sem abraço (`*>` e `*<`)

### HTML sugerido

```html
<section class="tmd-media-block tmd-media-block-right">
  <h3 class="tmd-block-title">Gauss</h3>
  <div class="tmd-media-block-inner">
    <div class="tmd-media-content">
      <p>Gauss desenvolveu técnicas matemáticas extraordinárias.</p>
    </div>
    <figure class="tmd-media-figure">
      <img src="./img/gauss.jpg" alt="Retrato de Gauss" class="tmd-media-image" />
      <figcaption class="tmd-media-caption">Retrato de Gauss</figcaption>
    </figure>
  </div>
</section>
```

Para `*<`, trocar classe por `tmd-media-block-left` e inverter a ordem dos filhos do grid.

## Modo com abraço (`*>wrap` e `*<wrap`)

### HTML sugerido

```html
<section class="tmd-media-wrap tmd-media-wrap-right">
  <h3 class="tmd-block-title">Gauss</h3>
  <figure class="tmd-media-figure tmd-media-float-right">
    <img src="./img/gauss.jpg" alt="Retrato de Gauss" class="tmd-media-image" />
    <figcaption class="tmd-media-caption">Retrato de Gauss</figcaption>
  </figure>
  <div class="tmd-media-content">
    <p>Gauss desenvolveu técnicas extraordinárias muito antes da computação moderna.</p>
  </div>
  <div class="tmd-clearfix"></div>
</section>
```

Para `*<wrap`, trocar para `tmd-media-wrap-left` e `tmd-media-float-left`.

---

# Mapeamento AST → classes HTML

## Blocos de conteúdo

- `ExplainerBlock`  → `.tmd-block-explainer`
- `PullQuoteBlock`  → `.tmd-block-pullquote`
- `AsideBlock`      → `.tmd-block-aside`
- `NoteBlock`       → `.tmd-block-note`
- `WarningBlock`    → `.tmd-block-warning`
- `QuestionBlock`   → `.tmd-block-question`
- `TakeawayBlock`   → `.tmd-block-takeaway`
- `ConceptBlock`    → `.tmd-block-concept`
- `TimelineBlock`   → `.tmd-block-timeline`
- `ErrorBlock`      → `.tmd-error-block`

## Blocos de imagem

- `ImageBlock(mode="*>")`     → `.tmd-media-block.tmd-media-block-right`
- `ImageBlock(mode="*<")`     → `.tmd-media-block.tmd-media-block-left`
- `ImageBlock(mode="*>wrap")` → `.tmd-media-wrap.tmd-media-wrap-right`
- `ImageBlock(mode="*<wrap")` → `.tmd-media-wrap.tmd-media-wrap-left`

---

# CSS base sugerido

## Variáveis (tema essay — padrão)

```css
[data-theme="essay"] {
  --tmd-max-width:   760px;
  --tmd-text:        #f5f1e8;
  --tmd-text-soft:   #b6aea3;
  --tmd-bg:          #121212;
  --tmd-surface:     #1b1b1b;
  --tmd-surface-soft:#202020;
  --tmd-border:      #353535;
  --tmd-accent:      #8c7b68;
  --tmd-warning:     #8a5a5a;
  --tmd-note:        #5f738d;
  --tmd-radius:      16px;
  --tmd-gap:         1.25rem;
  --tmd-font-body:   'Lora', Georgia, serif;
  --tmd-font-heading:'Playfair Display', Georgia, serif;
}
```

---

## Documento

```css
body {
  margin: 0;
  background: var(--tmd-bg);
  color: var(--tmd-text);
  font-family: var(--tmd-font-body);
  line-height: 1.85;
}

.tmd-document {
  max-width: var(--tmd-max-width);
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}
```

---

## Site header e switcher

```css
.tmd-site-header {
  background: var(--tmd-bg);
  border-bottom: 1px solid var(--tmd-border);
  padding: 0.75rem clamp(1rem, 4vw, 2rem);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tmd-theme-switcher {
  display: flex;
  gap: 0.4rem;
}

.tmd-theme-btn {
  font-size: 0.7rem;
  font-family: var(--tmd-font-body);
  letter-spacing: 0.1em;
  text-transform: lowercase;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid var(--tmd-border);
  background: transparent;
  color: var(--tmd-text-soft);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tmd-theme-btn:hover,
.tmd-theme-btn[data-active] {
  color: var(--tmd-accent);
  border-color: var(--tmd-accent);
}
```

---

## Header

```css
.tmd-header {
  margin-bottom: 2.5rem;
}

.tmd-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--tmd-text-soft);
}

.tmd-title {
  font-family: var(--tmd-font-heading);
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.1;
  margin: 0.4rem 0;
}

.tmd-subtitle {
  color: var(--tmd-text-soft);
  font-style: italic;
  margin: 0 0 1rem;
}

.tmd-author {
  color: var(--tmd-text-soft);
  font-size: 0.95rem;
}
```

---

## Blocos genéricos

```css
.tmd-block {
  margin: 1.75rem 0;
}

.tmd-block-title {
  margin: 0 0 0.8rem;
  font-size: 1.2rem;
}

.tmd-block-content {
  line-height: 1.8;
}
```

---

## Explainer / Note / Warning / Concept

```css
.tmd-block-explainer,
.tmd-block-note,
.tmd-block-warning,
.tmd-block-concept {
  padding: 1rem 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
  border-radius: 0 var(--tmd-radius) var(--tmd-radius) 0;
  background: var(--tmd-block-bg, var(--tmd-surface-soft));
}

.tmd-block-note {
  border-left-color: var(--tmd-block-border-color, var(--tmd-note));
}

.tmd-block-warning {
  border-left-color: var(--tmd-block-border-color, var(--tmd-warning));
}
```

---

## Pullquote

```css
.tmd-block-pullquote {
  margin: 2.5rem 0;
  padding-left: 1.2rem;
  border-left: 3px solid var(--tmd-block-border-color, var(--tmd-accent));
}

.tmd-pullquote-text {
  margin: 0;
  font-family: var(--tmd-font-heading);
  font-size: 1.35rem;
  font-style: italic;
}

.tmd-pullquote-author {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--tmd-text-soft);
}
```

---

## Timeline

```css
.tmd-timeline {
  position: relative;
  padding-left: 1.4rem;
}

.tmd-timeline::before {
  content: "";
  position: absolute;
  left: 0.35rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--tmd-border);
}

.tmd-timeline-item {
  position: relative;
  margin-bottom: 1rem;
}

.tmd-timeline-marker {
  position: absolute;
  left: -1.05rem;
  top: 0.45rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--tmd-block-marker-color, var(--tmd-accent));
}

.tmd-timeline-content {
  padding-left: 0.75rem;
}
```

---

## Blocos de imagem sem abraço

```css
.tmd-media-block-inner {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 260px);
  gap: var(--tmd-gap);
  align-items: start;
}

.tmd-media-block-left .tmd-media-block-inner {
  grid-template-columns: minmax(180px, 260px) 1fr;
}
```

---

## Blocos de imagem com abraço

```css
.tmd-media-float-right {
  float: right;
  margin: 0 0 1rem 1rem;
  width: min(260px, 42%);
}

.tmd-media-float-left {
  float: left;
  margin: 0 1rem 1rem 0;
  width: min(260px, 42%);
}

.tmd-clearfix {
  clear: both;
}
```

---

## Figure e imagem

```css
.tmd-media-figure {
  margin: 0;
}

.tmd-media-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.tmd-media-caption {
  margin-top: 0.45rem;
  font-size: 0.82rem;
  color: var(--tmd-text-soft);
}
```

---

# Responsividade

## Regra geral

Em telas estreitas, blocos laterais devem colapsar para empilhamento vertical.

```css
@media (max-width: 720px) {
  .tmd-media-block-inner {
    grid-template-columns: 1fr !important;
  }

  .tmd-media-float-right,
  .tmd-media-float-left {
    float: none;
    width: 100%;
    margin: 0 0 1rem 0;
  }
}
```

### Efeito esperado

- imagem passa a ficar acima do texto
- legenda permanece abaixo da imagem
- título do bloco continua acima do conjunto

---

# Placeholders e imagens inválidas

Se a imagem for inválida ou ausente no ambiente de saída, o HTML ainda pode ser gerado.

## Estratégias possíveis

1. manter `<img>` normal e deixar o navegador lidar com falha
2. substituir por placeholder visual
3. adicionar classe de erro

Exemplo:

```html
<figure class="tmd-media-figure tmd-media-figure-missing">
  <div class="tmd-media-placeholder">Imagem indisponível</div>
  <figcaption class="tmd-media-caption">Retrato de Gauss</figcaption>
</figure>
```

---

# Acessibilidade

## Regras mínimas

- sempre gerar `alt` no `<img>`
- usar `figure` + `figcaption` para imagem com legenda
- não usar heading vazio
- preservar ordem lógica do conteúdo
- não depender só de cor para hierarquia semântica
- garantir contraste suficiente no tema

---

# Exemplo completo

## Entrada AST resumida

```json
{
  "type": "Document",
  "frontmatter": {
    "title": "Fourier",
    "subtitle": "Matemática invisível",
    "author": "Matheus Toddy",
    "theme": "midnight"
  },
  "children": [
    {
      "type": "ExplainerBlock",
      "title": "O que é FFT?",
      "content": [
        { "type": "MarkdownBlock", "raw": "FFT é um método eficiente." }
      ]
    },
    {
      "type": "ImageBlock",
      "mode": "*>",
      "title": "Gauss",
      "caption": "Retrato de Gauss",
      "src": "./img/gauss.jpg",
      "content": [
        { "type": "MarkdownBlock", "raw": "Gauss desenvolveu técnicas extraordinárias." }
      ]
    }
  ]
}
```

## Saída HTML esperada

```html
<html data-theme="midnight">
...
<article class="tmd-document">
  <header class="tmd-header">
    <h1 class="tmd-title">Fourier</h1>
    <p class="tmd-subtitle">Matemática invisível</p>
    <p class="tmd-author">Matheus Toddy</p>
  </header>

  <main class="tmd-body">
    <section class="tmd-block tmd-block-explainer">
      <h3 class="tmd-block-title">O que é FFT?</h3>
      <div class="tmd-block-content">
        <p>FFT é um método eficiente.</p>
      </div>
    </section>

    <section class="tmd-media-block tmd-media-block-right">
      <h3 class="tmd-block-title">Gauss</h3>
      <div class="tmd-media-block-inner">
        <div class="tmd-media-content">
          <p>Gauss desenvolveu técnicas extraordinárias.</p>
        </div>
        <figure class="tmd-media-figure">
          <img src="./img/gauss.jpg" alt="Retrato de Gauss" class="tmd-media-image" />
          <figcaption class="tmd-media-caption">Retrato de Gauss</figcaption>
        </figure>
      </div>
    </section>
  </main>
</article>
```

## CSS gerado para o tema `midnight` (trecho relevante)

```css
[data-theme="midnight"] {
  --tmd-bg:          #080810;
  --tmd-surface:     #10101a;
  --tmd-text:        #e8e8f0;
  --tmd-text-soft:   #9090a8;
  --tmd-accent:      #a78bfa;
  --tmd-border:      #2a2a3a;
  --tmd-font-body:   Inter, sans-serif;
  --tmd-font-heading:Inter, sans-serif;
  --tmd-radius:      8px;
}

[data-theme="midnight"] .tmd-block-explainer {
  --tmd-block-border-color: #a78bfa;
  --tmd-block-bg:           #10101a;
}
```

---

# Princípio de projeto do tema HTML/CSS

A camada visual de ToddyMarkDown deve:

- respeitar a semântica da AST
- manter separação entre estrutura e estilo
- evitar HTML ornamental demais
- favorecer legibilidade longa
- permitir múltiplos temas sem mudar o parser
- expor customização progressiva sem expor complexidade desnecessária

Em termos menos solenes: o HTML precisa servir ao texto, não tentar roubar a cena como um pavão de framework.

---

# Changelog

## v1.5
- Sistema de customização em níveis documentado: Nível 0, 1, 2 e 3
- Nível 1 (`overrides`): whitelist de 9 variáveis globais com tipos e restrições de valor explicitados; propriedades bloqueadas documentadas com motivos
- Nível 2 (`blocks`): whitelist de propriedades por tipo de bloco (`border-color`, `bg`, `marker-color`); CSS gerado documentado com padrão de fallback via `var(--tmd-block-*, var(--tmd-*))
- Nível 3 (CSS externo): opt-in explícito via `allowExternalCSS: true` no config; comportamento em modo `standalone` e `fragment` documentados
- Variáveis CSS de bloco (`--tmd-block-border-color`, `--tmd-block-bg`, `--tmd-block-marker-color`) adicionadas ao CSS base com fallback para variáveis globais
- Seção de validação adicionada: erros fatais e warnings distinguidos
- Exemplo completo atualizado para uso de tema customizado (`midnight`) com CSS gerado correspondente
- Exemplo de `.config.tmd.json` completo com dois temas (`midnight` e `clean`)

## v1.4
- Bloco de erro de imagem adicionado: HTML e CSS para imagem não encontrada, com classe `.tmd-error-block-image`
- Bloco aparece no lugar exato onde a imagem estaria no documento

## v1.3
- Comportamento de saída atualizado: compilador sempre gera dois arquivos `title.html` + `title.css`
- Modo `standalone` e modo `fragment` documentados com HTML mínimo para cada um
- Diferença de escopo CSS entre modos documentada: `[data-theme]` vs `.tmd-theme-{nome}`
- Seção de temas customizados via `.config.tmd.json` adicionada
- HTML mínimo reestruturado em dois exemplos separados por modo

## v1.2
- Comportamento de saída do compilador documentado: HTML único com 4 temas, `data-theme`, `localStorage`
- Quatro temas definidos: `essay`, `ink`, `modern`, `amber` — com personalidades e variáveis mínimas
- Seção de temas anterior (docs, notes) substituída pelos temas reais
- HTML mínimo atualizado: `data-theme` no `<html>`, switcher no header, script de persistência
- Switcher documentado: adaptativo via variáveis CSS do tema ativo
- `ErrorBlock` adicionado: HTML, CSS e comportamento visual com `--ERROR BLOC--`
- Mapeamento AST → classes atualizado para nova sintaxe de imagem (`*>`, `*>wrap`, `*<`, `*<wrap`)
- HTML dos blocos de imagem atualizado para novos nomes de modo
- `PullQuoteBlock` sem autor: `figcaption` omitido quando `author` é `null`
- Variáveis CSS base reorganizadas por tema via `[data-theme]` em vez de `:root`

## v1.1
- Versão inicial
