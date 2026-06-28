import seedSpreadsheets from '../config/spreadsheets.json';
import { mockResponses } from '../data/mockResponses.js';
import { detectQuestions } from '../utils/detectQuestions.js';

function mockPeriods() {
  const monthNumbers = {
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
  };
  return seedSpreadsheets
    .filter((item) => item.active !== false)
    .map((item) => {
      const normalizedMonth = item.month.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const monthNumber = monthNumbers[normalizedMonth];
      const periodKey = `${item.year}-${String(monthNumber).padStart(2, '0')}`;
      return {
        id: periodKey,
        periodKey,
        year: item.year,
        month: item.month,
        monthNumber,
        name: item.name,
        label: item.label,
        updatedAt: item.lastUpdated || new Date().toISOString(),
        rowCount: mockRowsForPeriod({ monthNumber }).length,
        questionCount: detectQuestions(mockResponses).length,
        status: 'Mock local',
        inconsistencies: [],
        active: true
      };
    })
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function mockIndicatorDefinition(question) {
  const text = question.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (text.includes('planejamento')) return { indicatorId: 'IND-0001', name: 'Realizacao do Planejamento Pedagogico', category: 'Gestao pedagogica', axis: 'Planejamento' };
  if (text.includes('reuniao')) return { indicatorId: 'IND-0002', name: 'Realizacao de Reunioes Pedagogicas', category: 'Gestao pedagogica', axis: 'Articulacao pedagogica' };
  if (text.includes('acompanhamento') || text.includes('turmas acompanhadas')) return { indicatorId: 'IND-0003', name: 'Abrangencia do Acompanhamento Pedagogico', category: 'Ensino e aprendizagem', axis: 'Acompanhamento' };
  return null;
}

function mockQuestionLayer() {
  const sourceQuestions = detectQuestions(mockResponses);
  const indicatorMap = new Map();
  const catalog = sourceQuestions.map((question, index) => {
    const definition = mockIndicatorDefinition(question);
    if (definition) indicatorMap.set(definition.indicatorId, definition);
    return {
      questionId: `PERG-${String(index + 1).padStart(4, '0')}`,
      text: question.originalHeader,
      concept: question.title.toLowerCase(),
      category: definition?.category ?? 'Nao classificada',
      axis: definition?.axis ?? question.section,
      indicatorId: definition?.indicatorId ?? '',
      indicatorLinkStatus: definition ? 'VINCULO_AUTOMATICO' : 'PENDENTE_REVISAO',
      type: question.type,
      firstPeriod: '2026-06',
      lastPeriod: '2026-06',
      status: 'ativa',
      reviewStatus: 'pendente de revisao'
    };
  });
  const indicators = [...indicatorMap.values()].map((indicator) => ({
    ...indicator,
    concept: indicator.name.toLowerCase(),
    status: 'ativo',
    reviewStatus: 'PENDENTE_REVISAO',
    firstPeriod: '2026-06',
    lastPeriod: '2026-06'
  }));
  const dashboardQuestions = sourceQuestions.map((question, index) => {
    const catalogQuestion = catalog[index];
    const indicator = indicatorMap.get(catalogQuestion.indicatorId);
    return {
      ...question,
      permanentId: catalogQuestion.questionId,
      indicatorId: catalogQuestion.indicatorId,
      indicatorLinkStatus: catalogQuestion.indicatorLinkStatus,
      category: catalogQuestion.category,
      indicatorAxis: indicator?.axis ?? '',
      indicatorName: indicator?.name ?? ''
    };
  });
  const hierarchy = [...new Set(indicators.map((indicator) => indicator.category))].map((category) => ({
    category,
    axes: [...new Set(indicators.filter((indicator) => indicator.category === category).map((indicator) => indicator.axis))].map((axis) => ({
      axis,
      indicators: indicators.filter((indicator) => indicator.category === category && indicator.axis === axis).map((indicator) => ({
        indicatorId: indicator.indicatorId,
        name: indicator.name,
        questionIds: catalog.filter((question) => question.indicatorId === indicator.indicatorId).map((question) => question.questionId),
        questions: catalog.filter((question) => question.indicatorId === indicator.indicatorId).map((question) => ({
          questionId: question.questionId,
          text: question.text,
          firstPeriod: question.firstPeriod,
          lastPeriod: question.lastPeriod
        }))
      }))
    }))
  }));
  return { catalog, indicators, dashboardQuestions, hierarchy };
}

function mockRowsForPeriod(period) {
  const monthNumber = Number(period?.monthNumber || 6);
  const count = Math.min(mockResponses.length, Math.max(2, monthNumber - 2));
  const booleanScale = ['Nao', 'Parcialmente', 'Sim'];
  return mockResponses.slice(0, count).map((row, index) => ({
    ...row,
    timestamp: String(row.timestamp).replace('-06-', `-${String(monthNumber).padStart(2, '0')}-`),
    '1.1 - A escola realizou planejamento pedagogico no mes?': booleanScale[(monthNumber + index) % booleanScale.length],
    '1.2 - Houve reuniao com professores?': booleanScale[(monthNumber + index + 1) % booleanScale.length],
    '1.3 - Quantidade de turmas acompanhadas': Math.max(1, Number(row['1.3 - Quantidade de turmas acompanhadas']) - (6 - monthNumber)),
    '2.2 - Acompanhamento individual foi realizado?': booleanScale[(monthNumber + index + 2) % booleanScale.length]
  }));
}

export async function fetchMockCatalog() {
  const periods = mockPeriods();
  const synchronizedAt = new Date().toISOString();
  return {
    success: true,
    periods,
    selectedPeriod: periods[0] ?? null,
    metadata: {
      source: 'mock',
      catalog: periods,
      totalFiles: periods.length,
      totalSpreadsheets: periods.length,
      availablePeriods: periods.length,
      latestPeriod: periods[0] ?? null,
      lastSyncAt: synchronizedAt,
      sortOrder: 'descending'
    },
    questions: [],
    rows: [],
    statistics: {},
    updatedAt: synchronizedAt
  };
}

export async function fetchMockResponses(period) {
  const periodRows = mockRowsForPeriod(period);
  const headers = Object.keys(periodRows[0] ?? {});
  const layer = mockQuestionLayer();
  const questions = layer.dashboardQuestions;
  const periods = mockPeriods();
  return {
    success: true,
    periods,
    selectedPeriod: period,
    metadata: {
      source: 'mock',
      fileName: period?.name || 'Mock local',
      totalRows: periodRows.length,
      totalColumns: headers.length,
      status: 'Mock local',
      inconsistencies: [],
      indicatorCoverage: {
        total: questions.length,
        linked: questions.filter((question) => question.indicatorId).length,
        pending: questions.filter((question) => !question.indicatorId).length
      },
      lastSyncAt: new Date().toISOString()
    },
    headers,
    questions,
    indicators: layer.indicators,
    rows: periodRows,
    statistics: {
      totalRows: periodRows.length,
      totalQuestions: questions.length,
      totalDres: new Set(periodRows.map((row) => row.dre).filter(Boolean)).size,
      totalMunicipios: new Set(periodRows.map((row) => row.municipio).filter(Boolean)).size,
      totalEscolas: new Set(periodRows.map((row) => row.escola).filter(Boolean)).size
    },
    updatedAt: new Date().toISOString(),
    source: 'mock'
  };
}

export async function fetchMockQuestionCatalog() {
  const layer = mockQuestionLayer();
  const questions = layer.catalog;
  return {
    success: true,
    catalog: questions,
    indicators: layer.indicators,
    hierarchy: layer.hierarchy,
    summary: {
      totalQuestions: questions.length,
      totalIndicators: layer.indicators.length,
      linkedQuestions: questions.filter((question) => question.indicatorId).length,
      pendingIndicatorLinks: questions.filter((question) => !question.indicatorId),
      indicatorConflicts: [],
      processedPeriods: 1,
      processedNow: ['2026-06'],
      latestPeriod: '2026-06',
      newQuestions: questions,
      alteredQuestions: [],
      equivalentQuestions: [],
      unclassifiedQuestions: questions.filter((question) => question.category === 'Nao classificada'),
      comparison: null
    },
    history: questions.map((question) => ({
      timestamp: new Date().toISOString(),
      periodKey: '2026-06',
      eventType: 'nova',
      questionId: question.questionId,
      details: question.text
    })),
    updatedAt: new Date().toISOString()
  };
}
