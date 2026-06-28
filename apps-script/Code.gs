function normalizeApiAction(value) {
  return String(value || 'healthcheck').trim().toLowerCase().replace(/[^a-z-]/g, '').slice(0, 40);
}

function routeApiRequest(action, params) {
  var refresh = params.refresh === '1';

  if (action === 'healthcheck') {
    return { data: buildHealthcheckData(), message: 'API operacional' };
  }
  if (action === 'listspreadsheets' || action === 'catalog' || action === 'periods') {
    return { data: buildSpreadsheetListData(refresh), message: 'Planilhas localizadas com sucesso.' };
  }
  if (action === 'getspreadsheetdata' || action === 'period') {
    return { data: buildSpreadsheetData(params), message: 'Dados da planilha carregados com sucesso.' };
  }
  if (action === 'getdashboard') {
    return { data: buildDashboardData(params), message: 'Dashboard carregado com sucesso.' };
  }
  if (action === 'getindicators' || action === 'questions' || action === 'question-catalog') {
    return { data: buildIndicatorsData(params), message: 'Indicadores carregados com sucesso.' };
  }
  if (action === 'getcharts') {
    return { data: buildChartsData(params), message: 'Graficos carregados com sucesso.' };
  }
  if (action === 'getfilters') {
    return { data: buildFiltersData(params), message: 'Filtros carregados com sucesso.' };
  }
  if (action === 'getstatistics') {
    return { data: buildStatisticsData(params), message: 'Estatisticas carregadas com sucesso.' };
  }
  if (action === 'getmetadata') {
    return { data: buildMetadataData(refresh), message: 'Metadados carregados com sucesso.' };
  }
  if (action === 'compare') {
    return { data: buildComparisonContract(params.periodA || '', params.periodB || ''), message: 'Periodos comparados com sucesso.' };
  }
  throw new Error('Acao nao suportada. Consulte a documentacao da API.');
}

function doGet(e) {
  var startedAt = new Date().getTime();
  var params = e && e.parameter ? e.parameter : {};
  var action = normalizeApiAction(params.action);

  try {
    if (params.refresh === '1') clearApiCache();
    var result = routeApiRequest(action, params);
    logApiEvent('success', action, {
      period: params.period || '',
      elapsedMs: new Date().getTime() - startedAt
    });
    return jsonResponse(successResponse(result.data, result.message));
  } catch (error) {
    logApiEvent('error', action, {
      period: params.period || '',
      elapsedMs: new Date().getTime() - startedAt,
      message: error && error.message ? error.message : String(error)
    });
    return jsonResponse(errorResponse(error));
  }
}
