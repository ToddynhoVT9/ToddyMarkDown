# context-cloud-tmd-1.md
# ToddyMarkDown — Contexto de design e evolução da spec

Este documento registra o raciocínio por trás de cada decisão de design do ToddyMarkDown, na ordem em que as decisões foram tomadas. Para cada ponto: a ideia original, o que foi modificado, e por quê.

---

## 1. Ponto de partida — o problema

**Ideia:** Markdown é excelente para escrita, versionamento e organização. O problema não é estrutural — é visual. Um arquivo `.md` bem escrito perde riqueza de apresentação quando comparado ao que HTML + CSS pode oferecer.

**Decisão:** Criar uma extensão semântica de Markdown — o ToddyMarkDown (`.tmd`) — que preserve a legibilidade do texto-fonte em estado bruto e ao mesmo tempo sirva de entrada para uma renderização HTML editorialmente rica.

**Justificativa:** O princípio central do projeto é que o melhor texto-fonte é aquele que permanece legível antes da renderização. Qualquer sintaxe adicionada deve obedecer a essa restrição.

---

## 2. Estrutura geral do arquivo `.tmd`

**Ideia:** Um arquivo `.tmd` pode conter três elementos: frontmatter opcional, markdown comum e blocos especiais.

**Decisão:** Manter o markdown tradicional 100% válido fora e dentro dos blocos especiais. A extensão não substitui o Markdown — ela o complementa apenas onde ele é insuficiente.

**Justificativa:** Regra prática adotada: se um recurso pode ser resolvido com `##`, `>`, listas ou código cercado por crases, ele deve continuar em Markdown puro. Sintaxe nova só é criada para o que o Markdown não consegue expressar com clareza suficiente.

---

## 3. Frontmatter

**Ideia:** Bloco de metadados no topo do documento com campos como título, subtítulo, autor, categoria e tema.

**Decisão:** Frontmatter opcional, delimitado por `---`, com campos `title`, `subtitle`, `kicker`, `author`, `theme` e `compile`. Todos opcionais.

**Modificações ao longo do design:**
- `theme` foi inicialmente pensado como definidor único do tema de saída
- Depois redefinido como **tema padrão** após a decisão de o compilador sempre gerar os 4 temas embutidos
- `compile` foi adicionado posteriormente quando surgiu a necessidade de suporte a integração em sites maiores

**Justificativa:** Frontmatter totalmente opcional mantém a compatibilidade com fluxos simples. Campos ausentes têm fallbacks definidos — nunca geram erro.

---

## 4. Família 1 — Tokens de conteúdo

### 4.1 Sintaxe dos blocos

**Ideia inicial:** Usar a convenção `:::token` do Markdown estendido (similar ao MDX e ao Docusaurus).

**Modificação:** Substituída pela sintaxe `|>token ... <|`.

**Justificativa:** A sintaxe `|>...<|` é visualmente distinta do Markdown padrão sem competir com ele. Os delimitadores `|>` (abertura) e `<|` (fechamento) são reconhecíveis em estado bruto e difíceis de confundir com outra coisa. A forma `:::` é common demais em outros sistemas e conflita com pipes do shell.

### 4.2 Forma geral

```
|>token [título opcional]
conteúdo em markdown
<|
```

**Decisão:** Token obrigatório, título opcional entre colchetes, conteúdo livre, fechamento em linha isolada.

**Justificativa:** Mínimo de ruído sintático. O título entre `[]` é visualmente leve e legível em estado bruto. A linha de fechamento `<|` é inequívoca.

### 4.3 Tokens oficiais

| Token | Bloco |
|---|---|
| `!` | explainer |
| `@` | pullquote |
| `$` | aside |
| `#` | note |
| `##` | warning |
| `?` | question |
| `+` | takeaway |
| `~~` | timeline |
| `&` | concept |

**Decisão sobre `##` para warning:** Questionado se causaria confusão visual com heading H2 do Markdown. Mantido porque o contexto `|>##` — com o token colado diretamente após `|>` — é inequívoco. O parser nunca pode confundir `|>##` com `## heading` porque o prefixo `|>` define o contexto.

**Justificativa dos tokens:** `?` para question e `+` para takeaway são os mais intuitivos da lista — legíveis sem documentação. `~~` para timeline evoca riscado/sequência. `&` para concept remete a "e" (definição de conceito como "x e y"). `@` para pullquote remete a citação/menção.

