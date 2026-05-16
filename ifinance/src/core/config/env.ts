export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888',
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'iFinance',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
