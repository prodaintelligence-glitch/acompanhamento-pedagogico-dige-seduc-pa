import { appConfig } from '../config/appConfig.js';

const REQUEST_TIMEOUT_MS = 20000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_ACTIONS = new Set([
  'healthcheck', 'listSpreadsheets', 'getSpreadsheetData', 'getDashboard',
  'getIndicators', 'getCharts', 'getFilters', 'getStatistics', 'getMetadata', 'compare'
]);
const responseCache = new Map();
const pendingRequests = new Map();

function debugError(message, error) {
  if (appConfig.enableDebugLogs) console.error(message, error);
}

function validatePeriod(value, label = 'Periodo') {
  if (!/^\d{4}-\d{2}$/.test(String(value || ''))) throw new Error(`${label} invalido. Use o formato AAAA-MM.`);
}

function validateActionParams(action, params) {
  if (!ALLOWED_ACTIONS.has(action)) throw new Error('Operacao de consulta invalida.');
  if (['getSpreadsheetData', 'getDashboard', 'getCharts', 'getFilters', 'getStatistics'].includes(action)) {
    validatePeriod(params.period);
  }
  if (action === 'compare') {
    validatePeriod(params.periodA, 'Periodo inicial');
    validatePeriod(params.periodB, 'Periodo final');
  }
}

function validateResponse(action, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('A API retornou uma resposta inesperada.');
  }
  if (payload.success !== true) {
    const detail = typeof payload.details === 'string' ? payload.details.trim() : '';
    throw new Error(detail.slice(0, 240) || 'A API retornou um erro inesperado.');
  }
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    throw new Error('A API retornou dados incompletos.');
  }
  if (action === 'listSpreadsheets' && !Array.isArray(payload.data.periods)) {
    throw new Error('O catalogo retornado pela API esta incompleto.');
  }
  if (['getSpreadsheetData', 'getDashboard'].includes(action) && !Array.isArray(payload.data.rows)) {
    throw new Error('Os dados retornados pela planilha estao incompletos.');
  }
  return payload.data;
}

function buildApiUrl(action, params = {}) {
  if (!appConfig.googleAppsScriptUrl) throw new Error('URL do Google Apps Script nao configurada.');
  validateActionParams(action, params);
  let url;
  try {
    url = new URL(appConfig.googleAppsScriptUrl);
  } catch {
    throw new Error('URL do Google Apps Script invalida.');
  }
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

export async function requestGoogleApi(action, params = {}, { refresh = false } = {}) {
  const requestParams = { ...params, refresh: refresh ? 1 : undefined };
  const url = buildApiUrl(action, requestParams);
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.delete('refresh');
  const key = cacheUrl.toString();
  const cached = responseCache.get(key);
  if (!refresh && cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.data;
  if (pendingRequests.has(key)) return pendingRequests.get(key);

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();
    try {
      const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('Nao foi possivel acessar a API oficial de dados.');
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error('A API do Google Apps Script nao retornou JSON valido.');
      }
      const data = validateResponse(action, payload);
      responseCache.set(key, { createdAt: Date.now(), data });
      if (appConfig.enableDebugLogs) {
        console.info('[DIGE API]', { action, durationMs: Math.round(performance.now() - startedAt), records: data.rows?.length });
      }
      return data;
    } catch (error) {
      debugError(`[DIGE API] Falha em ${action}`, error);
      if (error.name === 'AbortError') throw new Error('A consulta demorou mais que o esperado. Tente novamente.');
      if (error instanceof TypeError) throw new Error('Falha de rede ao acessar o Google Apps Script.');
      throw error;
    } finally {
      clearTimeout(timeoutId);
      pendingRequests.delete(key);
    }
  })();
  pendingRequests.set(key, request);
  return request;
}

export function clearGoogleApiCache() {
  responseCache.clear();
}

export function healthcheck() {
  return requestGoogleApi('healthcheck');
}

export function fetchPeriodCatalog({ refresh = false } = {}) {
  return requestGoogleApi('listSpreadsheets', {}, { refresh });
}

export function fetchGoogleSheetResponses({ periodKey, id }, { refresh = false } = {}) {
  const period = periodKey || id;
  if (!period) throw new Error('Periodo nao informado para consulta.');
  return requestGoogleApi('getDashboard', { period }, { refresh });
}

export function fetchSpreadsheetData(period, options = {}) {
  return requestGoogleApi('getSpreadsheetData', { period }, options);
}

export function fetchQuestionCatalog({ refresh = false } = {}) {
  return requestGoogleApi('getIndicators', {}, { refresh });
}

export function fetchCharts(period, options = {}) {
  return requestGoogleApi('getCharts', { period }, options);
}

export function fetchFilters(period, options = {}) {
  return requestGoogleApi('getFilters', { period }, options);
}

export function fetchStatistics(period, options = {}) {
  return requestGoogleApi('getStatistics', { period }, options);
}

export function fetchMetadata(options = {}) {
  return requestGoogleApi('getMetadata', {}, options);
}

export function compareQuestionPeriods(periodA, periodB) {
  return requestGoogleApi('compare', { periodA, periodB });
}