### 4.4 Markdown interno nos blocos

**Ideia inicial:** Deixar ambíguo — a spec não dizia explicitamente o que era permitido.

**Modificação:** Explicitado que todos os blocos aceitam markdown completo — inline (bold, itálico, código) e block (listas, headings) — com **uma única exceção**: `|>@` (pullquote) aceita apenas markdown inline.

**Justificativa:** Heading dentro de pullquote quebra a semântica. Uma pullquote com `## título` dentro não é mais pullquote — é outro elemento. O pullquote é a única exceção porque a própria estrutura do bloco (`"citação" / -autor`) impõe uma forma rígida.

---

## 5. Regras especiais do pullquote (`|>@`)

**Ideia inicial:** Pullquote com `- Nome` para autor, sem restrições claras.

**Modificação:** Regras explicitadas:
- Linha de citação **obrigatória**, entre aspas duplas (`"texto"`)
- Linha de autor **opcional**, iniciada por `- `
- Sem linha de citação → **erro de parsing**
- Sem linha de autor → **válido**, renderiza sem `<cite>`

**Caso inválido identificado:**
```
|>@
- Autor sem citação
<|
```
Isso não faz sentido semanticamente — autor sem citação não é pullquote.

**Justificativa:** A regra "citação obrigatória, autor opcional" reflete o uso real: pullquotes sem atribuição são comuns; atribuição sem citação não existe.

---

## 6. Família 2 — Tokens de imagem

### 6.1 Evolução da sintaxe

**Versão original (v1.1):**
```
*(>)   direita, sem abraço
(*>)   direita, com abraço
*(<)   esquerda, sem abraço
(*<)   esquerda, com abraço
```

**Problema identificado:** Os quatro modos se diferenciam por parênteses dentro de parênteses — cognitivamente difícil. Para lembrar a diferença entre `*(>)` e `(*>)`, o autor precisa memorizar "asterisco fora = sem abraço, asterisco dentro = com abraço", o que não é intuitivo.

**Versão intermediária proposta:**
```
*(>)   →  |>*>
(*>)   →  |>(*>)
*(<)   →  |>*<
(*<)   →  |>(*<)
```
Descartada por inconsistência: ora parênteses envolvem tudo, ora não.

**Versão final adotada (v1.2):**
```
|>*>       direita, sem abraço
|>*>wrap   direita, com abraço
|>*<       esquerda, sem abraço
|>*<wrap   esquerda, com abraço
```

**Justificativa:** `wrap` é longo mas autoexplicativo. O autor digita esses tokens raramente — clareza vale mais que brevidade aqui. A lógica é direta: `*>` ou `*<` para posição, `wrap` para indicar abraço de texto.

### 6.2 Forma geral

```
|>*modo [título opcional] ![legenda](caminho)
conteúdo
<|
```

**Decisão:** Imagem obrigatoriamente na linha de abertura. Apenas uma imagem por bloco. `alt` obrigatório. Caminho obrigatório.

**Justificativa:** A imagem na linha de abertura torna o tipo do bloco imediatamente legível em estado bruto. Mais de uma imagem por bloco abriria complexidade de layout que a spec não precisa resolver.

---

## 7. Escape e bloco literal

**Decisão:** Dois mecanismos de escape:

1. **Escape de linha** — `\` no início da linha: o parser remove o `\` e trata o resto como texto comum
2. **Bloco literal multilinha** — delimitado por `/>` e `<\`: nada dentro é interpretado

**Justificativa:** O escape de linha resolve casos pontuais (ex: `\|>!` para mostrar a sintaxe sem ativá-la). O bloco literal resolve casos extensos (documentação da própria sintaxe TMD, por exemplo). Os dois mecanismos são complementares e não redundantes.

---

## 8. Comportamento de erro

**Ideia inicial:** Erros impedem compilação.

**Modificação:** Três coisas acontecem quando o parser encontra um bloco mal-formado:
1. Erro reportado no terminal com linha e motivo
2. Conteúdo original preservado como texto cru no HTML
3. Bloco cru renderizado com marcação visual de erro:

```
┌─────────────────────────────────────────┐  ← fundo vermelho semitransparente
  --ERROR BLOC--
  conteúdo cru original
  --ERROR BLOC--
