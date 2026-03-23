# prompt07 — Compilador: config loader, assets e orquestrador

## Depende de
`prompt05.md` — `resolveConfig`.
`prompt06.md` — `generateCSS`, `renderHTML`.

---

## Objetivo

Implementar o leitor de `.config.tmd.json`, o handler de assets e o orquestrador principal que conecta todos os módulos e produz os dois arquivos de saída em disco.

---

## Não fazer

- Não resolver defaults no `config-loader` — ele só lê e valida estrutura; defaults ficam no `config-resolver`
- Não fazer parsing de `.tmd` no `asset-handler` — ele recebe `string[]` de caminhos prontos
- Não emitir `process.exit` no compilador — exit codes ficam na CLI

---

## `src/compiler/config-loader.ts`

```typescript
import type { TMDConfig } from '../types/index.js';

export const EMPTY_CONFIG: TMDConfig = {
  defaultTheme:    '',  // vazio — config-resolver aplicará 'essay' se necessário
  defaultCompile:  '',  // vazio — config-resolver aplicará 'standalone' se necessário
  themes:          {},
  allowExternalCSS: false,
};

export function loadConfig(configPath?: string): TMDConfig
// configPath undefined → busca .config.tmd.json no cwd
// Não encontrado → retorna EMPTY_CONFIG silenciosamente
// Encontrado mas JSON inválido → lança Error (erro fatal, CLI faz exit 2)
// configPath explícito não encontrado → lança Error (erro fatal)
//
// Validações que lançam Error (fatais):
// - themes[x].extends referenciando tema que não é base nem outro tema do config
// - Referência circular em extends
// - Chave em themes[x].overrides fora da whitelist ThemeOverrideKey
// - Tipo em themes[x].blocks fora da lista BlockType válida
// - Propriedade em themes[x].blocks[tipo] fora da whitelist TMDConfigThemeBlock
// - Nome de tema igual a tema base ('essay'|'ink'|'modern'|'amber') → lança Error
//   (a spec diz warning + ignorar, mas errar explicitamente é mais seguro)
```

---

## `src/compiler/asset-handler.ts`

```typescript
import type { Diagnostic } from '../types/index.js';
import { DiagnosticCode } from '../types/index.js';

export interface AssetResult {
  originalSrc:  string;
  resolvedSrc:  string;   // caminho relativo ao HTML de saída, ex: './img/foto.jpg'
  found:        boolean;
  diagnostic:   Diagnostic | null;  // IMAGE_FILE_NOT_FOUND se não encontrado
}

export async function processAssets(
  assetPaths:  string[],  // DocumentNode.assets
  tmdFilePath: string,    // caminho absoluto do .tmd
  outputDir:   string,    // ex: /projeto/dist/meu-artigo/
  filePath:    string,    // para Diagnostic.filePath
): Promise<AssetResult[]>
```

### Lógica

Para cada caminho em `assetPaths`:

1. resolver relativo ao `tmdFilePath` (diretório do arquivo `.tmd`)
2. verificar existência
3. se existe: copiar para `outputDir/img/{basename}`, `resolvedSrc = './img/{basename}'`
4. se não existe: `found: false`, `diagnostic` com `IMAGE_FILE_NOT_FOUND`

```typescript
export function rewriteAssetPaths(
  html:         string,
  assetResults: AssetResult[],
): string
// Para asset encontrado: substitui src="{originalSrc}" por src="{resolvedSrc}"
// Para asset não encontrado: substitui toda a tag <img ...> pelo ErrorBlock de imagem HTML
```

---

## `src/compiler/index.ts` — orquestrador

```typescript
import type { CompileResult, Diagnostic } from '../types/index.js';
import { exitCodeFromDiagnostics } from '../types/index.js';

export interface CompileOptions {
  tmdPath:    string;   // caminho absoluto do .tmd
  outDir:     string;   // diretório base de saída, ex: /projeto/dist
  config:     TMDConfig;
}

export async function compile(options: CompileOptions): Promise<CompileResult>
```

### Fluxo completo

```
1.  ler o arquivo .tmd (I/O — pode lançar Error fatal)
2.  parse(raw, tmdPath) → ParseResult
3.  resolveConfig(document.frontmatter, config) → ResolvedConfig
4.  slugify(frontmatter.title ?? basename(tmdPath, '.tmd')) → slug
5.  criar outDir/slug/ se não existir
6.  processAssets(document.assets, tmdPath, outDir/slug/) → AssetResult[]
7.  coletar diagnostics de assets não encontrados
8.  resolver custom_css (nível 3):
      - se frontmatter.custom_css presente E resolvedConfig.allowExternalCSS = true:
          verificar existência do arquivo; se encontrado → customCssFile = caminho relativo
          se não encontrado → diagnostic WARN_CUSTOM_CSS_NOT_FOUND, customCssFile = undefined
      - se frontmatter.custom_css presente E allowExternalCSS = false:
          diagnostic WARN_CUSTOM_CSS_NOT_ALLOWED, customCssFile = undefined
9.  renderHTML(document, { resolvedConfig, title, cssFileName, customThemeNames, customCssFile }) → html
10. rewriteAssetPaths(html, assetResults) → html final
11. generateCSS({ resolvedConfig }) → css
12. escrever outDir/slug/slug.html
13. escrever outDir/slug/slug.css
14. retornar CompileResult com todos os diagnostics acumulados
```

