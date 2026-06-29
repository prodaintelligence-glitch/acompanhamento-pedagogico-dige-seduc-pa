import { getUniqueOptions } from '../utils/filters.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function options(items, selected = '') {
  return ['<option value="">Todos</option>', ...items.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`)].join('');
}

export function renderFilters(container, state, rows, questions, onChange, periods = []) {
  const availablePeriods = periods.filter((item) => item.active !== false);
  const years = [...new Set(availablePeriods.map((item) => item.year))];
  const months = availablePeriods.filter((item) => item.year === Number(state.year));
  const sections = [...new Set(questions.map((question) => question.section))];
  const visibleQuestions = questions.filter((question) => !state.section || question.section === state.section);
  const selectedQuestion = questions.find((question) => question.key === state.questionKey) ?? visibleQuestions[0];
  const responses = selectedQuestion ? getUniqueOptions(rows, selectedQuestion.key) : [];

  container.innerHTML = `
    <label>Ano<select data-filter="year">${years.map((year) => `<option value="${Number(year)}" ${Number(state.year) === year ? 'selected' : ''}>${Number(year)}</option>`).join('')}</select></label>
    <label>Mes<select data-filter="month">${months.map((period) => `<option value="${escapeHtml(period.month)}" ${state.month === period.month ? 'selected' : ''}>${escapeHtml(period.label ?? period.month)}</option>`).join('')}</select></label>
    <label>DRE<select data-filter="dre">${options(getUniqueOptions(rows, 'dre'), state.dre)}</select></label>
    <label>Municipio<select data-filter="municipio">${options(getUniqueOptions(rows, 'municipio'), state.municipio)}</select></label>
    <label>Escola<select data-filter="escola">${options(getUniqueOptions(rows, 'escola'), state.escola)}</select></label>
    <label>Tecnico<select data-filter="tecnico">${options(getUniqueOptions(rows, 'tecnico'), state.tecnico)}</select></label>
    <label>Etapa<select data-filter="etapa">${options(getUniqueOptions(rows, 'etapa'), state.etapa)}</select></label>
    <label>Modalidade<select data-filter="modalidade">${options(getUniqueOptions(rows, 'modalidade'), state.modalidade)}</select></label>
    <label>Eixo/secao<select data-filter="section">${options(sections, state.section)}</select></label>
    <label>Pergunta<select data-filter="questionKey">${visibleQuestions.map((question) => `<option value="${escapeHtml(question.key)}" ${state.questionKey === question.key ? 'selected' : ''}>${escapeHtml(question.code)} - ${escapeHtml(question.title)}</option>`).join('')}</select></label>
    <label>Resposta<select data-filter="response">${options(responses, state.response)}</select></label>
  `;

  container.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', () => onChange(select.dataset.filter, select.value));
  });
}
