import { Chart } from 'chart.js/auto';

const charts = new Map();
const secondaryColors = ['#16a34a', '#f59e0b', '#7c3aed', '#dc2626'];

function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    series: [styles.getPropertyValue('--color-primary').trim() || '#0072ce', ...secondaryColors],
    primarySoft: styles.getPropertyValue('--color-primary-soft').trim() || '#e5f3ff',
    primaryBorder: styles.getPropertyValue('--color-primary-border').trim() || '#8dccff',
    success: styles.getPropertyValue('--color-success').trim() || '#247a5a',
    text: styles.getPropertyValue('--color-text-muted').trim() || '#5b6675',
    grid: styles.getPropertyValue('--color-border').trim() || '#d9e0e8'
  };
}

function renderChart(id, config) {
  const canvas = document.querySelector(`#${id}`);
  if (!canvas) return;
  charts.get(id)?.destroy();
  const theme = themeColors();
  charts.set(id, new Chart(canvas, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { color: theme.text } } },
      scales: {
        x: { ticks: { color: theme.text }, grid: { color: theme.grid } },
        y: { beginAtZero: true, ticks: { color: theme.text }, grid: { color: theme.grid } }
      },
      ...config.options
    }
  }));
}

export function clearHistoricalCharts() {
  charts.forEach((chart) => chart.destroy());
  charts.clear();
}

export function renderHistoricalCharts(analysis) {
  const labels = analysis.periodMetrics.map((item) => item.label);
  const theme = themeColors();
  const colors = theme.series;
  renderChart('historical-volume-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Acompanhamentos', data: analysis.periodMetrics.map((item) => item.rows), borderColor: colors[0], backgroundColor: theme.primarySoft, fill: true, tension: 0.25 }]
    }
  });

  const comparison = analysis.comparison;
  renderChart('historical-comparison-chart', {
    type: 'bar',
    data: {
      labels: comparison ? [comparison.periodA.label, comparison.periodB.label] : [],
      datasets: comparison ? [
        { label: 'Registros', data: [comparison.periodA.rows, comparison.periodB.rows], backgroundColor: [colors[0], colors[1]], borderRadius: 6 },
        { label: 'Escolas', data: [comparison.periodA.schools, comparison.periodB.schools], backgroundColor: [theme.primaryBorder, theme.success], borderRadius: 6 }
      ] : []
    }
  });

  renderChart('historical-indicator-chart', {
    type: 'line',
    data: {
      labels,
      datasets: analysis.indicatorTrends.slice(0, 5).map((indicator, index) => ({
        label: indicator.name,
        data: analysis.periodMetrics.map((metric) => indicator.periods.find((item) => item.periodKey === metric.periodKey)?.positiveRate ?? null),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.25,
        spanGaps: true
      }))
    },
    options: { scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (value) => `${value}%`, color: theme.text }, grid: { color: theme.grid } } } }
  });

  renderChart('historical-entity-chart', {
    type: 'line',
    data: {
      labels,
      datasets: analysis.entityComparison.series.map((entity, index) => ({
        label: entity.name,
        data: entity.periods.map((item) => item.records),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.25
      }))
    }
  });
}
