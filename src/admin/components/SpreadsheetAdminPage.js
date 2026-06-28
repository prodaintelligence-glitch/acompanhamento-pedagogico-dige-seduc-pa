function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusClass(status) {
  if (status === 'Disponivel' || status === 'Mock local') return 'success';
  if (status === 'Erro de leitura') return 'error';
  return 'neutral';
}

function renderInconsistencies(items) {
  const messages = items.flatMap((item) =>
    (item.inconsistencies ?? []).map((message) => ({ name: item.name, message }))
  );

  if (!messages.length) {
    return '<p class="empty-state">Nenhuma inconsistencia encontrada no catalogo atual.</p>';
  }

  return `
    <ul class="monitor-issues">
      ${messages.map(({ name, message }) => `<li><strong>${escapeHtml(name)}:</strong> ${escapeHtml(message)}</li>`).join('')}
    </ul>
  `;
}

function renderEvolutionRows(summary) {
  const groups = [
    ['Nova', summary.newQuestions ?? []],
    ['Alterada', summary.alteredQuestions ?? []],
    ['Equivalente', summary.equivalentQuestions ?? []],
    ['Sem classificacao', summary.unclassifiedQuestions ?? []],
    ['Pendente indicador', summary.pendingIndicatorLinks ?? []],
    ['Conflito indicador', summary.indicatorConflicts ?? []]
  ];
  const rows = groups.flatMap(([kind, entries]) => entries.map((item) => ({ kind, ...item })));
  if (!rows.length) return '<tr><td colspan="5" class="empty-state">Nenhuma alteracao catalogada.</td></tr>';

  return rows.map((item) => `
    <tr>
      <td><span class="status-pill neutral">${escapeHtml(item.kind)}</span></td>
      <td>${escapeHtml(item.questionId || 'Nao informado')}</td>
      <td>${escapeHtml(item.text || item.originalText || item.after || 'Nao informado')}</td>
      <td>${escapeHtml(item.category || item.matchMethod || 'Nao informada')}</td>
      <td>${escapeHtml(item.firstPeriod || item.period || item.periodB || 'Nao informado')}</td>
    </tr>
  `).join('');
}

function renderQuestionEvolution(questionCatalog) {
  if (!questionCatalog) {
    return '<section class="panel"><p class="empty-state">Carregando catalogo de perguntas e evolucao dos formularios...</p></section>';
  }

  const summary = questionCatalog.summary ?? {};
  const comparison = summary.comparison;
  const history = questionCatalog.history ?? [];
  const indicators = questionCatalog.indicators ?? [];
  const catalog = questionCatalog.catalog ?? [];
  return `
    <section class="panel">
      <div class="panel-header"><div><p class="eyebrow">Evolucao dos formularios</p><h2>Catalogo permanente de perguntas</h2></div></div>
      <div class="integrity-panel">
        <div><span>Perguntas catalogadas</span><strong>${Number(summary.totalQuestions || 0)}</strong></div>
        <div><span>Indicadores</span><strong>${Number(summary.totalIndicators || 0)}</strong></div>
        <div><span>Perguntas vinculadas</span><strong>${Number(summary.linkedQuestions || 0)}</strong></div>
        <div><span>Pendentes de vinculo</span><strong>${summary.pendingIndicatorLinks?.length ?? 0}</strong></div>
        <div><span>Conflitos</span><strong>${summary.indicatorConflicts?.length ?? 0}</strong></div>
        <div><span>Periodos processados</span><strong>${Number(summary.processedPeriods || 0)}</strong></div>
      </div>
      <div class="table-scroll analysis-cache">
        <table class="admin-table">
          <thead><tr><th>Categoria</th><th>Eixo</th><th>ID</th><th>Indicador</th><th>Perguntas vinculadas</th><th>Revisao</th></tr></thead>
          <tbody>${indicators.length ? indicators.map((indicator) => `
            <tr>
              <td>${escapeHtml(indicator.category)}</td><td>${escapeHtml(indicator.axis)}</td>
              <td>${escapeHtml(indicator.indicatorId)}</td><td>${escapeHtml(indicator.name)}</td>
              <td>${catalog.filter((question) => question.indicatorId === indicator.indicatorId).length}</td>
              <td>${escapeHtml(indicator.reviewStatus)}</td>
            </tr>
          `).join('') : '<tr><td colspan="6" class="empty-state">Nenhum indicador catalogado.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="table-scroll analysis-cache">
        <table class="admin-table">
          <thead><tr><th>Situacao</th><th>ID permanente</th><th>Pergunta</th><th>Classificacao</th><th>Periodo</th></tr></thead>
          <tbody>${renderEvolutionRows(summary)}</tbody>
        </table>
      </div>
    </section>

    <section class="admin-grid">
      <article class="panel">
        <div class="panel-header"><div><p class="eyebrow">Comparacao automatica</p><h2>${comparison ? `${escapeHtml(comparison.periodA)} x ${escapeHtml(comparison.periodB)}` : 'Aguardando dois periodos'}</h2></div></div>
        ${comparison ? `
          <div class="analysis-cache-grid">
            <div><span>Iguais</span><strong>${comparison.equal?.length ?? 0}</strong></div>
            <div><span>Alteradas</span><strong>${comparison.altered?.length ?? 0}</strong></div>
            <div><span>Removidas</span><strong>${comparison.removed?.length ?? 0}</strong></div>
            <div><span>Adicionadas</span><strong>${comparison.added?.length ?? 0}</strong></div>
          </div>
        ` : '<p class="empty-state">A comparacao sera exibida quando houver pelo menos dois meses processados.</p>'}
      </article>

      <article class="panel">
        <div class="panel-header"><div><p class="eyebrow">Rastreabilidade</p><h2>Historico recente</h2></div></div>
        ${history.length ? `
          <div class="table-scroll">
            <table class="admin-table">
              <thead><tr><th>Data</th><th>Periodo</th><th>Evento</th><th>Pergunta</th></tr></thead>
              <tbody>${history.slice(0, 20).map((event) => `
                <tr><td>${escapeHtml(event.timestamp)}</td><td>${escapeHtml(event.periodKey)}</td><td>${escapeHtml(event.eventType)}</td><td>${escapeHtml(event.questionId)}</td></tr>
              `).join('')}</tbody>
            </table>
          </div>
        ` : '<p class="empty-state">Nenhuma alteracao registrada.</p>'}
      </article>
    </section>
  `;
}

