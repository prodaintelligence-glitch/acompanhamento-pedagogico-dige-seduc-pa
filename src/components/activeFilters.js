const filterLabels = {
  dre: 'DRE',
  municipio: 'Municipio',
  escola: 'Escola',
  tecnico: 'Tecnico',
  etapa: 'Etapa',
  modalidade: 'Modalidade',
  section: 'Eixo',
  questionKey: 'Pergunta',
  response: 'Resposta',
  drillAnswer: 'Drill-down'
};

export function hasActiveFilters(state) {
  return ['dre', 'municipio', 'escola', 'tecnico', 'etapa', 'modalidade', 'section', 'questionKey', 'response', 'drillAnswer'].some((field) => Boolean(state[field]));
}

export function renderActiveFilters(container, state, question) {
  const chips = Object.entries(filterLabels)
    .map(([field, label]) => {
      const rawValue = field === 'questionKey' && question ? `${question.code} - ${question.title}` : state[field];
      return rawValue ? `<span class="filter-chip">${label}: ${rawValue}</span>` : '';
    })
    .filter(Boolean);

  container.innerHTML = chips.length
    ? `<div class="active-filters"><strong>Filtros ativos</strong>${chips.join('')}</div>`
    : '<div class="active-filters muted">Nenhum filtro ativo alem do periodo selecionado.</div>';
}
