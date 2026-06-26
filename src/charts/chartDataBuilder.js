const palette = [
  '#2563eb',
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

export function buildChartData({ distribution, chartConfig = {} }) {
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);
  const selectedAnswer = chartConfig.selectedAnswer;

  return {
    labels,
    datasets: [
      {
        label: 'Respostas',
        data: values,
        backgroundColor: labels.map((label, index) => selectedAnswer && label !== selectedAnswer ? '#cbd5e1' : palette[index % palette.length]),
        borderColor: labels.map((label) => label === selectedAnswer ? '#0f172a' : '#ffffff'),
        borderWidth: labels.map((label) => label === selectedAnswer ? 4 : 2),
        borderRadius: 6
      }
    ]
  };
}
