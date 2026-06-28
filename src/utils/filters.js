export function getUniqueOptions(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

export function applyFilters(rows, filters) {
  return rows.filter((row) => {
    return ['dre', 'municipio', 'escola', 'tecnico'].every((field) => !filters[field] || row[field] === filters[field]);
  });
}
