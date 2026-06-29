import { appConfig } from '../config/appConfig.js';
import {
  clearGoogleApiCache,
  getAllData,
  getSpreadsheetData,
  healthcheck,
  listSpreadsheets,
  fetchQuestionCatalog as fetchRemoteQuestionCatalog
} from './googleApiService.js';
import { normalizeRows } from '../utils/normalizeRows.js';

const loadMockModule = import.meta.env.DEV ? () => import('./mockService.js') : null;

async function loadMockService() {
  if (!appConfig.useMockData || !loadMockModule) throw new Error('O modo mock esta desativado.');
  return loadMockModule();
}

function normalizeDataPayload(payload, source = 'google-drive') {
  const headers = payload.headers ?? Object.keys(payload.rows?.[0] ?? {});
  if (!Array.isArray(headers) || !Array.isArray(payload.rows)) {
    throw new Error('A API retornou dados invalidos. Verifique a estrutura da planilha.');
  }
  const rows = normalizeRows(headers, payload.rows);
  return {
    ...payload,
    headers: headers.length ? headers : Object.keys(rows[0] ?? {}),
    rows,
    questions: payload.questions ?? [],
    totalRows: payload.statistics?.totalRows ?? payload.totalRows ?? payload.count ?? rows.length,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    source
  };
}

export async function checkDataSource(options = {}) {
  if (appConfig.useMockData) return { status: 'development-mock', source: 'mock' };
  try {
    return await healthcheck(options);
  } catch (error) {
    throw new Error(`Nao foi possivel conectar a API oficial. ${error.message || ''}`.trim());
  }
}

export async function fetchPeriodCatalog(options = {}) {
  try {
    if (options.refresh) clearGoogleApiCache();
    if (appConfig.useMockData) {
      const { fetchMockCatalog } = await loadMockService();
      return fetchMockCatalog();
    }
    return await listSpreadsheets(options);
  } catch (error) {
    throw new Error(appConfig.useMockData
      ? 'Nao foi possivel carregar o catalogo de desenvolvimento.'
      : `Nao foi possivel listar as planilhas oficiais. ${error.message || ''}`.trim());
  }
}

export async function fetchResponsesForPeriod(period, options = {}) {
  if (!period) throw new Error('Periodo selecionado nao encontrado no catalogo.');

  try {
    let payload;
    if (appConfig.useMockData) {
      const { fetchMockResponses } = await loadMockService();
      payload = await fetchMockResponses(period);
    } else {
      const spreadsheetId = period.spreadsheetId || period.fileId;
      if (!spreadsheetId) throw new Error('A API nao informou o ID da planilha selecionada.');
      payload = await getSpreadsheetData(spreadsheetId, options);
    }
    return normalizeDataPayload(payload, appConfig.useMockData ? 'mock' : 'google-drive');
  } catch (error) {
    throw new Error(appConfig.useMockData
      ? 'Nao foi possivel carregar os dados de desenvolvimento.'
      : `Nao foi possivel carregar ${period.label || period.month || 'a planilha'}. ${error.message || ''}`.trim());
  }
}

export async function fetchAllResponses(options = {}) {
  if (appConfig.useMockData) {
    const catalog = await fetchPeriodCatalog(options);
    const datasets = await Promise.all(catalog.periods.map((period) => fetchResponsesForPeriod(period, options)));
    return normalizeDataPayload({
      rows: datasets.flatMap((dataset) => dataset.rows.map((row) => ({
        ...row,
        sourceSpreadsheetId: dataset.selectedPeriod?.spreadsheetId || dataset.selectedPeriod?.id,
        sourceYear: dataset.selectedPeriod?.year,
        sourceMonth: dataset.selectedPeriod?.month
      }))),
      spreadsheets: catalog.periods,
      spreadsheetCount: catalog.periods.length,
      updatedAt: new Date().toISOString()
    }, 'mock');
  }
  try {
    return normalizeDataPayload(await getAllData(options), 'google-drive');
  } catch (error) {
    throw new Error(`Nao foi possivel consolidar os dados oficiais. ${error.message || ''}`.trim());
  }
}

export async function fetchQuestionCatalog(options = {}) {
  try {
    if (appConfig.useMockData) {
      const { fetchMockQuestionCatalog } = await loadMockService();
      return fetchMockQuestionCatalog();
    }
    return await fetchRemoteQuestionCatalog(options);
  } catch (error) {
    throw new Error(`Nao foi possivel carregar a evolucao dos formularios. ${error.message || ''}`.trim());
  }
}
