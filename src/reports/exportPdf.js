import jsPDF from 'jspdf';
import { buildExecutiveSummary } from './reportBuilder.js';
import { buildReportFileName, formatGeneratedAt, rowsForDistribution, rowsForQuestion } from '../utils/reportFormatters.js';

function addLine(doc, text, x, y, options = {}) {
  const lines = doc.splitTextToSize(String(text ?? ''), options.width ?? 180);
  doc.text(lines, x, y);
  return y + lines.length * (options.lineHeight ?? 6);
}

function ensurePage(doc, y) {
  if (y < 275) return y;
  doc.addPage();
  return 18;
}

function addKeyValueRows(doc, title, rows, y) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  rows.forEach((row) => {
    y = ensurePage(doc, y);
    y = addLine(doc, `${row.Indicador ?? row.Filtro}: ${row.Valor}`, 14, y, { width: 180, lineHeight: 5 });
  });

  return y + 4;
}

function addSimpleTable(doc, title, rows, y, limit = 18) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (!rows.length) {
    return addLine(doc, 'Nao ha registros disponiveis.', 14, y, { width: 180 }) + 4;
  }

  rows.slice(0, limit).forEach((row) => {
    y = ensurePage(doc, y);
    const text = Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | ');
    y = addLine(doc, text, 14, y, { width: 180, lineHeight: 5 });
  });

  if (rows.length > limit) {
    y = addLine(doc, `Exibindo ${limit} de ${rows.length} registros. Exporte para Excel para ver todos os dados.`, 14, y, { width: 180, lineHeight: 5 });
  }

  return y + 4;
}

export function exportReportToPdf(report) {
  if (!report.filteredRows.length) {
    throw new Error('Nao ha dados filtrados para gerar PDF.');
  }

  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(report.title, 14, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = addLine(doc, `Periodo: ${report.period.label}`, 14, y);
  y = addLine(doc, `Gerado em: ${formatGeneratedAt(report.generatedAt)}`, 14, y);

  y = addKeyValueRows(doc, 'Resumo executivo', buildExecutiveSummary(report), y + 3);
  y = addKeyValueRows(doc, 'Filtros aplicados', Object.entries(report.filters).map(([Filtro, Valor]) => ({ Filtro, Valor })), y);

  if (report.question) {
    y = ensurePage(doc, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Pergunta selecionada', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addLine(doc, `${report.question.code} - ${report.question.title}`, 14, y);
    y = addLine(doc, `Eixo/secao: ${report.question.section}`, 14, y);
  }

  y = addSimpleTable(doc, 'Distribuicao das respostas', rowsForDistribution(report.distribution), y + 2, 20);

  if (report.question) {
    y = addSimpleTable(doc, report.questionType === 'text' ? 'Respostas abertas' : 'Drill-down', rowsForQuestion(report.drillRows, report.question), y, 18);
  }

  doc.setFontSize(9);
  doc.text('DIGE/SEDUC-PA - Acompanhamento Pedagogico', 14, 287);
  doc.save(buildReportFileName(report, 'pdf'));
}
