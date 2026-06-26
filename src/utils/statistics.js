import { EMPTY_LABEL, isBlankAnswer, normalizeAnswer } from './normalizeAnswers.js';

export function getDistribution(rows, questionKey, { preserveText = false } = {}) {
  return rows.reduce((acc, row) => {
    const answer = normalizeAnswer(row[questionKey], { preserveText });
    acc[answer] = (acc[answer] || 0) + 1;
    return acc;
  }, {});
}

export function getQuestionMetrics(rows, questionKey, distribution) {
  const blankCount = rows.filter((row) => isBlankAnswer(row[questionKey])).length;
  const validCount = Math.max(rows.length - blankCount, 0);
  const categoryEntries = Object.entries(distribution).filter(([label]) => label !== EMPTY_LABEL);
  const [topCategory = 'Nao informado', topCount = 0] = categoryEntries.sort((a, b) => b[1] - a[1])[0] ?? [];
  const topPercent = validCount ? Math.round((topCount / validCount) * 100) : 0;
  const categoryStats = categoryEntries.map(([label, count]) => ({
    label,
    count,
    percent: validCount ? Math.round((count / validCount) * 100) : 0
  }));

  return {
    total: rows.length,
    validCount,
    blankCount,
    categoryCount: categoryEntries.length,
    topCategory,
    topCount,
    topPercent,
    categoryStats,
    schoolCount: new Set(rows.filter((row) => !isBlankAnswer(row[questionKey])).map((row) => row.escola).filter(Boolean)).size,
    municipalityCount: new Set(rows.filter((row) => !isBlankAnswer(row[questionKey])).map((row) => row.municipio).filter(Boolean)).size,
    dreCount: new Set(rows.filter((row) => !isBlankAnswer(row[questionKey])).map((row) => row.dre).filter(Boolean)).size
  };
}

export function getLatestTimestamp(rows) {
  return rows
    .map((row) => row.timestamp)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
}
