import './styles/main.css';
import { isAuthenticated, login, logout } from './auth/auth.js';
import { fetchResponsesForPeriod } from './services/dataService.js';
import { renderSpreadsheetAdminPage } from './admin/components/SpreadsheetAdminPage.js';
import {
  exportSpreadsheetConfigs,
  importSpreadsheetConfigs,
  loadSpreadsheetCache,
  loadSpreadsheetConfigs,
  loadSyncLog,
  removeSpreadsheetConfig,
  testSpreadsheetConnection,
  upsertSpreadsheetConfig
} from './admin/services/spreadsheetAdminService.js';
import { clearQuestionChart, renderQuestionChart } from './charts/chartRenderer.js';
import { renderMetricCards } from './components/cards.js';
import { renderActiveFilters } from './components/activeFilters.js';
import { renderAnalysisBreadcrumb } from './components/analysisBreadcrumb.js';
import { renderDrillDownTable } from './components/drillDownTable.js';
import { renderFilters } from './components/filters.js';
import { renderLogin, renderShell, showStatus } from './components/layout.js';
import { renderQuestionInfoCards } from './components/questionInfoCards.js';
import { renderReportActions } from './components/reportActions.js';
import { renderSmartMessages } from './components/smartMessages.js';
import { renderStatisticalPanel } from './components/statisticalPanel.js';
import { renderSummaryTable, renderTextAnswers } from './components/table.js';
import { exportReportToExcel } from './reports/exportExcel.js';
import { exportReportToPdf } from './reports/exportPdf.js';
import { printReport } from './reports/printReport.js';
import { buildReport } from './reports/reportBuilder.js';
import { detectBestChartType } from './utils/chartTypeDetector.js';
import { detectQuestions, detectQuestionType } from './utils/detectQuestions.js';
import { applyFilters } from './utils/filters.js';
import { normalizeAnswer } from './utils/normalizeAnswers.js';
import { clearAnalysisCache, createCacheKey, getCachedCalculation } from './utils/analysisCache.js';
import { buildSmartIndicators } from './utils/smartIndicators.js';
import { buildSmartMessages } from './utils/smartMessages.js';
import { getDistribution, getLatestTimestamp, getQuestionMetrics } from './utils/statistics.js';

const app = document.querySelector('#app');
let spreadsheetConfigs = loadSpreadsheetConfigs();
const firstPeriod = spreadsheetConfigs.find((item) => item.active !== false) ?? spreadsheetConfigs[0];

const state = {
  year: firstPeriod?.year ?? new Date().getFullYear(),
  month: firstPeriod?.month ?? '',
  dre: '',
  municipio: '',
  escola: '',
  section: '',
  questionKey: '',
  drillAnswer: ''
};

let rows = [];
let questions = [];
let updatedAt = '';
let currentView = 'dashboard';
let selectedAdminSpreadsheetId = firstPeriod?.id ?? '';
let lastTestResult = null;

function selectedSpreadsheet() {
  return spreadsheetConfigs.find((item) => item.active !== false && item.year === Number(state.year) && item.month === state.month);
}

function firstActiveSpreadsheet() {
  return spreadsheetConfigs.find((item) => item.active !== false) ?? spreadsheetConfigs[0];
}

async function loadData() {
  const result = await fetchResponsesForPeriod(selectedSpreadsheet());
  clearAnalysisCache();
  rows = result.rows;
  updatedAt = result.updatedAt;
  questions = detectQuestions(rows);

  if (!questions.some((question) => question.key === state.questionKey)) {
    state.questionKey = questions[0]?.key ?? '';
  }
}

function resetDataFilters() {
  state.dre = '';
  state.municipio = '';
  state.escola = '';
  state.section = '';
  state.questionKey = '';
  state.drillAnswer = '';
}

function clearDrillSelection() {
  state.drillAnswer = '';
  renderDashboard();
}

function clearDashboardFilters() {
  state.dre = '';
  state.municipio = '';
  state.escola = '';
  state.section = '';
  state.questionKey = questions[0]?.key ?? '';
  state.drillAnswer = '';
  renderDashboard();
  showStatus('Filtros limpos. Periodo selecionado mantido.', 'success');
}

function currentReport() {
  return buildReport({
    rows,
    questions,
    state,
    period: selectedSpreadsheet(),
    updatedAt
  });
}

function runReportAction(action) {
  try {
    const report = currentReport();
    action(report);
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel concluir a acao solicitada.', 'error');
  }
}

