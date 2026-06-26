import { buildMetrics } from '../components/cards.js';
import { applyFilters } from '../utils/filters.js';
import { normalizeAnswer } from '../utils/normalizeAnswers.js';
import { detectQuestionType } from '../utils/detectQuestions.js';
import { getDistribution, getLatestTimestamp, getQuestionMetrics } from '../utils/statistics.js';

function appliedFilters(state, question) {
  return {
    Ano: state.year || 'Todos',
    Mes: state.month || 'Todos',
    DRE: state.dre || 'Todas',
    Municipio: state.municipio || 'Todos',
    Escola: state.escola || 'Todas',
    Eixo: state.section || 'Todos',
    Pergunta: question ? `${question.code} - ${question.title}` : 'Todas'
  };
}

export function buildReport({ rows, questions, state, period, updatedAt }) {
  const filteredRows = applyFilters(rows, state);
  const question = questions.find((item) => item.key === state.questionKey) ?? questions[0] ?? null;
  const questionType = question ? detectQuestionType(filteredRows, question.key) : 'empty';
  const isTextQuestion = questionType === 'text';
  const distribution = question ? getDistribution(filteredRows, question.key, { preserveText: isTextQuestion }) : {};
  const questionMetrics = question ? getQuestionMetrics(filteredRows, question.key, distribution) : null;
  const drillRows = question && state.drillAnswer
    ? filteredRows.filter((row) => normalizeAnswer(row[question.key]) === state.drillAnswer)
    : filteredRows;
  const mainMetrics = buildMetrics(filteredRows, questions, updatedAt || getLatestTimestamp(rows));

  return {
    title: 'Relatorio de Acompanhamento Pedagogico',
    period: {
      year: state.year,
      month: state.month,
      label: period?.label ?? `${state.month}/${state.year}`
    },
    generatedAt: new Date(),
    filters: appliedFilters(state, question),
    rows,
    filteredRows,
    drillRows,
    openAnswerRows: isTextQuestion ? filteredRows : [],
    questions,
    question,
    questionType,
    distribution,
    questionMetrics,
    mainMetrics,
    drillAnswer: state.drillAnswer,
    updatedAt
  };
}

export function buildExecutiveSummary(report) {
  const metrics = report.questionMetrics;
  return [
    { Indicador: 'Total de respostas', Valor: report.filteredRows.length },
    { Indicador: 'Quantidade de DREs', Valor: new Set(report.filteredRows.map((row) => row.dre).filter(Boolean)).size },
    { Indicador: 'Quantidade de municipios', Valor: new Set(report.filteredRows.map((row) => row.municipio).filter(Boolean)).size },
    { Indicador: 'Quantidade de escolas', Valor: new Set(report.filteredRows.map((row) => row.escola).filter(Boolean)).size },
    { Indicador: 'Pergunta analisada', Valor: report.question ? `${report.question.code} - ${report.question.title}` : 'Nao selecionada' },
    { Indicador: 'Resposta mais frequente', Valor: metrics?.topCategory ?? 'Nao informado' },
    { Indicador: 'Percentual da resposta mais frequente', Valor: metrics ? `${metrics.topPercent}%` : '0%' }
  ];
}
