# ToddyMarkDown (`.tmd`) — tmd-cli-spec v1.1

## Objetivo

Este documento define a especificação da interface de linha de comando do compilador ToddyMarkDown.

Ele cobre:

- comandos disponíveis
- flags e opções
- estrutura de saída
- regras de sanitização de nomes
- comportamento de erro e colisão
- exit codes
- comportamento do modo watch

O foco aqui não é o parser nem o HTML gerado. O foco é como o usuário invoca o compilador e o que ele pode esperar como resultado.

---

## Comandos disponíveis

```txt
tmd compile <alvo>   compila um arquivo .tmd ou um diretório
tmd init             cria .config.tmd.json na raiz do projeto
```

---

# Comando `tmd compile`

## Forma geral

```bash
tmd compile <alvo> [flags]
```

`<alvo>` pode ser:

- um arquivo `.tmd` individual
- um diretório contendo arquivos `.tmd`

---

## Compilando um arquivo

```bash
tmd compile ensaio.tmd
```

Fluxo:

1. lê `ensaio.tmd`
2. detecta `.config.tmd.json` na raiz do projeto (ou usa `--config`)
3. faz o parse do arquivo
4. sanitiza o título para gerar o slug (ver seção Sanitização)
5. cria `dist/` se não existir
6. cria `dist/{slug}/` se não existir
7. gera `dist/{slug}/{slug}.html` e `dist/{slug}/{slug}.css`

Exemplo de saída:

```
dist/
  o-algoritmo-invisivel/
    o-algoritmo-invisivel.html
    o-algoritmo-invisivel.css
```

---

## Compilando um diretório

```bash
tmd compile ./artigos/
```

Fluxo:

1. varre o diretório recursivamente buscando todos os arquivos `.tmd`
2. para cada arquivo encontrado, executa o mesmo fluxo de `tmd compile arquivo.tmd`
3. **a estrutura de diretórios da fonte é achatada** — toda saída vai direto para `dist/`, independentemente da profundidade do arquivo original
4. se dois slugs colidirem, emite erro no terminal e pula o segundo arquivo; o restante compila normalmente

Exemplo:

```
artigos/
  ciencia/
    fourier.tmd        → dist/fourier/
  cultura/
    gauss.tmd          → dist/gauss/
  raiz.tmd             → dist/raiz/
```

---

## Flags

### `--out <caminho>`

Sobrescreve `dist/` como diretório de saída.

```bash
tmd compile ensaio.tmd --out ./public
# saída: ./public/{slug}/
```

Se o diretório não existir, é criado automaticamente.

---

### `--config <caminho>`

Sobrescreve a detecção automática do `.config.tmd.json`.

```bash
tmd compile ensaio.tmd --config ./configs/meu-config.json
```

Se o arquivo não for encontrado no caminho fornecido, emite erro fatal (exit code `2`).

---

### `--watch`

Ativa o modo watch. O compilador monitora o alvo e recompila automaticamente ao detectar mudanças.

```bash
tmd compile ensaio.tmd --watch
tmd compile ./artigos/ --watch
```

Comportamento:

- ao iniciar, executa uma compilação completa do alvo
- depois monitora alterações em arquivos `.tmd` e no `.config.tmd.json`
- ao detectar mudança em um arquivo, recompila apenas aquele arquivo
- ao detectar mudança no `.config.tmd.json`, recompila todos os arquivos do alvo
- erros de parsing no watch não encerram o processo — são reportados no terminal e o compilador continua aguardando
- o processo é encerrado com `Ctrl+C` (exit code `0`)

---

## Combinando flags

As flags podem ser combinadas livremente:

```bash
tmd compile ./artigos/ --out ./public --config ./tmd.config.json --watch
```

---

# Assets — cópia e resolução de caminhos

O compilador detecta e copia automaticamente todos os assets de imagem referenciados em um arquivo `.tmd`, sejam eles:

- imagens na linha de abertura de blocos da família imagem (`|>*>`, `|>*>wrap`, `|>*<`, `|>*<wrap`)
- imagens em markdown comum (`![alt](caminho)`) em qualquer ponto do documento — corpo principal ou interior de blocos de conteúdo

## Resolução de caminho

O caminho da imagem é sempre resolvido **relativo ao arquivo `.tmd`** que o referencia.

```
artigos/ciencia/fourier.tmd referencia ./img/diagrama.png
→ arquivo de origem:  artigos/ciencia/img/diagrama.png
→ copiado para:       dist/fourier/img/diagrama.png
→ caminho no HTML:    ./img/diagrama.png
```

## Estrutura de saída com assets

```
dist/
  fourier/
    fourier.html
    fourier.css
    img/
      diagrama.png
      gauss.jpg
```

## Imagem não encontrada

Se o caminho referenciado não existir no sistema de arquivos:

1. **Terminal** — erro reportado com o caminho e o arquivo `.tmd` de origem
2. **HTML** — bloco de erro visual no lugar da imagem (ver tmd-html-theme-spec)
3. **Exit code** — `1` (compila o que conseguiu, continua para os demais arquivos)

## Modo `--watch` e assets

No modo watch, o compilador monitora apenas arquivos `.tmd` e o `.config.tmd.json`. Assets não são monitorados — se uma imagem mudar no disco, o usuário recompila manualmente ou reinicia o watch.

Arquivos `.tmd` adicionados ao diretório durante o watch são **ignorados** — o watch só reage a mudanças em arquivos que já existiam quando o processo foi iniciado.

---

# Sanitização de títulos (slug)

O slug é derivado do campo `title` no frontmatter.

