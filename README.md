# ToddyMarkDown (TMD)

[🇺🇸 English Version](#english-version) | [🇧🇷 Versão em Português](#-versão-em-português)

---

## 🇺🇸 English Version

**ToddyMarkDown (TMD)** is a semantic evolution of traditional Markdown focused on **rich editorial writing, structured essays, and advanced technical documentation**.

It allows you to map sophisticated visual elements (like highlighted pullquotes, timelines, and text wrapping around lateral images) using **Special Blocks**, without polluting the syntax and keeping the lightness of a plain text file.



### Key Features
*   **Pure Markdown First:** The core principle is that a `.tmd` file must be highly readable in its raw state. Standard Markdown works everywhere inside and outside blocks.
*   **Special Content Blocks:** Adds semantic value with `explainer` (`!`), `pullquote` (`@`), `aside` (`$`), `note` (`#`), `warning` (`##`), `timeline` (`~~`), `question` (`?`), `takeaway` (`+`), and `concept` (`&`) blocks.
*   **Editorial Image Diagramming:** Control image positioning (`*>` for right, `*<` for left) and allow text to geometrically flow around them using `*>wrap` and `*<wrap`.
*   **Built-in Themes:** Comes with out-of-the-box CSS themes (`essay`, `ink`, `modern`, `amber`). Custom themes can be added via the `.config.tmd.json` file.
*   **Integration Modes:** Compile as a `standalone` HTML document (with a native theme switcher) or as a `fragment` (`<article>`) to be seamlessly embedded in JAMStack sites.
*   **Fault-Tolerant Parser:** Parsing errors do not stop compilation. Instead, an `ErrorBlock` is generated, rendering a visual red warning in the HTML so you can fix it without losing your workflow.



### Installation and Usage

**1. Installation**
During development (global installation to register the `tmd` command in PATH):
```bash
npm run build
npm install -g .
```
Or use it as a project dependency:
```bash
npm install tmd --save-dev
```

**2. Project Initialization**
Create a default `.config.tmd.json` configuration file (use `npx tmd init` if installed locally):
```bash
tmd init
```

**3. Compile a File**
Generate the output in the `dist/` folder (default) or specify a custom directory:
```bash
tmd compile my-article.tmd
tmd compile my-article.tmd --out ./public
```

**4. Compile a Directory (and Watch Mode)**
Compile all files from a directory into a flattened output folder and/or start real-time monitoring:
```bash
tmd compile ./articles/
tmd compile ./articles/ --out ./public --watch
```



### Extension Installation (.vsix)

1. Open a terminal pointing to the extension folder (`tmd-vscode-extension`).

2. Globally install the official Microsoft packaging tool by running:
```bash
npm install -g @vscode/vsce
```
3. With the package installed, run the command below to "build" the extension:
```bash
vsce package
```
*If everything goes well, this will generate a file called `toddymarkdown-0.2.0.vsix` in the folder.*
4. Go back to VS Code:

- Open the Extensions tab (shortcut `Ctrl+Shift+X`).

- Click on the 3 dots `...` in the upper right corner of the Extensions menu.

- Choose the option **"Install from VSIX..."** ("Install from VSIX...").

5. Navigate to the folder, select the `.vsix` file that was created, and the installation will be complete. Now, whenever you open a `.tmd` file in your main editor, the coloring will work automatically.



### Syntax Quickstart

**Content Blocks** are delimited by `|>{token}` and `<|`:

```markdown
|>@
"This is a strictly formatted pullquote."
- Author Name
<|

|>$ [Optional Title]
This is an aside block with **Markdown** inside!
<|
```



---

## 🇧🇷 Versão em Português

O **ToddyMarkDown (TMD)** é uma evolução semântica do Markdown tradicional focada em **escrita editorial rica, ensaios estruturados e documentação técnica avançada**.

Ele permite diagramar elementos visuais sofisticados (como citações destacadas, linhas do tempo e texto "abraçando" imagens laterais) através de **Blocos Especiais**, sem poluir a sintaxe e mantendo a leveza de um arquivo longo de texto puro.



### Principais Funcionalidades
*   **Markdown Puro em Primeiro Lugar:** O princípio central é que um arquivo `.tmd` deve ser altamente legível em estado bruto. O Markdown tradicional funciona em toda parte, interna e externamente aos blocos.
*   **Blocos Especiais de Conteúdo:** Adiciona valor semântico com blocos do tipo `explainer` (`!`), `pullquote` (`@`), `aside` (`$`), `note` (`#`), `warning` (`##`), `timeline` (`~~`), `question` (`?`), `takeaway` (`+`) e `concept` (`&`).
*   **Diagramação Editorial de Imagens:** Controle o posicionamento da imagem (`*>` para direita, `*<` para esquerda) e permita que o texto flua ao redor delas organicamente através do `*>wrap` e `*<wrap`.
*   **Temas Embutidos:** Vem com temas CSS prontos para uso (`essay`, `ink`, `modern`, `amber`). Temas customizados podem ser adicionados no arquivo `.config.tmd.json`.
*   **Modos de Integração:** Compile como um documento HTML `standalone` (com um seletor nativo de tema no topo) ou como um `fragment` (`<article>`) para ser facilmente embutido em sites JAMStack.
*   **Parser Tolerante a Falhas:** Erros de sintaxe não param a compilação. Em vez disso, um `ErrorBlock` é gerado, renderizando um aviso vermelho no HTML para que você possa corrigir visualmente sem perder todo o seu trabalho.



### Como Instalar e Usar

**1. Instalação**
Durante o desenvolvimento (instalação global para registrar o comando `tmd` no PATH):
```bash
npm run build
npm install -g .
```
Ou use como dependência de projeto:
```bash
npm install tmd --save-dev
```

**2. Inicialização do Projeto**
Crie um arquivo de configuração padrão `.config.tmd.json` (use `npx tmd init` se instalado localmente):
```bash
tmd init
```

**3. Compilar um Arquivo**
Gere a saída na pasta `dist/` (padrão) ou especifique um diretório customizado:
```bash
tmd compile meu-artigo.tmd
tmd compile meu-artigo.tmd --out ./public
```

**4. Compilar um Diretório (e Modo Watch)**
Compile todos os arquivos de uma pasta de saída achatada e/ou inicie o monitoramento em tempo real:
```bash
tmd compile ./artigos/
tmd compile ./artigos/ --out ./public --watch
```



### Instalação da Extensão (.vsix)

1. Abra um terminal apontando para a pasta da extensão (`tmd-vscode-extension`).
2. Instale globalmente a ferramenta de empacotamento oficial da Microsoft rodando:
```bash
npm install -g @vscode/vsce
```
3. Com o pacote instalado, rode o comando abaixo para "buildar" a extensão:
```bash
vsce package
```
*Se der tudo certo, isso vai gerar um arquivo chamado `toddymarkdown-0.2.0.vsix` na pasta.*
4. Volte para o VS Code:
- Abra a aba de Extensões (atalho `Ctrl+Shift+X`).
- Clique nos 3 pontinhos `...` no canto superior direito do menu de Extensões.
- Escolha a opção **"Install from VSIX..."** ("Instalar do VSIX...").
5. Navegue até a pasta, escolha o arquivo `.vsix` que foi criado, e a instalação estará concluída. Agora sempre que abrir um `.tmd` no seu editor principal, a coloração funcionará automaticamente.



### Guia Rápido de Sintaxe

**Blocos de Conteúdo** são delimitados por `|>{token}` e `<|`:

```markdown
|>@
"Isto é uma citação destacada (pullquote) estritamente formatada."
- Nome do Autor
<|

|>$ [Título Opcional]
Isto é um bloco aside (informação secundária) com **Markdown** dentro!
<|
```
