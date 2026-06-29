function preferredSheetScore(name) {
  var normalized = normalizeText(name);
  var index = AP_CONFIG.PREFERRED_SHEET_NAMES.indexOf(normalized);
  return index >= 0 ? 100 - index * 10 : 0;
}

function findHeaderRow(values) {
  var best = null;
  values.forEach(function(row, rowIndex) {
    var nonEmpty = row.filter(function(cell) { return normalizeHeader(cell) !== ''; });
    if (nonEmpty.length < 2) return;

    var recognizedFields = nonEmpty.filter(function(cell) { return canonicalFieldName(cell); }).length;
    var codedQuestions = nonEmpty.filter(function(cell) { return getQuestionCode(cell); }).length;
    var textualCells = nonEmpty.filter(function(cell) { return typeof cell === 'string'; }).length;
    var score = recognizedFields * 12 + codedQuestions * 8 + textualCells + Math.min(nonEmpty.length, 10);

    if (!best || score > best.score) {
      best = { index: rowIndex, score: score, nonEmpty: nonEmpty.length };
    }
  });
  return best && best.score > 0 ? best : null;
}

function readHeaderSample(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (!lastRow || !lastColumn) return { values: [], lastRow: lastRow, lastColumn: lastColumn };
  var rowCount = Math.min(lastRow, AP_CONFIG.HEADER_SCAN_LIMIT);
  return {
    values: sheet.getRange(1, 1, rowCount, lastColumn).getDisplayValues(),
    lastRow: lastRow,
    lastColumn: lastColumn
  };
}

function findResponseSheet(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  if (!sheets.length) throw new Error('A planilha nao possui abas.');

  for (var preferredIndex = 0; preferredIndex < AP_CONFIG.PREFERRED_SHEET_NAMES.length; preferredIndex += 1) {
    var preferredName = AP_CONFIG.PREFERRED_SHEET_NAMES[preferredIndex];
    var configuredSheet = sheets.find(function(sheet) {
      return normalizeText(sheet.getName()) === preferredName;
    });
    if (configuredSheet) return configuredSheet;
  }

  for (var sheetIndex = 0; sheetIndex < sheets.length; sheetIndex += 1) {
    var sample = readHeaderSample(sheets[sheetIndex]);
    if (findHeaderRow(sample.values)) return sheets[sheetIndex];
  }

  return sheets[0];
}

function buildColumnDescriptors(headers) {
  var usedKeys = {};
  return headers.map(function(header, index) {
    var originalHeader = normalizeHeader(header);
    var canonical = canonicalFieldName(originalHeader);
    var baseKey = canonical || normalizeHeaderKey(originalHeader) || 'coluna' + (index + 1);
    var key = baseKey;
    var suffix = 2;
    while (usedKeys[key]) {
      key = baseKey + '_' + suffix;
      suffix += 1;
    }
    usedKeys[key] = true;
    return {
      index: index,
      key: key,
      header: originalHeader,
      canonical: canonical,
      technical: isTechnicalHeader(originalHeader),
      code: getQuestionCode(originalHeader)
    };
  });
}

function isQuestionColumn(descriptor) {
  if (!descriptor.header || descriptor.canonical || descriptor.technical) return false;
  if (descriptor.code && AP_CONFIG.IGNORED_QUESTION_CODES.indexOf(descriptor.code) >= 0) return false;
  return true;
}

function detectQuestionType(values) {
  if (!values.length) return 'empty';
  if (values.every(function(value) { return !isNaN(Number(value)); })) return 'numeric';

  var normalizedValues = values.map(normalizeText);
  if (normalizedValues.every(function(value) {
    return ['sim', 'nao', 'parcialmente'].indexOf(value) >= 0;
  })) return 'boolean';

  var unique = {};
  values.forEach(function(value) { unique[String(value)] = true; });
  if (Object.keys(unique).length <= 8 && values.every(function(value) { return String(value).length <= 60; })) {
    return 'categorical';
  }
  return 'text';
}

function buildQuestions(descriptors, rows) {
  return descriptors.filter(isQuestionColumn).map(function(descriptor) {
    var code = descriptor.code || 'P' + (descriptor.index + 1);
    var values = rows.map(function(row) { return row[descriptor.key]; })
      .filter(function(value) { return value !== '' && value !== null && value !== undefined; });
    var title = descriptor.code
      ? descriptor.header.replace(/^\d+\.\d+\s*-?\s*/, '')
      : descriptor.header;

    return {
      id: code,
      key: descriptor.key,
      code: code,
      detectedCode: descriptor.code,
      eixo: descriptor.code ? descriptor.code.split('.')[0] : 'Outros',
      section: descriptor.code ? 'Eixo ' + descriptor.code.split('.')[0] : 'Outros',
      titulo: title,
      title: title,
      originalHeader: descriptor.header,
      type: detectQuestionType(values)
    };
  });
}

