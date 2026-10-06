# Ovometro

**Experimento independente de visualização de dados** que acompanha a variação do preço de uma caixa de 30 ovos em um mercado pesquisado na região de Goiânia, Goiás.

## O que é o Ovometro?

O Ovometro é um site estático que exibe:

- a cotação mais recente de uma caixa de 30 ovos;
- a evolução histórica desse preço em um gráfico interativo;
- comparações com a cotação anterior e com a semana anterior;
- acontecimentos políticos, econômicos e sociais registrados manualmente, associados a cada data.

> **Importante:** os dados não representam uma cotação oficial do mercado brasileiro e não devem ser usados como referência nacional. Eles refletem exclusivamente as observações realizadas no estabelecimento pesquisado. O projeto não afirma causalidade entre notícias e variações de preço.

## Estrutura do projeto

```text
ovometro/
├── index.html          # Página única
├── data.json           # Fonte única de dados (cotações + notícias)
├── favicon.svg         # Ícone SVG do ovo
├── css/
│   └── style.css       # Estilos personalizados
└── js/
    └── app.js          # Lógica da aplicação