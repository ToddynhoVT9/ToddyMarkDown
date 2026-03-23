# prompt06 — Compilador: gerador de CSS e temas

## Depende de
`prompt01.md` — `ResolvedConfig`, `TMDConfigTheme`.
`prompt05.md` — `resolveConfig` funcionando.

---

## Objetivo

Implementar os 4 temas base como constantes internas do compilador e o gerador de CSS com suporte a modo `standalone`/`fragment` e temas customizados.

---

## Não fazer

- Não ler arquivos no `css-generator` — receber tudo por parâmetro
- Não duplicar variáveis CSS entre `themes.ts` e qualquer outro arquivo
- Não reexportar os temas como configuração editável pelo usuário — eles são internos
- Não colocar lógica de resolução de hierarquia aqui — isso ficou no `config-resolver`

---

## `src/compiler/themes.ts`

Os 4 temas base são **internos ao compilador**. O usuário não os configura — o `.config.tmd.json` só adiciona temas por cima deles.

```typescript
export interface ThemeVars {
  '--tmd-bg':           string;
  '--tmd-surface':      string;
  '--tmd-surface-soft': string;
  '--tmd-text':         string;
  '--tmd-text-soft':    string;
  '--tmd-border':       string;
  '--tmd-accent':       string;
  '--tmd-warning':      string;
  '--tmd-note':         string;
  '--tmd-radius':       string;
  '--tmd-gap':          string;
  '--tmd-font-body':    string;
  '--tmd-font-heading': string;
  '--tmd-max-width':    string;
  [key: string]: string;
}

export const BASE_THEMES: Record<string, ThemeVars> = {
  essay: { /* valores da html-theme-spec v1.5 */ },
  ink:   { /* valores da html-theme-spec v1.5 */ },
  modern:{ /* valores da html-theme-spec v1.5 */ },
  amber: { /* valores da html-theme-spec v1.5 */ },
};

// Mapeamento das chaves curtas do nível 1 para vars CSS completas
export const OVERRIDE_KEY_MAP: Record<string, string> = {
  'bg':           '--tmd-bg',
  'surface':      '--tmd-surface',
  'text':         '--tmd-text',
  'text-soft':    '--tmd-text-soft',
  'accent':       '--tmd-accent',
  'border':       '--tmd-border',
  'font-body':    '--tmd-font-body',
  'font-heading': '--tmd-font-heading',
  'radius':       '--tmd-radius',
};

// Resolve variáveis globais (nível 1) de um tema customizado
export function resolveThemeVars(
  themeName:    string,
  customThemes: Record<string, TMDConfigTheme>
): ThemeVars
// Se themeName é base → retorna BASE_THEMES[themeName]
// Se themeName é customizado → herda tudo do BASE_THEMES[extends] + aplica overrides via OVERRIDE_KEY_MAP
// Se themeName desconhecido → retorna BASE_THEMES['essay'] (fallback seguro)
// Chaves em overrides que não estão em OVERRIDE_KEY_MAP são ignoradas silenciosamente
// (validação de chaves é responsabilidade do config-loader)
```

Fontes Google por tema (para emitir `@import` correto):
```
essay:  Playfair Display, Lora
ink:    Playfair Display, Libre Baskerville, DM Sans
modern: IBM Plex Sans, IBM Plex Mono
amber:  Cormorant Garamond, Cormorant, Raleway
```

---

## `src/compiler/css-generator.ts`

```typescript
import type { ResolvedConfig } from '../types/index.js';

export interface CSSGeneratorOptions {
  resolvedConfig: ResolvedConfig;
}

export function generateCSS(options: CSSGeneratorOptions): string
```

### Estrutura do CSS gerado (nesta ordem)

1. `@import` Google Fonts para os temas presentes
2. Reset e base (`*, body, etc.`)
3. Bloco de variáveis globais para cada tema — nível 1 (base + customizados)
4. Blocos de variáveis por tipo de bloco para temas customizados — nível 2 (`blocks`)
5. CSS estrutural de todos os componentes usando `var()`
6. `@media (max-width: 720px)` para responsividade

### Seletor raiz por modo (da spec)

```typescript
function themeSelector(name: string, mode: 'standalone' | 'fragment'): string {
  return mode === 'standalone'
    ? `[data-theme="${name}"]`
    : `.tmd-theme-${name}`;
}
```

### Geração do CSS de nível 2 (blocos por tema)

Para cada tema customizado que tiver `blocks` definido, gerar blocos CSS adicionais **após** o bloco de variáveis globais do tema:

```css
/* Exemplo para tema "midnight" com blocks definidos */
[data-theme="midnight"] .tmd-block-warning {
  --tmd-block-border-color: #e07b3a;
  --tmd-block-bg:           #1f1508;
}

[data-theme="midnight"] .tmd-block-note {
  --tmd-block-border-color: #5b8dd9;
  --tmd-block-bg:           #0d1520;
}

[data-theme="midnight"] .tmd-block-pullquote {
  --tmd-block-border-color: #a78bfa;
}

[data-theme="midnight"] .tmd-timeline-marker {
  background: #c8913a;
}
```