└─────────────────────────────────────────┘
```

**Justificativa:** Compilação parcial é mais útil do que falha total. O autor pode ver o documento renderizado mesmo com erros, identificar visualmente onde está o problema e corrigir iterativamente. Parar tudo em erro de parsing seria inviável para documentos longos.

---

## 9. Temas visuais

### 9.1 Origem dos temas

**Ideia inicial:** Um único tema `essay` (já existente como exemplo compilado).

**Evolução:** Quatro temas, cada um com personalidade visual distinta e inspirado em uma referência real.

| Tema | Inspiração | Tipografia | Paleta |
|---|---|---|---|
| `essay` | Exemplo editorial original | Playfair Display + Lora | Escuro neutro |
| `ink` | `blog.html` (jornal impresso) | Playfair Display + Libre Baskerville | Creme + ferrugem |
| `modern` | `social.html` (app contemporâneo) | IBM Plex Sans | Escuro + violeta `#7c6aff` |
| `amber` | `editor.html` (editor literário) | Cormorant Garamond + Raleway | Escuro quente + âmbar `#c8913a` |

### 9.2 Nomenclatura

**Evolução dos nomes:**
- `retro` → renomeado para `ink` (mais preciso, evoca tinta de impressão)
- `modern` mantido
- `amber` criado quando `editor.html` foi adicionado como quarta referência

**Justificativa:** `ink` comunica a personalidade do tema (jornal, papel, tinta) melhor do que `retro`, que é vago. `amber` comunica a cor dominante e a atmosfera quente do tema.

### 9.3 Comportamento dos temas no compilador

**Ideia inicial:** `theme` no frontmatter define o tema único de saída.

**Modificação:** O compilador sempre gera os 4 temas embutidos no HTML. O campo `theme` define apenas o tema **padrão** na primeira abertura.

**Motivação:** Surgiu a ideia de um switcher de temas no header do documento compilado, o que tornou a compilação de tema único menos interessante.

**Switcher:**
- 4 botões (`essay`, `ink`, `modern`, `amber`)
- Herda variáveis CSS do tema ativo (`var(--accent)`, `var(--text)`, `var(--border)`)
- Tema persistido em `localStorage`

**Justificativa:** O switcher adaptativo (que herda CSS do tema ativo) foi preferido a um switcher de estilo fixo porque cada tema tem identidade visual forte — um switcher genérico pareceria fora de lugar em pelo menos dois dos temas.

### 9.4 Variantes light

**Decisão:** Variantes light (`essay-light`, `ink-light`, `modern-light`, `amber-light`) foram planejadas mas deixadas para versão posterior.

**Justificativa:** Quatro temas escuros já formam um conjunto coeso e completo para v1. As variantes light adicionam complexidade de implementação sem valor proporcional na primeira versão.

---

## 10. Modos de compilação

### 10.1 Motivação

**Problema identificado:** O compilador gerava um HTML autônomo (`<html>`, `<head>`, `<body>`, switcher). Num site maior, isso conflita com o CSS do site, o switcher não faz sentido no contexto de uma página existente, e o HTML completo não pode ser embarcado como fragmento.

### 10.2 Decisão: dois modos

```
compile: standalone   →  documento HTML completo e autônomo (padrão)
compile: fragment     →  fragmento <article> para integração
```

**Saída standalone:**
- `title.html` — página completa com switcher e `localStorage`
- `title.css` — escopo via `[data-theme]` no `<html>`

**Saída fragment:**
- `title.html` — apenas `<article class="tmd-document tmd-theme-{tema}">` e conteúdo
- `title.css` — escopo via `.tmd-theme-{nome}` no `<article>` para não vazar no CSS do site

**Diferença de escopo CSS:**
```css
/* standalone */
[data-theme="essay"] { --tmd-accent: ... }

/* fragment */
.tmd-theme-essay { --tmd-accent: ... }
```

**Justificativa:** A diferença de seletor é necessária porque no modo fragment o `<html>` pertence ao site externo — o TMD não pode assumir controle desse elemento. No modo fragment, o `<article>` é o único elemento sob controle do TMD.

### 10.3 Ausente ou inválido → standalone

**Justificativa:** Standalone é o comportamento mais esperado para quem não declarou nada. Fragment é uma decisão consciente de integração.

### 10.4 Saída sempre dois arquivos

