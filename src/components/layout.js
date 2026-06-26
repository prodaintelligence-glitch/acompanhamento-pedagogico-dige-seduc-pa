import { createIcons, BarChart3, FileDown, LogOut, Printer, Search, Table2 } from 'lucide';

export function renderLogin(container, onSubmit) {
  container.innerHTML = `
    <main class="login-page">
      <section class="login-panel">
        <div class="brand-mark"><i data-lucide="bar-chart-3"></i></div>
        <p class="eyebrow">DIGE/SEDUC-PA</p>
        <h1>Acompanhamento Pedagogico</h1>
        <p>Entre para acessar o painel mensal de analise das respostas.</p>
        <form id="login-form" class="login-form">
          <label>Usuario<input name="username" autocomplete="username" required /></label>
          <label>Senha<input name="password" type="password" autocomplete="current-password" required /></label>
          <button type="submit">Entrar</button>
          <span id="login-error" class="form-error" hidden>Usuario ou senha invalidos.</span>
        </form>
      </section>
    </main>
  `;
  createIcons({ icons: { BarChart3 } });

  container.querySelector('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const success = onSubmit(data.get('username'), data.get('password'));
    container.querySelector('#login-error').hidden = success;
  });
}

export function renderShell(container, onLogout) {
  container.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <i data-lucide="bar-chart-3"></i>
          <div><strong>Acompanhamento Pedagogico</strong><span>DIGE/SEDUC-PA</span></div>
        </div>
        <nav>
          <a href="#dashboard" class="active"><i data-lucide="table-2"></i>Dashboard</a>
          <a href="#abertas"><i data-lucide="search"></i>Perguntas abertas</a>
          <a href="#exportacoes"><i data-lucide="file-down"></i>Exportacoes</a>
        </nav>
        <button class="logout-button" type="button"><i data-lucide="log-out"></i>Sair</button>
      </aside>
      <main class="content">
        <header class="page-header">
          <div>
            <p class="eyebrow">Analise mensal</p>
            <h1>Dashboard pedagogico</h1>
          </div>
          <span class="institutional-mark">DIGE/SEDUC-PA</span>
        </header>
        <section id="status-message" class="status-message" hidden></section>
        <section id="report-actions"></section>
        <section id="metrics" class="metrics-grid"></section>
        <section id="filters" class="filters-grid"></section>
        <section class="panel question-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Pergunta selecionada</p>
              <h2 id="question-title"></h2>
              <span id="question-context"></span>
            </div>
            <span id="question-count"></span>
          </div>
          <div id="question-metrics" class="question-metrics"></div>
        </section>
        <section class="analysis-grid">
          <article class="panel chart-panel">
            <div class="panel-header"><div><p class="eyebrow">Grafico automatico</p><h2>Visualizacao das respostas</h2></div></div>
            <div class="chart-wrap">
              <canvas id="question-chart"></canvas>
              <p class="chart-message" hidden></p>
            </div>
            <div id="text-answers" class="text-answers" hidden></div>
          </article>
          <article class="panel">
            <div class="panel-header"><div><p class="eyebrow">Distribuicao</p><h2>Resumo das respostas</h2></div></div>
            <div id="summary-table" class="table-scroll"></div>
          </article>
        </section>
        <section class="panel">
          <div id="detail-table"></div>
        </section>
      </main>
    </div>
  `;

  createIcons({ icons: { BarChart3, FileDown, LogOut, Printer, Search, Table2 } });
  container.querySelector('.logout-button').addEventListener('click', onLogout);
}

export function showStatus(message, type = 'info') {
  const element = document.querySelector('#status-message');
  element.textContent = message;
  element.dataset.type = type;
  element.hidden = false;
}
