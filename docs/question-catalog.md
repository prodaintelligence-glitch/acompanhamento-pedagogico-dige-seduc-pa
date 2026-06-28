# Motor de evolucao dos formularios

O motor de perguntas funciona inteiramente no Google Apps Script e persiste dados derivados em uma planilha tecnica chamada `AP_CATALOGO_SISTEMA`, criada automaticamente dentro da pasta oficial. Essa planilha e ignorada pelo catalogo de periodos e nunca e tratada como formulario mensal.

## Estrutura persistida

- `Perguntas`: identidade permanente, texto canonico, conceito, categoria, eixo, tipo e vigencia.
- `Indicadores`: hierarquia Categoria > Eixo > Indicador e sua vigencia.
- `Ocorrencias`: texto, codigo, ordem, eixo e tipo encontrados em cada periodo.
- `PeriodosProcessados`: controle da ultima versao processada de cada arquivo.
- `HistoricoAlteracoes`: perguntas novas, alteradas, equivalentes, removidas, conflitos e classificacoes.

Os identificadores seguem o formato `PERG-0001`, `PERG-0002` e assim por diante. Perguntas que deixam de aparecer permanecem no catalogo com seu ultimo periodo de vigencia.

## Regras de equivalencia

A comparacao nao utiliza servicos externos. As regras consideram:

1. texto normalizado exatamente igual;
2. codigo original repetido, desde que o texto nao seja completamente divergente;
3. remocao de acentos, pontuacao, espacos e diferencas de caixa;
4. distancia de edicao;
5. sobreposicao de palavras relevantes;
6. conceito principal extraido apos remocao de palavras genericas.

O limiar fica em `QUESTION_MATCH_THRESHOLD`, em `apps-script/Config.gs`. Correspondencias por codigo com texto muito divergente geram conflito e uma nova pergunta pendente de revisao.

## Classificacao

Categorias iniciais sao inferidas por palavras-chave institucionais. Toda pergunta nova recebe `pendente de revisao`, mesmo quando uma categoria automatica e sugerida. Perguntas sem regra aplicavel ficam em `Nao classificada`.

## Processamento incremental

O motor compara a data de atualizacao do arquivo com `PeriodosProcessados`. Periodos inalterados nao sao relidos. Quando um arquivo mensal muda, apenas suas ocorrencias sao reconstruidas e a vigencia do catalogo e recalculada.

## Endpoints

Sincronizar e consultar o catalogo:

```text
GET /exec?action=questions
```

Comparar quaisquer dois periodos catalogados:

```text
GET /exec?action=compare&periodA=2026-03&periodB=2026-04
```

A comparacao retorna perguntas iguais, alteradas, removidas e adicionadas. IDs do Google Drive e Google Sheets nunca fazem parte dessas respostas.

## Painel administrativo

O Monitor de planilhas apresenta:

- perguntas novas;
- perguntas alteradas;
- equivalencias detectadas;
- perguntas sem classificacao;
- comparacao dos dois periodos mais recentes;
- historico de eventos.

O dashboard continua utilizando o contrato mensal existente e nao depende diretamente do catalogo permanente.

## Camada de indicadores

O identificador `PERG-*` representa uma pergunta conceitual; o identificador `IND-*` representa o indicador ao qual uma ou mais perguntas podem estar vinculadas. A hierarquia persistida e:

```text
Categoria
  Eixo
    Indicador
      Pergunta permanente
        Ocorrencia mensal
```

Regras fortes criam ou reutilizam indicadores conhecidos, como `Disponibilidade de Internet`. Perguntas sem regra segura recebem `PENDENTE_REVISAO`. Candidatos ambíguos recebem `CONFLITO` e nao sao vinculados automaticamente.

Os vínculos ficam registrados tanto em `Perguntas` quanto em `Ocorrencias`. Um vínculo revisado pode ser governado diretamente na planilha técnica, informando um `indicatorId` existente; sincronizações posteriores preservam esse vínculo.

O endpoint `questions` tambem retorna:

- `indicators`;
- `hierarchy`;
- quantidade de perguntas vinculadas;
- pendencias de revisao;
- conflitos de indicador.

Depois que o catálogo é processado, o endpoint mensal adiciona às perguntas os campos `permanentId`, `indicatorId`, `indicatorLinkStatus`, `category`, `indicatorAxis` e `indicatorName`. Os campos são aditivos e não alteram o contrato consumido pelo dashboard atual.
