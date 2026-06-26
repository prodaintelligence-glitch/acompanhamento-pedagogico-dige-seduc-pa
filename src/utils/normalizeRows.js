const fieldAliases = {
  timestamp: ['timestamp', 'carimbo de data/hora', 'data/hora', 'data de envio'],
  dre: ['dre', 'diretoria regional de ensino', 'regional'],
  municipio: ['municipio', 'município'],
  escola: ['escola', 'unidade escolar', 'nome da escola'],
  cargo: ['cargo', 'funcao', 'função'],
  email: ['email', 'e-mail', 'endereco de e-mail', 'endereço de e-mail']
};

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function canonicalFieldName(header) {
  const normalizedHeader = normalizeText(header);
  const entry = Object.entries(fieldAliases).find(([, aliases]) => aliases.includes(normalizedHeader));
  return entry ? entry[0] : String(header ?? '').trim();
}

function normalizeCell(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value.trim();
  return value ?? '';
}

export function normalizeRows(headers = [], rows = []) {
  if (!rows.length) return [];

  if (Array.isArray(rows[0])) {
    return rows.map((row) => headers.reduce((record, header, index) => {
      const field = canonicalFieldName(header);
      if (field) record[field] = normalizeCell(row[index]);
      return record;
    }, {}));
  }

  return rows.map((row) => Object.entries(row).reduce((record, [header, value]) => {
    const field = canonicalFieldName(header);
    if (field) record[field] = normalizeCell(value);
    return record;
  }, {}));
}
