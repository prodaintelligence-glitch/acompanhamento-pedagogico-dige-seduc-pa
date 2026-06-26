import { appConfig } from '../config/appConfig.js';
import { fetchGoogleSheetResponses } from './googleSheetsService.js';
import { fetchMockResponses } from './mockService.js';
import { normalizeRows } from '../utils/normalizeRows.js';

export async function fetchResponsesForPeriod(spreadsheet) {
  if (!spreadsheet) {
    throw new Error('Periodo selecionado nao encontrado na configuracao.');
  }

  let payload;
  try {
    payload = appConfig.useMockData
      ? await fetchMockResponses(spreadsheet)
      : await fetchGoogleSheetResponses(spreadsheet);
  } catch (error) {
    if (appConfig.enableDebugLogs) {
      console.error('Erro ao carregar dados da planilha:', error);
    }
    throw new Error(appConfig.useMockData
      ? 'Nao foi possivel carregar os dados mockados.'
      : `Nao foi possivel carregar dados reais de ${spreadsheet.label || spreadsheet.month}. Verifique endpoint, ID da planilha, nome da aba e permissoes do Apps Script.`);
  }

  const rows = normalizeRows(payload.headers, payload.rows);

  return {
    headers: payload.headers ?? Object.keys(rows[0] ?? {}),
    rows,
    totalRows: payload.totalRows ?? rows.length,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    source: payload.source ?? (appConfig.useMockData ? 'mock' : 'google-sheets')
  };
}
