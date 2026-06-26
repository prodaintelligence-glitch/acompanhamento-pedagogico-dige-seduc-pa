const EMPTY_LABEL = 'Sem resposta';

const equivalentAnswers = new Map([
  ['sim', 'Sim'],
  ['s', 'Sim'],
  ['nao', 'Nao'],
  ['não', 'Nao'],
  ['n', 'Nao'],
  ['parcialmente', 'Parcialmente']
]);

function compactSpaces(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return compactSpaces(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function titleCaseShortAnswer(value) {
  const normalized = compactSpaces(value).toLowerCase();
  if (!normalized) return EMPTY_LABEL;

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function normalizeAnswer(value, { preserveText = false } = {}) {
  const compacted = compactSpaces(value);
  if (!compacted) return EMPTY_LABEL;
  if (preserveText) return compacted;

  const key = normalizeKey(compacted);
  return equivalentAnswers.get(key) ?? titleCaseShortAnswer(compacted);
}

export function isBlankAnswer(value) {
  return normalizeAnswer(value) === EMPTY_LABEL;
}

export { EMPTY_LABEL };
