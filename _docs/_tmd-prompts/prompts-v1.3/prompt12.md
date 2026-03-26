# prompt12 — Validação final e relatório de implementação

## Depende de
`prompt11.md` — todos os testes de integração passando.

---

## Objetivo

Executar a validação completa contra as specs, corrigir discrepâncias encontradas e gerar `_relating/gemini/FINAL-IMPLEMENTATION-REPORT.md`.

---

## Não fazer

- Não alterar comportamento já testado sem atualizar os testes correspondentes
- Não gerar o relatório antes de corrigir todos os itens ❌ do checklist

---

## Etapa 1 — Suite completa

```bash
npm run build   # deve ser zero erros
npm test        # todos os testes devem passar
```

Se algum teste falhar: corrigir antes de continuar.

---

## Etapa 2 — Checklist de conformidade com a spec

Para cada item: ✅ passa, ❌ falha (descrever o desvio).

### tmd-parser-spec v1.4 — pontos críticos

- [ ] `parse()` nunca resolve defaults — `frontmatter.theme` pode ser `undefined`
- [ ] Família imagem reconhecida antes da família conteúdo no loop
- [ ] `*>wrap` capturado antes de `*>` no alternador
- [ ] `##` capturado antes de `#` no alternador de tokens
- [ ] `|>##` gera `WarningBlock`, nunca heading
- [ ] Pullquote sem citação → `ErrorBlockNode` com `PULLQUOTE_NO_QUOTE`
- [ ] Pullquote sem autor → `PullQuoteBlockNode` com `author: null`
- [ ] `DocumentNode.assets` inclui imagens de markdown comum E de blocos de imagem
- [ ] Parser não verifica existência de arquivos no disco
- [ ] `position: SourceRange` presente em todos os nós AST, incluindo `TimelineEventNode` e `TimelineMarkdownNode`
- [ ] `SourceRange.end` é **exclusivo** em todos os nós — nunca aponta para o último char, sempre para o char após
- [ ] `ErrorBlockNode` tem `position` mesmo quando bloco não fechado (end exclusivo = última linha consumida)
- [ ] `Diagnostic.position` é `SourceRange | null` — não usa mais `line: number | null`
- [ ] `Diagnostic.position` aponta para a localização real do problema no source
- [ ] `lineOffsets[0] === 0` sempre
- [ ] `positionAt(i, col, lineOffsets).offset === lineOffsets[i] + col`
- [ ] `positionAt(i, lines[i].length, lineOffsets)` produz o `end` exclusivo correto para a linha `i`
- [ ] `STRAY_CLOSE` diagnostic tem `position` com `end.offset === start.offset + 2`

### tmd-html-theme-spec v1.5 — pontos críticos

- [ ] `<h3>` omitido quando `title === null`
- [ ] `<figcaption>` omitido quando `author === null`
- [ ] Modo standalone: `[data-theme]` no `<html>`
- [ ] Modo fragment: `.tmd-theme-{nome}` no `<article>`
- [ ] Modo fragment: sem DOCTYPE, sem switcher, sem script
- [ ] `ErrorBlock` contém `--ERROR BLOC--` acima e abaixo
- [ ] `ErrorBlock` de imagem tem classe `tmd-error-block-image`
- [ ] CSS do switcher ausente no modo fragment
- [ ] Nível 1 — `overrides` mapeadas via `OVERRIDE_KEY_MAP` para `--tmd-*`
- [ ] Nível 1 — chaves fora da whitelist `ThemeOverrideKey` rejeitadas no `config-loader`
- [ ] Nível 2 — `blocks` geram seletores `[data-theme="x"] .tmd-block-{tipo}`
- [ ] Nível 2 — `marker-color` em timeline gera regra `background:` direta em `.tmd-timeline-marker`
- [ ] Nível 2 — `bg` em `pullquote` ou `timeline` ignorado silenciosamente no CSS
- [ ] CSS base usa `var(--tmd-block-border-color, var(--tmd-accent))` como fallback
- [ ] CSS base usa `var(--tmd-block-marker-color, var(--tmd-accent))` na timeline
- [ ] Nível 3 — `custom_css` ignorado com `WARN_CUSTOM_CSS_NOT_ALLOWED` quando `allowExternalCSS=false`
- [ ] Nível 3 — `custom_css` com arquivo inexistente gera `WARN_CUSTOM_CSS_NOT_FOUND`
- [ ] Nível 3 — `custom_css` válido injetado como segundo `<link>` apenas no modo standalone

### tmd-spec v1.3 — pontos críticos

- [ ] Hierarquia: config → frontmatter → padrão hardcoded
- [ ] `resolveConfig` é a única função que aplica defaults
- [ ] Temas customizados funcionam via `extends`
- [ ] `compile: fragment` gera fragmento sem DOCTYPE

### tmd-cli-spec v1.1 — pontos críticos

