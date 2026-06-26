# Acompanhamento Pedagogico - DIGE/SEDUC-PA

Aplicacao web simples, moderna e responsiva para analise mensal das respostas do formulario de Acompanhamento Pedagogico da DIGE/SEDUC-PA.

## Tecnologias

- Vite
- HTML5, CSS3 e JavaScript ES6+
- Chart.js para graficos
- Grid.js para tabelas
- Lucide Icons para iconografia
- SheetJS para exportacao Excel
- jsPDF para exportacao PDF

## Como executar

```bash
npm install
npm run dev
```

Credenciais locais da primeira versao:

- Usuario: `admin`
- Senha: `dige2026`

## Dados

A aplicacao possui duas fontes de dados:

- mock local em `src/data/mockResponses.js`;
- Google Sheets via endpoint publicado pelo Google Apps Script.

A troca entre as fontes fica em `src/config/appConfig.js`:

```js
export const appConfig = {
  useMockData: true,
  googleAppsScriptEndpoint: ''
};
```

Use `useMockData: true` para desenvolvimento local. Para ler planilhas reais, publique o Apps Script, informe a URL em `googleAppsScriptEndpoint` e altere `useMockData` para `false`.

## Configuracoes principais

- `src/config/spreadsheetConfig.js`: mapeia ano/mes para `spreadsheetId`, `sheetName`, rotulo e status ativo.
- `src/config/ignoredQuestions.js`: lista perguntas de navegacao que nao entram nas analises.
- `src/config/appConfig.js`: configura credenciais locais, modo mock e endpoint do Apps Script.

## Google Apps Script

O arquivo `apps-script/Code.gs` contem o script a ser colado no Google Apps Script. Ele recebe `spreadsheetId` e `sheetName` por GET, le a aba informada e retorna JSON no formato:

```json
{
  "success": true,
  "headers": [],
  "rows": [],
  "totalRows": 0,
  "updatedAt": "2026-06-26T00:00:00.000Z"
}
```

O passo a passo completo esta em `docs/google-apps-script.md`.

## Funcionalidades desta etapa

- Login local simples.
- Dashboard com indicadores principais.
- Carregamento dinamico por ano e mes.
- Fallback para mock local.
- Preparacao para leitura real via Google Apps Script.
- Normalizacao de linhas da planilha para objetos JavaScript.
- Deteccao automatica de perguntas numeradas.
- Ignora automaticamente perguntas configuradas.
- Filtros globais por DRE, municipio, escola, eixo/secao e pergunta.
- Grafico inicial com Chart.js.
- Drill-down basico ao clicar em itens do grafico.
- Tabelas de resumo e detalhes com Grid.js.
- Estrutura inicial para exportacao Excel e PDF.

## Dashboard inteligente

O modulo principal de analise visual permite selecionar eixo/secao e pergunta, recalcular automaticamente os dados conforme filtros globais e escolher o tipo de visualizacao mais adequado para cada pergunta. Perguntas categoricas usam grafico de setores, barras ou barras horizontais conforme a quantidade de categorias; perguntas abertas sao analisadas por tabela pesquisavel.

Ao clicar em uma categoria do grafico, a tabela de drill-down mostra os registros correspondentes com DRE, municipio, escola e resposta. O painel da pergunta tambem exibe total de registros filtrados, respostas validas, respostas em branco, categorias encontradas e categoria mais frequente.

## Relatorios e exportacoes

O dashboard possui acoes contextuais para exportar Excel, gerar PDF, imprimir e limpar filtros. As exportacoes respeitam o periodo, os filtros globais, a pergunta selecionada e a selecao de drill-down.

A exportacao Excel gera um arquivo `.xlsx` com abas para dados filtrados, drill-down, distribuicao, resumo executivo e filtros aplicados. Quando a pergunta selecionada for aberta, tambem inclui uma aba de respostas abertas.

O PDF inclui titulo, periodo, data de geracao, filtros aplicados, resumo executivo, pergunta selecionada, distribuicao das respostas e uma amostra da tabela de drill-down ou respostas abertas. A impressao usa um visual proprio, ocultando menu lateral, botoes e controles interativos.
