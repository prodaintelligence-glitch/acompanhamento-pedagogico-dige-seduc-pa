export const appConfig = {
  appName: 'Acompanhamento Pedagogico',
  organization: 'DIGE/SEDUC-PA',
  storageKey: 'dige-seduc-pa-authenticated',
  defaultCredentials: {
    username: 'admin',
    password: 'dige2026'
  },
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  googleAppsScriptEndpoint: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_ENDPOINT || '',
  enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'
};
