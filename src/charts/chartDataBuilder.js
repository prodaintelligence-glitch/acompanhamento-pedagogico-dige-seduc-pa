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

export function buildChartData({ distribution }) {
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);

  return {
    labels,
    datasets: [
      {
        label: 'Respostas',
        data: values,
        backgroundColor: labels.map((_, index) => palette[index % palette.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };
}
