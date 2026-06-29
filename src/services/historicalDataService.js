import { fetchResponsesForPeriod } from './dataService.js';
import { detectQuestions } from '../utils/detectQuestions.js';

const periodCache = new Map();

export function clearHistoricalDataCache() {
  periodCache.clear();
}

function periodCacheKey(period) {
  return [
    period.periodKey || period.id || '',
    period.spreadsheetId || period.fileId || '',
    period.updatedAt || ''
  ].join(':');
}

async function fetchPeriodHistory(period, { force = false } = {}) {
  const key = periodCacheKey(period);
  if (!force && periodCache.has(key)) return periodCache.get(key);

  try {
    const payload = await fetchResponsesForPeriod(period, { refresh: force });
    const item = {
      period,
      rows: payload.rows,
      questions: payload.questions?.length ? payload.questions : detectQuestions(payload.rows),
      indicators: payload.indicators ?? [],
      updatedAt: payload.updatedAt || period.updatedAt,
      error: ''
    };
    periodCache.set(key, item);
    return item;
  } catch (error) {
    return {
      period,
      rows: [],
      questions: [],
      indicators: [],
      updatedAt: period.updatedAt,
      error: error.message || 'Nao foi possivel carregar este periodo.'
    };
  }
}

export async function fetchHistoricalDataset(periods, { force = false } = {}) {
  if (force) clearHistoricalDataCache();
  const activePeriods = [...periods]
    .filter((period) => period.active !== false)
    .sort((a, b) => String(a.periodKey || a.id).localeCompare(String(b.periodKey || b.id)));

  const dataset = [];
  for (const period of activePeriods) {
    dataset.push(await fetchPeriodHistory(period, { force }));
  }
  return dataset;
}