**Slugify aqui ou em módulo dedicado?** Criar `src/compiler/slugify.ts` (compartilhado com CLI). A CLI e o compilador usam a mesma função — não duplicar.

### Acumulação de diagnostics

```typescript
const allDiagnostics: Diagnostic[] = [
  ...parseResult.diagnostics,
  ...assetResults.flatMap(r => r.diagnostic ? [r.diagnostic] : []),
];

return {
  slug,
  htmlPath: path.join(outDir, slug, `${slug}.html`),
  cssPath:  path.join(outDir, slug, `${slug}.css`),
  diagnostics: allDiagnostics,
};
```

---

## `src/compiler/slugify.ts`

Regras da spec (tmd-cli-spec v1.1):
1. minúsculas
2. NFD + remover marcas diacríticas
3. espaços → `-`
4. remover não-ASCII, não-número, não-`-`
5. colapsar múltiplos `-`
6. remover `-` nas bordas

```typescript
export function slugify(input: string): string
```

---

## Testes

### `tests/compiler/config-loader.test.ts`

```typescript
describe('loadConfig', () => {
  it('retorna EMPTY_CONFIG quando .config.tmd.json não existe', ...)
  it('carrega config válido corretamente', ...)
  it('allowExternalCSS: false quando ausente do JSON', ...)
  it('allowExternalCSS: true quando presente no JSON', ...)
  it('lança Error para JSON inválido', ...)
  it('lança Error para configPath explícito inexistente', ...)
  it('lança Error para referência circular em extends', ...)
  it('lança Error para chave em overrides fora da whitelist ThemeOverrideKey', ...)
  it('lança Error para tipo em blocks fora da lista BlockType', ...)
  it('lança Error para propriedade em blocks[tipo] fora da whitelist', ...)
  it('lança Error para nome de tema customizado igual a tema base', ...)
})
```

### `tests/compiler/asset-handler.test.ts`

```typescript
describe('processAssets', () => {
  it('copia imagem existente para outputDir/img/', ...)
  it('resolvedSrc começa com ./img/', ...)
  it('IMAGE_FILE_NOT_FOUND quando imagem inexistente', ...)
  it('resolve caminho relativo ao tmdFilePath', ...)
})

describe('rewriteAssetPaths', () => {
  it('substitui src original pelo resolvedSrc no HTML', ...)
  it('substitui <img> por ErrorBlock quando not found', ...)
})
```

### `tests/compiler/slugify.test.ts`

```typescript
describe('slugify', () => {
  it('"O Algoritmo Invisível..." → "o-algoritmo-invisivel-..."', ...)
  it('"Gauss & Fourier: Uma História" → "gauss-fourier-uma-historia"', ...)
  it('colapsa múltiplos hífens', ...)
  it('remove hífens nas bordas', ...)
})
```

### `tests/compiler/index.test.ts`

```typescript
describe('compile — integração', () => {
  it('basico.tmd: exit 0, gera .html e .css', ...)
  it('frontmatter.theme sobrescreve config.defaultTheme', ...)
  it('config.defaultTheme usado quando frontmatter.theme ausente', ...)
  it('padrão essay quando ambos ausentes', ...)
  it('modo fragment: HTML começa com <article>', ...)
  it('modo standalone: HTML começa com <!DOCTYPE', ...)
  it('imagem não encontrada: diagnostic IMAGE_FILE_NOT_FOUND', ...)
  it('slug deriva do title do frontmatter', ...)
  it('slug usa nome do arquivo quando title ausente', ...)
  // nível 3 — custom_css
  it('custom_css com allowExternalCSS=false → WARN_CUSTOM_CSS_NOT_ALLOWED, sem <link> extra no HTML', ...)
  it('custom_css com allowExternalCSS=true e arquivo existente → <link> extra presente no HTML', ...)
  it('custom_css com allowExternalCSS=true e arquivo ausente → WARN_CUSTOM_CSS_NOT_FOUND', ...)
  it('ausência de custom_css no frontmatter → nenhum <link> extra, sem warnings', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–07 passam
- `compile()` nunca chama `process.exit` — erros fatais propagam como `Error`
- `slugify` é a mesma função para compilador e CLI — não duplicada
- `resolveConfig` é chamado uma única vez por arquivo, no orquestrador
- `compile()` retorna `CompileResult` mesmo quando há erros — nunca lança por erro de parsing
- `custom_css` ignorado com warning quando `allowExternalCSS` é false

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: nenhum
Interfaces públicas novas: CompileOptions, AssetResult
Interfaces públicas alteradas: TMDConfig (+ allowExternalCSS), ResolvedConfig (+ allowExternalCSS)
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: CLI não implementada ainda
```
