# Acompanhamento Pedagogico - DIGE/SEDUC-PA

Aplicacao web privada para analise mensal das respostas do formulario de Acompanhamento Pedagogico da DIGE/SEDUC-PA.

## Objetivo

Centralizar a leitura das respostas mensais, permitindo que gestores acompanhem indicadores, filtrem dados por territorio/escola, analisem perguntas, executem drill-down e gerem relatorios a partir de dados mockados ou de planilhas Google Sheets via Google Apps Script.

## Tecnologias

- Vite
- HTML5, CSS3 e JavaScript ES6+
- Chart.js
- Grid.js
- Lucide Icons
- SheetJS
- jsPDF

## Instalar

```bash
npm install
```

## Executar localmente

```bash
npm run dev
```

Credenciais locais:

- Usuario: `admin`
- Senha: `dige2026`

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores locais:

```text
VITE_USE_MOCK_DATA=true
VITE_GOOGLE_APPS_SCRIPT_ENDPOINT=INSERIR_ENDPOINT_AQUI
VITE_ENABLE_DEBUG_LOGS=false
```

Use mock local:

```text
VITE_USE_MOCK_DATA=true
```

Use Google Sheets real:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_ENDPOINT=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
```

Nunca versionar `.env` com endpoint real. O arquivo `.env` esta ignorado pelo Git.

## Google Apps Script

O script esta em `apps-script/Code.gs`. Publique-o como Web App no Google Apps Script e copie a URL terminada em `/exec`.

Documentacao detalhada:

```text
docs/google-apps-script.md
```

## Planilhas mensais

A configuracao inicial fica em:

```text
src/config/spreadsheets.json
```

Na aplicacao, acesse:

```text
Configuracoes > Planilhas
```

Por essa area e possivel:

- cadastrar planilhas mensais;
- testar conexao;
- atualizar dados sem reiniciar;
- exportar/importar configuracao JSON;
- acompanhar monitor de integridade;
- consultar log de sincronizacao.

Alteracoes feitas pela interface sao salvas no armazenamento local do navegador. Para compartilhar configuracoes entre maquinas, use exportacao/importacao JSON.

## Dashboard

O dashboard inclui:

- indicadores inteligentes;
- filtros globais;
- selecao de eixo e pergunta;
- grafico automatico;
- tabela de distribuicao;
- drill-down com busca;
- painel estatistico;
- mensagens automaticas;
- breadcrumb da analise.

## Relatorios e exportacoes

A aplicacao permite:

- exportar Excel;
- gerar PDF;
- imprimir dashboard;
- exportar dados filtrados;
- exportar drill-down;
- exportar respostas abertas.

## Build

```bash
npm run build
```

A saida de producao fica em:

```text
dist/
```

Avisos de bundle grande podem aparecer por causa de `xlsx`, `jsPDF` e dependencias de exportacao. Isso nao impede o build.

## Deploy na Vercel

Documentacao:

```text
docs/vercel-deploy.md
```

Configure na Vercel:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_ENDPOINT=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
VITE_ENABLE_DEBUG_LOGS=false
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Dados mockados e dados reais

O mock local continua disponivel para desenvolvimento. Em producao, configure `VITE_USE_MOCK_DATA=false` e informe o endpoint real do Google Apps Script. Se o endpoint real falhar, a aplicacao exibe erro amigavel e nao troca silenciosamente para mock.
