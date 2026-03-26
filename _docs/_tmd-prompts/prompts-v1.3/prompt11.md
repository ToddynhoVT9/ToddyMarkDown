# prompt11 — Testes de integração

## Depende de
`prompt09.md` — compilador e CLI completos.

---

## Objetivo

Criar testes end-to-end que exercitam o fluxo completo contra fixtures reais em disco, verificando os arquivos de saída. Cobrir todos os comportamentos críticos das specs.

---

## Não fazer

- Não testar internos do parser ou do renderer — usar apenas a API pública `compile()`
- Não testar a CLI diretamente (spawning de processos) neste prompt — focar em `compile()`
- Não deixar arquivos temporários em disco após os testes — usar `beforeEach`/`afterEach` para cleanup

---

## Utilitário `tests/helpers/test-utils.ts`

```typescript
import { compile }     from '../../src/compiler/index.js';
import { loadConfig }  from '../../src/compiler/config-loader.js';
import { EMPTY_CONFIG } from '../../src/compiler/config-loader.js';
import fs   from 'fs';
import path from 'path';
import os   from 'os';

export async function compileFixture(
  fixturePath:  string,
  configOverride?: Partial<TMDConfig>
) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmd-test-'));
  const config = { ...EMPTY_CONFIG, ...configOverride };

  const result = await compile({
    tmdPath: path.resolve(fixturePath),
    outDir:  tmpDir,
    config,
  });

  const html = result.htmlPath ? fs.readFileSync(result.htmlPath, 'utf-8') : '';
  const css  = result.cssPath  ? fs.readFileSync(result.cssPath,  'utf-8') : '';

  return { result, html, css, tmpDir };
}

export function cleanup(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
```

---

## Fixtures adicionais a criar

### `fixtures/valid/essay-completo.tmd`

Documento com todos os recursos: frontmatter completo, todos os 9 tokens de conteúdo, todos os 4 modos de imagem, markdown com headings/listas/código, bloco literal, escape.

### `fixtures/valid/sem-frontmatter.tmd`

Arquivo sem `---` — testa fallbacks completos de tema e compile.

### `fixtures/valid/fragment.tmd`

```tmd
---
title: Artigo Fragment
compile: fragment
theme: modern
---
Conteúdo.
|>! [Nota]
Explainer.
<|
```

### `fixtures/valid/tema-custom/artigo.tmd`

```tmd
---
title: Artigo Tema Custom
---
Texto.
```

### `fixtures/valid/tema-custom/.config.tmd.json` (não é um .tmd, é um config)

```json
{
  "defaultTheme": "midnight",
  "defaultCompile": "standalone",
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
        "timeline": { "marker-color": "#c8913a" }
      }
    }
  }
}
```

### `fixtures/valid/custom-css.tmd`

```tmd
---
title: Artigo com CSS Externo
theme: essay
custom_css: ./extra.css
---
Texto.
```

(Não há `./extra.css` em disco — usado para testar o warning de arquivo não encontrado.)

---

## `tests/integration/compile-standalone.test.ts`

```typescript
describe('compile standalone', () => {
  it('gera slug.html e slug.css em outDir/slug/', ...)
  it('HTML começa com <!DOCTYPE html>', ...)
  it('HTML tem data-theme igual ao tema resolvido', ...)
  it('HTML tem switcher com 4 botões', ...)
  it('HTML tem script de localStorage', ...)
  it('CSS tem [data-theme="essay"]', ...)
  it('CSS tem [data-theme] para todos os 4 temas base', ...)
  it('frontmatter.kicker aparece como .tmd-kicker', ...)
  it('campo ausente não gera elemento vazio no HTML', ...)
  it('essay-completo.tmd: diagnostics vazio', ...)
  it('sem-frontmatter.tmd: usa nome do arquivo como slug', ...)
  it('sem-frontmatter.tmd: tema padrão = essay', ...)
})
```

---

## `tests/integration/compile-fragment.test.ts`

