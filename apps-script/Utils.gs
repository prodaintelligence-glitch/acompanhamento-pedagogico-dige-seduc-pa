var AP_MONTHS = [
  { number: 1, name: 'Janeiro', aliases: ['janeiro', 'jan'] },
  { number: 2, name: 'Fevereiro', aliases: ['fevereiro', 'fev'] },
  { number: 3, name: 'Março', aliases: ['marco', 'mar'] },
  { number: 4, name: 'Abril', aliases: ['abril', 'abr'] },
  { number: 5, name: 'Maio', aliases: ['maio', 'mai'] },
  { number: 6, name: 'Junho', aliases: ['junho', 'jun'] },
  { number: 7, name: 'Julho', aliases: ['julho', 'jul'] },
  { number: 8, name: 'Agosto', aliases: ['agosto', 'ago'] },
  { number: 9, name: 'Setembro', aliases: ['setembro', 'set'] },
  { number: 10, name: 'Outubro', aliases: ['outubro', 'out'] },
  { number: 11, name: 'Novembro', aliases: ['novembro', 'nov'] },
  { number: 12, name: 'Dezembro', aliases: ['dezembro', 'dez'] }
];

var AP_FIELD_ALIASES = {
  timestamp: ['timestamp', 'carimbo de data/hora', 'data/hora', 'data de envio'],
  dre: ['dre', 'diretoria regional de ensino', 'regional'],
  municipio: ['municipio'],
  escola: ['escola', 'unidade escolar', 'nome da escola'],
  cargo: ['cargo', 'funcao'],
  email: ['email', 'e-mail', 'endereco de e-mail'],
  tecnico: ['tecnico', 'tecnico responsavel', 'nome do tecnico'],
  respondente: ['respondente', 'nome do respondente', 'nome completo'],
  matricula: ['matricula', 'matricula funcional'],
  telefone: ['telefone', 'celular', 'contato']
};

var AP_TECHNICAL_HEADERS = [
  'id da resposta',
  'id da resposta do formulario',
  'url de edicao da resposta',
  'edit response url',
  'pontuacao',
  'score'
];

function normalizeText(value) {
  return String(value === null || value === undefined ? '' : value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeHeader(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function normalizeHeaderKey(value) {
  var words = normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(function(word) { return word; });
  if (!words.length) return '';
  return words[0] + words.slice(1).map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
}

function normalizeCell(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString();
  if (typeof value === 'string') return value.trim();
  return value === null || value === undefined ? '' : value;
}

function canonicalFieldName(header) {
  var normalized = normalizeText(header);
  var names = Object.keys(AP_FIELD_ALIASES);
  for (var index = 0; index < names.length; index += 1) {
    var name = names[index];
    if (AP_FIELD_ALIASES[name].indexOf(normalized) >= 0) return name;
  }
  return '';
}

function isTechnicalHeader(header) {
  return AP_TECHNICAL_HEADERS.indexOf(normalizeText(header)) >= 0;
}

function parsePeriodFromName(name) {
  var normalized = normalizeText(name);
  var yearMatch = normalized.match(/(?:19|20)\d{2}/);
  var month = null;

  var yearFirst = normalized.match(/((?:19|20)\d{2})[^0-9a-z]+(0?[1-9]|1[0-2])(?:[^0-9]|$)/);
  var monthFirst = normalized.match(/(?:^|[^0-9])(0?[1-9]|1[0-2])[^0-9a-z]+((?:19|20)\d{2})(?:[^0-9]|$)/);
  var numericMonth = yearFirst ? Number(yearFirst[2]) : monthFirst ? Number(monthFirst[1]) : 0;
  if (numericMonth) {
    month = AP_MONTHS.find(function(candidate) { return candidate.number === numericMonth; }) || null;
    yearMatch = [yearFirst ? yearFirst[1] : monthFirst[2]];
  }

  AP_MONTHS.some(function(candidate) {
    var matched = candidate.aliases.some(function(alias) {
      return new RegExp('(^|[^a-z])' + alias + '([^a-z]|$)').test(normalized);
    });
    if (matched) month = candidate;
    return matched;
  });

  if (!yearMatch || !month) return null;
  var year = Number(yearMatch[0]);
  var key = year + '-' + String(month.number).padStart(2, '0');
  return {
    key: key,
    year: year,
    month: month.name,
    monthNumber: month.number,
    label: month.name + '/' + year
  };
}

function distinctValues(rows, field) {
  var values = {};
  rows.forEach(function(row) {
    var value = row[field];
    if (value !== '' && value !== null && value !== undefined) values[String(value)] = true;
  });
  return Object.keys(values).sort();
}

function getQuestionCode(header) {
  var match = normalizeHeader(header).match(/^(\d+\.\d+)/);
  return match ? match[1] : '';
}

function uniqueValues(rows, field) {
  var values = {};
  rows.forEach(function(row) {
    if (row[field] !== '' && row[field] !== null && row[field] !== undefined) {
      values[String(row[field])] = true;
    }
  });
  return Object.keys(values).length;
}
