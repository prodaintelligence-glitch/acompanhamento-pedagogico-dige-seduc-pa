function discoverCatalog() {
  var catalog = listOfficialSpreadsheetFiles().map(inspectSpreadsheetFile);

  catalog.sort(function(a, b) {
    if (a.year !== b.year) return Number(b.year || 0) - Number(a.year || 0);
    if (a.monthNumber !== b.monthNumber) return Number(b.monthNumber || 0) - Number(a.monthNumber || 0);
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  var seen = {};
  catalog.forEach(function(item) {
    if (!item.periodKey) return;
    if (seen[item.periodKey]) {
      item.status = 'Atencao';
      item.inconsistencies.push('Existe mais de uma planilha para este periodo.');
      seen[item.periodKey].status = 'Atencao';
      seen[item.periodKey].inconsistencies.push('Existe mais de uma planilha para este periodo.');
    } else {
      seen[item.periodKey] = item;
    }
  });

  return catalog;
}

function getCatalogInternal() {
  var cached = readChunkedCache(AP_CONFIG.CATALOG_CACHE_KEY);
  if (cached) return cached;
  var catalog = discoverCatalog();
  writeChunkedCache(AP_CONFIG.CATALOG_CACHE_KEY, catalog);
  return catalog;
}

function publicCatalogItem(item) {
  return {
    id: item.periodKey,
    periodKey: item.periodKey,
    year: item.year,
    month: item.month,
    monthNumber: item.monthNumber,
    label: item.label,
    name: item.name,
    updatedAt: item.updatedAt,
    rowCount: item.rowCount,
    questionCount: item.questionCount,
    status: item.status,
    inconsistencies: item.inconsistencies || [],
    active: Boolean(item.compatible)
  };
}

function buildCatalogContract() {
  var internalCatalog = getCatalogInternal();
  var publicCatalog = internalCatalog.map(publicCatalogItem);
  var periods = publicCatalog.filter(function(item) { return item.active; });
  var synchronizedAt = new Date().toISOString();
  return {
    success: true,
    periods: periods,
    selectedPeriod: periods.length ? periods[0] : null,
    metadata: {
      source: 'google-drive',
      catalog: publicCatalog,
      totalFiles: publicCatalog.length,
      totalSpreadsheets: publicCatalog.length,
      availablePeriods: periods.length,
      latestPeriod: periods.length ? periods[0] : null,
      lastSyncAt: synchronizedAt,
      sortOrder: 'descending'
    },
    questions: [],
    rows: [],
    statistics: {},
    updatedAt: synchronizedAt
  };
}

function buildPeriodContract(periodKey, skipCache) {
  if (!/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new Error('Periodo invalido. Use o formato AAAA-MM.');
  }

  var matches = getCatalogInternal().filter(function(item) { return item.periodKey === periodKey; });
  if (!matches.length) throw new Error('Periodo nao encontrado na pasta oficial.');
  if (matches.length > 1) throw new Error('Periodo duplicado na pasta oficial. Corrija o catalogo antes de continuar.');

  var item = matches[0];
  if (!item.compatible) {
    throw new Error(item.inconsistencies[0] || 'Planilha incompativel com o contrato de dados.');
  }
  var file = DriveApp.getFileById(item.fileId);
  if (!isFileInOfficialFolder(file)) {
    throw new Error('A planilha solicitada nao pertence a pasta oficial.');
  }

  var cacheKey = 'ap-period-v3-' + periodKey + '-' + file.getLastUpdated().getTime() + '-' + questionCatalogVersion();
  var cached = skipCache ? null : readChunkedCache(cacheKey);
  if (cached) return cached;

  var data = readSpreadsheetData(file);
  var indicatorData = enrichQuestionsWithIndicators(periodKey, data.questions);
  var selectedPeriod = publicCatalogItem(item);
  var contract = {
    success: true,
    periods: getCatalogInternal()
      .filter(function(catalogItem) { return catalogItem.compatible; })
      .map(publicCatalogItem),
    selectedPeriod: selectedPeriod,
    metadata: {
      source: 'google-drive',
      fileName: item.name,
      sheetName: data.sheetName,
      headerRow: data.headerRow,
      totalRows: data.rows.length,
      totalColumns: data.headers.length,
      status: item.status,
      inconsistencies: item.inconsistencies || [],
      indicatorCoverage: indicatorData.coverage,
      lastSyncAt: new Date().toISOString()
    },
    questions: indicatorData.questions,
    indicators: indicatorData.indicators,
    rows: data.rows,
    statistics: buildStatistics(data.rows, indicatorData.questions),
    updatedAt: item.updatedAt
  };

  writeChunkedCache(cacheKey, contract);
  return contract;
}
