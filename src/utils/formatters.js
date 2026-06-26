export function formatDateTime(value) {
  if (!value) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function normalizeEmpty(value) {
  return value === undefined || value === null || value === '' ? 'Nao informado' : value;
}
