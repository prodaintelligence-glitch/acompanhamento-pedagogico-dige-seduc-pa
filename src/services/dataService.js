import { appConfig } from '../config/appConfig.js';
import { fetchGoogleSheetResponses } from './googleSheetsService.js';
import { fetchMockResponses } from './mockService.js';
import { normalizeRows } from '../utils/normalizeRows.js';

export async function fetchResponsesForPeriod(spreadsheet) {
  if (!spreadsheet) {
    throw new Error('Periodo selecionado nao encontrado na configuracao.');
  }

  const payload = appConfig.useMockData
    ? await fetchMockResponses(spreadsheet)
    : await fetchGoogleSheetResponses(spreadsheet);

  const rows = normalizeRows(payload.headers, payload.rows);

  return {
    headers: payload.headers ?? Object.keys(rows[0] ?? {}),
    rows,
    totalRows: payload.totalRows ?? rows.length,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    source: payload.source ?? (appConfig.useMockData ? 'mock' : 'google-sheets')
  };
}
