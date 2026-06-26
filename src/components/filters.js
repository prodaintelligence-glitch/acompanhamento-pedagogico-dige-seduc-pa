import { spreadsheetConfig } from '../config/spreadsheetConfig.js';
import { getUniqueOptions } from '../utils/filters.js';

function options(items, selected = '') {
  return ['<option value="">Todos</option>', ...items.map((item) => `<option value="${item}" ${item === selected ? 'selected' : ''}>${item}</option>`)].join('');
}

export function renderFilters(container, state, rows, questions, onChange) {
  const availablePeriods = spreadsheetConfig.filter((item) => item.active !== false);
  const years = [...new Set(availablePeriods.map((item) => item.year))];
  const months = availablePeriods.filter((item) => item.year === Number(state.year));
  const sections = [...new Set(questions.map((question) => question.section))];
  const visibleQuestions = questions.filter((question) => !state.section || question.section === state.section);

  container.innerHTML = `
    <label>Ano<select data-filter="year">${years.map((year) => `<option value="${year}" ${Number(state.year) === year ? 'selected' : ''}>${year}</option>`).join('')}</select></label>
    <label>Mes<select data-filter="month">${months.map((period) => `<option value="${period.month}" ${state.month === period.month ? 'selected' : ''}>${period.label ?? period.month}</option>`).join('')}</select></label>
    <label>DRE<select data-filter="dre">${options(getUniqueOptions(rows, 'dre'), state.dre)}</select></label>
    <label>Municipio<select data-filter="municipio">${options(getUniqueOptions(rows, 'municipio'), state.municipio)}</select></label>
    <label>Escola<select data-filter="escola">${options(getUniqueOptions(rows, 'escola'), state.escola)}</select></label>
    <label>Eixo/secao<select data-filter="section">${options(sections, state.section)}</select></label>
    <label>Pergunta<select data-filter="questionKey">${visibleQuestions.map((question) => `<option value="${question.key}" ${state.questionKey === question.key ? 'selected' : ''}>${question.code} - ${question.title}</option>`).join('')}</select></label>
  `;

  container.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', () => onChange(select.dataset.filter, select.value));
  });
}
