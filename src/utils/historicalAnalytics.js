import { isBlankAnswer, normalizeAnswer } from './normalizeAnswers.js';

const ENTITY_FIELDS = ['dre', 'municipio', 'escola', 'tecnico'];

function percent(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function percentDelta(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function sentiment(value) {
  const answer = normalizeAnswer(value).toLowerCase();
  if (['sim', 'adequado', 'realizado', 'concluido', 'satisfatorio'].includes(answer)) return 1;
  if (['nao', 'inadequado', 'nao realizado', 'insatisfatorio'].includes(answer)) return -1;
  if (answer === 'parcialmente') return 0;
  return null;
}

function filterRows(rows, filters) {
  return rows.filter((row) => ENTITY_FIELDS.every((field) => !filters[field] || row[field] === filters[field]));
}

function responseSentiments(item, rows) {
  const values = [];
  item.questions.forEach((question) => {
    rows.forEach((row) => {
      const score = sentiment(row[question.key]);
      if (score !== null) values.push(score);
    });
  });
  return values;
}

function periodMetric(item, filters) {
  const rows = filterRows(item.rows, filters);
  const sentiments = responseSentiments(item, rows);
  return {
    periodKey: item.period.periodKey || item.period.id,
    label: item.period.label,
    rows: rows.length,
    schools: new Set(rows.map((row) => row.escola).filter(Boolean)).size,
    municipalities: new Set(rows.map((row) => row.municipio).filter(Boolean)).size,
    dres: new Set(rows.map((row) => row.dre).filter(Boolean)).size,
    technicians: new Set(rows.map((row) => row.tecnico).filter(Boolean)).size,
    positiveRate: percent(sentiments.filter((value) => value > 0).length, sentiments.length),
    negativeRate: percent(sentiments.filter((value) => value < 0).length, sentiments.length)
  };
}

function rank(dataset, filters, field, mode = 'records') {
  const groups = new Map();
  dataset.forEach((item) => {
    filterRows(item.rows, filters).forEach((row) => {
      const name = row[field];
      if (!name) return;
      const current = groups.get(name) ?? { name, records: 0, schools: new Set(), municipalities: new Set(), periods: new Set() };
      current.records += 1;
      if (row.escola) current.schools.add(row.escola);
      if (row.municipio) current.municipalities.add(row.municipio);
      current.periods.add(item.period.periodKey || item.period.id);
      groups.set(name, current);
    });
  });
  return [...groups.values()].map((item) => ({
    name: item.name,
    records: item.records,
    schools: item.schools.size,
    municipalities: item.municipalities.size,
    periods: item.periods.size,
    value: mode === 'schools' ? item.schools.size : item.records
  })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 8);
}

function indicatorEvolution(dataset, filters) {
  const indicators = new Map();
  dataset.forEach((item) => {
    const rows = filterRows(item.rows, filters);
    item.questions.filter((question) => question.indicatorId).forEach((question) => {
      const entry = indicators.get(question.indicatorId) ?? {
        indicatorId: question.indicatorId,
        name: question.indicatorName || question.title,
        category: question.category || 'Nao classificada',
        axis: question.indicatorAxis || question.section,
        periods: new Map()
      };
      const periodKey = item.period.periodKey || item.period.id;
      const period = entry.periods.get(periodKey) ?? { periodKey, label: item.period.label, positive: 0, negative: 0, responses: 0 };
      rows.forEach((row) => {
        const score = sentiment(row[question.key]);
        if (score === null) return;
        period.responses += 1;
        if (score > 0) period.positive += 1;
        if (score < 0) period.negative += 1;
      });
      entry.periods.set(periodKey, period);
      indicators.set(question.indicatorId, entry);
    });
  });
  return [...indicators.values()].map((indicator) => {
    const periods = [...indicator.periods.values()].sort((a, b) => a.periodKey.localeCompare(b.periodKey)).map((item) => ({
      ...item,
      positiveRate: percent(item.positive, item.responses),
      negativeRate: percent(item.negative, item.responses)
    }));
    const delta = periods.length > 1 ? Math.round((periods.at(-1).positiveRate - periods[0].positiveRate) * 10) / 10 : 0;
    return {
      ...indicator,
      periods,
      delta,
      trend: delta > 3 ? 'Crescimento' : delta < -3 ? 'Reducao' : 'Estabilidade'
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function criticalQuestions(dataset, filters) {
  const groups = new Map();
  dataset.forEach((item) => {
    const rows = filterRows(item.rows, filters);
    item.questions.forEach((question) => {
      const key = question.permanentId || question.code || question.title;
      const current = groups.get(key) ?? { key, title: question.title, negative: 0, blank: 0, valid: 0, periods: new Set() };
      current.periods.add(item.period.periodKey || item.period.id);
      rows.forEach((row) => {
        if (isBlankAnswer(row[question.key])) {
          current.blank += 1;
          return;
        }
        current.valid += 1;
        if (sentiment(row[question.key]) === -1) current.negative += 1;
      });
      groups.set(key, current);
    });
  });
  return [...groups.values()].map((item) => ({
    id: item.key,
    title: item.title,
    negativeRate: percent(item.negative, item.valid),
    blanks: item.blank,
    recurringPeriods: item.periods.size
  })).sort((a, b) => b.negativeRate - a.negativeRate || b.blanks - a.blanks).slice(0, 10);
}

export function getHistoricalEntityOptions(dataset, dimension, filters = {}) {
  const relaxed = { ...filters, [dimension]: '' };
  return [...new Set(dataset.flatMap((item) => filterRows(item.rows, relaxed).map((row) => row[dimension])).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

function entitySeries(dataset, filters, dimension, names) {
  return names.filter(Boolean).map((name) => ({
    name,
    periods: dataset.map((item) => {
      const rows = filterRows(item.rows, { ...filters, [dimension]: name });
      return { periodKey: item.period.periodKey || item.period.id, label: item.period.label, records: rows.length };
    })
  }));
}

function executiveSummary(metrics, comparison, indicators, critical) {
  const messages = [];
  if (comparison) {
    const direction = comparison.recordsDelta > 0 ? 'aumento' : comparison.recordsDelta < 0 ? 'reducao' : 'estabilidade';
    messages.push(`O comparativo registra ${direction} de ${Math.abs(comparison.recordsDelta)}% na quantidade de acompanhamentos.`);
  }
  const advancing = indicators.find((item) => item.delta > 3);
  if (advancing) messages.push(`Principal avanco: ${advancing.name}, com variacao positiva de ${advancing.delta} pontos percentuais.`);
  const attention = critical.find((item) => item.negativeRate > 0 || item.blanks > 0);
  if (attention) messages.push(`Ponto de atencao: ${attention.title} (${attention.negativeRate}% de respostas negativas e ${attention.blanks} em branco).`);
  if (!messages.length && metrics.length) messages.push('Os dados disponiveis indicam estabilidade no recorte selecionado.');
  return messages;
}

export function buildHistoricalAnalysis(dataset, filters, controls) {
  const validDataset = dataset.filter((item) => !item.error && (!filters.year || item.period.year === Number(filters.year)));
  const periodMetrics = validDataset.map((item) => periodMetric(item, filters));
  const byKey = new Map(periodMetrics.map((item) => [item.periodKey, item]));
  const left = byKey.get(controls.periodA);
  const right = byKey.get(controls.periodB);
  const comparison = left && right ? {
    periodA: left,
    periodB: right,
    recordsDelta: percentDelta(right.rows, left.rows),
    schoolsDelta: right.schools - left.schools,
    municipalitiesDelta: right.municipalities - left.municipalities,
    positiveRateDelta: Math.round((right.positiveRate - left.positiveRate) * 10) / 10
  } : null;
  const allRows = validDataset.flatMap((item) => filterRows(item.rows, filters));
  const indicators = indicatorEvolution(validDataset, filters);
  const critical = criticalQuestions(validDataset, filters);
  const strategic = [
    { label: 'Escolas acompanhadas', value: new Set(allRows.map((row) => row.escola).filter(Boolean)).size },
    { label: 'Municipios atendidos', value: new Set(allRows.map((row) => row.municipio).filter(Boolean)).size },
    { label: 'DREs atendidas', value: new Set(allRows.map((row) => row.dre).filter(Boolean)).size },
    { label: 'Visitas realizadas', value: allRows.length },
    { label: 'Media mensal', value: validDataset.length ? Math.round((allRows.length / validDataset.length) * 10) / 10 : 0 }
  ];
  return {
    periodMetrics,
    comparison,
    strategic,
    rankings: {
      municipalities: rank(validDataset, filters, 'municipio'),
      dres: rank(validDataset, filters, 'dre', 'schools'),
      technicians: rank(validDataset, filters, 'tecnico')
    },
    criticalQuestions: critical,
    indicatorTrends: indicators,
    entityComparison: {
      dimension: controls.dimension,
      series: entitySeries(validDataset, filters, controls.dimension, [controls.entityA, controls.entityB])
    },
    executiveSummary: executiveSummary(periodMetrics, comparison, indicators, critical),
    errors: dataset.filter((item) => item.error).map((item) => ({ period: item.period.label, message: item.error }))
  };
}
