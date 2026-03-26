# prompt10 — Extensão VS Code (pacote paralelo)

## Atenção
Esta extensão é um **pacote paralelo e independente**. Ela não importa código do compilador. Pode ser implementada a qualquer momento após o prompt01, em paralelo ou após o compilador estar estável.

## Depende de
Apenas das specs. Nenhum arquivo do compilador.

---

## Objetivo

Implementar syntax highlight, grammar TextMate e tema de cores para arquivos `.tmd` no VS Code.

---

## Não fazer

- Não importar código de `src/` do compilador
- Não duplicar regex se já existir fonte clara na spec — documentar a origem
- Não tentar validar semântica profunda — gramática é para highlight, não para parsing completo
- Não tentar implementar preview ou compilação inline na v1

---

## Localização

```
tmd-vscode-extension/    ← diretório separado, não dentro de tmd/src/
├── package.json
├── language-configuration.json
├── syntaxes/
│   └── toddymarkdown.tmLanguage.json
├── themes/
│   └── toddymarkdown-color-theme.json
└── README.md
```

---

## package.json

```json
{
  "name": "toddymarkdown",
  "displayName": "ToddyMarkDown",
  "description": "Syntax highlighting for ToddyMarkDown (.tmd)",
  "version": "0.2.0",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [{
      "id": "toddymarkdown",
      "aliases": ["ToddyMarkDown", "tmd"],
      "extensions": [".tmd"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "toddymarkdown",
      "scopeName": "text.toddymarkdown",
      "path": "./syntaxes/toddymarkdown.tmLanguage.json"
    }],
    "themes": [{
      "label": "ToddyMarkDown",
      "uiTheme": "vs-dark",
      "path": "./themes/toddymarkdown-color-theme.json"
    }]
  }
}
```

---

## language-configuration.json

Conforme `tmd-vscode-extension-spec v1.2` (seção language-configuration.json).

Incluir `folding.markers` com `^\|>` e `^<\|$`.

---

## Grammar TextMate — ordem das regras (da spec — crítico)

```
1. frontmatter
2. literal-block
3. escaped-line
4. image-block        ← ANTES de content-block
5. content-block
6. markdown-heading-3 ← ### ANTES de ##
7. markdown-heading-2 ← ## ANTES de #
8. markdown-heading-1
9. markdown-list
10. markdown-blockquote
```

### Alternadores críticos (da spec)

Em `image-block`: `\*>wrap|\*>|\*<wrap|\*<` — nessa ordem.
Em `content-block`: `!|@|\$|##|#|\?|\+|~~|&` — `##` antes de `#`.

### Mapeamento de cores (da spec)

```
|>, <|, />, <\     → punctuation.definition.block.*.tmd  → magenta  #ff4fd8
tokens (!, @, ##…) → keyword.control.block.token.tmd     → dourado   #d9a441
modos de imagem    → keyword.control.block.image-mode.tmd → dourado  #d9a441
[Título]           → entity.name.block.title.tmd          → laranja  #ff9b42
# heading 1        → markup.heading.1.tmd                 → azul claro #7ec8ff
## heading 2       → markup.heading.2.tmd                 → azul médio #3fa9ff
### heading 3      → markup.heading.3.tmd                 → azul escuro #1f6fe5
- lista            → punctuation.definition.list.begin.tmd → dourado claro #e3c77a
> blockquote       → punctuation.definition.quote.begin.tmd → vermelho #e05757
frontmatter keys   → support.type.property-name.frontmatter.tmd → verde
frontmatter values → string.unquoted.frontmatter.tmd
```

---

## Checklist de validação manual

Após `F5` (modo desenvolvimento) no VS Code:

- [ ] `.tmd` reconhecido como linguagem ToddyMarkDown
- [ ] `|>` e `<|` em magenta
- [ ] `!`, `@`, `##`, `#`, `?`, `+`, `~~`, `&` após `|>` em dourado
- [ ] `*>`, `*>wrap`, `*<`, `*<wrap` após `|>` em dourado
- [ ] `[Título]` em laranja
- [ ] `---` do frontmatter com escopo de frontmatter
- [ ] Chaves do frontmatter em verde
- [ ] Headings `#`, `##`, `###` em azuis corretos
- [ ] `|>##` **não** recebe escopo de heading — recebe escopo de token
- [ ] `|>#` **não** recebe escopo de heading — recebe escopo de token
- [ ] Folding funciona nos blocos `|>...<|`
- [ ] Folding funciona nos blocos `/>...<\`

---

## README.md da extensão

Incluir:
- O que é ToddyMarkDown
- Como instalar em desenvolvimento
- Tabela de tokens e cores
- Link para `tmd-spec-v1.3.md`

---

## Critério de aceite

- `package.json` válido para VS Code
- Grammar não causa erros ao carregar no VS Code
- Todos os itens do checklist manual passam
- Nenhum import de `src/` do compilador

---

## Resumo de entrega (preencher ao final)

```
Arquivos criados: [lista]
Arquivos alterados: []
Interfaces públicas novas: nenhuma (extensão VS Code não exporta código)
Interfaces públicas alteradas: nenhuma
Decisões assumidas não cobertas pela spec: [lista ou "nenhuma"]
Pendências para o próximo prompt: nenhuma
```
