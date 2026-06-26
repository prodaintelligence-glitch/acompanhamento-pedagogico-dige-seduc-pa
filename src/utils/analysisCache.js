const cache = new Map();

export function createCacheKey(...parts) {
  return parts.map((part) => JSON.stringify(part)).join('|');
}

export function getCachedCalculation(key, factory) {
  if (cache.has(key)) return cache.get(key);
  const value = factory();
  cache.set(key, value);
  return value;
}

export function clearAnalysisCache() {
  cache.clear();
}
