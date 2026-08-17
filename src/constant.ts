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

/**
 * Where the hosted chat lives, for deployments that publish the landing page
 * without the chat behind it (a marketing site on one host, the app on
 * another):
 *
 *   WEB_CHAT_URL=https://chat.example.com npm run build:web
 *
 * Left empty — the default — the chat is part of this build and every call to
 * action routes to /chat in-page instead.
 */
export const webChatURL = process.env.WEB_CHAT_URL || '';

/**
 * Public origin of the deployed site, e.g. `https://chattydesk.example.com`:
 *
 *   SITE_URL=https://chattydesk.example.com npm run build:web
 *
 * Needed for the absolute URLs that search engines and link previews require —
 * canonical, `og:url`, `og:image`, sitemap.xml. Left empty (the default, and the
 * only sane one for the desktop build) those are simply omitted rather than
 * pointing somewhere invented.
 */
export const siteURL = (process.env.SITE_URL || '').replace(/\/+$/, '');

/**
 * Router basename, derived from the asset prefix the bundle was built with.
 *
 * A real sub-path (`PUBLIC_PATH=/chattydesk/`, which is what a GitHub Pages
 * project site needs) means the routes are served from under it too. The
 * default `./` is not a path at all, so there is no basename to set.
 */
const publicPath = process.env.PUBLIC_PATH || './';
export const routerBasename = publicPath.startsWith('/')
  ? publicPath
  : undefined;
