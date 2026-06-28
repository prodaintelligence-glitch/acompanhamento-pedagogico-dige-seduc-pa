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

1. Crie um projeto no Google Apps Script.
2. Crie todos os arquivos `.gs` existentes em `apps-script/`.
3. Copie o conteudo dos arquivos locais para os correspondentes no editor.
4. Confirme o `DRIVE_FOLDER_ID` em `Config.gs`.
5. Implante como Aplicativo da Web, executando como o proprietario.
6. Conceda acesso ao Drive e Sheets e restrinja os usuarios conforme a politica institucional.
7. Copie a URL terminada em `/exec`.
8. Configure na Vercel:

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
  "data": {},
  "message": "",
  "timestamp": "2026-06-28T00:00:00.000Z"
}
```

Erro:

```json
{
  "success": false,
  "error": "SPREADSHEET_ERROR",
  "details": "Mensagem amigavel.",
  "timestamp": "2026-06-28T00:00:00.000Z"
}
```

As respostas usam somente JSON e nao expõem IDs internos dos arquivos.

## Endpoints

| Acao | Parametros | Responsabilidade |
| --- | --- | --- |
| `healthcheck` | nenhum | Verifica pasta e API |
| `listSpreadsheets` | `refresh=1` opcional | Lista periodos oficiais |
| `getSpreadsheetData` | `period=AAAA-MM` | Retorna linhas normalizadas |
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

A melhor aba e escolhida pela estrutura e pelos nomes preferenciais. A linha de cabecalho e detectada nas linhas iniciais. Datas sao convertidas para ISO, numeros sao preservados, valores nulos viram string vazia e linhas totalmente vazias sao removidas.

Campos institucionais conhecidos sao normalizados, por exemplo `DRE -> dre`, `Municipio -> municipio` e `Nome da Escola -> escola`. Cabecalhos das perguntas sao preservados para manter rastreabilidade.

## Cache

Catalogo, periodos, dashboard, filtros, graficos, indicadores, estatisticas e metadados usam `CacheService` por cinco minutos. Respostas grandes sao fragmentadas. `refresh=1` invalida todas as chaves registradas antes da nova leitura.

## Testes de homologacao

1. Chame `?action=healthcheck` e confirme `API operacional`.
2. Chame `?action=listSpreadsheets&refresh=1` e confira os meses.
3. Teste cada periodo com `getDashboard` e `getSpreadsheetData`.
4. Confira filtros, graficos, indicadores, estatisticas e metadados.
5. Adicione uma nova planilha mensal valida e confirme a descoberta sem alterar codigo.
6. Teste arquivo temporario, nome invalido, aba ausente, planilha vazia e falta de permissao.
7. Confirme que o frontend exibe o erro e nao troca silenciosamente para o mock.
