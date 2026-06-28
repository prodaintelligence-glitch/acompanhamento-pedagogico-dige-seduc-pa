export const appConfig = {
  appName: 'Acompanhamento Pedagogico',
  organization: 'DIGE/SEDUC-PA',
  storageKey: 'dige-seduc-pa-authenticated',
  defaultCredentials: {
    username: import.meta.env.VITE_ADMIN_USERNAME || (import.meta.env.DEV ? 'admin' : ''),
    password: import.meta.env.VITE_ADMIN_PASSWORD || (import.meta.env.DEV ? 'dige2026' : '')
  },
  accessConfigured: Boolean(
    (import.meta.env.VITE_ADMIN_USERNAME && import.meta.env.VITE_ADMIN_PASSWORD)
    || import.meta.env.DEV
  ),
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  googleAppsScriptUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_ENDPOINT || '',
  enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'
};
