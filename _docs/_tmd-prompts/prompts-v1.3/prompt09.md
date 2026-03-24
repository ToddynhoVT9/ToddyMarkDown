# prompt09 — CLI: `tmd init` e `--watch`

## Depende de
`prompt08.md` — `runCompileCommand`, `print-diagnostics`, `src/cli/index.ts`.

---

## Objetivo

Implementar `tmd init` e o modo `--watch`. Finalizar a CLI.

---

## Não fazer

- Não reimplementar lógica de compilação no watch — delegar para `runCompileCommand`
- Não monitorar assets (imagens) no watch — apenas `.tmd` e `.config.tmd.json`
- Não processar arquivos `.tmd` novos adicionados durante o watch (da spec: ignorar)
- Não usar `console.*` fora de `print-diagnostics.ts`

---

## `src/cli/init-command.ts`

```typescript
export function runInitCommand(): void
// Cria .config.tmd.json no cwd com conteúdo padrão
// Se já existir → printFatal ou aviso específico + não sobrescreve + retorna
```

Conteúdo gerado (da spec):
```json
{
  "defaultTheme": "essay",
  "defaultCompile": "standalone",
  "themes": {}
}
```

Adicionar em `print-diagnostics.ts`:
```typescript
export function printInitCreated(path: string): void   // [OK] {path} criado
export function printInitExists(path: string):  void   // [AVISO] {path} já existe
```

---

## `src/cli/watch-command.ts`

```typescript
import chokidar from 'chokidar';

export interface WatchOptions {
  target:  string;
  out:     string;
  config?: string;
}

export function runWatchCommand(options: WatchOptions): void
```

### Comportamento (da spec)

1. compilação completa inicial via `runCompileCommand`
2. monitorar: arquivos `.tmd` do alvo + `.config.tmd.json`
3. mudança em `.tmd` → recompilar apenas aquele arquivo
4. mudança em `.config.tmd.json` → recompilar todo o alvo
5. arquivos **novos** (evento `add`) → **ignorar** (`ignoreInitial: true` + não ouvir `add`)
6. erro de parsing → não encerra o processo
7. `Ctrl+C` → fechar watcher + exit 0

```typescript
export function runWatchCommand({ target, out, config }: WatchOptions): void {
  console.log(`[WATCH] Monitorando ${target} — Ctrl+C para encerrar`);

  // compilação inicial
  runCompileCommand({ target, out, config });

  const isFile    = target.endsWith('.tmd');
  const patterns  = isFile ? [target] : [path.join(target, '**/*.tmd')];
  const configFile = config ?? path.join(process.cwd(), '.config.tmd.json');
  if (fs.existsSync(configFile)) patterns.push(configFile);

  const watcher = chokidar.watch(patterns, {
    ignoreInitial: true,
    persistent:    true,
  });

  watcher.on('change', async (changedPath) => {
    printWatchEvent('MUDANÇA', changedPath);
    const isConfigChange = changedPath.endsWith('.config.tmd.json');
    await runCompileCommand({
      target: isConfigChange ? target : changedPath,
      out,
      config,
    });
  });

  // NÃO ouvir 'add' — arquivos novos são ignorados

  process.on('SIGINT', () => {
    watcher.close().then(() => {
      console.log('\n[WATCH] Encerrado.');
      process.exit(0);
    });
  });
}
```

---

## Testes

### `tests/cli/init-command.test.ts`

```typescript
describe('runInitCommand', () => {
  it('cria .config.tmd.json com conteúdo padrão', ...)
  it('JSON gerado é parseável e tem os 3 campos', ...)
  it('defaultTheme: "essay"', ...)
  it('defaultCompile: "standalone"', ...)
  it('themes: {}', ...)
  it('não sobrescreve se já existir', ...)
  it('emite aviso (não erro fatal) quando já existir', ...)
})
```

### `tests/cli/watch-command.test.ts`

Usar mocks de `chokidar` para simular eventos:

```typescript
describe('runWatchCommand', () => {
  it('executa compilação inicial', ...)
  it('recompila o arquivo alterado em evento change', ...)
  it('recompila todo o alvo quando config muda', ...)
  it('não processa evento add (arquivos novos ignorados)', ...)
  it('não encerra processo em erro de parsing', ...)
})
```

---

## Smoke test final da CLI

Pré-requisito: build e instalação global.

```bash
npm run build
npm install -g .
```

```bash
# 1. standalone básico
tmd compile fixtures/valid/basico.tmd
# Esperado: [OK] dist/teste-basico/teste-basico.html
#           [OK] dist/teste-basico/teste-basico.css
# exit 0

# 2. erro de parsing
tmd compile fixtures/invalid/pullquote-sem-citacao.tmd
# Esperado: [ERRO] ... PULLQUOTE_NO_QUOTE
#           [OK] dist/.../... (compilado com ErrorBlock)
# exit 1

# 3. tmd init (primeira vez)
tmd init
# Esperado: [OK] .config.tmd.json criado
# exit 0

# 4. tmd init (segunda vez)
tmd init
# Esperado: [AVISO] .config.tmd.json já existe
# exit 0
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–09 passam
- Os 4 smoke tests acima produzem o comportamento esperado
- Watcher não reage a eventos `add`
- CLI completa: `compile` (arquivo, diretório, --watch), `init`

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: src/cli/index.ts (watch e init integrados), src/cli/print-diagnostics.ts
Interfaces públicas novas: WatchOptions
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: extensão VS Code (pacote paralelo)
```
