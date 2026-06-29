# Acompanhamento Pedagogico - DIGE/SEDUC-PA

Aplicacao web para analise mensal das respostas do formulario de Acompanhamento Pedagogico da DIGE/SEDUC-PA. Versao atual: **1.0.0**.

## Objetivo

Centralizar a leitura das respostas mensais, permitindo que gestores acompanhem indicadores, filtrem dados por territorio/escola, analisem perguntas, executem drill-down e gerem relatorios a partir da API oficial do Google Apps Script.

A arquitetura obrigatoria e suas regras de evolucao estao em `docs/official-architecture.md`.

## Tecnologias

- Vite
- HTML5, CSS3 e JavaScript ES6+
- Chart.js
- Grid.js
- Lucide Icons
- XML Spreadsheet (exportacao Excel sem dependencia adicional)
- jsPDF

## Estrutura final

```text
src/
  admin/        monitor e integridade das planilhas
  auth/         barreira local de acesso
  charts/       graficos mensais e historicos
  components/   interface e estados visuais
  config/       configuracao do frontend
  reports/      Excel, PDF e impressao
  services/     API oficial, mock de desenvolvimento e dados historicos
  utils/        normalizacao, filtros, cache e estatisticas
apps-script/    API e descoberta automatica no Google Drive
docs/           implantacao, integracao e homologacao
test/           testes unitarios essenciais
.clasp.json     vinculo com o projeto Apps Script existente
.claspignore    controle dos arquivos enviados pelo clasp
```

## Instalar

```bash
npm install
```

## Executar localmente

```bash
npm run dev
```

Credencial administrativa local:

- Usuario: `admin`
- Senha: `dige2026`

O acesso individual aceita e-mail institucional ou matricula no mesmo campo. Identificadores e senhas individuais nao sao versionados em texto aberto; apenas seus hashes ficam no cadastro local de acesso.

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores locais:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_URL=INSERIR_URL_DO_WEB_APP_AQUI
VITE_ENABLE_DEBUG_LOGS=false
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SUBSTITUIR_POR_UMA_SENHA_FORTE
```

Opcionalmente, use mock somente no servidor local `npm run dev`:

```text
VITE_USE_MOCK_DATA=true
```

Use Google Sheets real:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
```

Nunca versionar `.env` com endpoint real. O arquivo `.env` esta ignorado pelo Git.

As credenciais `admin` / `dige2026` sao usadas apenas como conveniencia no servidor de desenvolvimento. Em producao, configure `VITE_ADMIN_USERNAME` e `VITE_ADMIN_PASSWORD`. Como a aplicacao e um frontend estatico, esse login e somente uma barreira de interface e nao deve ser tratado como autenticacao de servidor.

## Google Apps Script

A API esta organizada nos arquivos de `apps-script/`. Crie os arquivos correspondentes no projeto Google Apps Script, publique como Web App e copie a URL terminada em `/exec`.

Arquitetura definitiva:

```text
Frontend Vite -> Google Apps Script -> pasta oficial no Google Drive -> Google Sheets
```

A unica origem oficial e a pasta `1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly`. O frontend nao recebe IDs de arquivos e nao acessa Drive ou Sheets diretamente. Toda chamada HTTP fica centralizada em `src/services/googleApiService.js`.

Documentacao detalhada:

```text
docs/google-apps-script.md
docs/question-catalog.md
docs/historical-analytics.md
docs/clasp-workflow.md
```

## Sincronizacao do Apps Script

O projeto esta vinculado ao Script ID existente por `.clasp.json`. Depois de autenticar com `npx clasp login`, utilize:

```bash
npm run gas:status
npm run gas:push
npm run gas:pull
npm run gas:open
npm run gas:deploy
```

`gas:deploy` atualiza o deployment existente e preserva a URL atual do Web App.

## Planilhas mensais

As planilhas sao descobertas automaticamente na pasta oficial do Google Drive pelo Apps Script. Nenhum periodo e cadastrado manualmente e nenhum ID do Drive ou das planilhas e enviado ao navegador.

Use `Monitor de planilhas` para consultar periodo, quantidade de registros, perguntas, ultima atualizacao, status e inconsistencias. `src/config/spreadsheets.json` existe apenas para o modo mock local.

Para adicionar um novo mes, coloque a planilha Google Sheets na pasta oficial usando mes e ano no nome. O Apps Script atualiza o catalogo automaticamente; nao e necessario alterar o frontend. Consulte `docs/google-apps-script.md` para configurar a pasta e publicar a API.

Sao aceitos formatos como `Janeiro 2026`, `Jan-2026`, `01-2026`, `AP Janeiro 2026`, `AP_2026_01` e `Acompanhamento_2026_01`. Para entrar no catalogo oficial, o arquivo tambem precisa possuir aba legivel, cabecalhos reconheciveis, perguntas e pelo menos um registro.

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
- tema claro e escuro com preferencia salva no navegador;
- comparativos entre periodos e entidades;
- evolucao por DRE, municipio, escola e tecnico;
- indicadores estrategicos, rankings de cobertura e perguntas criticas;
- tendencias de indicadores e resumo executivo.

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

As bibliotecas de Excel e PDF sao carregadas sob demanda, reduzindo o pacote inicial da aplicacao.

## Deploy na Vercel

Documentacao:

```text
docs/vercel-deploy.md
```

Configure na Vercel:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
VITE_ENABLE_DEBUG_LOGS=false
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SUBSTITUIR_POR_UMA_SENHA_FORTE
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

O mock permanece isolado para desenvolvimento local. Builds de producao ignoram o modo mock e usam exclusivamente `VITE_GOOGLE_APPS_SCRIPT_URL`. Se a API real falhar, a aplicacao exibe erro amigavel e nao troca silenciosamente de fonte.

## Homologacao da versao 1.0

O roteiro, a matriz de testes e as pendencias que exigem o ambiente Google real estao em `docs/homologacao-v1.md`.

## Atualizar o sistema

1. Atualize o codigo do repositorio e execute `npm install`.
2. Execute `npm test` e `npm run build`.
3. Se arquivos de `apps-script/` mudaram, atualize o projeto Apps Script e crie uma nova versao do Web App.
4. Confirme as variaveis da Vercel e publique o novo commit.
5. Execute o roteiro de `docs/homologacao-v1.md` no ambiente publicado.