**Decisão:** O compilador sempre gera `title.html` e `title.css`, independente do modo.

**Justificativa:** Unificar a lógica de saída simplifica o compilador. O que muda entre os modos é o *conteúdo* dos arquivos, não a quantidade.

**Naming:** `title` é o campo `title` do frontmatter sanitizado como slug. Se ausente, usa o nome do arquivo `.tmd`.

---

## 11. `.config.tmd.json`

### 11.1 Motivação

**Problema:** Para projetos com múltiplos arquivos, repetir `theme:` e `compile:` em cada frontmatter é verboso. Além disso, não havia como o usuário criar temas customizados.

### 11.2 Estrutura

```json
{
  "defaultTheme": "essay",
  "defaultCompile": "standalone",
  "themes": {
    "midnight": {
      "extends": "essay",
      "vars": {
        "--tmd-bg": "#080810",
        "--tmd-accent": "#a78bfa"
      }
    }
  }
}
```

**Campos:**
- `defaultTheme` — tema padrão global, sobrescrito pelo `theme:` do frontmatter
- `defaultCompile` — modo padrão global, sobrescrito pelo `compile:` do frontmatter
- `themes` — mapa de temas customizados

### 11.3 Temas customizados

**Decisão:** Nível 1 apenas — os temas customizados só sobrescrevem variáveis CSS do tema base declarado em `extends`. A estrutura HTML e a lógica do compilador não mudam.

**Justificativa:** Nível 2 (template HTML livre) abriria uma caixa de pandora de manutenção. O `extends` garante que o tema customizado herda tudo do base e só redefine o que declara — mínima fricção para o usuário.

### 11.4 Os 4 temas base são internos ao compilador

**Decisão:** Os temas `essay`, `ink`, `modern` e `amber` estão embutidos no compilador. O `.config.tmd.json` só adiciona temas por cima deles.

**Justificativa:** O usuário não precisa do config para usar os 4 temas base. O config é inteiramente opcional.

### 11.5 Detecção automática

**Decisão:** O compilador detecta `.config.tmd.json` na raiz do projeto automaticamente. Flag `--config` disponível para sobrescrever o caminho.

**Justificativa:** Convenção sobre configuração — igual ao que `prettier`, `eslint` e outros fazem. Comportamento esperado sem necessidade de instrução extra.

### 11.6 Hierarquia de precedência

```
.config.tmd.json  →  frontmatter do arquivo  →  padrão hardcoded
```

**Justificativa:** O frontmatter de cada arquivo é mais específico que o config global, e o config é mais específico que os padrões do compilador.

---

## 12. CLI

### 12.1 Comandos

```bash
tmd compile <alvo>   # arquivo .tmd ou diretório
tmd init             # cria .config.tmd.json com valores padrão
```

### 12.2 Estrutura de saída

**Decisão:** `dist/{slug}/{slug}.html` + `dist/{slug}/{slug}.css`

**Saída achatada:** Quando compilando um diretório, subdiretórios são ignorados na estrutura de saída — todos os slugs vão direto para `dist/`.

**Justificativa:** Saída achatada evita que a hierarquia de pastas da fonte vaze para o output, o que simplifica deployments e links entre documentos.

### 12.3 Sanitização de slug

Regras aplicadas ao `title` para gerar o nome da pasta e dos arquivos:

1. Converter para minúsculas
2. Remover acentos e diacríticos (NFD)
3. Substituir espaços por `-`
4. Remover caracteres não-ASCII, não-numéricos e não-`-`
5. Colapsar múltiplos `-`
6. Remover `-` nas bordas

Fallback: se `title` está ausente, usa o nome do arquivo `.tmd`.

### 12.4 Colisão de slugs

**Decisão:** Se dois arquivos geram o mesmo slug, o compilador emite erro no terminal, pula o segundo arquivo e continua compilando os demais.

**Justificativa:** Parar toda a compilação por colisão seria desproporcional. O erro é reportado claramente e o restante do trabalho é preservado.

### 12.5 Flag `--watch`

**Comportamento:**
- Compilação completa inicial ao iniciar
- Monitora mudanças em `.tmd` e no `.config.tmd.json`
- Mudança em `.tmd` → recompila apenas aquele arquivo
- Mudança em `.config.tmd.json` → recompila todos os arquivos do alvo
- Arquivos novos adicionados durante o watch → **ignorados**
- Erros de parsing não encerram o processo

