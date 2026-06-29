import { fetchAllResponses } from './dataService.js';
import { detectQuestions } from '../utils/detectQuestions.js';

let consolidatedCache = null;

export function clearHistoricalDataCache() {
  consolidatedCache = null;
}

function rowsForPeriod(rows, period) {
  const spreadsheetId = period.spreadsheetId || period.fileId;
  return rows.filter((row) => {
    if (spreadsheetId && row.sourceSpreadsheetId) return row.sourceSpreadsheetId === spreadsheetId;
    return Number(row.sourceYear) === Number(period.year)
      && String(row.sourceMonth || '').toLowerCase() === String(period.month || '').toLowerCase();
  });
}

function metadataForPeriod(spreadsheets, period) {
  const spreadsheetId = period.spreadsheetId || period.fileId;
  return (spreadsheets || []).find((item) => item.sourceSpreadsheetId === spreadsheetId) || null;
}

export async function fetchHistoricalDataset(periods, { force = false } = {}) {
  if (force) clearHistoricalDataCache();
  if (!consolidatedCache) consolidatedCache = await fetchAllResponses({ refresh: force });

  return [...periods]
    .filter((period) => period.active !== false)
    .sort((a, b) => String(a.periodKey || a.id).localeCompare(String(b.periodKey || b.id)))
    .map((period) => {
      const periodRows = rowsForPeriod(consolidatedCache.rows, period);
      const metadata = metadataForPeriod(consolidatedCache.spreadsheets, period);
      if (!periodRows.length) {
        return {
          period,
          rows: [],
          questions: [],
          indicators: [],
          error: 'Nenhum registro consolidado foi encontrado para este periodo.'
        };
      }
      return {
        period,
        rows: periodRows,
        questions: metadata?.questions?.length ? metadata.questions : detectQuestions(periodRows),
        indicators: [],
        updatedAt: metadata?.updatedAt || consolidatedCache.updatedAt,
        error: ''
      };
    });
}
