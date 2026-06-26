import { Grid } from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';

let drillGrid = null;

function destroyGrid() {
  if (drillGrid) {
    drillGrid.destroy();
    drillGrid = null;
  }
}

export function renderDrillDownTable(container, { rows, question, answer, onClear }) {
  destroyGrid();

  const title = answer ? `Registros com resposta: ${answer}` : 'Registros detalhados';
  const description = question ? `${question.code} - ${question.title}` : 'Nenhuma pergunta selecionada';

  container.innerHTML = `
    <div class="drill-header">
      <div>
        <p class="eyebrow">Drill-down</p>
        <h2>${title}</h2>
        <span>${description}</span>
      </div>
      <div class="drill-actions">
        <strong>${rows.length} registros</strong>
        <button id="clear-drill" class="secondary-button compact-button" type="button" ${answer ? '' : 'hidden'}>Limpar selecao</button>
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
    search: false,
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
