export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')}%`;
}

export function formatGeneratedAt(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export function buildReportFileName(report, extension) {
  const period = slugify(`${report.period.month}-${report.period.year}`);
  const question = report.question ? `-pergunta-${slugify(report.question.code)}` : '';
  return `acompanhamento-pedagogico-${period}${question}.${extension}`;
}

export function rowsForQuestion(rows, question) {
  if (!question) return [];

  return rows.map((row) => ({
    DRE: row.dre || 'Nao informado',
    Municipio: row.municipio || 'Nao informado',
    Escola: row.escola || 'Nao informado',
    Resposta: row[question.key] || 'Sem resposta'
  }));
}

export function rowsForDistribution(distribution) {
  return Object.entries(distribution).map(([answer, count]) => ({
    Resposta: answer,
    Quantidade: count
  }));
}

export function rowsForFilters(filters) {
  return Object.entries(filters).map(([name, value]) => ({
    Filtro: name,
    Valor: value
  }));
}