export function renderSpreadsheetAdminPage(container, { items = [], metadata = {}, questionCatalog = null, onRefresh }) {
  const available = items.filter((item) => item.active).length;
  const attention = items.filter((item) => (item.inconsistencies ?? []).length > 0).length;
  const errors = items.filter((item) => item.status === 'Erro de leitura').length;
  const totalRows = items.reduce((sum, item) => sum + Number(item.rowCount || 0), 0);

  container.innerHTML = `
    <section class="admin-page">
      <div class="admin-header">
        <div>
          <p class="eyebrow">Configuracoes</p>
          <h1>Monitor automatico de planilhas</h1>
          <p class="muted-text">Catalogo gerado exclusivamente a partir da pasta oficial no Google Drive.</p>
        </div>
        <button type="button" class="secondary-button" data-action="refresh-catalog" aria-label="Atualizar catalogo de planilhas">Atualizar catalogo</button>
      </div>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Integridade</p><h2>Resumo do catalogo</h2></div></div>
        <div class="integrity-panel">
          <div><span>Arquivos encontrados</span><strong>${metadata?.totalFiles ?? items.length}</strong></div>
          <div><span>Periodos disponiveis</span><strong>${metadata?.availablePeriods ?? available}</strong></div>
          <div><span>Registros catalogados</span><strong>${totalRows}</strong></div>
          <div><span>Com inconsistencias</span><strong>${attention}</strong></div>
          <div><span>Erros de leitura</span><strong>${errors}</strong></div>
          <div><span>Ultima sincronizacao</span><strong>${escapeHtml(metadata?.lastSyncAt || 'Nao informada')}</strong></div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Periodos</p><h2>Planilhas detectadas automaticamente</h2></div></div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr><th>Planilha</th><th>Mes</th><th>Ano</th><th>Perguntas</th><th>Registros</th><th>Ultima atualizacao</th><th>Status</th><th>Inconsistencias</th></tr>
            </thead>
            <tbody>
              ${items.length ? items.map((item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.month || 'Nao identificado')}</td>
                  <td>${escapeHtml(item.year || 'Nao identificado')}</td>
                  <td>${Number(item.questionCount || 0)}</td>
                  <td>${Number(item.rowCount || 0)}</td>
                  <td>${escapeHtml(item.updatedAt || 'Nao informada')}</td>
                  <td><span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status || 'Nao informado')}</span></td>
                  <td>${escapeHtml((item.inconsistencies ?? []).join(' | ') || 'Nenhuma')}</td>
                </tr>
              `).join('') : '<tr><td colspan="8" class="empty-state">Nenhuma planilha encontrada.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Validacao estrutural</p><h2>Inconsistencias encontradas</h2></div></div>
        ${renderInconsistencies(items)}
      </section>

      ${renderQuestionEvolution(questionCatalog)}
    </section>
  `;

  const refreshButton = container.querySelector('[data-action="refresh-catalog"]');
  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.setAttribute('aria-busy', 'true');
    try {
      await onRefresh();
    } finally {
      if (refreshButton.isConnected) {
        refreshButton.disabled = false;
        refreshButton.setAttribute('aria-busy', 'false');
      }
    }
  });
}
