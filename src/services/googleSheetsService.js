import { appConfig } from '../config/appConfig.js';

export async function fetchGoogleSheetResponses({ spreadsheetId, sheetName }) {
  if (!appConfig.googleAppsScriptEndpoint) {
    throw new Error('Endpoint do Google Apps Script nao configurado.');
  }

  if (!spreadsheetId) {
    throw new Error('ID da planilha nao configurado para o mes selecionado.');
  }

  let url;
  try {
    url = new URL(appConfig.googleAppsScriptEndpoint);
  } catch {
    throw new Error('Endpoint do Google Apps Script invalido.');
  }

  url.searchParams.set('spreadsheetId', spreadsheetId);
  url.searchParams.set('sheetName', sheetName);

  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os dados da planilha.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('O endpoint do Google Apps Script nao retornou JSON valido.');
  }

  if (!payload.success) {
    throw new Error(payload.message || 'A planilha retornou um erro inesperado.');
  }

  return payload;
}
