import './styles/tokens.css';
import './styles/main.css';
import { isAuthenticated, login, logout } from './auth/auth.js';
import { fetchPeriodCatalog, fetchQuestionCatalog, fetchResponsesForPeriod } from './services/dataService.js';
import { clearHistoricalDataCache, fetchHistoricalDataset } from './services/historicalDataService.js';
import { renderSpreadsheetAdminPage } from './admin/components/SpreadsheetAdminPage.js';
import { clearQuestionChart, renderQuestionChart } from './charts/chartRenderer.js';
import { renderMetricCards } from './components/cards.js';
import { renderActiveFilters } from './components/activeFilters.js';
import { renderAnalysisBreadcrumb } from './components/analysisBreadcrumb.js';
import { renderDrillDownTable } from './components/drillDownTable.js';
import { renderFilters } from './components/filters.js';
import { renderHistoricalAnalysis } from './components/historicalAnalysis.js';
import { renderLogin, renderShell, showStatus } from './components/layout.js';
import { renderQuestionInfoCards } from './components/questionInfoCards.js';
import { renderReportActions } from './components/reportActions.js';
import { renderSmartMessages } from './components/smartMessages.js';
import { renderStatisticalPanel } from './components/statisticalPanel.js';
import { renderSummaryTable, renderTextAnswers } from './components/table.js';
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
import { buildHistoricalAnalysis, getHistoricalEntityOptions } from './utils/historicalAnalytics.js';
import { initializeTheme } from './utils/theme.js';

initializeTheme();

const app = document.querySelector('#app');
let spreadsheetConfigs = [];
let catalogMetadata = null;
let questionCatalogState = null;

const state = {
  year: new Date().getFullYear(),
  month: '',
  dre: '',
  municipio: '',
  escola: '',
  tecnico: '',
  section: '',
  questionKey: '',
  drillAnswer: ''
};

let rows = [];
let questions = [];
let updatedAt = '';
let currentView = 'dashboard';
let historicalDataset = [];
let historicalLoading = false;
let historicalError = '';
let currentHistoricalAnalysis = null;
const historicalControls = { periodA: '', periodB: '', dimension: 'dre', entityA: '', entityB: '' };

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
  questions = result.questions?.length ? result.questions : detectQuestions(rows);

  if (!questions.some((question) => question.key === state.questionKey)) {
    state.questionKey = questions[0]?.key ?? '';
  }
}

async function loadCatalog(options = {}) {
  const result = await fetchPeriodCatalog(options);
  spreadsheetConfigs = result.periods ?? [];
  catalogMetadata = result.metadata ?? null;

  if (!selectedSpreadsheet()) {
    const selected = result.selectedPeriod ?? firstActiveSpreadsheet();
    state.year = selected?.year ?? state.year;
    state.month = selected?.month ?? '';
  }

  if (!spreadsheetConfigs.length) {
    throw new Error('Nenhum periodo valido foi encontrado na pasta oficial.');
  }
}

async function loadQuestionEvolution(options = {}) {
  questionCatalogState = await fetchQuestionCatalog(options);
}

async function loadHistoricalData(options = {}) {
  historicalLoading = true;
  historicalError = '';
  renderHistoricalDashboard();
  try {
    if (!questionCatalogState) {
      try {
        await loadQuestionEvolution();
      } catch {
        questionCatalogState = null;
      }
    }
    historicalDataset = await fetchHistoricalDataset(spreadsheetConfigs, options);
  } catch (error) {
    historicalError = error.message || 'Nao foi possivel carregar os dados historicos.';
  } finally {
    historicalLoading = false;
    renderHistoricalDashboard();
  }
}

function resetDataFilters() {
  state.dre = '';
  state.municipio = '';
  state.escola = '';
  state.tecnico = '';
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
  state.tecnico = '';
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
    updatedAt,
    historicalAnalysis: currentHistoricalAnalysis
  });
}

async function runReportAction(action, loadingMessage) {
  try {
    showStatus(loadingMessage, 'info');
    const report = currentReport();
    await action(report);
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel concluir a acao solicitada.', 'error');
  }
}

function renderAdminView() {
  renderSpreadsheetAdminPage(document.querySelector('#admin-root'), {
    items: catalogMetadata?.catalog ?? spreadsheetConfigs,
    metadata: catalogMetadata,
    questionCatalog: questionCatalogState,
    onRefresh: handleRefreshCatalog
  });
}

async function showView(view) {
  currentView = view;
  document.querySelector('#dashboard-root').hidden = view !== 'dashboard';
  document.querySelector('#admin-root').hidden = view !== 'admin';
  document.querySelector('#page-title').textContent = view === 'admin' ? 'Monitor de planilhas' : 'Dashboard pedagogico';
  if (view === 'admin') {
    renderAdminView();
    try {
      showStatus('Atualizando catalogo de perguntas...', 'info');
      await loadQuestionEvolution();
      renderAdminView();
      hideInfoStatus();
    } catch (error) {
      showStatus(error.message || 'Nao foi possivel carregar a evolucao dos formularios.', 'error');
    }
  } else {
    renderDashboard();
  }
}

