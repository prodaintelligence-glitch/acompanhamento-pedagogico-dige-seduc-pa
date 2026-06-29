// Camada de compatibilidade temporaria. Toda comunicacao HTTP esta centralizada em googleApiService.js.
export {
  clearGoogleApiCache as clearGoogleSheetsCache,
  compareQuestionPeriods,
  getAllData,
  getSpreadsheetData,
  healthcheck,
  listSpreadsheets,
  fetchGoogleSheetResponses,
  fetchPeriodCatalog,
  fetchQuestionCatalog
} from './googleApiService.js';
