// Camada de compatibilidade temporaria. Toda comunicacao HTTP esta centralizada em googleApiService.js.
export {
  clearGoogleApiCache as clearGoogleSheetsCache,
  compareQuestionPeriods,
  fetchGoogleSheetResponses,
  fetchPeriodCatalog,
  fetchQuestionCatalog
} from './googleApiService.js';
