export function renderStatisticalPanel(container, { metrics, distribution }) {
  if (!metrics) {
    container.innerHTML = '<p class="empty-state">Selecione uma pergunta para visualizar estatisticas.</p>';
    return;
  }

  const distributionRows = metrics.categoryStats
    .map((item) => `
      <div class="distribution-row">
        <span>${item.label}</span>
        <strong>${item.count}</strong>
        <small>${item.percent}%</small>
        <div class="distribution-bar"><i style="width: ${item.percent}%"></i></div>
      </div>
    `)
    .join('');

  container.innerHTML = `
    <div class="panel-header compact"><div><p class="eyebrow">Painel estatistico</p><h2>Leitura da pergunta</h2></div></div>
    <div class="stat-panel-grid">
      <span>Categorias<strong>${metrics.categoryCount}</strong></span>
      <span>Moda<strong>${metrics.topCategory}</strong></span>
      <span>Freq. absoluta<strong>${metrics.topCount}</strong></span>
      <span>Freq. relativa<strong>${metrics.topPercent}%</strong></span>
      <span>Registros filtrados<strong>${metrics.total}</strong></span>
      <span>Em branco<strong>${metrics.blankCount}</strong></span>
    </div>
    <div class="distribution-list">${distributionRows || '<p class="empty-state">Sem distribuicao disponivel.</p>'}</div>
  `;
}
