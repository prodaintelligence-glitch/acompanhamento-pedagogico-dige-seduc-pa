function fieldValue(item, field, fallback = '') {
  return item?.[field] ?? fallback;
}

function renderRows(items, cache) {
  return items.map((item) => {
    const integrity = cache[item.id];
    return `
      <tr>
        <td>${item.year}</td>
        <td>${item.month}</td>
        <td>${item.name}</td>
        <td><span class="status-pill ${integrity?.success ? 'success' : 'neutral'}">${integrity?.status || 'Nao testada'}</span></td>
        <td class="mono-cell">${item.spreadsheetId}</td>
        <td>${item.sheetName}</td>
        <td>${item.lastUpdated || integrity?.updatedAt || 'Nao informado'}</td>
        <td>${item.active ? 'Sim' : 'Nao'}</td>
        <td>
          <div class="inline-actions">
            <button type="button" class="compact-button secondary-button" data-edit="${item.id}">Editar</button>
            <button type="button" class="compact-button secondary-button" data-test="${item.id}">Testar</button>
            <button type="button" class="compact-button danger-button" data-remove="${item.id}">Remover</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderMonitor(item, cache) {
  const current = item ? cache[item.id] : null;
  const statusClass = current?.success ? 'success' : current ? 'error' : 'neutral';

  return `
    <div class="integrity-panel">
      <div><span>Ultima sincronizacao</span><strong>${current?.updatedAt || 'Nao informada'}</strong></div>
      <div><span>Respostas</span><strong>${current?.rowCount ?? 0}</strong></div>
      <div><span>Perguntas</span><strong>${current?.analysis?.totalQuestions ?? 0}</strong></div>
      <div><span>Erros</span><strong>${current?.errors ?? 0}</strong></div>
      <div><span>Tempo da consulta</span><strong>${current?.elapsedMs ? `${current.elapsedMs} ms` : 'Nao testado'}</strong></div>
      <div><span>Status</span><strong class="${statusClass}">${current?.success ? 'Conectado' : current ? 'Erro de conexao' : 'Nao testada'}</strong></div>
    </div>
  `;
}

function renderConnectionResult(result) {
  if (!result) return '<p class="empty-state">Teste uma planilha para visualizar os detalhes da conexao.</p>';

  if (!result.success) {
    return `<p class="empty-state error-state">${result.message || 'Nao foi possivel acessar esta planilha.'}</p>`;
  }

  return `
    <div class="connection-result">
      <p><strong>Linhas:</strong> ${result.rowCount}</p>
      <p><strong>Colunas:</strong> ${result.columnCount}</p>
      <p><strong>Aba:</strong> ${result.sheetName}</p>
      <p><strong>Ultima resposta:</strong> ${result.lastResponseAt || 'Nao identificada'}</p>
      <p><strong>Perguntas encontradas:</strong></p>
      <ul>${result.analysis.firstQuestions.map((question) => `<li>${question}</li>`).join('')}</ul>
    </div>
  `;
}

function renderAnalysisCache(item, cache) {
  const analysis = item ? cache[item.id]?.analysis : null;
  if (!analysis) {
    return '<p class="empty-state">A analise automatica aparecera apos testar a conexao.</p>';
  }

  return `
    <div class="analysis-cache-grid">
      <div><span>Perguntas</span><strong>${analysis.totalQuestions}</strong></div>
      <div><span>Eixos</span><strong>${analysis.totalAxes}</strong></div>
      <div><span>Abertas</span><strong>${analysis.openQuestions.length}</strong></div>
      <div><span>Fechadas</span><strong>${analysis.closedQuestions.length}</strong></div>
      <div><span>Ignoradas</span><strong>${analysis.ignoredQuestions.length}</strong></div>
    </div>
  `;
}

function renderLogs(logs) {
  if (!logs.length) return '<p class="empty-state">Nenhuma sincronizacao registrada.</p>';

  return `
    <div class="table-scroll">
      <table class="admin-table">
        <thead><tr><th>Data/hora</th><th>Planilha</th><th>Resultado</th><th>Tempo</th><th>Status</th></tr></thead>
        <tbody>
          ${logs.map((log) => `
            <tr>
              <td>${log.date}</td>
              <td>${log.spreadsheet}</td>
              <td>${log.result}</td>
              <td>${log.elapsedMs} ms</td>
              <td>${log.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderSpreadsheetAdminPage(container, props) {
  const { items, cache, logs, selectedItem, testResult } = props;
  const item = selectedItem === null ? null : selectedItem || items[0];

  container.innerHTML = `
    <section class="admin-page">
      <div class="admin-header">
        <div>
          <p class="eyebrow">Configuracoes</p>
          <h1>Planilhas mensais</h1>
        </div>
        <div class="report-actions">
          <button type="button" class="secondary-button" data-action="export-config">Exportar Configuracao</button>
          <label class="secondary-button import-button">Importar Configuracao<input type="file" accept="application/json" data-action="import-config" hidden /></label>
          <button type="button" class="secondary-button" data-action="refresh-dashboard">Atualizar Dados</button>
        </div>
      </div>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Monitor de integridade</p><h2>${item?.label || 'Nenhuma planilha'}</h2></div></div>
        ${renderMonitor(item, cache)}
      </section>

      <section class="admin-grid">
        <article class="panel">
          <div class="panel-header"><div><p class="eyebrow">Cadastro</p><h2>Nova planilha ou edicao</h2></div></div>
          <form id="spreadsheet-form" class="admin-form">
            <input name="id" type="hidden" value="${fieldValue(item, 'id')}" />
            <label>Ano<input name="year" type="number" min="2020" max="2100" required value="${fieldValue(item, 'year', new Date().getFullYear())}" /></label>
            <label>Mes<input name="month" required value="${fieldValue(item, 'month')}" /></label>
            <label>Nome amigavel<input name="name" required value="${fieldValue(item, 'name')}" /></label>
            <label>ID da Planilha Google<input name="spreadsheetId" required value="${fieldValue(item, 'spreadsheetId')}" /></label>
            <label>Nome da Aba<input name="sheetName" required value="${fieldValue(item, 'sheetName', 'Respostas ao formulario 1')}" /></label>
            <label>Descricao<textarea name="description">${fieldValue(item, 'description')}</textarea></label>
            <label class="checkbox-label"><input name="active" type="checkbox" ${item?.active !== false ? 'checked' : ''} /> Ativa</label>
            <div class="inline-actions">
              <button type="submit" class="secondary-button">Salvar</button>
              <button type="button" class="secondary-button" data-action="new">Novo</button>
              <button type="button" class="secondary-button" data-action="test-current">Testar Conexao</button>
            </div>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header"><div><p class="eyebrow">Teste da configuracao</p><h2>Resultado da conexao</h2></div></div>
          ${renderConnectionResult(testResult)}
          <div class="analysis-cache">
            <p class="eyebrow">Identificacao automatica</p>
            ${renderAnalysisCache(item, cache)}
          </div>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Planilhas cadastradas</p><h2>${items.length} configuracoes</h2></div></div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Ano</th><th>Mes</th><th>Nome</th><th>Status</th><th>ID da Planilha</th><th>Nome da Aba</th><th>Ultima Atualizacao</th><th>Ativa</th><th>Acoes</th></tr></thead>
            <tbody>${renderRows(items, cache)}</tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Log de sincronizacao</p><h2>Historico recente</h2></div></div>
        ${renderLogs(logs)}
      </section>
    </section>
  `;

  const form = container.querySelector('#spreadsheet-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    props.onSave(new FormData(form));
  });

  container.querySelector('[data-action="new"]').addEventListener('click', props.onNew);
  container.querySelector('[data-action="test-current"]').addEventListener('click', () => props.onTest(new FormData(form)));
  container.querySelector('[data-action="export-config"]').addEventListener('click', props.onExport);
  container.querySelector('[data-action="refresh-dashboard"]').addEventListener('click', props.onRefreshDashboard);
  container.querySelector('[data-action="import-config"]').addEventListener('change', (event) => props.onImport(event.target.files[0]));

  container.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => props.onEdit(button.dataset.edit));
  });
  container.querySelectorAll('[data-test]').forEach((button) => {
    button.addEventListener('click', () => props.onTest(items.find((current) => current.id === button.dataset.test)));
  });
  container.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => props.onRemove(button.dataset.remove));
  });
}