```typescript
describe('compile fragment', () => {
  it('HTML não começa com <!DOCTYPE', ...)
  it('HTML começa com <article class="tmd-document tmd-theme-modern">', ...)
  it('HTML não contém .tmd-site-header', ...)
  it('HTML não contém localStorage', ...)
  it('CSS usa .tmd-theme-modern em vez de [data-theme="modern"]', ...)
  it('CSS não contém .tmd-theme-btn', ...)
})
```

---

## `tests/integration/compile-errors.test.ts`

```typescript
describe('compile com erros', () => {
  it('pullquote-sem-citacao: HTML gerado com ErrorBlock', ...)
  it('HTML do ErrorBlock contém --ERROR BLOC--', ...)
  it('HTML do ErrorBlock contém o conteúdo cru', ...)
  it('bloco-nao-fechado: HTML gerado com ErrorBlock', ...)
  it('compile retorna mesmo com erros — não lança exceção', ...)
  it('diagnostics contém PULLQUOTE_NO_QUOTE com severity error', ...)
  it('exitCodeFromDiagnostics retorna 1 para erros', ...)
})
```

---

## `tests/integration/compile-assets.test.ts`

```typescript
describe('compile com assets', () => {
  beforeEach(() => {
    // criar fixtures/valid/img/foto.jpg fake (buffer mínimo)
  })
  afterEach(cleanup)

  it('imagem existente copiada para outDir/slug/img/', ...)
  it('src reescrito no HTML para ./img/{filename}', ...)
  it('imagem em markdown comum também copiada', ...)
  it('imagem não encontrada → ErrorBlock de imagem no HTML', ...)
  it('ErrorBlock de imagem tem classe tmd-error-block-image', ...)
  it('IMAGE_FILE_NOT_FOUND em diagnostics quando imagem ausente', ...)
  it('compile continua após imagem ausente — gera HTML parcial', ...)
})
```

---

## `tests/integration/compile-themes.test.ts`

```typescript
describe('compile com temas', () => {
  it('tema ink: CSS contém fundo claro #f5f0e8', ...)
  it('tema modern: CSS contém acento violeta #7c6aff', ...)
  it('tema amber: CSS contém acento âmbar #c8913a', ...)
  it('frontmatter.theme sobrescreve config.defaultTheme', ...)
  it('config.defaultTheme usado quando frontmatter.theme ausente', ...)
  it('tema inválido no frontmatter → usa essay', ...)
  // nível 1 — overrides
  it('tema customizado: CSS gerado com [data-theme="midnight"]', ...)
  it('tema customizado: overrides.bg refletido em --tmd-bg no CSS', ...)
  it('tema customizado: overrides.accent refletido em --tmd-accent no CSS', ...)
  it('tema customizado herda vars não sobrescritas do base extends', ...)
  // nível 2 — blocks
  it('tema customizado com blocks.warning: CSS contém [data-theme="midnight"] .tmd-block-warning', ...)
  it('blocks.warning.border-color gera --tmd-block-border-color no seletor correto', ...)
  it('blocks.timeline.marker-color gera .tmd-timeline-marker { background: ... }', ...)
  it('bloco sem customização usa fallback var(--tmd-accent) do CSS base', ...)
})
```

## `tests/integration/compile-custom-css.test.ts`

```typescript
describe('compile com custom_css', () => {
  it('custom_css + allowExternalCSS=false → WARN_CUSTOM_CSS_NOT_ALLOWED em diagnostics', ...)
  it('custom_css + allowExternalCSS=false → HTML sem segundo <link>', ...)
  it('custom_css + allowExternalCSS=true + arquivo existente → HTML com segundo <link>', ...)
  it('custom_css + allowExternalCSS=true + arquivo ausente → WARN_CUSTOM_CSS_NOT_FOUND', ...)
  it('custom_css + allowExternalCSS=true + arquivo ausente → HTML sem segundo <link>', ...)
  it('sem custom_css → sem warnings e sem <link> extra', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–11 passam
- Nenhum arquivo temporário deixado em disco após os testes
- Nenhum teste acessa internos do parser ou do renderer diretamente
- Cada test file tem `afterEach(cleanup)` ou equivalente

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: nenhum
Interfaces públicas novas: compileFixture, cleanup (helpers de teste)
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: validação final e relatório
```
