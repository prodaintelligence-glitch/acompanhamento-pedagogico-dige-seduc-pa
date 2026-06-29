# Arquitetura oficial do projeto

Este documento e normativo para todo desenvolvimento do **Acompanhamento Pedagogico DIGE/SEDUC-PA**.

## Identidade e destinos oficiais

- Repositorio: `https://github.com/prodaintelligence-glitch/acompanhamento-pedagogico-dige-seduc-pa`
- Branch: `main`
- Projeto Vercel: `acompanhamento-pedagogico-dige-seduc-pa`
- Painel Vercel: `https://vercel.com/paulo-david-s-projects/acompanhamento-pedagogico-dige-seduc-pa`
- Script ID: `1Ek05osjoYyK11VmCaZz3LJ2OJiYPoDdkGOiA_u5jU-BIoRkyog1yt0zg`
- Pasta Drive: `1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly`

## Fluxo obrigatorio

```text
VS Code
  -> GitHub (main)
  -> Vercel
  -> Frontend Vite
  -> Google Apps Script (API)
  -> Google Drive
  -> Google Sheets
```

O GitHub e a fonte oficial do codigo. A Vercel publica o frontend a partir da branch `main`. O Google Apps Script permanece como backend e e sincronizado por `clasp` com o Script ID existente.

## Regras invariantes

1. O frontend permanece em Vite, JavaScript, HTML e CSS.
2. Toda comunicacao remota de dados do frontend passa por `src/services/googleApiService.js`.
3. O frontend nao usa `DriveApp`, `SpreadsheetApp`, URLs de planilhas ou IDs de arquivos.
4. Regras de leitura, descoberta, normalizacao, cache e agregacao ficam no Apps Script.
5. A unica base oficial e Google Drive + Google Sheets na pasta configurada em `apps-script/Config.gs`.
6. Nao introduzir Supabase, Firebase, bancos SQL, MongoDB, SQLite ou outro banco.
7. O Apps Script usa cache sempre que a leitura puder ser reutilizada com seguranca.
8. O design system preserva Lucide, responsividade, acessibilidade, temas claro/escuro e `#0072CE`.
9. Nao criar outro repositorio, projeto Vercel, projeto Apps Script ou deployment sem autorizacao expressa.
10. Toda entrega aceita deve terminar com teste, build, commit e push para `main`.

## Organizacao

- `src/services`: comunicacao e selecao das fontes.
- `src/components`: componentes de interface.
- `src/utils`: transformacoes puras e calculos.
- `src/config`: configuracao do frontend.
- `src/charts`: visualizacoes.
- `apps-script`: API, Drive, Sheets, cache e regras dos dados.
- `docs`: arquitetura, operacao e homologacao.
- `test`: testes funcionais de contrato e invariantes.

## Checklist de release

```bash
npm run verify:architecture
npm test
npm run build
npm run gas:status
git status
git commit
git push origin main
```

Quando houver alteracao em `apps-script/`, executar `gas:push` e `gas:deploy` somente com autorizacao valida. Se o Google responder `Insufficient Permission`, nao criar outro projeto: corrigir a permissao da conta sobre o Script ID oficial.

Depois do push, confirmar o commit em `origin/main` e acompanhar o deployment automatico da Vercel.
