# Refatoração do exemplo para TMD

Conteúdo do pacote:

- `fonte/custom-markdown-example-refatorado.tmd` — versão refatorada do arquivo original, agora compatível com a sintaxe oficial descrita nas specs
- `fonte/img/` — imagens SVG locais usadas pelos blocos de imagem e pela imagem Markdown comum
- `saida/saida.html` — exemplo de saída HTML standalone
- `saida/saida.css` — exemplo de folha de estilos para a saída
- `saida/img/` — assets usados pelo HTML de exemplo

Observações:

- A refatoração cobre frontmatter, markdown comum, escape de linha, bloco literal multilinha, todos os blocos da família de conteúdo e todos os modos da família de imagem.
- O HTML foi montado como uma saída editorial plausível seguindo as classes e estruturas sugeridas pela spec de tema HTML.
