# Deploy na Vercel

Este projeto e uma aplicacao Vite estatica. O deploy na Vercel pode ser feito diretamente a partir do repositorio GitHub.

## 1. Criar projeto

1. Acesse `https://vercel.com`.
2. Entre com a conta autorizada.
3. Clique em `Add New` e depois em `Project`.
4. Selecione o repositorio `acompanhamento-pedagogico-dige-seduc-pa`.

## 2. Configurar build

A Vercel deve detectar Vite automaticamente.

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## 3. Variaveis de ambiente

Em `Settings > Environment Variables`, cadastre:

```text
VITE_USE_MOCK_DATA=false
VITE_GOOGLE_APPS_SCRIPT_ENDPOINT=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
VITE_ENABLE_DEBUG_LOGS=false
```

Para um deploy de homologacao com dados mockados:

```text
VITE_USE_MOCK_DATA=true
VITE_GOOGLE_APPS_SCRIPT_ENDPOINT=
VITE_ENABLE_DEBUG_LOGS=false
```

Nao coloque endpoint real em arquivos versionados. Use variaveis da Vercel.

## 4. Executar deploy

1. Clique em `Deploy`.
2. Aguarde a instalacao de dependencias.
3. Verifique se o build finaliza sem erro.
4. Abra a URL publicada.

## 5. Verificar logs

1. Acesse o projeto na Vercel.
2. Abra a aba `Deployments`.
3. Selecione o deploy mais recente.
4. Veja `Build Logs` para erros de instalacao ou build.
5. Veja `Runtime Logs` se houver comportamento inesperado em producao.

## 6. Testar a aplicacao publicada

Checklist minimo:

- Login local funciona.
- Dashboard abre sem erro.
- Periodo Junho/2026 aparece.
- `Configuracoes > Planilhas` abre.
- `Testar Conexao` funciona quando endpoint e planilha real estao configurados.
- Filtros, graficos, drill-down e exportacoes funcionam.
- Impressao abre o layout correto.

## 7. Observacoes

- `src/config/spreadsheets.json` contem apenas a configuracao inicial.
- Alteracoes feitas em `Configuracoes > Planilhas` ficam no armazenamento local do navegador.
- Para compartilhar configuracoes entre computadores, use `Exportar Configuracao` e `Importar Configuracao`.
- O aviso de bundle grande pode aparecer por causa de `xlsx`, `jsPDF` e dependencias de exportacao. Ele nao impede o deploy.
