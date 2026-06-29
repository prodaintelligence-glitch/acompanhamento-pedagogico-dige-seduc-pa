# Fluxo oficial com clasp, GitHub e Vercel

## Identificadores preservados

- Projeto Google Cloud: `acomp-pedagogico-dige`
- Script ID: `1Ek05osjoYyK11VmCaZz3LJ2OJiYPoDdkGOiA_u5jU-BIoRkyog1yt0zg`
- Deployment/Web App: `AKfycbwqqadAHkgC4duTenXKXW6YagX8-tbFV8LLUOzX3CstCzj2yytsHLW3ByCvZ2-wYBGLPg`
- URL: `https://script.google.com/macros/s/AKfycbwqqadAHkgC4duTenXKXW6YagX8-tbFV8LLUOzX3CstCzj2yytsHLW3ByCvZ2-wYBGLPg/exec`
- Pasta Drive: `1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly`

Nenhum comando deste fluxo cria um novo projeto Apps Script ou uma nova URL de Web App.

## Arquivos de infraestrutura

- `.clasp.json`: aponta para o Script ID existente e usa `apps-script` como `rootDir`.
- `.claspignore`: envia somente arquivos `.gs` e `appsscript.json`.
- `apps-script/appsscript.json`: manifesto V8, fuso de Sao Paulo, logs e escopos de Drive/Sheets.

## Autenticacao

Na primeira utilizacao:

```bash
npx clasp login
```

Se o navegador nao puder ser aberto automaticamente:

```bash
npx clasp login --no-localhost
```

Use a conta que possui permissao de edicao no Script ID informado. A Apps Script API deve continuar ativada nas configuracoes da conta e no projeto Google Cloud.

As credenciais do `clasp` ficam no perfil do usuario e nao devem ser adicionadas ao Git.

### Erro `Insufficient Permission`

Se `gas:push`, `gas:pull` ou `clasp list-scripts` retornarem essa mensagem:

1. Confirme que a conta autenticada possui permissao de editor no Script ID existente.
2. Ative o acesso da Apps Script API em `https://script.google.com/home/usersettings`.
3. Renove a autorizacao:

```bash
npx clasp logout
npx clasp login
```

4. Execute novamente `npm run gas:status`, `npm run gas:push` e `npm run gas:pull`.

Ativar a API no Google Cloud e permitir a Apps Script API nas configuracoes do usuario sao verificacoes distintas.

## Fluxo seguro de sincronizacao

Antes de qualquer operacao, confirme que o Git esta limpo:

```bash
git status
npm run gas:status
```

Enviar a versao local ao projeto existente:

```bash
npm run gas:push
```

Baixar o estado remoto:

```bash
npm run gas:pull
```

`gas:pull` pode substituir arquivos locais. Execute-o somente com o Git limpo ou depois de confirmar que o push foi concluido.

Abrir o editor do projeto vinculado:

```bash
npm run gas:open
```

## Atualizacao do Web App

O script abaixo atualiza o deployment existente e, portanto, preserva a URL usada pela Vercel:

```bash
npm run gas:deploy
```

Nao use `clasp create-deployment` sem informar o deployment existente, pois um novo deployment gera outra URL.

Depois do deploy, valide:

```text
https://script.google.com/macros/s/AKfycbwqqadAHkgC4duTenXKXW6YagX8-tbFV8LLUOzX3CstCzj2yytsHLW3ByCvZ2-wYBGLPg/exec?action=healthcheck
```

## GitHub e Vercel

O fluxo oficial permanece:

1. Alterar e testar localmente.
2. Executar `npm test`, `npm run build` e `npm run gas:status`.
3. Executar `npm run gas:push` e, quando necessario, `npm run gas:deploy`.
4. Criar commit e enviar ao GitHub.
5. A Vercel publica o frontend a partir do repositorio.
6. A Vercel continua usando `VITE_GOOGLE_APPS_SCRIPT_URL` com a URL existente.

GitHub versiona o frontend, os fontes `.gs` e a infraestrutura do clasp. A Vercel publica somente o frontend Vite; o backend continua no Google Apps Script.

## Google Drive e Google Sheets

O Apps Script acessa exclusivamente a pasta oficial definida em `Config.gs`. As planilhas mensais permanecem no Drive e são descobertas automaticamente. O frontend nunca usa credenciais do Google nem acessa as planilhas diretamente.

## Testes recomendados

```bash
npm test
npm run build
npm run gas:status
```

Depois do push/deploy do Apps Script, testar:

- `healthcheck`;
- `listSpreadsheets`;
- carregamento de um periodo;
- filtros, indicadores e graficos;
- descoberta de uma nova planilha mensal;
- logs de execucao no Apps Script.
