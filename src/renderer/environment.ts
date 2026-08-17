/* eslint import/prefer-default-export: off */

/**
 * True in the desktop app, false in the browser.
 *
 * `window.electron` is injected by the Electron preload script and is absent
 * when the same bundle is served as a plain web page, which makes it the one
 * honest way to tell the two apart at runtime.
 *
 * The difference matters twice: the desktop app has no address bar, so it
 * routes on the hash and opens straight into the chat rather than onto the
 * landing page that exists to introduce the web version.
 *
 * A function rather than a constant so it is read when a component renders, not
 * when the module happens to load.
 */
export const isDesktop = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.electron);