function spreadsheetFromForm(data) {
  const year = Number(data.get('year'));
  const month = String(data.get('month') || '').trim();
  const name = String(data.get('name') || '').trim();
  const spreadsheetId = String(data.get('spreadsheetId') || '').trim();
  const sheetName = String(data.get('sheetName') || '').trim();

  if (!year || !month || !name || !spreadsheetId || !sheetName) {
    throw new Error('Preencha ano, mes, nome, ID da planilha e nome da aba.');
  }

  const id = String(data.get('id') || `${year}-${month}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    id,
    year,
    month,
    name,
    label: name,
    spreadsheetId,
    sheetName,
    description: String(data.get('description') || '').trim(),
    active: data.get('active') === 'on',
    lastUpdated: new Date().toISOString()
  };
}

function syncSpreadsheetConfigs(nextItems) {
  spreadsheetConfigs = nextItems;
  const selected = selectedSpreadsheet() ?? firstActiveSpreadsheet();
  state.year = selected?.year ?? state.year;
  state.month = selected?.month ?? state.month;
  selectedAdminSpreadsheetId = selectedAdminSpreadsheetId || selected?.id || '';
}

function renderAdminView() {
  const selectedItem = selectedAdminSpreadsheetId === '__new__'
    ? null
    : spreadsheetConfigs.find((item) => item.id === selectedAdminSpreadsheetId) ?? spreadsheetConfigs[0];
  renderSpreadsheetAdminPage(document.querySelector('#admin-root'), {
    items: spreadsheetConfigs,
    cache: loadSpreadsheetCache(),
    logs: loadSyncLog(),
    selectedItem,
    testResult: lastTestResult,
    onNew: () => {
      selectedAdminSpreadsheetId = '__new__';
      lastTestResult = null;
      renderAdminView();
    },
    onSave: handleSaveSpreadsheet,
    onTest: handleTestSpreadsheet,
    onEdit: handleEditSpreadsheet,
    onRemove: handleRemoveSpreadsheet,
    onExport: exportSpreadsheetConfigs,
    onImport: handleImportSpreadsheetConfigs,
    onRefreshDashboard: handleRefreshDashboard
  });
}

function showView(view) {
  currentView = view;
  document.querySelector('#dashboard-root').hidden = view !== 'dashboard';
  document.querySelector('#admin-root').hidden = view !== 'admin';
  document.querySelector('#page-title').textContent = view === 'admin' ? 'Configurações de planilhas' : 'Dashboard pedagogico';
  if (view === 'admin') renderAdminView();
  else renderDashboard();
}

async function handleSaveSpreadsheet(data) {
  try {
    const item = spreadsheetFromForm(data);
    syncSpreadsheetConfigs(upsertSpreadsheetConfig(item));
    selectedAdminSpreadsheetId = item.id;
    showStatus('Planilha salva. Meses, filtros e dashboard foram atualizados.', 'success');
    await reloadDashboardData();
    showView('admin');
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel salvar a planilha.', 'error');
  }
}

async function handleTestSpreadsheet(input) {
  try {
    const item = input instanceof FormData ? spreadsheetFromForm(input) : input;
    lastTestResult = await testSpreadsheetConnection(item);
    selectedAdminSpreadsheetId = item.id;
    showStatus(lastTestResult.success ? 'Conexao testada com sucesso.' : 'Nao foi possivel acessar esta planilha.', lastTestResult.success ? 'success' : 'error');
    renderAdminView();
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel testar a conexao.', 'error');
  }
}

function handleEditSpreadsheet(id) {
  selectedAdminSpreadsheetId = id;
  lastTestResult = loadSpreadsheetCache()[id] ?? null;
  renderAdminView();
}

async function handleRemoveSpreadsheet(id) {
  try {
    if (!window.confirm('Remover esta configuracao de planilha?')) return;
    syncSpreadsheetConfigs(removeSpreadsheetConfig(id));
    selectedAdminSpreadsheetId = firstActiveSpreadsheet()?.id ?? spreadsheetConfigs[0]?.id ?? '';
    showStatus('Configuracao removida.', 'success');
    await reloadDashboardData();
    showView('admin');
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel remover a planilha.', 'error');
  }
}

async function handleImportSpreadsheetConfigs(file) {
  if (!file) return;
  try {
    syncSpreadsheetConfigs(await importSpreadsheetConfigs(file));
    selectedAdminSpreadsheetId = firstActiveSpreadsheet()?.id ?? spreadsheetConfigs[0]?.id ?? '';
    showStatus('Configuracao importada com sucesso.', 'success');
    await reloadDashboardData();
    showView('admin');
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel importar a configuracao.', 'error');
  }
}

async function handleRefreshDashboard() {
  try {
    const item = selectedSpreadsheet() ?? firstActiveSpreadsheet();
    if (item) lastTestResult = await testSpreadsheetConnection(item);
    await reloadDashboardData();
    showStatus('Dados atualizados sem reiniciar a aplicacao.', 'success');
    if (currentView === 'admin') renderAdminView();
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel atualizar os dados.', 'error');
  }
}

async function updateState(key, value) {
  state[key] = value;

  if (key === 'year') {
    const firstMonth = spreadsheetConfigs.find((item) => item.active !== false && item.year === Number(value));
    state.month = firstMonth?.month ?? '';
  }

  if (key === 'section') {
    const firstQuestion = questions.find((question) => !value || question.section === value);
    state.questionKey = firstQuestion?.key ?? '';
    state.drillAnswer = '';
  }

  if (key === 'questionKey') {
    state.drillAnswer = '';
  }

  if (key === 'year' || key === 'month') {
    resetDataFilters();
    await reloadDashboardData();
    return;
  }

  renderDashboard();
}

function renderQuestionMetrics(container, metrics, chartConfig) {
  container.innerHTML = `
    <article class="question-stat"><span>Registros filtrados</span><strong>${metrics.total}</strong></article>
    <article class="question-stat"><span>Respostas validas</span><strong>${metrics.validCount}</strong></article>
    <article class="question-stat"><span>Em branco</span><strong>${metrics.blankCount}</strong></article>
    <article class="question-stat"><span>Categorias</span><strong>${metrics.categoryCount}</strong></article>
    <article class="question-stat"><span>Escolas</span><strong>${metrics.schoolCount}</strong></article>
    <article class="question-stat"><span>Municipios</span><strong>${metrics.municipalityCount}</strong></article>
    <article class="question-stat"><span>DREs</span><strong>${metrics.dreCount}</strong></article>
    <article class="question-stat wide"><span>Mais frequente</span><strong>${metrics.topCategory}</strong><small>${metrics.topPercent}% das validas</small></article>
    <article class="question-stat wide"><span>Tipo de visualizacao</span><strong>${chartConfig.chartType === 'table' ? 'Tabela' : chartConfig.chartType}</strong><small>${chartConfig.reason}</small></article>
  `;
}

function renderNoQuestionState(filteredRows) {
  document.querySelector('#question-title').textContent = 'Nenhuma pergunta analisavel encontrada';
  document.querySelector('#question-count').textContent = `${filteredRows.length} registros filtrados`;
  document.querySelector('#question-context').textContent = 'Verifique os cabecalhos da planilha e a lista de perguntas ignoradas.';
  document.querySelector('#text-answers').hidden = true;
  document.querySelector('#question-info').innerHTML = '';
  document.querySelector('#question-metrics').innerHTML = '';
  renderSmartMessages(document.querySelector('#smart-messages'), [{ type: 'warning', text: 'Nenhuma pergunta analisavel foi encontrada.' }]);
  renderStatisticalPanel(document.querySelector('#statistical-panel'), { metrics: null, distribution: {} });
  clearQuestionChart(document.querySelector('#question-chart'), 'Nenhuma pergunta selecionada.');
  renderSummaryTable(document.querySelector('#summary-table'), {});
  renderDrillDownTable(document.querySelector('#detail-table'), {
    rows: [],
    question: null,
    answer: '',
    totalRows: filteredRows.length,
    filters: currentReport().filters,
    onClear: clearDrillSelection
  });
}

function renderQuestionAnalysis(filteredRows) {
  const question = questions.find((item) => item.key === state.questionKey) ?? questions[0];
  if (!question) {
    renderNoQuestionState(filteredRows);
    return;
  }

  const analysisKey = createCacheKey('question-analysis', updatedAt, state, filteredRows.length, question.key);
  const analysis = getCachedCalculation(analysisKey, () => {
    const questionType = detectQuestionType(filteredRows, question.key);
    const isTextQuestion = questionType === 'text';
    const distribution = getDistribution(filteredRows, question.key, { preserveText: isTextQuestion });
    const metrics = getQuestionMetrics(filteredRows, question.key, distribution);
    const chartConfig = detectBestChartType({ questionType, distribution });
    return { questionType, isTextQuestion, distribution, metrics, chartConfig };
  });
  const { questionType, isTextQuestion, distribution, metrics, chartConfig } = analysis;
  const canvas = document.querySelector('#question-chart');
  const textAnswers = document.querySelector('#text-answers');
  const totalMunicipios = new Set(filteredRows.map((row) => row.municipio).filter(Boolean)).size;

  document.querySelector('#question-title').textContent = `${question.code} - ${question.title}`;
  document.querySelector('#question-count').textContent = `${metrics.validCount} validas | ${metrics.blankCount} em branco`;
  document.querySelector('#question-context').textContent = `${question.section} | ${question.originalHeader}`;
  renderQuestionInfoCards(document.querySelector('#question-info'), { question, questionType, metrics, chartConfig });
  renderQuestionMetrics(document.querySelector('#question-metrics'), metrics, chartConfig);
  renderSmartMessages(document.querySelector('#smart-messages'), buildSmartMessages({ filteredRows, question, questionMetrics: metrics, totalMunicipios }));
  renderStatisticalPanel(document.querySelector('#statistical-panel'), { metrics, distribution });

  if (!filteredRows.length) {
    textAnswers.hidden = true;
    clearQuestionChart(canvas, 'O filtro atual nao retornou registros.');
    renderSummaryTable(document.querySelector('#summary-table'), {});
    renderDrillDownTable(document.querySelector('#detail-table'), {
      rows: [],
      question,
      answer: state.drillAnswer,
      totalRows: filteredRows.length,
      filters: currentReport().filters,
      onClear: clearDrillSelection
    });
    return;
  }

  renderSummaryTable(document.querySelector('#summary-table'), distribution);

  if (isTextQuestion) {
    clearQuestionChart(canvas, 'Perguntas abertas sao analisadas por tabela.');
    textAnswers.hidden = false;
    textAnswers.innerHTML = '<p class="empty-state">Pergunta aberta: use a tabela abaixo para pesquisar e revisar as respostas textuais.</p>';
    renderTextAnswers(document.querySelector('#detail-table'), filteredRows, question.key);
    return;
  }

  textAnswers.hidden = true;
  renderQuestionChart(canvas, question, { ...chartConfig, selectedAnswer: state.drillAnswer }, distribution, ({ answer }) => {
    state.drillAnswer = answer;
    renderDashboard();
  });

  const drillRows = state.drillAnswer
    ? filteredRows.filter((row) => normalizeAnswer(row[question.key]) === state.drillAnswer)
    : filteredRows;

  renderDrillDownTable(document.querySelector('#detail-table'), {
    rows: drillRows,
    question,
    answer: state.drillAnswer,
    totalRows: filteredRows.length,
    filters: currentReport().filters,
    onClear: clearDrillSelection
  });
}

function renderDashboard() {
  const filterKey = createCacheKey('filtered-rows', updatedAt, rows.length, state.year, state.month, state.dre, state.municipio, state.escola);
  const filteredRows = getCachedCalculation(filterKey, () => applyFilters(rows, state));
  const question = questions.find((item) => item.key === state.questionKey) ?? questions[0] ?? null;
  const indicatorsKey = createCacheKey('smart-indicators', updatedAt, filteredRows.length, questions.length, state);
  const smartIndicators = getCachedCalculation(indicatorsKey, () => buildSmartIndicators(filteredRows, questions, updatedAt || getLatestTimestamp(rows)));

  renderAnalysisBreadcrumb(document.querySelector('#analysis-breadcrumb'), {
    period: selectedSpreadsheet(),
    section: state.section,
    question,
    drillAnswer: state.drillAnswer
  });
  renderReportActions(document.querySelector('#report-actions'), {
    onExportExcel: () => runReportAction((report) => {
      exportReportToExcel(report);
      showStatus('Arquivo Excel gerado com sucesso.', 'success');
    }),
    onExportPdf: () => runReportAction((report) => {
      exportReportToPdf(report);
      showStatus('Arquivo PDF gerado com sucesso.', 'success');
    }),
    onPrint: () => runReportAction((report) => {
      if (!report.filteredRows.length) throw new Error('Nao ha dados filtrados para imprimir.');
      printReport();
    }),
    onClearFilters: clearDashboardFilters
  });
  renderFilters(document.querySelector('#filters'), state, rows, questions, updateState, spreadsheetConfigs);
  renderActiveFilters(document.querySelector('#active-filters'), state, question);
  renderMetricCards(document.querySelector('#metrics'), smartIndicators);
  renderQuestionAnalysis(filteredRows);
}

function hideInfoStatus() {
  const element = document.querySelector('#status-message');
  if (element && element.dataset.type === 'info') {
    element.hidden = true;
  }
}

async function reloadDashboardData() {
  try {
    showStatus('Carregando dados do periodo selecionado...', 'info');
    await loadData();
    hideInfoStatus();
    renderDashboard();
  } catch (error) {
    rows = [];
    questions = [];
    updatedAt = '';
    renderDashboard();
    showStatus(error.message || 'Nao foi possivel carregar os dados.', 'error');
  }
}

async function startDashboard() {
  renderShell(app, {
    onLogout: () => {
      logout();
      startLogin();
    },
    onNavigate: showView
  });

  await reloadDashboardData();
  showView('dashboard');
}

function startLogin() {
  renderLogin(app, (username, password) => {
    const success = login(username, password);
    if (success) startDashboard();
    return success;
  });
}

if (isAuthenticated()) {
  startDashboard();
} else {
  startLogin();
}