function readSpreadsheetData(file, options) {
  options = options || {};
  var spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(file.getId());
  } catch (error) {
    throw new Error('Planilha sem permissao de leitura.');
  }

  var sheet = findResponseSheet(spreadsheet);
  var values = sheet.getDataRange().getValues();
  var hasContent = values.some(function(row) {
    return row.some(function(cell) { return cell !== '' && cell !== null; });
  });
  if (!hasContent) throw new Error('Planilha vazia: nenhum cabecalho ou registro encontrado.');
  var header = findHeaderRow(values.slice(0, AP_CONFIG.HEADER_SCAN_LIMIT));
  if (!header) throw new Error('Estrutura invalida: linha de cabecalho nao identificada.');

  var headers = values[header.index].map(normalizeHeader);
  var descriptors = buildColumnDescriptors(headers);
  var rows = values.slice(header.index + 1)
    .filter(function(row) {
      return row.some(function(cell) { return cell !== '' && cell !== null; });
    })
    .map(function(row) {
      return descriptors.reduce(function(record, descriptor) {
        record[descriptor.key] = normalizeCell(row[descriptor.index]);
        return record;
      }, {});
    });
  var questions = buildQuestions(descriptors, rows);

  if (!questions.length && options.requireQuestions !== false) {
    throw new Error('Estrutura invalida: nenhuma pergunta identificada.');
  }
  if (!rows.length) throw new Error('Planilha vazia: nenhum registro de resposta encontrado.');

  return {
    sheetName: sheet.getName(),
    headerRow: header.index + 1,
    headers: descriptors.map(function(descriptor) { return descriptor.key; }),
    rows: rows,
    questions: questions
  };
}

function safeSpreadsheetError(error) {
  var message = error && error.message ? error.message : '';
  if (/permission|permissao|access denied/i.test(message)) return 'Planilha sem permissao de leitura.';
  if (/cabecalho|estrutura invalida/i.test(message)) return message;
  if (/vazia|nenhum registro/i.test(message)) return message;
  return 'Erro de leitura da planilha.';
}

function inspectSpreadsheetFile(file) {
  var period = parsePeriodFromName(file.getName());
  var officialName = matchesOfficialFileName(file.getName());
  var inconsistencies = [];
  var result = {
    fileId: file.getId(),
    periodKey: period ? period.key : '',
    year: period ? period.year : null,
    month: period ? period.month : '',
    monthNumber: period ? period.monthNumber : null,
    label: period ? period.label : file.getName(),
    name: file.getName(),
    updatedAt: file.getLastUpdated().toISOString(),
    rowCount: 0,
    questionCount: 0,
    headerRow: null,
    status: 'Disponivel',
    compatible: false,
    officialName: officialName,
    inconsistencies: inconsistencies
  };

  if (!period) inconsistencies.push('Mes e ano nao identificados no nome do arquivo.');
  else if (!officialName) inconsistencies.push('Nome fora do padrao configurado para planilhas oficiais.');

  try {
    var spreadsheet = SpreadsheetApp.openById(file.getId());
    var sheet = findResponseSheet(spreadsheet);
    var sample = readHeaderSample(sheet);
    var header = findHeaderRow(sample.values);
    result.sheetName = sheet.getName();

    var hasContent = sample.values.some(function(row) {
      return row.some(function(cell) { return normalizeHeader(cell) !== ''; });
    });
    if (!hasContent) {
      inconsistencies.push('Planilha vazia: nenhum cabecalho ou registro encontrado.');
    } else if (!header) {
      inconsistencies.push('Estrutura invalida: linha de cabecalho nao identificada.');
    } else {
      var headers = sample.values[header.index].map(normalizeHeader);
      var descriptors = buildColumnDescriptors(headers);
      result.headerRow = header.index + 1;
      result.rowCount = Math.max(sample.lastRow - result.headerRow, 0);
      result.questionCount = descriptors.filter(isQuestionColumn).length;
      if (!result.questionCount) inconsistencies.push('Estrutura invalida: nenhuma pergunta identificada.');
      if (!result.rowCount) inconsistencies.push('Planilha vazia: nenhum registro de resposta encontrado.');
    }
  } catch (error) {
    result.status = 'Erro de leitura';
    inconsistencies.push(safeSpreadsheetError(error));
  }

  result.compatible = Boolean(period && officialName && result.questionCount > 0 && result.rowCount > 0 && result.status !== 'Erro de leitura');
  if (!result.compatible && result.status !== 'Erro de leitura') result.status = 'Incompativel';
  else if (inconsistencies.length && result.status === 'Disponivel') result.status = 'Atencao';
  return result;
}

function buildStatistics(rows, questions) {
  return {
    totalRows: rows.length,
    totalQuestions: questions.length,
    totalDres: uniqueValues(rows, 'dre'),
    totalMunicipios: uniqueValues(rows, 'municipio'),
    totalEscolas: uniqueValues(rows, 'escola')
  };
}
