import { renderHistoricalCharts } from '../charts/historicalChartRenderer.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function options(items, selected, valueKey = 'value', labelKey = 'label') {
  return items.map((item) => {
    const value = typeof item === 'string' ? item : item[valueKey];
    const label = typeof item === 'string' ? item : item[labelKey];
    return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function rankingTable(items, label) {
  if (!items.length) return '<p class="empty-state">Sem dados para o recorte selecionado.</p>';
  return `<table class="admin-table"><thead><tr><th>${label}</th><th>Acompanhamentos</th><th>Municipios</th><th>Escolas</th><th>Meses</th></tr></thead><tbody>${items.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td>${item.records}</td><td>${item.municipalities}</td><td>${item.schools}</td><td>${item.periods}</td></tr>
  `).join('')}</tbody></table>`;
}

export function renderHistoricalAnalysis(container, { analysis, periods, controls, entityOptions, loading = false, error = '', onChange }) {
  if (loading) {
    container.innerHTML = '<section class="panel"><p class="empty-state">Carregando analises historicas e comparativas...</p></section>';
    return;
  }
  if (error) {
    container.innerHTML = `<section class="panel"><p class="empty-state error-state">${escapeHtml(error)}</p></section>`;
    return;
  }
  if (!analysis?.periodMetrics?.length) {
    container.innerHTML = '<section class="panel"><p class="empty-state">Nao ha periodos suficientes para analise historica.</p></section>';
    return;
  }

  const dimensionLabels = { dre: 'DRE', municipio: 'Municipio', escola: 'Escola', tecnico: 'Tecnico' };
  const comparison = analysis.comparison;
  container.innerHTML = `
    <section class="historical-section">
      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Inteligencia historica</p><h2>Comparativos e evolucao</h2></div><span>Todos os calculos respeitam os filtros ativos</span></div>
        <div class="historical-controls">
          <label>Periodo inicial<select data-historical-control="periodA">${options(periods, controls.periodA, 'periodKey', 'label')}</select></label>
          <label>Periodo final<select data-historical-control="periodB">${options(periods, controls.periodB, 'periodKey', 'label')}</select></label>
          <label>Dimensao<select data-historical-control="dimension">${options(Object.entries(dimensionLabels).map(([value, label]) => ({ value, label })), controls.dimension)}</select></label>
          <label>Referencia A<select data-historical-control="entityA"><option value="">Selecione</option>${options(entityOptions, controls.entityA)}</select></label>
          <label>Referencia B<select data-historical-control="entityB"><option value="">Selecione</option>${options(entityOptions, controls.entityB)}</select></label>
        </div>
      </section>

      <section class="metrics-grid historical-metrics">
        ${analysis.strategic.map((metric) => `<article class="metric-card"><span class="metric-label">${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></article>`).join('')}
      </section>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Resumo executivo</p><h2>Leitura estrategica do recorte</h2></div></div>
        <div class="smart-messages">${analysis.executiveSummary.map((message, index) => `<p data-type="${index ? 'warning' : 'info'}">${escapeHtml(message)}</p>`).join('')}</div>
        ${comparison ? `<div class="comparison-strip">
          <span>Registros<strong>${comparison.periodA.rows} → ${comparison.periodB.rows}</strong><small>${comparison.recordsDelta}%</small></span>
          <span>Escolas<strong>${comparison.periodA.schools} → ${comparison.periodB.schools}</strong><small>${comparison.schoolsDelta >= 0 ? '+' : ''}${comparison.schoolsDelta}</small></span>
          <span>Municipios<strong>${comparison.periodA.municipalities} → ${comparison.periodB.municipalities}</strong><small>${comparison.municipalitiesDelta >= 0 ? '+' : ''}${comparison.municipalitiesDelta}</small></span>
          <span>Indice positivo<strong>${comparison.periodA.positiveRate}% → ${comparison.periodB.positiveRate}%</strong><small>${comparison.positiveRateDelta >= 0 ? '+' : ''}${comparison.positiveRateDelta} p.p.</small></span>
        </div>` : ''}
      </section>

      <section class="historical-chart-grid">
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Evolucao mensal</p><h2>Quantidade de acompanhamentos</h2></div></div><div class="historical-chart"><canvas id="historical-volume-chart"></canvas></div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Comparativo</p><h2>Periodos selecionados</h2></div></div><div class="historical-chart"><canvas id="historical-comparison-chart"></canvas></div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Indicadores</p><h2>Tendencia historica</h2></div></div><div class="historical-chart"><canvas id="historical-indicator-chart"></canvas></div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">${escapeHtml(dimensionLabels[controls.dimension])}</p><h2>Comparacao entre referencias</h2></div></div><div class="historical-chart"><canvas id="historical-entity-chart"></canvas></div></article>
      </section>

      <section class="historical-ranking-grid">
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Cobertura</p><h2>Municipios acompanhados</h2></div></div><div class="table-scroll">${rankingTable(analysis.rankings.municipalities, 'Municipio')}</div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Cobertura</p><h2>DREs atendidas</h2></div></div><div class="table-scroll">${rankingTable(analysis.rankings.dres, 'DRE')}</div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Distribuicao de visitas</p><h2>Tecnicos</h2></div><span>Uso gerencial, sem avaliacao competitiva</span></div><div class="table-scroll">${rankingTable(analysis.rankings.technicians, 'Tecnico')}</div></article>
      </section>

      <section class="analysis-grid">
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Perguntas criticas</p><h2>Negativas, lacunas e recorrencia</h2></div></div><div class="table-scroll"><table class="admin-table"><thead><tr><th>Pergunta</th><th>Negativas</th><th>Em branco</th><th>Meses</th></tr></thead><tbody>${analysis.criticalQuestions.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${item.negativeRate}%</td><td>${item.blanks}</td><td>${item.recurringPeriods}</td></tr>`).join('') || '<tr><td colspan="4">Sem dados.</td></tr>'}</tbody></table></div></article>
        <article class="panel"><div class="panel-header"><div><p class="eyebrow">Indicadores estrategicos</p><h2>Variacao e tendencia</h2></div></div><div class="table-scroll"><table class="admin-table"><thead><tr><th>Indicador</th><th>Tendencia</th><th>Variacao</th><th>Meses</th></tr></thead><tbody>${analysis.indicatorTrends.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.trend)}</td><td>${item.delta >= 0 ? '+' : ''}${item.delta} p.p.</td><td>${item.periods.length}</td></tr>`).join('') || '<tr><td colspan="4">Catalogo de indicadores ainda nao processado.</td></tr>'}</tbody></table></div></article>
      </section>

      ${analysis.errors.length ? `<section class="panel"><p class="empty-state error-state">Periodos com falha: ${escapeHtml(analysis.errors.map((item) => item.period).join(', '))}</p></section>` : ''}
    </section>
  `;

  container.querySelectorAll('[data-historical-control]').forEach((select) => {
    select.addEventListener('change', () => onChange(select.dataset.historicalControl, select.value));
  });
  renderHistoricalCharts(analysis);
}
