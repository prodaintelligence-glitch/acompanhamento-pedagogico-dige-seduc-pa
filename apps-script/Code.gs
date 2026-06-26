function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var spreadsheetId = params.spreadsheetId;
    var sheetName = params.sheetName || 'Respostas ao formulário 1';

    if (!spreadsheetId) {
      return jsonResponse({
        success: false,
        message: 'Parametro spreadsheetId e obrigatorio.'
      });
    }

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({
        success: false,
        message: 'Aba "' + sheetName + '" nao encontrada.'
      });
    }

    var values = sheet.getDataRange().getValues();
    if (!values.length) {
      return jsonResponse({
        success: true,
        headers: [],
        rows: [],
        totalRows: 0,
        updatedAt: new Date().toISOString()
      });
    }

    var headers = values[0].map(normalizeHeader);
    var rows = values.slice(1)
      .filter(function(row) {
        return row.some(function(cell) {
          return cell !== '' && cell !== null;
        });
      })
      .map(function(row) {
        return row.map(normalizeCell);
      });

    return jsonResponse({
      success: true,
      headers: headers,
      rows: rows,
      totalRows: rows.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error && error.message ? error.message : 'Erro inesperado ao ler a planilha.'
    });
  }
}

function normalizeHeader(header) {
  return String(header || '').trim();
}

function normalizeCell(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return value === null || value === undefined ? '' : value;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
