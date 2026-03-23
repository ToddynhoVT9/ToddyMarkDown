# prompt08 — CLI: comando `tmd compile`

## Depende de
`prompt07.md` — `compile()`, `loadConfig()`, `slugify()`.

---

## Objetivo

Implementar `tmd compile` para arquivo único e diretório, com detecção de colisão de slugs e flags `--out` e `--config`.

---

## Não fazer

- Não acessar internos do parser diretamente — usar apenas `compile()` do compilador
- Não reimplementar slugify — importar de `src/compiler/slugify.ts`
- Não chamar `process.exit` dentro de `compile-command.ts` — retornar `exitCode` e deixar `index.ts` chamar
- Não emitir mensagens de terminal dentro de `compile()` — isso é responsabilidade da CLI

---

## `src/cli/find-tmd-files.ts`

```typescript
export async function findTmdFiles(dirPath: string): Promise<string[]>
// Busca recursiva — inclui subdiretórios
// Lança Error se dirPath não existir
// Retorna array de caminhos absolutos
```

---

## `src/cli/print-diagnostics.ts`

Centralizar todas as mensagens de terminal aqui. Não espalhar `console.*` em outros arquivos da CLI.

```typescript
import type { Diagnostic, CompileResult } from '../types/index.js';

export function formatPosition(d: Diagnostic): string
// Formata a localização de um diagnostic para exibição no terminal
// Com position:    "{line}:{column}"  ex: "12:0"
// Sem position:    "(sem posição)"

export function printCompileResult(result: CompileResult): void
// [OK]   {htmlPath}
// [OK]   {cssPath}
// Para cada diagnostic de severity error:
//   [ERRO] {filePath} · {formatPosition(d)} · {message}
// Para cada diagnostic de severity warning:
//   [WARN] {filePath} · {formatPosition(d)} · {message}

export function printSlugCollision(slug: string, first: string, second: string): void
// [ERRO] Colisão de slug: "{slug}"
//   → já compilado: {first}
//   → ignorado:     {second}

export function printFatal(message: string): void
// [FATAL] {message}

export function printWatchEvent(event: string, path: string): void
// [MUDANÇA] {path}  ou  [WATCH] {event}: {path}
```

---

## `src/cli/compile-command.ts`

```typescript
import type { CompileResult } from '../types/index.js';

export interface CompileCommandOptions {
  target: string;
  out:    string;
  config?: string;
}

export interface CompileCommandResult {
  filesProcessed:   number;
  filesWithErrors:  number;
  fatalError:       string | null;
  exitCode:         0 | 1 | 2;
}

export async function runCompileCommand(
  options: CompileCommandOptions
): Promise<CompileCommandResult>
```

### Fluxo arquivo único

```
1. verificar se arquivo existe → fatalError + exitCode 2 se não
2. loadConfig(options.config) → se lança Error → fatalError + exitCode 2
3. compile({ tmdPath, outDir: options.out, config }) → CompileResult
4. printCompileResult(result)
5. exitCode = exitCodeFromDiagnostics(result.diagnostics)
```

### Fluxo diretório

```
1. verificar se diretório existe → fatalError + exitCode 2 se não
2. loadConfig(options.config) → se lança Error → fatalError + exitCode 2
3. findTmdFiles(target) → lista de .tmd
4. para cada arquivo:
   a. ler frontmatter parcial para obter title (sem fazer parse completo — usar parseFrontmatter)
   b. slug = slugify(title ?? basename)
   c. se colisão: printSlugCollision + filesWithErrors++ + continue
   d. registrar slug como usado
   e. compile(...) → CompileResult
   f. printCompileResult(result)
   g. acumular diagnostics
5. exitCode = 0 se sem erros/colisões, 1 se houve qualquer erro
```

**Saída achatada** — todos os slugs vão direto para `options.out/`, sem espelhar subdiretórios.

---

## `src/cli/index.ts`

Entry point. Parsear `process.argv` e despachar comandos.

```typescript
#!/usr/bin/env node

const [,, command, ...rest] = process.argv;

async function main() {
  if (command === 'compile') {
    const target = rest[0];
    if (!target) { printFatal('Uso: tmd compile <arquivo|dir> [--out <dir>] [--config <path>]'); process.exit(2); }

    const out    = argAfter('--out',    rest) ?? 'dist';
    const config = argAfter('--config', rest);
    const watch  = rest.includes('--watch');

    if (watch) {
      const { runWatchCommand } = await import('./watch-command.js');
      runWatchCommand({ target, out, config }); // não chama process.exit — fica vivo
    } else {
      const result = await runCompileCommand({ target, out, config });
      if (result.fatalError) printFatal(result.fatalError);
      process.exit(result.exitCode);
    }
  }
  else if (command === 'init') {
    const { runInitCommand } = await import('./init-command.js');
    runInitCommand();
    process.exit(0);
  }
  else {
    printFatal(`Comando desconhecido: ${command ?? '(nenhum)'}. Use: compile, init`);
    process.exit(2);
  }
}

function argAfter(flag: string, args: string[]): string | undefined {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}

main().catch(err => { printFatal(err.message); process.exit(2); });
```

---

## Testes

### `tests/cli/compile-command.test.ts`

```typescript
describe('runCompileCommand — arquivo único', () => {
  it('compila basico.tmd → exitCode 0', ...)
  it('arquivo inexistente → fatalError + exitCode 2', ...)
  it('usa dist/ como saída padrão', ...)
  it('--out muda diretório de saída', ...)
})

describe('runCompileCommand — diretório', () => {
  it('compila todos os .tmd do diretório', ...)
  it('recursivo: compila .tmd em subdiretórios', ...)
  it('saída achatada: todos os slugs em out/', ...)
  it('colisão de slug: pula segundo, continua, exitCode 1', ...)
  it('diretório inexistente → fatalError + exitCode 2', ...)
})

describe('print-diagnostics', () => {
  it('printCompileResult emite [OK] para html e css', ...)
  it('printCompileResult emite [ERRO] para diagnostics de erro', ...)
  it('printSlugCollision emite os dois caminhos', ...)
  it('formatPosition retorna "linha:coluna" quando position está presente', ...)
  it('formatPosition retorna "(sem posição)" quando position é null', ...)
  it('output de [ERRO] inclui formatPosition no formato correto', ...)
})
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` — todos os testes de prompts 01–08 passam
- `compile-command.ts` não chama `process.exit` — retorna `exitCode`
- `slugify` importado de `src/compiler/slugify.ts`, não reimplementado
- `console.*` apenas em `print-diagnostics.ts`, em nenhum outro arquivo CLI
- `tmd compile fixtures/valid/basico.tmd` (smoke test manual — requer `npm run build && npm install -g .`) produz dois arquivos em `dist/`

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: nenhum
Interfaces públicas novas: CompileCommandOptions, CompileCommandResult, formatPosition
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: init e watch não implementados
```
