import * as XLSX from 'xlsx';
import { buildExecutiveSummary } from './reportBuilder.js';
import { buildReportFileName, rowsForDistribution, rowsForFilters, rowsForQuestion } from '../utils/reportFormatters.js';

function appendSheet(workbook, rows, sheetName) {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
}

function assertRows(rows, message) {
  if (!rows.length) {
    throw new Error(message);
  }
}

export function exportReportToExcel(report, scope = 'all') {
  const workbook = XLSX.utils.book_new();

  if (scope === 'filtered' || scope === 'all') {
    assertRows(report.filteredRows, 'Nao ha dados filtrados para exportar.');
    appendSheet(workbook, report.filteredRows, 'Dados filtrados');
  }

  if ((scope === 'drill' || scope === 'all') && report.question) {
    assertRows(report.drillRows, 'Nao ha registros de drill-down para exportar.');
    appendSheet(workbook, rowsForQuestion(report.drillRows, report.question), 'Drill down');
  }

  if ((scope === 'open' || scope === 'all') && report.questionType === 'text') {
    assertRows(report.openAnswerRows, 'Nao ha respostas abertas para exportar.');
    appendSheet(workbook, rowsForQuestion(report.openAnswerRows, report.question), 'Respostas abertas');
  }

  if ((scope === 'distribution' || scope === 'all') && report.question) {
    const distributionRows = rowsForDistribution(report.distribution);
    assertRows(distributionRows, 'Nao ha distribuicao para exportar.');
    appendSheet(workbook, distributionRows, 'Distribuicao');
  }

  appendSheet(workbook, buildExecutiveSummary(report), 'Resumo executivo');
  appendSheet(workbook, rowsForFilters(report.filters), 'Filtros aplicados');

  if (!workbook.SheetNames.length) {
    throw new Error('Nao ha dados disponiveis para exportacao.');
  }

  XLSX.writeFile(workbook, buildReportFileName(report, 'xlsx'));
}
