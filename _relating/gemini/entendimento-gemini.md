# O que entendi sobre o projeto ToddyMarkDown (TMD)

Após analisar de forma abrangente toda a documentação das versões 1.x (parser v1.4, theme v1.4, cli v1.1, vscode v1.2 e spec v1.3) no diretório `_docs/tmd-spec/`, consolidei meu entendimento atualizado sobre a arquitetura, regras e conceitos do ecossistema ToddyMarkDown.

## 1. Visão Geral do ToddyMarkDown (TMD)
O ToddyMarkDown (arquivos `.tmd`) é uma evolução semântica do Markdown tradicional focada em **escrita editorial rica, ensaios estruturados e documentação técnica avançada**. O grande atrativo da linguagem é a capacidade de diagramar elementos visuais sofisticados (como citações destacadas, linhas do tempo e texto "abraçando" imagens laterais) através dos **Blocos Especiais** (`|>` e `<|`), sem poluir a sintaxe e mantendo a leveza de um arquivo longo de texto puro.

## 2. A Arquitetura do Ecossistema
O funcionamento interno se separa em áreas de atuação bem delimitadas (uma base funcional inspirada em pureza e isolamento de escopo):

1.  **Extensão VS Code (`tmd-vscode-extension`):**
    *   Um pacote paralelo, puramente estético e visual, não fazendo parsing estrutural rigoroso.
    *   Emprega TextMate grammars para identificar blocos, literais e *frontmatter*, categorizando-os semanticamente para destacar delimitadores (magenta), tokens (dourado) e estrutura do markdown. A premissa é legibilidade visual da estrutura limpa, não transformar a tela num "carro alegórico".
2.  **O Compilador CLI:**
    *   O "orquestrador" de disco e interface (I/O). Exerce os comandos `compile` e `init`, além do modo `--watch`.
    *   Lida ativamente com a leitura e cópia atômica de *assets* (imagens relativas ao arquivo font `.tmd` sendo colocadas em `dist/{slug}/img/`).
    *   Resolve colisões de slug (ex: dois artigos com o mesmo título pulam a segunda compilação ao invés de sobrescrever incorretamente).
3.  **O Parser (Espinha Dorsal):**
    *   O parser é rígido, "burro" quanto a suposições automáticas e altamente determinístico. Opera em duplo nível: reconhece a estrutura das entidades TMD e só depois passa o interior para ser lícito ao Markdown tradicional.
    *   Possui uma **ordem estrita de leitura**: normaliza quebras, processa o *frontmatter* no topo, identifica e resolve blocos literais (`/>` e `<\`) e strings escapadas (`\`) e só então avalia possíveis blocos em família.
4.  **Renderizadores (HTML / CSS):**
    *   Obedece fortemente o modo de compilação vindo do Frontmatter/Config (`standalone` ou `fragment`). 
    *   O CSS é modular, aplicando suas regras em escopos de temas (`essay`, `ink`, `modern`, `amber` ou temas customizados do `.config.tmd.json`). No modo standalone é um documento web completo com alternador nativo no `<header>`; no fragmento, emite apenas o `<article>` e seu conteúdo limpo para a JAMStack.

## 3. Elementos, Estrutura e Famílias
Além das blindagens (*escapes* literais e multilinha) que protegem partes do documento contra reprocessamento não intencional, os blocos da linguagem dividem-se em duas famílias principais:

### A) Família 1 — Conteúdo
Suportam toda a linguagem Markdown tradicional interna (listas, negritos) e dão estrutura visual. Exceção é o *Pullquote*, que apenas aceita inline-markdown.
- `|>` **`!`** : **Explainer** (Contextualizar assuntos complexos)
- `|>` **`@`** : **Pullquote** (Citações proeminentes estritas com obrigatoriedade de aspas textuais e autor opcional prefixado por `-`)
- `|>` **`$`** : **Aside** (Dados discretos secundários)
- `|>` **`#`** / **`##`** : **Note** e **Warning** (Advertências visuais diferenciadas)
- `|>` **`?`** / **`+`** / **`&`** : **Question, Takeaway e Concept** (Destaque para indagar, sintetizar ideias ou descrever fichas de conceito).
- `|>` **`~~`**: **Timeline** (Mescla eventos formatados em dupla til com markdown fluido transcorrendo entre as linhas do tempo)

### B) Família 2 — Imagens (Diagramação Editorial)
Traz o layout clássico de revistas à tona:
- Sintaxe base: `|>*modo [titulo opcional] ![legenda obrigatória](caminho_imagem)`
- Modos direcionais `*>` e `*<` colocam as imagens formatadas aos cantos, com seus equivalentes `*>wrap` e `*<wrap` permitindo que o corpo textual contorne o objeto geometricamente e flua de maneira orgânica ao redor.

## 4. Robustez e Tratamento de Erros
Se formos mensurar um pilar forte do sistema recém-atualizado: é a falha segura. 
Quando a regra não é respeitada (ex: um pullquote sem aspas, um token que não existe, ou um _path_ de imagem ausente do SSD), **o projeto não paralisa**:
1. Acusa o Erro com a linha exata no fluxo `stderr`/Terminal.
2. O parser em vez de anular a AST, substitui o pedaço defeituoso originando um nó explícito tipo `ErrorBlock` constando a *raw text* da falha ou imagem que faltou.
3. Isso renderiza dentro do HTML gerado como uma caixa avermelhada translúcida emulando um aviso estrito delimitado por `--ERROR BLOC--`. Assim, o escritor não perde 40 páginas compiladas por conta da ausência acidental de um caracter num parágrafo irrelevante e facilmente corrige na visualização a posteriori, gerando no final uma *exit code 1* como alerta pro CI.

## 5. Resumo das Regras Profundas Orientativas
Ao programar/manter novas áreas atente-se ao seguinte contrato:
*   **Responsabilidade restrita a camadas sem salto (No-crossing):** O Parser não lê o tamanho das imagens nem aplica *defaults* CSS; o Renderer do HTML não escreve os arquivos do HD, nem a *tmd-cli* se baseia em adivinhação semântica. O E/S fica no CLI; a lógica pura no Meio;
*   **A "Fonte" é sagrada:** A prioridade é sempre garantir a máxima inteligibilidade das diretivas durante a leitura em modo texto do desenvolvedor.
*   **As Configurações seguem hierarquia rígida:** `Frontmatter > .config.tmd.json > valores hardcoded (essay/standalone)`.

Esse foi o refinamento baseado nos specs recém analisados. O ToddyMarkDown foca profundamente num editor sem adornos mágicos, pragmático e blindado contra interrupções de fluxo de criadores de conteúdo long-form.
