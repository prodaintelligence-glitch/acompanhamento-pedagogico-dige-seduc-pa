import { createIcons, Download, FileText, Printer, RotateCcw } from 'lucide';

export function renderReportActions(container, { onExportExcel, onExportPdf, onPrint, onClearFilters }) {
  container.innerHTML = `
    <div class="report-actions">
      <button type="button" class="secondary-button" data-action="excel"><i data-lucide="download"></i>Exportar Excel</button>
      <button type="button" class="secondary-button" data-action="pdf"><i data-lucide="file-text"></i>Gerar PDF</button>
      <button type="button" class="secondary-button" data-action="print"><i data-lucide="printer"></i>Imprimir</button>
      <button type="button" class="secondary-button" data-action="clear"><i data-lucide="rotate-ccw"></i>Limpar filtros</button>
    </div>
  `;

  createIcons({ icons: { Download, FileText, Printer, RotateCcw } });

  container.querySelector('[data-action="excel"]').addEventListener('click', onExportExcel);
  container.querySelector('[data-action="pdf"]').addEventListener('click', onExportPdf);
  container.querySelector('[data-action="print"]').addEventListener('click', onPrint);
  container.querySelector('[data-action="clear"]').addEventListener('click', onClearFilters);
}
