import { fetchResponsesForPeriod } from './dataService.js';

const periodCache = new Map();

function cacheKey(period) {
  return `${period.periodKey || period.id}:${period.updatedAt || ''}`;
}

export function clearHistoricalDataCache() {
  periodCache.clear();
}

export async function fetchHistoricalDataset(periods, { force = false } = {}) {
  if (force) clearHistoricalDataCache();
  const ordered = [...periods]
    .filter((period) => period.active !== false)
    .sort((a, b) => String(a.periodKey || a.id).localeCompare(String(b.periodKey || b.id)));
  const results = [];

  for (let offset = 0; offset < ordered.length; offset += 3) {
    const batch = ordered.slice(offset, offset + 3);
    const loaded = await Promise.all(batch.map(async (period) => {
      const key = cacheKey(period);
      if (periodCache.has(key)) return periodCache.get(key);
      try {
        const payload = await fetchResponsesForPeriod(period);
        const item = {
          period,
          rows: payload.rows,
          questions: payload.questions,
          indicators: payload.indicators ?? [],
          updatedAt: payload.updatedAt,
          error: ''
        };
        periodCache.set(key, item);
        return item;
      } catch (error) {
        return { period, rows: [], questions: [], indicators: [], error: error.message || 'Erro de leitura.' };
      }
    }));
    results.push(...loaded);
  }
  return results;
}