## Regras de sanitização

1. converter para minúsculas
2. remover acentos e diacríticos (normalizar para NFD e remover marcas)
3. substituir espaços por `-`
4. remover caracteres que não sejam letras ASCII, números ou `-`
5. colapsar múltiplos `-` consecutivos em um único `-`
6. remover `-` no início e no fim

## Exemplos

```txt
"O Algoritmo Invisível que Governa o Mundo"  →  o-algoritmo-invisivel-que-governa-o-mundo
"Gauss & Fourier: Uma História"              →  gauss-fourier-uma-historia
"  espaços nas bordas  "                     →  espacos-nas-bordas
"já---muitos---hífens"                       →  ja-muitos-hifens
```

## Fallback: título ausente

Se o campo `title` não estiver no frontmatter, o compilador usa o **nome do arquivo `.tmd`** (sem extensão) como base para o slug, aplicando as mesmas regras de sanitização.

```bash
fourier_moderno.tmd  →  slug: fourier-moderno
```

---

# Colisão de slugs

Ocorre quando dois arquivos distintos produzem o mesmo slug após sanitização.

## Comportamento

1. o primeiro arquivo encontrado compila normalmente
2. ao encontrar o segundo arquivo com slug idêntico, o compilador:
   - emite erro no terminal indicando os dois arquivos envolvidos e o slug em conflito
   - **pula** o segundo arquivo sem sobrescrever o primeiro
   - continua compilando os demais arquivos normalmente

## Exemplo de mensagem de erro

```
[ERRO] Colisão de slug: "o-gauss"
  → já compilado: artigos/O Gauss.tmd
  → ignorado:     artigos/o gauss.tmd
```

---

# Comando `tmd init`

```bash
tmd init
```

Cria um arquivo `.config.tmd.json` na raiz do diretório atual com valores padrão.

## Arquivo gerado

```json
{
  "defaultTheme": "essay",
  "defaultCompile": "standalone",
  "themes": {}
}
```

## Comportamento

- se já existir um `.config.tmd.json` no diretório, emite aviso no terminal e **não sobrescreve**
- não aceita flags adicionais na v1

---

# Exit codes

```txt
0   compilação concluída sem erros
1   compilação concluída com um ou mais erros de parsing ou colisão de slug
        (o compilador processou tudo que conseguiu)
2   erro fatal — compilação não realizada
        exemplos: diretório não encontrado, --config aponta para arquivo inexistente,
        .config.tmd.json com JSON inválido
```

---

# Mensagens de terminal

## Compilação bem-sucedida (exit 0)

```
[OK]   dist/o-algoritmo-invisivel/o-algoritmo-invisivel.html
[OK]   dist/o-algoritmo-invisivel/o-algoritmo-invisivel.css
```

## Erro de parsing (exit 1)

```
[ERRO] ensaio.tmd · linha 42 · PullQuote sem linha de citação entre aspas
[OK]   dist/ensaio/ensaio.html  (compilado com bloco de erro embutido)
[OK]   dist/ensaio/ensaio.css
```

## Erro fatal (exit 2)

```
[FATAL] Diretório não encontrado: ./artigos/
```

## Imagem não encontrada (exit 1)

```
[ERRO] fourier.tmd · imagem não encontrada: ./img/diagrama.png
[OK]   dist/fourier/fourier.html  (compilado com bloco de erro embutido)
[OK]   dist/fourier/fourier.css
```

```
[WATCH] Monitorando ./artigos/ — Ctrl+C para encerrar
[OK]    dist/fourier/fourier.html
[MUDANÇA] fourier.tmd
[OK]    dist/fourier/fourier.html
```

---

# Resumo de comportamentos padrão

| Situação | Comportamento |
|---|---|
| `--out` ausente | saída em `dist/` |
| `--config` ausente | detecta `.config.tmd.json` na raiz |
| `title` ausente no frontmatter | usa nome do arquivo `.tmd` |
| `compile` ausente ou inválido | usa `standalone` |
| `theme` ausente ou inválido | usa `essay` |
| diretório `dist/` inexistente | criado automaticamente |
| colisão de slug | erro + pula o segundo + continua |
| `tmd init` com config existente | aviso + não sobrescreve |
| imagem encontrada | copiada para `dist/{slug}/img/` |
| imagem não encontrada | erro no terminal + bloco de erro no HTML + exit 1 + continua |
| arquivo `.tmd` novo adicionado durante `--watch` | ignorado |

---

# Changelog

## v1.1
- Seção de assets adicionada: cópia automática para `dist/{slug}/img/`, resolução relativa ao arquivo `.tmd`
- Escopo de detecção de imagens: todos os `![](caminho)` no documento, incluindo markdown comum e interior de blocos
- Comportamento de imagem não encontrada: erro no terminal + bloco de erro no HTML + exit 1 + continua
- Modo watch: arquivos novos adicionados durante o watch são ignorados; assets não são monitorados
- Tabela de resumo atualizada com comportamentos de assets e watch

## v1.0
- Versão inicial
- Comandos `tmd compile` e `tmd init` documentados
- Flags `--out`, `--config`, `--watch` documentadas
- Estrutura de saída: `dist/{slug}/{slug}.html` + `dist/{slug}/{slug}.css`
- Diretório achatado: subdiretórios da fonte não são espelhados no `dist/`
- Regras de sanitização de slug documentadas com exemplos
- Fallback de título ausente: nome do arquivo `.tmd`
- Comportamento de colisão de slug documentado
- Exit codes `0`, `1`, `2` definidos
- Padrões de mensagem de terminal documentados
