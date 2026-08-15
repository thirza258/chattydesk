/* eslint import/prefer-default-export: off */
// Overridable at build time with API_BASE_URL, e.g.
//   API_BASE_URL=/api/v1 npm run build:web
// The fallback below is inlined by webpack's EnvironmentPlugin (see
// .erb/configs/webpack.config.base.ts), so this stays a plain string literal in
// every bundle — including the sandboxed Electron renderer, where `process`
// does not exist.
export const apiBaseURL =
  process.env.API_BASE_URL ||
  'https://web-production-7ffc1.up.railway.app/api/v1';
