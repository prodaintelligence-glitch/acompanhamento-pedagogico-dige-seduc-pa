import { createIcons, BarChart3, Eye, EyeOff, FileDown, LogOut, Moon, Search, Sun, Table2 } from 'lucide';
import { getTheme, toggleTheme } from '../utils/theme.js';

function themeButtonMarkup(extraClass = '') {
  return `
    <button type="button" class="theme-toggle ${extraClass}" data-theme-toggle aria-label="Alternar para tema escuro" title="Alternar para tema escuro">
      <i class="theme-icon theme-icon-light" data-lucide="moon"></i>
      <i class="theme-icon theme-icon-dark" data-lucide="sun"></i>
      <span class="theme-label">Tema escuro</span>
    </button>
  `;
}

function syncThemeButtons(container) {
  const isDark = getTheme() === 'dark';
  container.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const label = isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.querySelector('.theme-label').textContent = isDark ? 'Tema claro' : 'Tema escuro';
  });
}

function bindThemeButtons(container) {
  syncThemeButtons(container);
  container.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleTheme();
      syncThemeButtons(container);
    });
  });
}

export function renderLogin(container, onSubmit) {
  container.innerHTML = `
    <main class="login-page">
      ${themeButtonMarkup('theme-toggle-floating')}
      <section class="login-panel">
        <div class="brand-mark"><i data-lucide="bar-chart-3"></i></div>
        <p class="eyebrow">DIGE/SEDUC-PA</p>
        <h1>Acompanhamento Pedagogico</h1>
        <p>Entre para acessar o painel mensal de analise das respostas.</p>
        <form id="login-form" class="login-form">
          <label>E-mail ou matricula<input name="username" autocomplete="username" required /></label>
          <label>
            Senha
            <span class="password-field">
              <input name="password" type="password" autocomplete="current-password" required />
              <button type="button" class="password-toggle" aria-label="Visualizar senha" title="Visualizar senha">
                <i class="password-icon password-icon-show" data-lucide="eye"></i>
                <i class="password-icon password-icon-hide" data-lucide="eye-off"></i>
              </button>
            </span>
          </label>
          <button type="submit">Entrar</button>
          <span id="login-error" class="form-error" role="alert" aria-live="polite" hidden>Usuario ou senha invalidos.</span>
        </form>
      </section>
    </main>
  `;
  createIcons({ icons: { BarChart3, Eye, EyeOff, Moon, Sun } });
  bindThemeButtons(container);

  const passwordInput = container.querySelector('input[name="password"]');
  const passwordToggle = container.querySelector('.password-toggle');
  passwordToggle.addEventListener('click', () => {
    const shouldShowPassword = passwordInput.type === 'password';
    passwordInput.type = shouldShowPassword ? 'text' : 'password';
    passwordToggle.classList.toggle('is-visible', shouldShowPassword);
    passwordToggle.setAttribute('aria-label', shouldShowPassword ? 'Ocultar senha' : 'Visualizar senha');
    passwordToggle.title = shouldShowPassword ? 'Ocultar senha' : 'Visualizar senha';
  });

  container.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const data = new FormData(event.currentTarget);
    const success = await onSubmit(data.get('username'), data.get('password'));
    container.querySelector('#login-error').hidden = success;
    button.disabled = false;
  });
}

export function renderShell(container, { onLogout, onNavigate }) {
  container.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <i data-lucide="bar-chart-3"></i>
          <div><strong>Acompanhamento Pedagogico</strong><span>DIGE/SEDUC-PA</span></div>
        </div>
        <nav aria-label="Navegacao principal">
          <button type="button" class="nav-link active" data-view="dashboard"><i data-lucide="table-2"></i>Dashboard</button>
          <button type="button" class="nav-link" data-view="admin"><i data-lucide="search"></i>Monitor de planilhas</button>
          <a href="#exportacoes"><i data-lucide="file-down"></i>Exportacoes</a>
        </nav>
        <button class="logout-button" type="button"><i data-lucide="log-out"></i>Sair</button>
      </aside>
      <main class="content">
        <header class="page-header">
          <div>
            <p class="eyebrow">Analise mensal</p>
            <h1 id="page-title">Dashboard pedagogico</h1>
          </div>
          <div class="page-header-actions">
            <span class="institutional-mark">DIGE/SEDUC-PA</span>
            ${themeButtonMarkup()}
          </div>
        </header>
        <section id="status-message" class="status-message" role="status" aria-live="polite" aria-atomic="true" hidden></section>
        <section id="admin-root" hidden></section>
        <section id="dashboard-root">
          <section id="analysis-breadcrumb"></section>
          <section id="report-actions"></section>
          <section id="metrics" class="metrics-grid"></section>
          <section id="filters" class="filters-grid"></section>
          <section id="active-filters"></section>
          <section class="panel question-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Pergunta selecionada</p>
                <h2 id="question-title"></h2>
                <span id="question-context"></span>
              </div>
              <span id="question-count"></span>
            </div>
            <div id="question-info" class="question-info-grid"></div>
            <div id="question-metrics" class="question-metrics"></div>
          </section>
          <section id="smart-messages"></section>
          <section class="analysis-grid">
            <article class="panel chart-panel">
              <div class="panel-header"><div><p class="eyebrow">Grafico automatico</p><h2>Visualizacao das respostas</h2></div></div>
              <div class="chart-wrap">
                <canvas id="question-chart" role="img" aria-label="Grafico das respostas da pergunta selecionada">Seu navegador nao oferece suporte a graficos em canvas.</canvas>
                <p class="chart-message" hidden></p>
              </div>
              <div id="text-answers" class="text-answers" hidden></div>
            </article>
            <article class="panel">
              <div class="panel-header"><div><p class="eyebrow">Distribuicao</p><h2>Resumo das respostas</h2></div></div>
              <div id="summary-table" class="table-scroll"></div>
            </article>
          </section>
          <section class="dashboard-lower-grid">
            <article class="panel">
              <div id="detail-table"></div>
            </article>
            <aside id="statistical-panel" class="panel"></aside>
          </section>
          <section id="historical-analysis"></section>
        </section>
      </main>
    </div>
  `;

  createIcons({ icons: { BarChart3, FileDown, LogOut, Moon, Search, Sun, Table2 } });
  bindThemeButtons(container);
  container.querySelector('.logout-button').addEventListener('click', onLogout);
  container.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item === button));
      onNavigate(button.dataset.view);
    });
  });
}

export function showStatus(message, type = 'info') {
  const element = document.querySelector('#status-message');
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
  element.hidden = false;
  const isLoading = type === 'info';
  element.setAttribute('aria-busy', String(isLoading));
  document.querySelector('#dashboard-root')?.setAttribute('aria-busy', String(isLoading));
  document.querySelector('#admin-root')?.setAttribute('aria-busy', String(isLoading));
}
