import { EMPTY_LABEL } from './normalizeAnswers.js';

function isDateLike(values) {
  return values.length > 0 && values.every((value) => {
    const time = Date.parse(value);
    return !Number.isNaN(time) && /[-/T:]/.test(String(value));
  });
}

function isContinuousNumeric(values) {
  if (!values.length) return false;
  const numbers = values.map(Number);
  const uniqueCount = new Set(numbers).size;
  return numbers.every((number) => Number.isFinite(number)) && uniqueCount > 6;
}

export function detectBestChartType({ questionType, distribution }) {
  const entries = Object.entries(distribution).filter(([label]) => label !== EMPTY_LABEL);
  const labels = entries.map(([label]) => label);
  const categoryCount = labels.length;
  const lowerLabels = labels.map((label) => label.toLowerCase());

  if (!categoryCount || questionType === 'empty') {
    return { chartType: 'none', reason: 'Pergunta sem respostas suficientes para grafico.' };
  }

  if (questionType === 'text') {
    return { chartType: 'table', reason: 'Pergunta aberta analisada por tabela.' };
  }

  if (isDateLike(labels)) {
    return { chartType: 'line', reason: 'Respostas com formato de data.' };
  }

  if (questionType === 'numeric' && isContinuousNumeric(labels)) {
    return { chartType: 'bar', indexAxis: 'x', reason: 'Valores numericos continuos agrupados em colunas.' };
  }

  const isBooleanScale = lowerLabels.every((label) => ['sim', 'nao', 'não', 'parcialmente'].includes(label));
  if (questionType === 'boolean' || isBooleanScale) {
    return { chartType: 'doughnut', reason: 'Escala Sim/Nao/Parcialmente.' };
  }

  if (categoryCount <= 6) {
    return { chartType: 'doughnut', reason: 'Ate 6 categorias.' };
  }

  return { chartType: 'bar', indexAxis: 'y', reason: 'Mais de 6 categorias.' };
}
