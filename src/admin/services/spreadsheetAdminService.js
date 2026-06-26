import seedSpreadsheets from '../../config/spreadsheets.json';
import { fetchGoogleSheetResponses } from '../../services/googleSheetsService.js';
import { normalizeRows } from '../../utils/normalizeRows.js';
import { analyzeSpreadsheetRows } from '../utils/spreadsheetAnalysis.js';

const STORAGE_KEY = 'dige-seduc-pa-spreadsheets';
const CACHE_KEY = 'dige-seduc-pa-spreadsheet-cache';
const LOG_KEY = 'dige-seduc-pa-sync-log';

function now() {
  return new Date().toISOString();
}

function normalizeSpreadsheet(item) {
  const id = item.id || `${item.year}-${item.month}`.toLowerCase().replace(/\s+/g, '-');
  const label = item.label || item.name || `${item.month}/${item.year}`;

  return {
    id,
    year: Number(item.year),
    month: item.month,
    name: item.name || label,
    label,
    spreadsheetId: item.spreadsheetId,
    sheetName: item.sheetName || 'Respostas ao formulario 1',
    description: item.description || '',
    active: item.active !== false,
    lastUpdated: item.lastUpdated || ''
  };
}

function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSpreadsheetConfigs() {
  return readJson(STORAGE_KEY, seedSpreadsheets).map(normalizeSpreadsheet);
}

export function saveSpreadsheetConfigs(items) {
  const normalized = items.map(normalizeSpreadsheet);
  writeJson(STORAGE_KEY, normalized);
  return normalized;
}

export function upsertSpreadsheetConfig(item) {
  const items = loadSpreadsheetConfigs();
  const normalized = normalizeSpreadsheet(item);
  const index = items.findIndex((current) => current.id === normalized.id);
  if (index >= 0) items[index] = normalized;
  else items.push(normalized);
  return saveSpreadsheetConfigs(items);
}

export function removeSpreadsheetConfig(id) {
  const items = loadSpreadsheetConfigs();
  if (items.length <= 1) {
    throw new Error('Nao e permitido excluir a ultima planilha cadastrada.');
  }
  return saveSpreadsheetConfigs(items.filter((item) => item.id !== id));
}

export function exportSpreadsheetConfigs() {
  const blob = new Blob([JSON.stringify(loadSpreadsheetConfigs(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `configuracao-planilhas-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importSpreadsheetConfigs(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Arquivo de configuracao invalido.');
  }
  return saveSpreadsheetConfigs(parsed);
}

export function loadSpreadsheetCache() {
  return readJson(CACHE_KEY, {});
}

export function saveSpreadsheetCache(id, data) {
  const cache = loadSpreadsheetCache();
  cache[id] = { ...data, cachedAt: now() };
  writeJson(CACHE_KEY, cache);
  return cache[id];
}

export function loadSyncLog() {
  return readJson(LOG_KEY, []);
}

export function appendSyncLog(entry) {
  const logs = loadSyncLog();
  logs.unshift({ id: crypto.randomUUID(), date: now(), ...entry });
  const trimmed = logs.slice(0, 25);
  writeJson(LOG_KEY, trimmed);
  return trimmed;
}

export async function testSpreadsheetConnection(spreadsheet) {
  const startedAt = performance.now();
  try {
    const payload = await fetchGoogleSheetResponses(spreadsheet);
    const rows = normalizeRows(payload.headers, payload.rows);
    const analysis = analyzeSpreadsheetRows(rows);
    const elapsedMs = Math.round(performance.now() - startedAt);
    const result = {
      success: true,
      status: 'Conectado',
      rowCount: rows.length,
      columnCount: payload.headers?.length ?? Object.keys(rows[0] ?? {}).length,
      sheetName: spreadsheet.sheetName,
      lastResponseAt: rows.map((row) => row.timestamp).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || '',
      elapsedMs,
      errors: 0,
      analysis,
      updatedAt: payload.updatedAt || now()
    };
    saveSpreadsheetCache(spreadsheet.id, result);
    appendSyncLog({ spreadsheet: spreadsheet.label, result: 'Sucesso', status: 'Conectado', elapsedMs });
    return result;
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt);
    const result = {
      success: false,
      status: 'Erro de conexao',
      message: error.message || 'Nao foi possivel acessar esta planilha.',
      rowCount: 0,
      columnCount: 0,
      sheetName: spreadsheet.sheetName,
      lastResponseAt: '',
      elapsedMs,
      errors: 1,
      analysis: null,
      updatedAt: now()
    };
    saveSpreadsheetCache(spreadsheet.id, result);
    appendSyncLog({ spreadsheet: spreadsheet.label, result: result.message, status: 'Erro', elapsedMs });
    return result;
  }
}
