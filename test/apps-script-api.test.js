import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function runScript(file, additions = {}) {
  return runScripts([file], additions);
}

async function runScripts(files, additions = {}) {
  const context = vm.createContext({ console, Date, JSON, Object, String, Number, Math, RegExp, ...additions });
  for (const file of files) {
    const source = await readFile(new URL(`../apps-script/${file}`, import.meta.url), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

test('identifica os formatos de periodo exigidos pela API', async () => {
  const context = await runScript('Utils.gs');
  const examples = {
    'Janeiro 2026': '2026-01',
    'Jan-2026': '2026-01',
    '01-2026': '2026-01',
    'AP Janeiro 2026': '2026-01',
    'AP_2026_01': '2026-01',
    'Acompanhamento_2026_01': '2026-01'
  };
  Object.entries(examples).forEach(([name, expected]) => {
    assert.equal(context.parsePeriodFromName(name)?.key, expected, name);
  });
  assert.equal(context.parsePeriodFromName('Arquivo sem periodo'), null);
});

test('padroniza o envelope de sucesso sem duplicar campos internos', async () => {
  const context = await runScript('ResponseService.gs');
  const response = context.successResponse({ success: true, rows: [1], updatedAt: 'agora' }, 'OK');
  assert.equal(response.success, true);
  assert.equal(response.message, 'OK');
  assert.equal(response.count, 1);
  assert.deepEqual(Array.from(response.data.rows), [1]);
  assert.equal('success' in response.data, false);
  assert.match(response.timestamp, /^\d{4}-\d{2}-\d{2}T/);

  const listResponse = context.successResponse([{ dre: '01' }], 'OK', { metadata: { spreadsheetCount: 1 } });
  assert.equal(listResponse.count, 1);
  assert.equal(listResponse.metadata.spreadsheetCount, 1);
  assert.deepEqual(Array.from(listResponse.data, (item) => ({ ...item })), [{ dre: '01' }]);
});

test('roteia todos os endpoints oficiais e aliases principais', async () => {
  const marker = (name) => () => ({ endpoint: name });
  const context = await runScript('Code.gs', {
    buildHealthcheckData: marker('healthcheck'),
    buildSpreadsheetListData: marker('listSpreadsheets'),
    buildSpreadsheetData: marker('getSpreadsheetData'),
    buildAllData: () => ({ rows: [], count: 0, spreadsheets: [], spreadsheetCount: 0, skippedSpreadsheetCount: 0, errors: [], updatedAt: 'agora' }),
    buildDashboardData: marker('getDashboard'),
    buildIndicatorsData: marker('getIndicators'),
    buildChartsData: marker('getCharts'),
    buildFiltersData: marker('getFilters'),
    buildStatisticsData: marker('getStatistics'),
    buildMetadataData: marker('getMetadata'),
    buildComparisonContract: marker('compare')
  });
  const actions = [
    'healthcheck', 'listSpreadsheets', 'getSpreadsheetData', 'getAllData', 'getDashboard',
    'getIndicators', 'getCharts', 'getFilters', 'getStatistics', 'getMetadata', 'compare'
  ];
  actions.filter((action) => action !== 'getAllData').forEach((action) => {
    const normalized = context.normalizeApiAction(action);
    assert.equal(context.routeApiRequest(normalized, { period: '2026-01' }).data.endpoint, action);
  });
  assert.deepEqual(Array.from(context.routeApiRequest('getalldata', {}).data), []);
  assert.equal(context.routeApiRequest('catalog', {}).data.endpoint, 'listSpreadsheets');
  assert.equal(context.routeApiRequest('period', { period: '2026-01' }).data.endpoint, 'getSpreadsheetData');
});

function mockSheet(name, values) {
  return {
    getName: () => name,
    getLastRow: () => values.length,
    getLastColumn: () => Math.max(0, ...values.map((row) => row.length)),
    getDataRange: () => ({ getValues: () => values }),
    getRange: (row, column, rowCount, columnCount) => ({
      getDisplayValues: () => values.slice(row - 1, row - 1 + rowCount)
        .map((item) => item.slice(column - 1, column - 1 + columnCount))
    })
  };
}

test('normaliza cabecalhos, duplicidades, vazios, datas e linhas sem dados', async () => {
  const sheet = mockSheet('Respostas', [
    ['DRE', 'Município', 'Nome da Escola', 'Campo Livre', 'Campo Livre', ''],
    ['DRE 01', 'Belém', 'Escola A', 'Sim', 10, new Date('2026-01-15T12:00:00.000Z')],
    ['', '', '', '', '', '']
  ]);
  const context = await runScripts(['Config.gs', 'Utils.gs', 'SpreadsheetService.gs'], {
    SpreadsheetApp: { openById: () => ({ getSheets: () => [sheet] }) }
  });
  const result = context.readSpreadsheetData({ getId: () => 'spreadsheet-123' });

  assert.equal(context.normalizeHeaderKey('Data de Registro'), 'dataDeRegistro');
  assert.deepEqual(Array.from(result.headers), ['dre', 'municipio', 'escola', 'campoLivre', 'campoLivre_2', 'coluna6']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].municipio, 'Belém');
  assert.equal(result.rows[0].campoLivre_2, 10);
  assert.equal(result.rows[0].coluna6, '2026-01-15T12:00:00.000Z');
});

test('seleciona aba configurada, depois primeira aba valida e por fim a primeira aba', async () => {
  const invalid = mockSheet('Capa', [['Titulo']]);
  const valid = mockSheet('Dados', [['DRE', 'Municipio'], ['01', 'Belem']]);
  const configured = mockSheet('Respostas', [['Ainda sem dados']]);
  const context = await runScripts(['Config.gs', 'Utils.gs', 'SpreadsheetService.gs']);

  assert.equal(context.findResponseSheet({ getSheets: () => [invalid, configured, valid] }).getName(), 'Respostas');
  assert.equal(context.findResponseSheet({ getSheets: () => [invalid, valid] }).getName(), 'Dados');
  assert.equal(context.findResponseSheet({ getSheets: () => [invalid] }).getName(), 'Capa');
});

test('le por ID oficial e consolida registros com metadados de origem', async () => {
  const sheet = mockSheet('Respostas', [
    ['DRE', 'Municipio', 'Nome da Escola'],
    ['01', 'Belem', 'Escola A']
  ]);
  const file = {
    getId: () => 'spreadsheet_123456',
    getName: () => 'AP Janeiro 2026',
    getLastUpdated: () => new Date('2026-01-20T10:00:00.000Z'),
    getMimeType: () => 'GOOGLE_SHEETS',
    isTrashed: () => false
  };
  let cachedValue = null;
  const context = await runScripts(
    ['Config.gs', 'Utils.gs', 'SpreadsheetService.gs', 'DataReadService.gs'],
    {
      SpreadsheetApp: { openById: () => ({ getSheets: () => [sheet] }) },
      DriveApp: { getFileById: () => file },
      MimeType: { GOOGLE_SHEETS: 'GOOGLE_SHEETS' },
      isFileInOfficialFolder: () => true,
      isIgnoredDriveFile: () => false,
      readChunkedCache: () => null,
      writeChunkedCache: (key, value) => { cachedValue = { key, value }; },
      clearApiCache: () => {},
      getCatalogInternal: () => [{
        fileId: file.getId(), name: file.getName(), compatible: true,
        updatedAt: file.getLastUpdated().toISOString()
      }],
      safeSpreadsheetError: (error) => error.message
    }
  );

  const single = context.buildSpreadsheetDataById({ spreadsheetId: file.getId() });
  assert.equal(single.count, 1);
  assert.equal(single.questions.length, 0);
  assert.equal(single.rows[0].sourceSpreadsheetName, 'AP Janeiro 2026');
  assert.equal(single.rows[0].sourceMonth, 'Janeiro');
  assert.equal(single.rows[0].sourceYear, 2026);
  assert.equal(single.rows[0].sourceSheetName, 'Respostas');

  const consolidated = context.buildAllData({ refresh: '1' });
  assert.equal(consolidated.spreadsheetCount, 1);
  assert.equal(consolidated.count, 1);
  assert.equal(consolidated.rows[0].sourceSpreadsheetId, file.getId());
  assert.match(cachedValue.key, /^ap-all-data-v1-/);
});
