var DRIVE_FOLDER_ID = '1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly';

var AP_CONFIG = Object.freeze({
  FOLDER_ID: DRIVE_FOLDER_ID,
  CATALOG_CACHE_KEY: 'ap-catalog-v3',
  CACHE_REGISTRY_KEY: 'ap-cache-registry-v1',
  CACHE_SECONDS: 300,
  CACHE_CHUNK_SIZE: 30000,
  HEADER_SCAN_LIMIT: 25,
  QUESTION_CATALOG_FILE_NAME: 'AP_CATALOGO_SISTEMA',
  QUESTION_MATCH_THRESHOLD: 0.72,
  OFFICIAL_FILE_PREFIXES: ['ap ', 'ap_', 'acompanhamento', 'respostas', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  PREFERRED_SHEET_NAMES: [
    'respostas ao formulario 1',
    'respostas ao formulario',
    'respostas'
  ],
  IGNORED_QUESTION_CODES: ['1.4', '2.5', '3.9', '4.14', '5.4', '6.13']
});
