function requiredPeriod(params) {
  var period = String(params.period || '').trim();
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error('Periodo invalido. Use o formato AAAA-MM.');
  return period;
}

function cachedApiView(name, period, refresh, factory) {
  var key = 'ap-api-v1-' + name + '-' + (period || 'global') + '-' + questionCatalogVersion();
  var cached = refresh ? null : readChunkedCache(key);
  if (cached) return cached;
  var value = factory();
  writeChunkedCache(key, value);
  return value;
}

function buildHealthcheckData() {
  var folder = getOfficialFolder();
  return {
    status: folder && folder.getId() === DRIVE_FOLDER_ID ? 'operational' : 'unavailable',
    source: 'google-drive',
    cacheSeconds: AP_CONFIG.CACHE_SECONDS
  };
}

function buildSpreadsheetListData(refresh) {
  if (refresh) clearApiCache();
  return buildCatalogContract();
}

function buildSpreadsheetData(params) {
  return buildPeriodContract(requiredPeriod(params), params.refresh === '1');
}

function buildDashboardData(params) {
  var period = requiredPeriod(params);
  return cachedApiView('dashboard', period, params.refresh === '1', function() {
    return buildPeriodContract(period, params.refresh === '1');
  });
}

function buildIndicatorsData(params) {
  return cachedApiView('indicators', '', params.refresh === '1', function() {
    return buildQuestionCatalogContract();
  });
}

function buildFiltersData(params) {
  var period = requiredPeriod(params);
  return cachedApiView('filters', period, params.refresh === '1', function() {
    var payload = buildPeriodContract(period, params.refresh === '1');
    return {
      period: payload.selectedPeriod,
      filters: {
        dre: distinctValues(payload.rows, 'dre'),
        municipio: distinctValues(payload.rows, 'municipio'),
        escola: distinctValues(payload.rows, 'escola'),
        tecnico: distinctValues(payload.rows, 'tecnico')
      },
      updatedAt: payload.updatedAt
    };
  });
}

function buildStatisticsData(params) {
  var period = requiredPeriod(params);
  return cachedApiView('statistics', period, params.refresh === '1', function() {
    var payload = buildPeriodContract(period, params.refresh === '1');
    return {
      period: payload.selectedPeriod,
      statistics: payload.statistics,
      updatedAt: payload.updatedAt
    };
  });
}

function buildChartsData(params) {
  var period = requiredPeriod(params);
  return cachedApiView('charts', period, params.refresh === '1', function() {
    var payload = buildPeriodContract(period, params.refresh === '1');
    var charts = payload.questions.map(function(question) {
      var distribution = {};
      payload.rows.forEach(function(row) {
        var answer = row[question.key];
        var label = answer === '' || answer === null || answer === undefined ? 'Nao informado' : String(answer);
        distribution[label] = (distribution[label] || 0) + 1;
      });
      return {
        questionId: question.permanentId || question.id,
        questionKey: question.key,
        title: question.title,
        type: question.type,
        distribution: distribution
      };
    });
    return { period: payload.selectedPeriod, charts: charts, updatedAt: payload.updatedAt };
  });
}

function buildMetadataData(refresh) {
  var catalog = buildSpreadsheetListData(refresh);
  return {
    source: 'google-drive',
    folderConfigured: Boolean(DRIVE_FOLDER_ID),
    metadata: catalog.metadata,
    updatedAt: catalog.updatedAt
  };
}
