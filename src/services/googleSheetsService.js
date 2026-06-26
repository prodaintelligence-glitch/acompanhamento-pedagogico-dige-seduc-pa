import { appConfig } from '../config/appConfig.js';

export async function fetchGoogleSheetResponses({ spreadsheetId, sheetName }) {
  if (!appConfig.googleAppsScriptEndpoint) {
    throw new Error('Endpoint do Google Apps Script nao configurado.');
  }

  if (!spreadsheetId) {
    throw new Error('ID da planilha nao configurado para o mes selecionado.');
  }

  const url = new URL(appConfig.googleAppsScriptEndpoint);
  url.searchParams.set('spreadsheetId', spreadsheetId);
  url.searchParams.set('sheetName', sheetName);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os dados da planilha.');
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || 'A planilha retornou um erro inesperado.');
  }

  return payload;
}
