# Integracao com Google Apps Script

A aplicacao pode ler respostas diretamente de planilhas Google Sheets mensais por meio de um Web App publicado no Google Apps Script. O mock local continua disponivel para testes e desenvolvimento.

## 1. Criar o projeto no Apps Script

1. Acesse `https://script.google.com`.
2. Clique em `Novo projeto`.
3. Renomeie o projeto para algo como `Acompanhamento Pedagogico DIGE SEDUC PA`.
4. Abra o arquivo `apps-script/Code.gs` deste projeto local.
5. Copie todo o conteudo e cole no arquivo `Code.gs` do Google Apps Script.

## 2. Publicar como Web App

1. No Apps Script, clique em `Implantar` e depois em `Nova implantacao`.
2. Em `Tipo`, selecione `Aplicativo da Web`.
3. Em `Executar como`, escolha `Eu`.
4. Em `Quem pode acessar`, escolha a opcao permitida pela politica institucional. Para uso interno controlado, prefira acesso restrito aos usuarios autorizados.
5. Clique em `Implantar`.
6. Autorize as permissoes solicitadas para leitura das planilhas.
7. Copie a URL do aplicativo da Web.

## 3. Configurar o endpoint no projeto

No arquivo `src/config/appConfig.js`, cole a URL copiada em `googleAppsScriptEndpoint` e altere `useMockData` para `false` quando quiser usar dados reais:

```js
export const appConfig = {
  useMockData: false,
  googleAppsScriptEndpoint: 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec'
};
```

Para voltar ao ambiente local com dados de teste, mantenha:

```js
useMockData: true
```

## 4. Cadastrar planilhas mensais

Cada mes fica em `src/config/spreadsheetConfig.js`:

```js
export const spreadsheetConfig = [
  {
    year: 2026,
    month: 'Junho',
    label: 'Junho/2026',
    spreadsheetId: 'ID_DA_PLANILHA',
    sheetName: 'Respostas ao formulario 1',
    active: true
  }
];
```

O `spreadsheetId` e a parte da URL da planilha entre `/d/` e `/edit`.

Exemplo:

```text
https://docs.google.com/spreadsheets/d/1ABCDEF123456/edit
```

Nesse caso, o ID e:

```text
1ABCDEF123456
```

Para cadastrar novos meses, adicione outro objeto no array. A interface carrega automaticamente anos e meses ativos.

## 5. Parametros enviados ao endpoint

A aplicacao chama o Web App por GET com:

- `spreadsheetId`: ID da planilha mensal.
- `sheetName`: nome da aba que contem as respostas.

Exemplo:

```text
https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec?spreadsheetId=ID_DA_PLANILHA&sheetName=Respostas%20ao%20formulario%201
```

## 6. Retorno esperado

Sucesso:

```json
{
  "success": true,
  "headers": [],
  "rows": [],
  "totalRows": 0,
  "updatedAt": "2026-06-26T00:00:00.000Z"
}
```

Erro:

```json
{
  "success": false,
  "message": "Descricao do erro"
}
```

## 7. Cabecalhos e perguntas

A aplicacao transforma as linhas da planilha em objetos JavaScript usando os cabecalhos da primeira linha.

Regras atuais:

- colunas A ate L sao tratadas como dados pessoais ou institucionais;
- perguntas sao identificadas preferencialmente a partir da coluna O;
- perguntas precisam iniciar com numeracao, como `1.1`, `1.2`, `2.1`, `4.10`;
- perguntas listadas em `src/config/ignoredQuestions.js` nao entram nas analises.

Exemplo de cabecalho recomendado:

```text
1.1 - A escola realizou planejamento pedagogico no mes?
```
