import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function runScript(file, additions = {}) {
  const source = await readFile(new URL(`../apps-script/${file}`, import.meta.url), 'utf8');
  const context = vm.createContext({ console, Date, JSON, Object, String, Number, Math, RegExp, ...additions });
  vm.runInContext(source, context, { filename: file });
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
  assert.deepEqual(Array.from(response.data.rows), [1]);
  assert.equal('success' in response.data, false);
  assert.match(response.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('roteia todos os endpoints oficiais e aliases principais', async () => {
  const marker = (name) => () => ({ endpoint: name });
  const context = await runScript('Code.gs', {
    buildHealthcheckData: marker('healthcheck'),
    buildSpreadsheetListData: marker('listSpreadsheets'),
    buildSpreadsheetData: marker('getSpreadsheetData'),
    buildDashboardData: marker('getDashboard'),
    buildIndicatorsData: marker('getIndicators'),
    buildChartsData: marker('getCharts'),
    buildFiltersData: marker('getFilters'),
    buildStatisticsData: marker('getStatistics'),
    buildMetadataData: marker('getMetadata'),
    buildComparisonContract: marker('compare')
  });
  const actions = [
    'healthcheck', 'listSpreadsheets', 'getSpreadsheetData', 'getDashboard',
    'getIndicators', 'getCharts', 'getFilters', 'getStatistics', 'getMetadata', 'compare'
  ];
  actions.forEach((action) => {
    const normalized = context.normalizeApiAction(action);
    assert.equal(context.routeApiRequest(normalized, { period: '2026-01' }).data.endpoint, action);
  });
  assert.equal(context.routeApiRequest('catalog', {}).data.endpoint, 'listSpreadsheets');
  assert.equal(context.routeApiRequest('period', { period: '2026-01' }).data.endpoint, 'getSpreadsheetData');
});
