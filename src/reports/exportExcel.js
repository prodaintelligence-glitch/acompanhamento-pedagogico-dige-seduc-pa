import { buildExecutiveSummary } from './reportBuilder.js';
import { buildReportFileName, rowsForDistribution, rowsForFilters, rowsForQuestion } from '../utils/reportFormatters.js';

const worksheets = [];

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function safeSheetName(name) {
  return String(name).replace(/[\\/:*?\[\]]/g, ' ').trim().slice(0, 31) || 'Dados';
}

function cellXml(value) {
  const isNumber = typeof value === 'number' && Number.isFinite(value);
  return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXml(value)}</Data></Cell>`;
}

function worksheetXml({ name, rows }) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const header = `<Row>${columns.map(cellXml).join('')}</Row>`;
  const body = rows.map((row) => `<Row>${columns.map((column) => cellXml(row[column])).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${escapeXml(safeSheetName(name))}"><Table>${header}${body}</Table></Worksheet>`;
}

function appendSheet(rows, sheetName) {
  if (rows.length) worksheets.push({ name: sheetName, rows });
}

function assertRows(rows, message) {
  if (!rows.length) throw new Error(message);
}

function downloadWorkbook(report) {
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheets.map(worksheetXml).join('')}
</Workbook>`;
  const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildReportFileName(report, 'xml');
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportReportToExcel(report, scope = 'all') {
  worksheets.length = 0;

  if (scope === 'filtered' || scope === 'all') {
    assertRows(report.filteredRows, 'Nao ha dados filtrados para exportar.');
    appendSheet(report.filteredRows, 'Dados filtrados');
  }

  if ((scope === 'drill' || scope === 'all') && report.question) {
    assertRows(report.drillRows, 'Nao ha registros de drill-down para exportar.');
    appendSheet(rowsForQuestion(report.drillRows, report.question), 'Drill down');
  }

  if ((scope === 'open' || scope === 'all') && report.questionType === 'text') {
    assertRows(report.openAnswerRows, 'Nao ha respostas abertas para exportar.');
    appendSheet(rowsForQuestion(report.openAnswerRows, report.question), 'Respostas abertas');
  }

  if ((scope === 'distribution' || scope === 'all') && report.question) {
    const distributionRows = rowsForDistribution(report.distribution);
    assertRows(distributionRows, 'Nao ha distribuicao para exportar.');
    appendSheet(distributionRows, 'Distribuicao');
  }

  appendSheet(buildExecutiveSummary(report), 'Resumo executivo');
  appendSheet(rowsForFilters(report.filters), 'Filtros aplicados');

  if (report.historicalAnalysis) {
    const historical = report.historicalAnalysis;
    appendSheet(historical.strategic.map((item) => ({ Indicador: item.label, Valor: item.value })), 'Indicadores historicos');
    if (historical.comparison) {
      appendSheet([
        { Medida: 'Registros', PeriodoA: historical.comparison.periodA.rows, PeriodoB: historical.comparison.periodB.rows, Variacao: `${historical.comparison.recordsDelta}%` },
        { Medida: 'Escolas', PeriodoA: historical.comparison.periodA.schools, PeriodoB: historical.comparison.periodB.schools, Variacao: historical.comparison.schoolsDelta },
        { Medida: 'Municipios', PeriodoA: historical.comparison.periodA.municipalities, PeriodoB: historical.comparison.periodB.municipalities, Variacao: historical.comparison.municipalitiesDelta },
        { Medida: 'Indice positivo', PeriodoA: `${historical.comparison.periodA.positiveRate}%`, PeriodoB: `${historical.comparison.periodB.positiveRate}%`, Variacao: `${historical.comparison.positiveRateDelta} p.p.` }
      ], 'Comparativo historico');
    }
    appendSheet(historical.indicatorTrends.flatMap((indicator) => indicator.periods.map((period) => ({
      Indicador: indicator.name,
      Categoria: indicator.category,
      Eixo: indicator.axis,
      Periodo: period.label,
      Respostas: period.responses,
      PercentualPositivo: period.positiveRate,
      Tendencia: indicator.trend
    }))), 'Evolucao indicadores');
    appendSheet(historical.criticalQuestions.map((item) => ({
      Pergunta: item.title,
      PercentualNegativo: item.negativeRate,
      EmBranco: item.blanks,
      PeriodosRecorrentes: item.recurringPeriods
    })), 'Perguntas criticas');
  }

  if (!worksheets.length) throw new Error('Nao ha dados disponiveis para exportacao.');
  downloadWorkbook(report);
}