Regras de geração do nível 2:
- `marker-color` em `timeline` → regra direta `background:` em `.tmd-timeline-marker` (não é var CSS)
- `border-color` → `--tmd-block-border-color` no seletor `.tmd-block-{tipo}`
- `bg` → `--tmd-block-bg` no seletor `.tmd-block-{tipo}`
- Bloco `timeline` com `border-color` ou `bg` → ignorado (timeline não tem fundo/borda lateral)
- Bloco `pullquote` com `bg` → ignorado (pullquote não tem fundo)

### Componentes CSS a incluir (da html-theme-spec v1.5)

- `.tmd-site-header`, `.tmd-theme-switcher`, `.tmd-theme-btn` — **apenas modo standalone**
- `.tmd-document`, `.tmd-body`, `.tmd-header`
- `.tmd-kicker`, `.tmd-title`, `.tmd-subtitle`, `.tmd-author`
- `.tmd-markdown`
- `.tmd-block` (base), `.tmd-block-title`, `.tmd-block-content`
- `.tmd-block-explainer`, `.tmd-block-note`, `.tmd-block-warning`, `.tmd-block-concept` — usar padrão de fallback:
  ```css
  border-left-color: var(--tmd-block-border-color, var(--tmd-accent));
  background:        var(--tmd-block-bg, var(--tmd-surface-soft));
  ```
- `.tmd-block-aside`, `.tmd-block-question`, `.tmd-block-takeaway`
- `.tmd-block-pullquote`, `.tmd-pullquote-text`, `.tmd-pullquote-author` — usar fallback:
  ```css
  border-left-color: var(--tmd-block-border-color, var(--tmd-accent));
  ```
- `.tmd-timeline` e filhos — `.tmd-timeline-marker` usa:
  ```css
  background: var(--tmd-block-marker-color, var(--tmd-accent));
  ```
- `.tmd-error-block`, `.tmd-error-marker`, `.tmd-error-raw`, `.tmd-error-block-image`
- `.tmd-media-block`, `.tmd-media-wrap`, `.tmd-media-block-inner`
- `.tmd-media-float-right`, `.tmd-media-float-left`, `.tmd-clearfix`
- `.tmd-media-figure`, `.tmd-media-image`, `.tmd-media-caption`

---

## Testes

### `tests/compiler/themes.test.ts`

```typescript
describe('resolveThemeVars', () => {
  it('retorna vars corretas para os 4 temas base', ...)
  it('tema customizado herda todas as vars do extends', ...)
  it('tema customizado com overrides sobrescreve apenas as vars mapeadas', ...)
  it('chave em overrides não presente em OVERRIDE_KEY_MAP é ignorada', ...)
  it('tema desconhecido → fallback para essay', ...)
})
```

### `tests/compiler/css-generator.test.ts`

```typescript
describe('generateCSS — standalone', () => {
  it('[data-theme="essay"] presente para tema essay', ...)
  it('[data-theme] presente para todos os 4 temas base', ...)
  it('[data-theme="midnight"] presente para tema customizado', ...)
  it('tema customizado herda vars do base no CSS gerado', ...)
  it('tema customizado sobrescreve via overrides no CSS gerado', ...)
  it('inclui .tmd-theme-btn', ...)
  it('@import correto para as fontes do tema ativo', ...)
  // nível 2 — blocks
  it('tema com blocks.warning gera [data-theme="x"] .tmd-block-warning com --tmd-block-border-color', ...)
  it('tema com blocks.timeline gera .tmd-timeline-marker com background direto', ...)
  it('blocks.pullquote com bg → ignorado no CSS gerado (pullquote não tem fundo)', ...)
  it('blocks.timeline com bg → ignorado no CSS gerado (timeline não tem fundo)', ...)
  // CSS base
  it('.tmd-block-warning usa var(--tmd-block-border-color, var(--tmd-warning)) no CSS base', ...)
  it('.tmd-timeline-marker usa var(--tmd-block-marker-color, var(--tmd-accent)) no CSS base', ...)
})

describe('generateCSS — fragment', () => {
  it('.tmd-theme-essay em vez de [data-theme="essay"]', ...)
  it('não contém .tmd-theme-btn', ...)
  it('não contém .tmd-site-header', ...)
  it('tema com blocks gera .tmd-theme-x .tmd-block-warning no modo fragment', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–06 passam
- CSS gerado usa `var(--tmd-*)` em todos os valores visuais
- Modo standalone e fragment produzem seletores diferentes para os mesmos temas
- Temas customizados herdam corretamente via `extends`
- `css-generator` não faz I/O
- CSS base dos blocos usa padrão `var(--tmd-block-*, var(--tmd-*))` para fallback correto

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: nenhum
Interfaces públicas novas: ThemeVars, CSSGeneratorOptions, resolveThemeVars, OVERRIDE_KEY_MAP
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: assets e orquestração geral
```
