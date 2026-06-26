const PERSONAL_FIELD_LIMIT = 12;

const fixedPersonalFields = new Set([
  'timestamp',
  'dre',
  'municipio',
  'escola',
  'cargo',
  'email'
]);

export function detectPersonalFields(headers = []) {
  return new Set([
    ...headers.slice(0, PERSONAL_FIELD_LIMIT),
    ...headers.filter((header) => fixedPersonalFields.has(header))
  ]);
}
