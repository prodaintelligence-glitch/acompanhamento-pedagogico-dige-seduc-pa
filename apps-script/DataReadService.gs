function requiredSpreadsheetId(params) {
  var spreadsheetId = String(params.spreadsheetId || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(spreadsheetId)) {
    throw new Error('ID da planilha invalido ou nao informado.');
  }
  return spreadsheetId;
}

function getOfficialSpreadsheetFile(spreadsheetId) {
  var file;
  try {
    file = DriveApp.getFileById(spreadsheetId);
  } catch (error) {
    throw new Error('Planilha nao encontrada ou sem permissao de leitura.');
  }
  if (file.isTrashed() || file.getMimeType() !== MimeType.GOOGLE_SHEETS) {
    throw new Error('O arquivo informado nao e uma planilha Google valida.');
  }
  if (!isFileInOfficialFolder(file)) {
    throw new Error('A planilha solicitada nao pertence a pasta oficial.');
  }
  if (isIgnoredDriveFile(file)) {
    throw new Error('A planilha solicitada esta marcada como arquivo ignorado.');
  }
  return file;
}

function sourceMetadata(file, sheetName) {
  var period = parsePeriodFromName(file.getName());
  return {
    sourceSpreadsheetId: file.getId(),
    sourceSpreadsheetName: file.getName(),
    sourceMonth: period ? period.month : null,
    sourceYear: period ? period.year : null,
    sourceSheetName: sheetName
  };
}

function addSourceMetadata(row, metadata) {
  return Object.assign({}, row, metadata);
}

function spreadsheetReadContract(file, data) {
  var metadata = sourceMetadata(file, data.sheetName);
  return {
    spreadsheet: metadata,
    headers: data.headers,
    headerRow: data.headerRow,
    questions: data.questions,
    rows: data.rows.map(function(row) { return addSourceMetadata(row, metadata); }),
    count: data.rows.length,
    updatedAt: file.getLastUpdated().toISOString()
  };
}

function spreadsheetCacheKey(file) {
  return 'ap-spreadsheet-v1-' + file.getId() + '-' + file.getLastUpdated().getTime();
}

function buildSpreadsheetDataById(params) {
  var file = getOfficialSpreadsheetFile(requiredSpreadsheetId(params));
  var key = spreadsheetCacheKey(file);
  var cached = params.refresh === '1' ? null : readChunkedCache(key);
  if (cached) return cached;

  var contract = spreadsheetReadContract(file, readSpreadsheetData(file, { requireQuestions: false }));
  writeChunkedCache(key, contract);
  return contract;
}

function catalogVersion(items) {
  var signature = items.map(function(item) {
    return item.fileId + ':' + item.updatedAt;
  }).sort().join('|');
  var hash = 5381;
  for (var index = 0; index < signature.length; index += 1) {
    hash = ((hash << 5) + hash) ^ signature.charCodeAt(index);
  }
  return String(hash >>> 0);
}

function buildAllData(params) {
  var refresh = params.refresh === '1';
  if (refresh) clearApiCache();

  var catalog = getCatalogInternal();
  var key = 'ap-all-data-v1-' + catalogVersion(catalog);
  var cached = refresh ? null : readChunkedCache(key);
  if (cached) return cached;

  var rows = [];
  var spreadsheets = [];
  var errors = [];
  catalog.forEach(function(item) {
    try {
      var file = getOfficialSpreadsheetFile(item.fileId);
      var data = readSpreadsheetData(file, { requireQuestions: false });
      var metadata = sourceMetadata(file, data.sheetName);
      data.rows.forEach(function(row) { rows.push(addSourceMetadata(row, metadata)); });
      spreadsheets.push(Object.assign({}, metadata, {
        count: data.rows.length,
        headerRow: data.headerRow,
        headers: data.headers,
        questions: data.questions,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      errors.push({
        sourceSpreadsheetId: item.fileId,
        sourceSpreadsheetName: item.name,
        error: safeSpreadsheetError(error)
      });
    }
  });

  var contract = {
    rows: rows,
    count: rows.length,
    spreadsheets: spreadsheets,
    spreadsheetCount: spreadsheets.length,
    skippedSpreadsheetCount: catalog.length - spreadsheets.length,
    errors: errors,
    updatedAt: new Date().toISOString()
  };
  writeChunkedCache(key, contract);
  return contract;
}
