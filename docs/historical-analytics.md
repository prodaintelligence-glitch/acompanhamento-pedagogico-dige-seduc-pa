# Dashboards inteligentes e analises comparativas

A camada historica amplia o dashboard existente sem substituir os graficos mensais. Os dados de cada periodo continuam vindo do mesmo contrato do Apps Script e sao carregados em lotes de ate tres requisicoes, com cache por periodo e data de atualizacao.

## Filtros

As analises respeitam ano, DRE, municipio, escola e tecnico. O mes do dashboard continua controlando a analise mensal original; os campos `Periodo inicial` e `Periodo final` controlam o comparativo historico.

## Indicadores estrategicos

- escolas acompanhadas;
- municipios atendidos;
- DREs atendidas;
- visitas realizadas, considerando cada registro como um acompanhamento;
- media de acompanhamentos por mes.

## Comparacoes

O painel compara quantidade de registros, escolas, municipios e indice de respostas positivas. Tambem permite escolher a dimensao DRE, municipio, escola ou tecnico e duas referencias para acompanhar suas series mensais.

Os rankings representam cobertura e distribuicao de atendimentos. O ranking de tecnicos nao deve ser interpretado como avaliacao competitiva de desempenho individual.

## Perguntas criticas

As perguntas sao agregadas pelo identificador permanente quando disponivel. O motor calcula percentual de respostas negativas, respostas em branco e quantidade de meses em que a pergunta apareceu.

## Evolucao de indicadores

Perguntas vinculadas a `IND-*` sao agrupadas mensalmente. O percentual positivo de cada indicador gera uma tendencia:

- `Crescimento`: variacao superior a 3 pontos percentuais;
- `Reducao`: variacao inferior a -3 pontos percentuais;
- `Estabilidade`: variacao entre -3 e 3 pontos percentuais.

## Resumo executivo

Os textos sao produzidos por regras deterministicas sobre volume de acompanhamentos, maior variacao positiva e principal ponto de atencao. Nao sao utilizados modelos externos de IA.

## Exportacoes

Excel e PDF preservam filtros e periodo corrente e passam a incluir indicadores estrategicos, comparativo historico, evolucao dos indicadores e perguntas criticas. A impressao inclui os novos paineis visiveis.

## Desempenho

- cache de respostas por periodo;
- carga em lotes;
- cache das analises por conjunto de dados, filtros e controles comparativos;
- reutilizacao dos dados ao trocar filtros ou graficos;
- invalidacao ao atualizar o catalogo.
