import { formatDateTime } from './formatters.js';
import { EMPTY_LABEL, normalizeAnswer } from './normalizeAnswers.js';

function isPositive(answer) {
  return normalizeAnswer(answer) === 'Sim';
}

function isNegative(answer) {
  return normalizeAnswer(answer) === 'Nao';
}

function questionRatio(rows, question, predicate) {
  const answers = rows.map((row) => row[question.key]).filter((answer) => normalizeAnswer(answer) !== EMPTY_LABEL);
  if (!answers.length) return 0;
  return Math.round((answers.filter(predicate).length / answers.length) * 100);
}

function blankCount(rows, question) {
  return rows.filter((row) => normalizeAnswer(row[question.key]) === EMPTY_LABEL).length;
}

function bestQuestion(rows, questions, scorer) {
  if (!questions.length || !rows.length) return 'Nao informado';
  const ranked = questions
    .map((question) => ({ question, score: scorer(rows, question) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  return top && top.score > 0 ? `${top.question.code} (${top.score}%)` : 'Nao informado';
}

export function buildSmartIndicators(rows, questions, latestTimestamp) {
  const answeredQuestions = questions.filter((question) =>
    rows.some((row) => normalizeAnswer(row[question.key]) !== EMPTY_LABEL)
  ).length;

  const mostBlankQuestion = questions
    .map((question) => ({ question, count: blankCount(rows, question) }))
    .sort((a, b) => b.count - a.count)[0];

  return [
    { label: 'Total de respostas', value: rows.length },
    { label: 'Total de escolas', value: new Set(rows.map((row) => row.escola).filter(Boolean)).size },
    { label: 'Total de municipios', value: new Set(rows.map((row) => row.municipio).filter(Boolean)).size },
    { label: 'Total de DREs', value: new Set(rows.map((row) => row.dre).filter(Boolean)).size },
    { label: 'Perguntas analisaveis', value: questions.length },
    { label: 'Perguntas respondidas', value: answeredQuestions },
    { label: 'Maior indice positivo', value: bestQuestion(rows, questions, (items, question) => questionRatio(items, question, isPositive)) },
    { label: 'Maior indice negativo', value: bestQuestion(rows, questions, (items, question) => questionRatio(items, question, isNegative)) },
    {
      label: 'Mais respostas em branco',
      value: mostBlankQuestion && mostBlankQuestion.count > 0 ? `${mostBlankQuestion.question.code} (${mostBlankQuestion.count})` : 'Nao informado'
    },
    { label: 'Ultima atualizacao', value: formatDateTime(latestTimestamp) }
  ];
}
