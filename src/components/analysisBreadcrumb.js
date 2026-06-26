function item(label, active = false) {
  return `<span class="${active ? 'active' : ''}">${label}</span>`;
}

export function renderAnalysisBreadcrumb(container, { period, section, question, drillAnswer }) {
  const parts = [
    item('Dashboard'),
    item(period?.label ?? 'Periodo'),
    section ? item(section) : '',
    question ? item(`Pergunta ${question.code}`) : '',
    drillAnswer ? item(`Categoria "${drillAnswer}"`, true) : ''
  ].filter(Boolean);

  container.innerHTML = `<nav class="analysis-breadcrumb" aria-label="Caminho da analise">${parts.join('<b>›</b>')}</nav>`;
}
