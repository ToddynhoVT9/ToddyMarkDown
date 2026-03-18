# ToddyMarkDown (`.tmd`) — tmd-html-theme-spec v1.4

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
5. tema CSS (4 temas embutidos)
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

### Temas customizados via `.config.tmd.json`

Além dos quatro temas base, o compilador carrega temas customizados definidos no `.config.tmd.json` na raiz do projeto.

Temas customizados são do **nível 1**: só sobrescrevem variáveis CSS do tema base declarado em `extends`. A estrutura HTML permanece idêntica.

No modo `standalone`, os temas customizados são adicionados ao `.css` como blocos `[data-theme]` adicionais. No modo `fragment`, como blocos `.tmd-theme-{nome}` adicionais.

Exemplo de tema customizado no CSS gerado (modo standalone):

```css
[data-theme="midnight"] {
  /* herda todas as vars de essay */
  --tmd-bg:        #080810;
  --tmd-accent:    #a78bfa;
  --tmd-text:      #e8e8f0;
  --tmd-font-body: 'Inter', sans-serif;
}
```

Cada tema deve definir ao menos:

```css
--tmd-bg
--tmd-surface
--tmd-text
--tmd-text-soft
--tmd-border
--tmd-accent
--tmd-font-body
--tmd-font-heading
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

## Estrutura global sugerida

### Container principal

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
  border-left: 3px solid var(--tmd-accent);
  border-radius: 0 var(--tmd-radius) var(--tmd-radius) 0;
  background: var(--tmd-surface-soft);
}

.tmd-block-note {
  border-left-color: var(--tmd-note);
}

.tmd-block-warning {
  border-left-color: var(--tmd-warning);
}
```

---

## Pullquote

```css
.tmd-block-pullquote {
  margin: 2.5rem 0;
  padding-left: 1.2rem;
  border-left: 3px solid var(--tmd-accent);
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
  background: var(--tmd-accent);
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
    "theme": "essay"
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
<html data-theme="essay">
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

---

# Princípio de projeto do tema HTML/CSS

A camada visual de ToddyMarkDown deve:

- respeitar a semântica da AST
- manter separação entre estrutura e estilo
- evitar HTML ornamental demais
- favorecer legibilidade longa
- permitir múltiplos temas sem mudar o parser

Em termos menos solenes: o HTML precisa servir ao texto, não tentar roubar a cena como um pavão de framework.

---

# Changelog

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
