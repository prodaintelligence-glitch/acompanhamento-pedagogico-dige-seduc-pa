export function getUniqueOptions(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

export function applyFilters(rows, filters) {
  return rows.filter((row) => {
    const institutionalMatch = ['dre', 'municipio', 'escola', 'tecnico', 'etapa', 'modalidade']
      .every((field) => !filters[field] || row[field] === filters[field]);
    const responseMatch = !filters.response
      || !filters.questionKey
      || String(row[filters.questionKey] ?? '') === String(filters.response);
    return institutionalMatch && responseMatch;
  });
}
