import test from 'node:test';
import assert from 'node:assert/strict';

import { clearAnalysisCache, getCachedCalculation } from '../src/utils/analysisCache.js';
import { detectQuestions, detectQuestionType } from '../src/utils/detectQuestions.js';
import { applyFilters, getUniqueOptions } from '../src/utils/filters.js';
import { normalizeRows } from '../src/utils/normalizeRows.js';
import { getDistribution, getQuestionMetrics } from '../src/utils/statistics.js';
import { applyTheme, getTheme } from '../src/utils/theme.js';

test('normaliza linhas matriciais e cabecalhos institucionais', () => {
  const rows = normalizeRows(['Município', 'Nome da escola', '1.1 - Pergunta'], [[' Belém ', ' Escola A ', ' Sim ']]);
  assert.deepEqual(rows, [{ municipio: 'Belém', escola: 'Escola A', '1.1 - Pergunta': 'Sim' }]);
});

test('detecta perguntas numeradas e ignora codigos configurados', () => {
  const questions = detectQuestions([{ dre: 'DRE 1', '1.1 - Ativa': 'Sim', '1.4 - Ignorada': 'Nao' }]);
  assert.deepEqual(questions.map((question) => question.code), ['1.1']);
});

test('reconhece respostas booleanas com e sem acento', () => {
  assert.equal(detectQuestionType([{ q: 'Sim' }, { q: 'Não' }, { q: 'Parcialmente' }], 'q'), 'boolean');
});

test('aplica filtros combinados e ordena opcoes unicas', () => {
  const rows = [
    { dre: 'DRE 2', municipio: 'Marabá', escola: 'B' },
    { dre: 'DRE 1', municipio: 'Belém', escola: 'A' },
    { dre: 'DRE 1', municipio: 'Belém', escola: 'C' }
  ];
  assert.equal(applyFilters(rows, { dre: 'DRE 1', municipio: 'Belém' }).length, 2);
  assert.deepEqual(getUniqueOptions(rows, 'dre'), ['DRE 1', 'DRE 2']);
});

test('reutiliza calculos em cache ate a limpeza explicita', () => {
  clearAnalysisCache();
  let calls = 0;
  const factory = () => ++calls;
  assert.equal(getCachedCalculation('indicadores', factory), 1);
  assert.equal(getCachedCalculation('indicadores', factory), 1);
  clearAnalysisCache();
  assert.equal(getCachedCalculation('indicadores', factory), 2);
});

test('calcula distribuicao e metricas sem quebrar com respostas vazias', () => {
  const rows = [
    { q: 'Sim', escola: 'A', municipio: 'Belém', dre: 'DRE 1' },
    { q: '', escola: 'B', municipio: 'Belém', dre: 'DRE 1' }
  ];
  const distribution = getDistribution(rows, 'q');
  const metrics = getQuestionMetrics(rows, 'q', distribution);
  assert.equal(metrics.total, 2);
  assert.equal(metrics.validCount, 1);
  assert.equal(metrics.blankCount, 1);
  assert.equal(metrics.topCategory, 'Sim');
});

test('aplica e persiste somente temas validos', () => {
  const previousDocument = globalThis.document;
  const previousStorage = globalThis.localStorage;
  const previousCustomEvent = globalThis.CustomEvent;
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  globalThis.document = {
    documentElement: { dataset: {} },
    dispatchEvent: () => true
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) { this.type = type; this.detail = init?.detail; }
  };

  try {
    assert.equal(applyTheme('dark', { persist: true }), 'dark');
    assert.equal(getTheme(), 'dark');
    assert.equal(globalThis.document.documentElement.dataset.theme, 'dark');
    assert.equal(applyTheme('invalido'), 'light');
  } finally {
    globalThis.document = previousDocument;
    globalThis.localStorage = previousStorage;
    globalThis.CustomEvent = previousCustomEvent;
  }
});