- [ ] Saída: `dist/{slug}/{slug}.html` + `dist/{slug}/{slug}.css`
- [ ] Saída achatada (subdiretórios não espelhados)
- [ ] Colisão de slug: pula segundo, continua, exit 1
- [ ] Imagem não encontrada: ErrorBlock + exit 1 + continua
- [ ] `tmd init` não sobrescreve config existente
- [ ] `--watch` ignora arquivos novos (evento `add`)
- [ ] Exit code 0 sem erros, 1 com erros, 2 para fatal

### Arquitetura — pontos críticos

- [ ] `Diagnostic` é o único tipo de erro usado em todo o projeto
- [ ] `DiagnosticCode` canônicos usados em todos os módulos
- [ ] `console.*` apenas em `print-diagnostics.ts`
- [ ] `compile()` nunca chama `process.exit`
- [ ] `slugify` tem apenas uma implementação (não duplicada)
- [ ] Nenhuma regex de parsing duplicada entre módulos
- [ ] `Position` e `SourceRange` definidos apenas em `src/types/index.ts` — nunca redefinidos
- [ ] `positionAt` é o único lugar que constrói `Position` a partir de índice de linha — nenhum parser constrói `Position` manualmente
- [ ] `formatPosition` é o único lugar que serializa `Position` para string no terminal

---

## Etapa 3 — Smoke tests manuais

Pré-requisito: build e instalação global.

```bash
npm run build
npm install -g .
```

```bash
# 1. standalone básico
tmd compile fixtures/valid/basico.tmd
# → [OK] dist/teste-basico/teste-basico.html
# → [OK] dist/teste-basico/teste-basico.css
# → exit 0

# 2. fragment
tmd compile fixtures/valid/fragment.tmd
# → HTML começa com <article class="tmd-document tmd-theme-modern">

# 3. erro de parsing
tmd compile fixtures/invalid/pullquote-sem-citacao.tmd
# → [ERRO] ... PULLQUOTE_NO_QUOTE
# → [OK] ... (compilado com ErrorBlock)
# → exit 1

# 4. tmd init
tmd init
# → [OK] .config.tmd.json criado
tmd init
# → [AVISO] .config.tmd.json já existe
# → exit 0

# 5. diretório
tmd compile fixtures/valid/ --out /tmp/tmd-dir-test
# → compila todos os .tmd recursivamente
# → saída achatada em /tmp/tmd-dir-test/
```

---

## Etapa 4 — Gerar `IMPLEMENTATION-REPORT.md`

```markdown
# TMD v1.0 — Relatório de Implementação

## Status geral

| Componente              | Status | Testes |
|-------------------------|--------|--------|
| Parser                  | ✅/⚠️/❌ | X/Y   |
| Config resolver         | ...    | ...    |
| HTML renderer           | ...    | ...    |
| CSS generator           | ...    | ...    |
| Asset handler           | ...    | ...    |
| Compilador (orquestrador)| ...   | ...    |
| CLI — compile           | ...    | ...    |
| CLI — init              | ...    | ...    |
| CLI — watch             | ...    | ...    |
| Extensão VS Code        | ...    | manual |

## Cobertura de testes

(colar output de `npm test -- --coverage` ou equivalente Vitest)

## Conformidade com specs

### tmd-parser-spec v1.4
[lista dos itens do checklist com ✅ ou ❌ + descrição de desvio se ❌]

### tmd-html-theme-spec v1.5
[...]

### tmd-spec v1.3
[...]

### tmd-cli-spec v1.1
[...]

### tmd-vscode-extension-spec v1.2
[apenas checklist manual]

## Desvios da spec

(lista de comportamentos implementados diferente do especificado, com justificativa)
Se nenhum: "Nenhum desvio conhecido."

## Decisões de implementação não cobertas pela spec

(decisões tomadas durante a implementação)

## Como instalar e usar

### Instalar durante o desenvolvimento
\`\`\`bash
npm run build
npm install -g .    # registra o comando tmd no PATH
\`\`\`

### Usar como dependência de projeto
\`\`\`bash
npm install tmd --save-dev
npx tmd init
\`\`\`

### Compilar um arquivo
\`\`\`bash
tmd compile meu-artigo.tmd
tmd compile meu-artigo.tmd --out ./public
\`\`\`

### Compilar um diretório
\`\`\`bash
tmd compile ./artigos/
tmd compile ./artigos/ --out ./public --watch
\`\`\`

### Criar config do projeto
\`\`\`bash
tmd init
\`\`\`

## Próximos passos (v1.1+)

- Variantes light dos 4 temas
- `tmd validate` — validar sem compilar
- Snippets na extensão VS Code
- Tree-sitter na extensão VS Code
```

---

## Critério de aceite

- `npm run build` sem erros
- `npm test` todos os testes passam
- Checklist de conformidade: zero itens ❌
- Os 5 smoke tests produzem comportamento correto
- `IMPLEMENTATION-REPORT.md` gerado na raiz do projeto

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: IMPLEMENTATION-REPORT.md
Arquivos alterados: [correções de bugs encontrados no checklist]
Interfaces públicas alteradas: [se houver correção que quebre interface, listar]
Decisões assumidas não cobertas pela spec: nenhuma
Pendências: TMD v1.0 completo
```