async function handleRefreshCatalog() {
  try {
    showStatus('Atualizando catalogo da pasta oficial...', 'info');
    await loadCatalog({ refresh: true });
    await loadQuestionEvolution({ refresh: true });
    clearHistoricalDataCache();
    historicalDataset = [];
    await reloadDashboardData({ refreshHistorical: true });
    showStatus('Catalogo e dashboard atualizados com sucesso.', 'success');
    if (currentView === 'admin') renderAdminView();
  } catch (error) {
    showStatus(error.message || 'Nao foi possivel atualizar o catalogo.', 'error');
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

function ensureHistoricalControls() {
  const scopedDataset = historicalDataset.filter((item) => !item.error && (!state.year || item.period.year === Number(state.year)));
  const periods = scopedDataset.map((item) => ({
    periodKey: item.period.periodKey || item.period.id,
    label: item.period.label
  }));
  const keys = periods.map((period) => period.periodKey);
  if (!keys.includes(historicalControls.periodB)) historicalControls.periodB = keys.at(-1) ?? '';
  if (!keys.includes(historicalControls.periodA)) historicalControls.periodA = keys.at(-2) ?? keys.at(-1) ?? '';
  const entityOptions = getHistoricalEntityOptions(scopedDataset, historicalControls.dimension, state);
  if (!entityOptions.includes(historicalControls.entityA)) historicalControls.entityA = entityOptions[0] ?? '';
  if (!entityOptions.includes(historicalControls.entityB)) historicalControls.entityB = entityOptions[1] ?? entityOptions[0] ?? '';
  return { periods, entityOptions };
}

function handleHistoricalControl(key, value) {
  historicalControls[key] = value;
  if (key === 'dimension') {
    historicalControls.entityA = '';
    historicalControls.entityB = '';
  }
  renderHistoricalDashboard();
}

function renderHistoricalDashboard() {
  const container = document.querySelector('#historical-analysis');
  if (!container) return;
  if (historicalLoading || historicalError || !historicalDataset.length) {
    renderHistoricalAnalysis(container, {
      analysis: null,
      periods: [],
      controls: historicalControls,
      entityOptions: [],
      loading: historicalLoading,
      error: historicalError,
      onChange: handleHistoricalControl
    });
    return;
  }
  const { periods, entityOptions } = ensureHistoricalControls();
  const historyKey = createCacheKey(
    'historical-analysis',
    historicalDataset.map((item) => `${item.period.periodKey || item.period.id}:${item.updatedAt}:${item.rows.length}`).join('|'),
    state.dre,
    state.municipio,
    state.escola,
    state.tecnico,
    historicalControls
  );
  currentHistoricalAnalysis = getCachedCalculation(historyKey, () => buildHistoricalAnalysis(historicalDataset, state, historicalControls));
  renderHistoricalAnalysis(container, {
    analysis: currentHistoricalAnalysis,
    periods,
    controls: historicalControls,
    entityOptions,
    onChange: handleHistoricalControl
  });
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
  const filterKey = createCacheKey('filtered-rows', updatedAt, rows.length, state.year, state.month, state.dre, state.municipio, state.escola, state.tecnico);
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
    onExportExcel: () => runReportAction(async (report) => {
      const { exportReportToExcel } = await import('./reports/exportExcel.js');
      exportReportToExcel(report);
      showStatus('Arquivo Excel gerado com sucesso.', 'success');
    }, 'Preparando exportacao para Excel...'),
    onExportPdf: () => runReportAction(async (report) => {
      const { exportReportToPdf } = await import('./reports/exportPdf.js');
      exportReportToPdf(report);
      showStatus('Arquivo PDF gerado com sucesso.', 'success');
    }, 'Preparando arquivo PDF...'),
    onPrint: () => runReportAction((report) => {
      if (!report.filteredRows.length) throw new Error('Nao ha dados filtrados para imprimir.');
      printReport();
      showStatus('Relatorio preparado para impressao.', 'success');
    }, 'Preparando visualizacao para impressao...'),
    onClearFilters: clearDashboardFilters
  });
  renderFilters(document.querySelector('#filters'), state, rows, questions, updateState, spreadsheetConfigs);
  renderActiveFilters(document.querySelector('#active-filters'), state, question);
  renderMetricCards(document.querySelector('#metrics'), smartIndicators);
  renderQuestionAnalysis(filteredRows);
  renderHistoricalDashboard();
}

function hideInfoStatus() {
  const element = document.querySelector('#status-message');
  if (element && element.dataset.type === 'info') {
    element.hidden = true;
    element.setAttribute('aria-busy', 'false');
    document.querySelector('#dashboard-root')?.setAttribute('aria-busy', 'false');
    document.querySelector('#admin-root')?.setAttribute('aria-busy', 'false');
  }
}

async function reloadDashboardData({ refreshHistorical = false } = {}) {
  try {
    showStatus('Carregando dados do periodo selecionado...', 'info');
    await loadData();
    hideInfoStatus();
    renderDashboard();
    if (!historicalDataset.length || refreshHistorical) await loadHistoricalData({ force: refreshHistorical });
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

  try {
    showStatus('Localizando planilhas na pasta oficial...', 'info');
    await loadCatalog();
    await reloadDashboardData();
    showView('dashboard');
  } catch (error) {
    rows = [];
    questions = [];
    updatedAt = '';
    renderDashboard();
    showStatus(error.message || 'Nao foi possivel iniciar a plataforma.', 'error');
  }
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

document.addEventListener('themechange', () => {
  if (!isAuthenticated()) return;
  if (currentView === 'admin') renderAdminView();
  else renderDashboard();
});
