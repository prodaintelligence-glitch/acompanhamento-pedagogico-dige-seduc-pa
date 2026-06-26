import { Grid } from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';

let drillGrid = null;

function destroyGrid() {
  if (drillGrid) {
    drillGrid.destroy();
    drillGrid = null;
  }
}

function renderFilterSummary(filters = {}) {
  const visible = Object.entries(filters).filter(([, value]) => value && !['Todos', 'Todas'].includes(value));
  if (!visible.length) return '<span class="muted-text">Sem filtros adicionais.</span>';
  return visible.map(([key, value]) => `<span class="filter-chip">${key}: ${value}</span>`).join('');
}

export function renderDrillDownTable(container, { rows, question, answer, totalRows = rows.length, filters = {}, onClear }) {
  destroyGrid();

  const title = answer ? `Registros com resposta: ${answer}` : 'Registros detalhados';
  const description = question ? `${question.code} - ${question.title}` : 'Nenhuma pergunta selecionada';
  const percent = totalRows ? Math.round((rows.length / totalRows) * 100) : 0;

  container.innerHTML = `
    <div class="drill-header">
      <div>
        <p class="eyebrow">Drill-down</p>
        <h2>${title}</h2>
        <span>${description}</span>
        <div class="drill-filter-summary">${renderFilterSummary(filters)}</div>
      </div>
      <div class="drill-actions">
        <strong>${rows.length} registros</strong>
        <span class="drill-percent">${percent}% do filtro atual</span>
        <button id="clear-drill" class="secondary-button compact-button" type="button" ${answer ? '' : 'hidden'}>Limpar Drill-down</button>
      </div>
    </div>
    <div id="drill-grid" class="table-scroll"></div>
  `;

  container.querySelector('#clear-drill')?.addEventListener('click', onClear);

  if (!rows.length) {
    container.querySelector('#drill-grid').innerHTML = '<p class="empty-state">Nenhum registro encontrado para a selecao atual.</p>';
    return;
  }

  drillGrid = new Grid({
    search: true,
    sort: true,
    pagination: { limit: 8 },
    columns: ['DRE', 'Municipio', 'Escola', 'Resposta'],
    data: rows.map((row) => [
      row.dre || 'Nao informado',
      row.municipio || 'Nao informado',
      row.escola || 'Nao informado',
      row[question.key] || 'Sem resposta'
    ])
  });

  drillGrid.render(container.querySelector('#drill-grid'));
}
