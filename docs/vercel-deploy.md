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
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
VITE_ENABLE_DEBUG_LOGS=false
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SUBSTITUIR_POR_UMA_SENHA_FORTE
```

Para um deploy de homologacao com dados mockados:

```text
VITE_USE_MOCK_DATA=true
VITE_GOOGLE_APPS_SCRIPT_URL=
VITE_ENABLE_DEBUG_LOGS=false
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SUBSTITUIR_POR_UMA_SENHA_FORTE
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
- Os periodos da pasta oficial aparecem automaticamente.
- `Monitor de planilhas` abre sem expor IDs internos.
- `Atualizar catalogo` detecta novas planilhas.
- Filtros, graficos, drill-down e exportacoes funcionam.
- Impressao abre o layout correto.

## 7. Observacoes

- `src/config/spreadsheets.json` e usado apenas pelo modo mock.
- Em producao, o Apps Script gera o catalogo diretamente a partir da pasta oficial.
- IDs da pasta e das planilhas nao fazem parte do contrato enviado ao frontend.
- Excel e PDF sao carregados sob demanda para manter o pacote inicial abaixo do limite de aviso do Vite.
- O login local e uma barreira de interface. A protecao dos dados deve continuar sendo garantida pelas permissoes do Google Drive e pelo acesso ao Web App do Apps Script.
