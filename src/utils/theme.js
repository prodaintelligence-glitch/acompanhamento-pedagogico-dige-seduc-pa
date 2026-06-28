const THEME_STORAGE_KEY = 'dige-seduc-pa-theme';
const THEMES = new Set(['light', 'dark']);

export function getTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.has(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme, { persist = false } = {}) {
  const nextTheme = THEMES.has(theme) ? theme : 'light';
  document.documentElement.dataset.theme = nextTheme;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // O tema continua aplicado mesmo quando o armazenamento esta indisponivel.
    }
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
  return nextTheme;
}

export function initializeTheme() {
  return applyTheme(getTheme());
}

export function toggleTheme() {
  return applyTheme(getTheme() === 'dark' ? 'light' : 'dark', { persist: true });
}
