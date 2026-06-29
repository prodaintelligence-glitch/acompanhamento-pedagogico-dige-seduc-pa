# API oficial - Google Apps Script

## Arquitetura definitiva

```text
Frontend Vite
  -> Google Apps Script (API JSON)
  -> Google Drive
  -> Google Sheets
```

O frontend nunca acessa diretamente o Google Drive ou uma planilha. A pasta oficial e a unica origem de dados:

- URL: `https://drive.google.com/drive/folders/1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly`
- ID: `1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly`

O ID fica centralizado em `apps-script/Config.gs` pela constante `DRIVE_FOLDER_ID`.

## Estrutura do Apps Script

- `Code.gs`: roteamento das requisicoes GET e aliases legados.
- `Config.gs`: pasta oficial, cache e criterios configuraveis.
- `DriveService.gs`: acesso exclusivo a pasta e descarte de arquivos temporarios.
- `CatalogService.gs`: descoberta, ordenacao e catalogo de periodos.
- `SpreadsheetService.gs`: validacao, leitura, normalizacao e estatisticas.
- `DashboardService.gs`: dashboard, filtros, graficos, indicadores e metadados.
- `QuestionCatalogService.gs`: catalogo permanente e comparacao de perguntas.
- `CacheService.gs`: cache fragmentado e invalidacao por registro de chaves.
- `ResponseService.gs`: envelope JSON padronizado.
- `ErrorService.gs`: codigos e mensagens publicas seguras.
- `Logger.gs`: logs tecnicos estruturados.
- `Utils.gs`: meses, aliases, normalizacao e periodos.

## Publicacao

O fluxo oficial de sincronizacao utiliza `clasp`; consulte `docs/clasp-workflow.md`.

1. Execute `npx clasp login` com a conta autorizada.
2. Confirme os arquivos com `npm run gas:status`.
3. Envie os fontes com `npm run gas:push`.
4. Atualize o deployment existente com `npm run gas:deploy`.
5. Confirme o `DRIVE_FOLDER_ID` em `Config.gs`.
6. Configure na Vercel:

Se o Google retornar `Insufficient Permission`, confirme a edicao do Script ID, habilite a Apps Script API em `script.google.com/home/usersettings` e renove o login. O roteiro detalhado esta em `docs/clasp-workflow.md`.

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
```

`VITE_GOOGLE_APPS_SCRIPT_ENDPOINT` permanece apenas como fallback temporario para ambientes antigos.

## Contrato de resposta

Sucesso:

```json
{
  "success": true,
  "data": [],
  "count": 0,
  "metadata": {},
  "message": "",
  "timestamp": "2026-06-28T00:00:00.000Z"
}
```

Erro:

```json
{
  "success": false,
  "error": "Mensagem amigavel.",
  "details": "Detalhe tecnico.",
  "code": "SPREADSHEET_ERROR",
  "timestamp": "2026-06-28T00:00:00.000Z"
}
```

Nas novas leituras por ID e consolidada, `data` e sempre uma lista e `metadata` descreve as origens. Os endpoints legados do dashboard preservam o objeto em `data` para compatibilidade. As respostas usam somente JSON. Os IDs das planilhas aparecem apenas nos contratos de leitura para permitir rastrear a origem de cada registro.

## Endpoints

| Acao | Parametros | Responsabilidade |
| --- | --- | --- |
| `healthcheck` | nenhum | Verifica pasta e API |
| `listSpreadsheets` | `refresh=1` opcional | Lista periodos oficiais |
| `getSpreadsheetData` | `spreadsheetId=ID` ou `period=AAAA-MM` | Le uma planilha pelo ID; o periodo permanece como compatibilidade |
| `getAllData` | `refresh=1` opcional | Consolida todas as planilhas legiveis da pasta oficial |
| `getDashboard` | `period=AAAA-MM` | Contrato completo consumido pelo dashboard |
| `getIndicators` | `refresh=1` opcional | Catalogo de perguntas e indicadores |
| `getCharts` | `period=AAAA-MM` | Distribuicoes por pergunta |
| `getFilters` | `period=AAAA-MM` | Valores de DRE, municipio, escola e tecnico |
| `getStatistics` | `period=AAAA-MM` | Estatisticas consolidadas |
| `getMetadata` | `refresh=1` opcional | Metadados do catalogo |
| `compare` | `periodA`, `periodB` | Compara formularios entre periodos |

Aliases mantidos: `catalog`, `periods`, `period`, `questions` e `question-catalog`.

## Descoberta e validacao

A API busca apenas arquivos Google Sheets diretamente na pasta oficial. Atalhos, documentos, PDFs, imagens, arquivos na lixeira, temporarios, backups e o catalogo tecnico `AP_CATALOGO_SISTEMA` sao descartados.

Formatos de periodo aceitos:

- `Janeiro 2026`
- `Jan-2026`
- `01-2026`
- `AP Janeiro 2026`
- `AP_2026_01`
- `Acompanhamento_2026_01`

Uma planilha somente entra no seletor quando possui nome compativel, periodo identificavel, aba de respostas legivel, cabecalho valido, perguntas e registros. Arquivos invalidos ficam apenas no diagnostico do monitor.

## Leitura e normalizacao

A aba e escolhida nesta ordem: nome configurado, primeira aba com cabecalho valido e primeira aba da planilha. A linha de cabecalho e detectada nas linhas iniciais. Datas sao convertidas para ISO, numeros sao preservados, valores nulos viram string vazia e linhas totalmente vazias sao removidas.

Campos institucionais conhecidos sao normalizados, por exemplo `DRE -> dre`, `Municipio -> municipio` e `Nome da Escola -> escola`. Os demais cabecalhos usam camelCase sem acentos ou caracteres especiais; duplicados recebem sufixos numericos e colunas sem nome viram `colunaN`. O texto original das perguntas permanece no catalogo para manter rastreabilidade.

No `getAllData`, cada linha recebe `sourceSpreadsheetId`, `sourceSpreadsheetName`, `sourceMonth`, `sourceYear` e `sourceSheetName`. Mes e ano ficam nulos quando nao puderem ser inferidos do nome. A metadata de cada planilha inclui seus cabecalhos e perguntas para permitir analises historicas sem novas leituras. O retorno tambem informa `spreadsheetCount`, `count`, planilhas lidas e eventuais erros isolados; um arquivo invalido nao interrompe a leitura dos demais.

## Cache

Catalogo, periodos, dashboard, filtros, graficos, indicadores, estatisticas e metadados usam `CacheService` por cinco minutos. Respostas grandes sao fragmentadas. `refresh=1` invalida todas as chaves registradas antes da nova leitura.

## Testes de homologacao

1. Chame `?action=healthcheck` e confirme `API operacional`.
2. Chame `?action=listSpreadsheets&refresh=1` e confira os meses.
3. Teste cada periodo com `getDashboard` e `getSpreadsheetData`.
4. Teste uma planilha por ID com `getSpreadsheetData&spreadsheetId=ID_DA_PLANILHA`.
5. Chame `getAllData&refresh=1` e confira `spreadsheetCount` e `count`.
6. Confira filtros, graficos, indicadores, estatisticas e metadados.
7. Adicione uma nova planilha mensal valida e confirme a descoberta sem alterar codigo.
8. Teste arquivo temporario, nome invalido, aba ausente, planilha vazia e falta de permissao.
9. Confirme que o frontend exibe o erro e nao troca silenciosamente para o mock.
