# Changelog

Todas as mudanças relevantes do Ovometro são documentadas neste arquivo.

O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-10-06

### Adicionado

- Versão inicial pública do Ovometro, experimento independente de
  visualização de dados sobre o preço de uma caixa de 30 ovos em um
  mercado pesquisado na região de Goiânia, Goiás.
- Página única, estática, sem backend, sem banco de dados e sem
  processo de build.
- Seção de **Cotação do Ovo** com o preço mais recente carregado
  dinamicamente a partir de `data.json`.
- Cálculo automático da variação em relação à cotação anterior
  (diferença absoluta e percentual), com indicação visual de alta,
  queda e estabilidade.
- Comparação aproximada com a cotação da semana anterior, quando há
  dados suficientes disponíveis.
- Gráfico histórico de linha interativo (Chart.js), com escala
  temporal real no eixo X e adaptador de datas `date-fns`.
- Filtros de período no gráfico: **Total**, **2 anos**, **1 ano**
  (padrão), **6 meses** e **3 meses**, sempre tomando como referência
  a data mais recente do conjunto de dados.
- Interação por clique em pontos do gráfico, exibindo abaixo da
  visualização os acontecimentos relacionados àquela data.
- Área de **Acontecimentos relacionados** com manchetes clicáveis,
  abertas em nova aba com `target="_blank"` e
  `rel="noopener noreferrer"`.
- Seção **Sobre** explicando o caráter independente e experimental do
  projeto, a origem dos dados e a ausência de qualquer afirmação de
  causalidade entre notícias e variações de preço.
- Layout responsivo mobile-first, com identidade visual laranja e
  branca, ícone de ovo em SVG e navbar Bootstrap colapsável.
- Tratamento de erros para JSON ausente, inválido, vazio ou com dados
  insuficientes, sempre com mensagens amigáveis ao usuário.
- Boas práticas de acessibilidade: HTML semântico, ARIA quando
  necessário, foco de teclado visível e informação de alta/queda que
  não depende exclusivamente de cor.
- Estrutura de arquivos organizada:
  - `index.html`
  - `data.json` (fonte única de dados)
  - `favicon.svg`
  - `css/style.css`
  - `js/app.js`
  - `README.md`
- Documentação no `README.md` cobrindo o que é o Ovometro, a
  estrutura do projeto, o formato do `data.json`, como adicionar
  novas cotações e notícias, como executar localmente e como publicar
  em hospedagem estática.

### Notas

- Os dados iniciais são **demonstrativos** e devem ser substituídos
  pelas observações reais do mercado pesquisado antes da publicação
  definitiva.
- O Ovometro não representa uma cotação oficial de ovos do Brasil e
  não deve ser utilizado como referência nacional.
- A relação entre notícias e variações de preço é exclusivamente
  temporal e observacional; o projeto não afirma causalidade.

[1.0.0]: https://github.com/SEU-USUARIO/ovometro/releases/tag/v1.0.0