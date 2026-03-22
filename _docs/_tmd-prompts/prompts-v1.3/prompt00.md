# prompt00 — Contrato de comportamento do agente

## Propósito

Este prompt define as regras fixas de comportamento para toda a sequência de implementação do TMD v1.0. Ele deve ser lido antes do prompt01 e relembrado no início de cada prompt subsequente.

---

## O que você está construindo

ToddyMarkDown (TMD) é um compilador de uma linguagem de marcação editorial. O projeto tem quatro componentes:

```
tmd/                       compilador principal (Node.js + TypeScript)
  src/parser/              transforma .tmd em AST
  src/compiler/            transforma AST em HTML + CSS
  src/cli/                 interface de linha de comando

tmd-vscode-extension/      extensão VS Code (pacote paralelo, independente)
```

A extensão VS Code é um **pacote paralelo**. Ela não bloqueia nem depende do compilador. Implemente-a depois que o compilador estiver estável.

---

## Specs de referência

Toda decisão de comportamento deve ser rastreável a uma dessas specs:

```
tmd-spec-v1.3.md
tmd-parser-spec-v1.4.md
tmd-html-theme-spec-v1.5.md
tmd-cli-spec-v1.1.md
tmd-vscode-extension-spec-v1.2.md
```

Se a spec não cobre um caso, **pergunte antes de inventar**.

---

## Regras de execução

### Regra 1 — Incrementalidade
Cada prompt avança o projeto. Você nunca cria arquivos fora da árvore definida no prompt01. Você nunca exclui o que foi criado antes sem justificativa explícita.

### Regra 2 — Compatibilidade pública
Antes de alterar um arquivo existente, verifique se a mudança quebra a interface pública (tipos exportados, assinaturas de função). Se quebrar, liste a quebra explicitamente e ajuste **todos os consumidores no mesmo passo**. Nunca deixe o projeto em estado inconsistente entre arquivos.

### Regra 3 — Responsabilidade de módulo
Cada módulo tem uma responsabilidade única. Respeitar os limites:

- **parser**: lê `.tmd`, produz `ParseResult` (AST + diagnostics). Não resolve defaults. Não copia arquivos. Não conhece temas.
- **config-resolver**: aplica hierarquia config → frontmatter → padrão hardcoded. Não faz I/O além de ler o config.
- **html-renderer**: transforma AST em string HTML. Não faz I/O. Não lê arquivos.
- **css-generator**: produz string CSS. Não faz I/O.
- **asset-handler**: copia arquivos. Não conhece AST diretamente.
- **compiler/index**: orquestra todos os anteriores. Faz I/O de saída.
- **CLI**: invoca o compilador. Não acessa internos do parser diretamente.

### Regra 4 — Sem duplicação de regex
Se uma regex de reconhecimento de sintaxe TMD já existe no parser, não a duplique na extensão VS Code ou em outro módulo. Documente a fonte quando necessário.

### Regra 5 — Ao final de cada prompt
Sempre encerrar com uma seção chamada **"Resumo de entrega"** contendo:

```
Arquivos criados: [lista]
Arquivos alterados: [lista com o que mudou]
Interfaces públicas novas: [lista de tipos/funções exportados]
Interfaces públicas alteradas: [lista + impacto]
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: [lista ou "nenhuma"]
```

---

## Hierarquia de defaults — regra crítica

Esta é a decisão arquitetural mais importante da sequência inteira.

O **parser nunca resolve defaults**. Ele preserva ausência como `undefined`.

A resolução acontece no `src/compiler/config-resolver.ts`, na seguinte ordem:

```
1. valor do frontmatter (se presente e válido)
2. valor do .config.tmd.json (defaultTheme / defaultCompile)
3. padrão hardcoded: theme = 'essay', compile = 'standalone'
```

Isso significa que `FrontmatterFields` tem todos os campos como `string | undefined`, não como `string`.

---

## Sistema de Diagnostics — regra crítica

Erros, warnings e informações de compilação são sempre representados pelo tipo `Diagnostic`, definido no prompt01 e nunca redefinido depois.

```typescript
type DiagnosticSeverity = 'error' | 'warning' | 'info';

interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;           // ex: 'PULLQUOTE_NO_QUOTE', 'IMAGE_NOT_FOUND'
  message: string;
  line: number | null;
  filePath: string;
  recoverable: boolean;   // false = bloco ignorado; true = warning, continua normal
}
```

`ParseResult`, `CompileResult` e `CompileCommandResult` todos carregam `diagnostics: Diagnostic[]`. Exit codes são derivados dos diagnostics, nunca calculados ad-hoc.

---

## Invocação da CLI

O TMD é um pacote Node.js com um entry point definido em `bin` no `package.json`:

```json
"bin": { "tmd": "./dist/cli/index.js" }
```

Isso mapeia o comando `tmd` para o compilador. Dependendo do contexto, a invocação muda:

**Durante o desenvolvimento** — instalar o pacote local globalmente uma vez e usar `tmd` diretamente:

```bash
npm run build
npm install -g .    # registra o comando tmd no PATH
tmd init
tmd compile artigo.tmd
```

**Como dependência de projeto** — após `npm install tmd --save-dev`:

```bash
npx tmd init
npx tmd compile artigo.tmd
```

**Após publicação no npm** — qualquer um dos dois:

```bash
npx tmd init
# ou
npm install -g tmd && tmd init
```

**Regra para os prompts:** todos os smoke tests e exemplos de uso devem usar `tmd <comando>` (não `node dist/cli/index.js`), assumindo que `npm install -g .` foi executado após o build. Documentar esse pré-requisito no início de cada seção de smoke test.

---

## Setup de testes

Usar **Vitest** em vez de Jest. Motivo: compatibilidade nativa com ESM sem configuração extra.

```bash
npm install -D vitest
```

```json
// package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Sem `--experimental-vm-modules`. Sem `ts-jest`.

---

## O que este prompt entrega

Nenhum arquivo de código. Apenas o contrato que governa todos os prompts seguintes.
