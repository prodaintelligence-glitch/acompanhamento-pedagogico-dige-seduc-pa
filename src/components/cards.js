import { formatDateTime } from '../utils/formatters.js';

export function renderMetricCards(container, metrics) {
  container.innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <span class="metric-label">${metric.label}</span>
      <strong>${metric.value}</strong>
    </article>
  `).join('');
}

export function buildMetrics(rows, questions, latestTimestamp) {
  return [
    { label: 'Total de respostas', value: rows.length },
    { label: 'Total de DREs', value: new Set(rows.map((row) => row.dre).filter(Boolean)).size },
    { label: 'Total de municipios', value: new Set(rows.map((row) => row.municipio).filter(Boolean)).size },
    { label: 'Total de escolas', value: new Set(rows.map((row) => row.escola).filter(Boolean)).size },
    { label: 'Perguntas analisaveis', value: questions.length },
    { label: 'Ultima atualizacao', value: formatDateTime(latestTimestamp) }
  ];
}
