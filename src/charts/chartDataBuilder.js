const secondaryPalette = [
  '#16a34a',
  '#f59e0b',
  '#64748b',
  '#0f766e',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#4f46e5',
  '#65a30d'
];

function cssColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function buildChartData({ distribution, chartConfig = {} }) {
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);
  const selectedAnswer = chartConfig.selectedAnswer;
  const palette = [cssColor('--color-primary', '#0072ce'), ...secondaryPalette];
  const muted = cssColor('--color-border-strong', '#bdc9d6');
  const strong = cssColor('--color-text-strong', '#102033');
  const surface = cssColor('--color-surface', '#ffffff');

  return {
    labels,
    datasets: [
      {
        label: 'Respostas',
        data: values,
        backgroundColor: labels.map((label, index) => selectedAnswer && label !== selectedAnswer ? muted : palette[index % palette.length]),
        borderColor: labels.map((label) => label === selectedAnswer ? strong : surface),
        borderWidth: labels.map((label) => label === selectedAnswer ? 4 : 2),
        borderRadius: 6
      }
    ]
  };
}
