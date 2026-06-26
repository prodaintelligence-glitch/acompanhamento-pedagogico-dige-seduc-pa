import { Chart } from 'chart.js/auto';
import { buildChartData } from './chartDataBuilder.js';
import { getClickedCategory } from './chartEvents.js';

let activeChart = null;

function destroyActiveChart() {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
}

function showChartMessage(canvas, message) {
  const wrapper = canvas.closest('.chart-wrap');
  const messageElement = wrapper?.querySelector('.chart-message');
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.hidden = false;
  }
  canvas.hidden = true;
}

function hideChartMessage(canvas) {
  const wrapper = canvas.closest('.chart-wrap');
  const messageElement = wrapper?.querySelector('.chart-message');
  if (messageElement) {
    messageElement.hidden = true;
  }
  canvas.hidden = false;
}

export function clearQuestionChart(canvas, message = 'Nao ha grafico para a pergunta selecionada.') {
  destroyActiveChart();
  showChartMessage(canvas, message);
}

export function renderQuestionChart(canvas, question, chartConfig, distribution, onSelect) {
  destroyActiveChart();

  const labels = Object.keys(distribution);
  const values = Object.values(distribution);

  if (!labels.length || !values.some((value) => value > 0)) {
    showChartMessage(canvas, 'Nao ha dados suficientes para gerar o grafico.');
    return;
  }

  if (chartConfig.chartType === 'none' || chartConfig.chartType === 'table') {
    showChartMessage(canvas, chartConfig.reason || 'Pergunta analisada sem grafico.');
    return;
  }

  hideChartMessage(canvas);

  const chartType = chartConfig.chartType === 'line' ? 'line' : chartConfig.chartType;

  try {
    activeChart = new Chart(canvas, {
      type: chartType,
      data: buildChartData({ distribution, question, chartConfig }),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartConfig.indexAxis ?? 'x',
        plugins: {
          legend: { position: chartType === 'doughnut' ? 'bottom' : 'top' },
          tooltip: { intersect: false }
        },
        onClick: (_, elements) => {
          const answer = getClickedCategory(elements, labels);
          if (!answer) return;
          onSelect({ questionKey: question.key, answer });
        },
        scales: chartType === 'doughnut'
          ? undefined
          : {
              x: { beginAtZero: true, ticks: { precision: 0 } },
              y: { beginAtZero: true, ticks: { precision: 0 } }
            }
      }
    });
  } catch (error) {
    clearQuestionChart(canvas, 'Nao foi possivel renderizar o grafico desta pergunta.');
  }
}
