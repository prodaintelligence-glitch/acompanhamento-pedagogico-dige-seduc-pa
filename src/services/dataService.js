import { appConfig } from '../config/appConfig.js';
import {
  clearGoogleApiCache,
  fetchGoogleSheetResponses,
  fetchPeriodCatalog as fetchRemoteCatalog,
  fetchQuestionCatalog as fetchRemoteQuestionCatalog
} from './googleApiService.js';
import { fetchMockCatalog, fetchMockQuestionCatalog, fetchMockResponses } from './mockService.js';
import { normalizeRows } from '../utils/normalizeRows.js';

export async function fetchPeriodCatalog(options = {}) {
  try {
    if (options.refresh) clearGoogleApiCache();
    return appConfig.useMockData
      ? await fetchMockCatalog()
      : await fetchRemoteCatalog(options);
  } catch (error) {
    if (appConfig.enableDebugLogs) console.error('Erro ao carregar catalogo:', error);
    throw new Error(appConfig.useMockData
      ? 'Nao foi possivel carregar o catalogo mockado.'
      : `Nao foi possivel carregar o catalogo automatico. ${error.message || ''}`.trim());
  }
}

export async function fetchResponsesForPeriod(period, options = {}) {
  if (!period) throw new Error('Periodo selecionado nao encontrado no catalogo.');

  let payload;
  try {
    payload = appConfig.useMockData
      ? await fetchMockResponses(period)
      : await fetchGoogleSheetResponses(period, options);
  } catch (error) {
    if (appConfig.enableDebugLogs) console.error('Erro ao carregar periodo:', error);
    throw new Error(appConfig.useMockData
      ? 'Nao foi possivel carregar os dados mockados.'
      : `Nao foi possivel carregar ${period.label || period.month}. ${error.message || ''}`.trim());
  }

  const headers = payload.headers ?? Object.keys(payload.rows?.[0] ?? {});
  if (!Array.isArray(headers) || !Array.isArray(payload.rows)) {
    throw new Error('A fonte de dados retornou uma estrutura invalida.');
  }
  const rows = normalizeRows(headers, payload.rows ?? []);
  return {
    ...payload,
    headers: headers.length ? headers : Object.keys(rows[0] ?? {}),
    rows,
    questions: payload.questions ?? [],
    totalRows: payload.statistics?.totalRows ?? payload.totalRows ?? rows.length,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    source: payload.metadata?.source ?? payload.source ?? (appConfig.useMockData ? 'mock' : 'google-drive')
  };
}

export async function fetchQuestionCatalog(options = {}) {
  try {
    return appConfig.useMockData
      ? await fetchMockQuestionCatalog()
      : await fetchRemoteQuestionCatalog(options);
  } catch (error) {
    if (appConfig.enableDebugLogs) console.error('Erro ao carregar catalogo de perguntas:', error);
    throw new Error(`Nao foi possivel carregar a evolucao dos formularios. ${error.message || ''}`.trim());
  }
}