**Justificativa para ignorar arquivos novos:** Detectar e compilar arquivos novos durante o watch introduz complexidade de gerenciamento de estado (slugs novos, possíveis colisões). Para v1, o usuário reinicia o watch ou compila manualmente o arquivo novo.

### 12.6 `tmd init`

**Decisão:** Cria `.config.tmd.json` com valores padrão. Se já existir, emite aviso e não sobrescreve.

**Justificativa:** Proteção contra sobrescrita acidental de configuração existente.

### 12.7 Exit codes

```
0   compilação sem erros
1   um ou mais erros de parsing ou colisão de slug (compilou o que conseguiu)
2   erro fatal — diretório não encontrado, config inválido, etc.
```

**Justificativa:** Exit codes bem definidos permitem integração em pipelines de CI/CD. A distinção entre 1 (erro recuperável, output parcial gerado) e 2 (erro fatal, nenhum output) é essencial para automação.

---

## 13. Assets (imagens)

### 13.1 Problema

Quando um `.tmd` referencia `./img/gauss.jpg` e o compilador gera `dist/meu-artigo/meu-artigo.html`, o caminho relativo fica quebrado.

### 13.2 Decisão: copiar assets automaticamente (Opção A)

O compilador copia automaticamente todos os assets de imagem para `dist/{slug}/img/` e reescreve os caminhos no HTML.

**Escopo de detecção:** Todas as imagens no documento, independente de contexto:
- Imagens na linha de abertura de blocos `|>*>`, `|>*>wrap`, `|>*<`, `|>*<wrap`
- Imagens em markdown comum (`![alt](caminho)`) em qualquer ponto do documento, incluindo interior de blocos de conteúdo

**Resolução de caminho:** Sempre relativo ao arquivo `.tmd` de origem.

**Justificativa:** Opção A (cópia automática) é mais amigável que Opção B (ajuste de caminho sem cópia) ou Opção C (apenas URLs absolutas). O autor escreve o caminho relativo ao arquivo que está editando — comportamento natural — e o compilador cuida do resto.

### 13.3 Imagem não encontrada

Se o caminho referenciado não existir:
1. Erro reportado no terminal
2. Bloco de erro visual no lugar da imagem no HTML
3. Exit code `1` (compila o resto normalmente)

```
┌─────────────────────────────────────────┐  ← fundo vermelho semitransparente
  --ERROR BLOC--
  ./img/foto-inexistente.jpg
  --ERROR BLOC--
└─────────────────────────────────────────┘
```

**Justificativa:** Consistente com o comportamento geral de erro — compilação parcial com marcação visual clara do problema.

---

## 14. Estado atual da spec (v1.3 / v1.4)

O conjunto de specs no momento atual é:

| Arquivo | Versão | Escopo |
|---|---|---|
| `tmd-spec.md` | v1.3 | Linguagem, sintaxe, frontmatter, compilador, config |
| `tmd-parser-spec.md` | v1.4 | Pipeline de parsing, AST, erros |
| `tmd-html-theme-spec.md` | v1.4 | HTML gerado, CSS, temas, responsividade |
| `tmd-cli-spec.md` | v1.1 | Comandos, flags, slug, assets, exit codes |
| `tmd-vscode-extension-spec.md` | v1.2 | Grammar TextMate, highlight, escopos |

---

## 15. Princípios de design que guiaram todas as decisões

Ao longo de todas as discussões, quatro princípios apareceram repetidamente e guiaram as escolhas:

**1. Legibilidade em estado bruto**
O arquivo `.tmd` deve ser legível mesmo sem renderização. Toda sintaxe adicionada foi avaliada por esse critério.

**2. Só vale criar sintaxe nova para o que o Markdown não consegue expressar**
Se `##`, `>`, listas ou blocos de código resolvem o problema, eles devem ser usados. Tokens novos existem apenas para semântica que o Markdown não tem.

**3. Compilação parcial é melhor que falha total**
Erros de parsing não impedem a saída. O documento é compilado com marcação visual dos problemas, permitindo iteração rápida do autor.

**4. Separação entre estrutura e apresentação**
O parser decide o que um bloco é. O tema decide como ele aparece. O compilador não mistura as duas responsabilidades.
