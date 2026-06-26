export function renderQuestionInfoCards(container, { question, questionType, metrics, chartConfig }) {
  if (!question) {
    container.innerHTML = '';
    return;
  }

  const chartLabel = chartConfig.chartType === 'table' ? 'Tabela' : chartConfig.chartType;

  container.innerHTML = `
    <article class="info-card"><span>Pergunta</span><strong>${question.title}</strong></article>
    <article class="info-card"><span>Codigo</span><strong>${question.code}</strong></article>
    <article class="info-card"><span>Tipo</span><strong>${questionType}</strong></article>
    <article class="info-card"><span>Categorias</span><strong>${metrics.categoryCount}</strong></article>
    <article class="info-card"><span>Grafico</span><strong>${chartLabel}</strong></article>
  `;
}
