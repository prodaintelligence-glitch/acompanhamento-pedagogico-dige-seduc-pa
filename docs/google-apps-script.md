# Integracao real com Google Apps Script

A aplicacao pode ler respostas diretamente de uma planilha Google Sheets por meio de um Web App publicado no Google Apps Script. O mock local continua disponivel para desenvolvimento.

## 1. Criar o projeto

1. Acesse `https://script.google.com`.
2. Clique em `Novo projeto`.
3. Renomeie o projeto para `Acompanhamento Pedagogico DIGE SEDUC PA`.
4. No projeto local, abra `apps-script/Code.gs`.
5. Copie todo o conteudo do arquivo.
6. Cole o conteudo no arquivo `Code.gs` do Google Apps Script.
7. Clique em `Salvar`.

## 2. Implantar como Web App

1. Clique em `Implantar`.
2. Clique em `Nova implantacao`.
3. Em `Tipo`, escolha `Aplicativo da Web`.
4. Em `Executar como`, escolha `Eu`.
5. Em `Quem pode acessar`, escolha a opcao definida pela politica institucional.
6. Para teste controlado, use uma opcao restrita sempre que possivel.
7. Clique em `Implantar`.
8. Autorize a leitura das planilhas quando o Google solicitar.
9. Copie a URL terminada em `/exec`.

## 3. Configurar a aplicacao

No arquivo `src/config/appConfig.js`, informe a URL do Web App:

```js
export const appConfig = {
  useMockData: false,
  googleAppsScriptEndpoint: 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec',
  enableDebugLogs: false
};
```

Para voltar ao mock local:

```js
useMockData: true
```

Quando `useMockData` estiver como `false`, a aplicacao nao volta silenciosamente ao mock se o endpoint falhar. Ela exibe erro amigavel para que o problema seja corrigido.

## 4. Cadastrar a planilha de Junho/2026

Use a tela `Configuracoes > Planilhas` para cadastrar ou editar Junho/2026.

Campos principais:

- Ano: `2026`
- Mes: `Junho`
- Nome amigavel: `Junho/2026`
- ID da Planilha Google: ID real da planilha
- Nome da Aba: `Respostas ao formulário 1` ou o nome exato usado no Google Sheets
- Ativa: marcado

O ID da planilha fica na URL entre `/d/` e `/edit`.

Exemplo:

```text
https://docs.google.com/spreadsheets/d/1ABCDEF123456/edit
```

ID:

```text
1ABCDEF123456
```

A configuracao inicial do projeto fica em `src/config/spreadsheets.json`, mas alteracoes feitas pela interface sao persistidas no armazenamento local do navegador e podem ser exportadas/importadas em JSON.

## 5. Testar a conexao

Na tela `Configuracoes > Planilhas`:

1. Selecione ou cadastre Junho/2026.
2. Clique em `Testar Conexao`.
3. Verifique se o painel retorna:
   - status da conexao;
   - quantidade de linhas;
   - quantidade de colunas;
   - nome da aba;
   - ultima atualizacao;
   - primeiras perguntas identificadas.
4. Clique em `Atualizar Dados` para atualizar dashboard, filtros, perguntas, graficos e tabelas sem reiniciar a aplicacao.

## 6. Parametros do endpoint

A aplicacao chama o Web App por GET:

- `spreadsheetId`: ID da planilha.
- `sheetName`: nome da aba.

Exemplo:

```text
https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec?spreadsheetId=ID_DA_PLANILHA&sheetName=Respostas%20ao%20formul%C3%A1rio%201
```

## 7. Retorno esperado

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

## 8. Regras de identificacao

A aplicacao usa os cabecalhos da primeira linha e aplica as seguintes regras:

- colunas A ate L sao tratadas como dados pessoais ou institucionais;
- perguntas sao identificadas preferencialmente a partir da coluna O;
- perguntas devem iniciar com codigos como `1.1`, `1.2`, `2.1`, `4.10`;
- perguntas `1.4`, `2.5`, `3.9`, `4.14`, `5.4` e `6.13` sao ignoradas.

Exemplo de cabecalho recomendado:

```text
1.1 - A escola realizou planejamento pedagogico no mes?
```
