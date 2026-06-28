# Homologacao tecnica - versao 1.0

## Escopo

Esta homologacao preserva a arquitetura Vite + Vercel + Google Apps Script + Google Drive + Google Sheets. Nenhum banco de dados ou servico de persistencia adicional foi introduzido.

## Verificacoes automatizadas

| Verificacao | Resultado | Evidencia |
| --- | --- | --- |
| Sintaxe JavaScript | Aprovado | `node --check` em todos os arquivos de `src/` |
| Testes unitarios essenciais | Aprovado | `npm test` para normalizacao, perguntas, filtros, cache e estatisticas |
| Build de producao | Aprovado | `npm run build` |
| Pacote inicial | Aprovado | exportacoes Excel/PDF separadas por carregamento sob demanda |
| Dependencias de producao | Aprovado | `npm audit --omit=dev` sem vulnerabilidades conhecidas apos remocao do pacote `xlsx` |
| Contrato da API | Aprovado localmente | validacao de acao, periodo, JSON, catalogo e linhas |
| Falhas de rede | Aprovado por inspecao | timeout, cancelamento, mensagem amigavel e log de desenvolvimento |
| Cache | Aprovado por inspecao | TTL de 5 minutos e deduplicacao de requisicoes simultaneas |
| Estados vazios | Aprovado por inspecao | dashboard, graficos, tabelas, historico e monitor |
| Acessibilidade estrutural | Aprovado por inspecao | foco visivel, status ao vivo, navegacao rotulada, canvas descrito e movimento reduzido |
| Responsividade | Aprovado por CSS | breakpoints para notebook, tablet e celular |

## Roteiro funcional

Executar em homologacao local com `VITE_USE_MOCK_DATA=true`:

1. Entrar com as credenciais locais.
2. Confirmar a abertura do dashboard e dos indicadores.
3. Alterar ano, mes, DRE, municipio, escola, tecnico, eixo e pergunta.
4. Confirmar grafico, distribuicao, drill-down e estados sem dados.
5. Abrir o monitor de planilhas e atualizar o catalogo.
6. Validar analises historicas e comparativas.
7. Exportar Excel, gerar PDF e abrir a impressao.
8. Repetir em larguras de 1440, 1024, 768 e 390 pixels.
9. Confirmar navegacao por teclado, foco visivel e leitura das mensagens de status.

## Roteiro da integracao real

Executar antes do deploy definitivo com `VITE_USE_MOCK_DATA=false`:

1. Publicar todos os arquivos de `apps-script/` no mesmo projeto Apps Script.
2. Confirmar as permissoes da pasta oficial e das planilhas mensais.
3. Configurar a URL `/exec` em `VITE_GOOGLE_APPS_SCRIPT_URL`.
4. Validar `action=catalog`, `action=period`, `action=questions` e `action=compare`.
5. Testar planilha valida, vazia, sem aba de respostas, duplicada e sem permissao.
6. Confirmar descoberta automatica de uma nova planilha mensal na pasta oficial.
7. Confirmar que falhas reais nao acionam fallback silencioso para o mock.

## Tratamentos consolidados

- timeout de 20 segundos para consultas;
- falha de rede e indisponibilidade temporaria;
- endpoint ausente ou invalido;
- periodo ou acao invalidos;
- JSON invalido ou contrato incompleto;
- planilha vazia, inexistente, duplicada ou sem permissao;
- cache temporario e deduplicacao de chamadas;
- mensagens amigaveis sem detalhes internos;
- logs tecnicos condicionados a `VITE_ENABLE_DEBUG_LOGS=true`.

## Limites e pendencias externas

- A comunicacao ponta a ponta com dados reais depende do Web App publicado e das permissoes da conta Google; ela nao pode ser comprovada apenas pelo checkout local.
- O login do frontend nao e autenticacao de servidor. As credenciais Vite ficam no bundle e servem apenas como barreira de interface.
- A validacao final na Vercel depende da configuracao das variaveis de ambiente e de um deploy autorizado.
