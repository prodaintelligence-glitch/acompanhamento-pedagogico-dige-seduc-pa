import { Grid } from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';

let summaryGrid = null;
let detailGrid = null;

function mountGrid(currentGrid, container, config) {
  if (currentGrid) currentGrid.destroy();
  const grid = new Grid({ search: false, sort: true, pagination: { limit: 6 }, ...config });
  grid.render(container);
  return grid;
}

export function renderSummaryTable(container, distribution) {
  const rows = Object.entries(distribution).map(([answer, count]) => [answer, count]);
  summaryGrid = mountGrid(summaryGrid, container, {
    columns: ['Resposta', 'Quantidade'],
    data: rows
  });
}

export function renderDetailTable(container, rows, questionKey) {
  detailGrid = mountGrid(detailGrid, container, {
    columns: ['DRE', 'Municipio', 'Escola', 'Resposta selecionada'],
    data: rows.map((row) => [row.dre, row.municipio, row.escola, row[questionKey] ?? 'Nao informado'])
  });
}

export function renderTextAnswers(container, rows, questionKey) {
  container.innerHTML = `
    <div class="text-filter"><input id="open-answer-search" placeholder="Pesquisar nas respostas" /></div>
    <div id="open-answer-table"></div>
  `;

  const tableContainer = container.querySelector('#open-answer-table');
  const draw = (term = '') => {
    const filtered = rows.filter((row) => String(row[questionKey] ?? '').toLowerCase().includes(term.toLowerCase()));
    renderDetailTable(tableContainer, filtered, questionKey);
  };

  draw();
  container.querySelector('#open-answer-search').addEventListener('input', (event) => draw(event.target.value));
}
