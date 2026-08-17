/* eslint import/prefer-default-export: off */
import { useEffect } from 'react';
import { siteURL } from '../constant';

/**
 * Per-route `<head>` metadata for a single-page app.
 *
 * The HTML shell (src/renderer/index.ejs) carries the landing page's title,
 * description and social tags, which is what a crawler or a link unfurler sees
 * without running any JavaScript. This hook keeps the rest honest once the app
 * is running: the title follows the route, and the pages that exist for the
 * signed-in user tell search engines not to index them.
 *
 * Written directly against `document.head` rather than through a helmet-style
 * library: four tags do not justify a dependency in a bundle the desktop app
 * also ships.
 */
interface PageMeta {
  /** Shown in the tab and used as the search result heading. Keep under ~60 characters. */
  title: string;
  description?: string;
  /** Route this page lives at, for the canonical URL. Omit to leave it alone. */
  path?: string;
  /** True for the app's own pages — thin content, and nothing a stranger can open. */
  noindex?: boolean;
}

const ensureTag = (
  tagName: 'meta' | 'link',
  attributes: Record<string, string>,
): Element => {
  const selector =
    tagName +
    Object.entries(attributes)
      .map(([name, value]) => `[${name}="${value}"]`)
      .join('');

  const existing = document.head.querySelector(selector);
  if (existing) return existing;

  const created = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) =>
    created.setAttribute(name, value),
  );
  document.head.appendChild(created);
  return created;
};

export const usePageMeta = ({
  title,
  description,
  path,
  noindex,
}: PageMeta): void => {
  useEffect(() => {
    document.title = title;

    if (description) {
      ensureTag('meta', { name: 'description' }).setAttribute(
        'content',
        description,
      );
    }

    // Set on every route, not only the noindex ones: leaving a stale "noindex"
    // behind after navigating back to the landing page would quietly delist it.
    ensureTag('meta', { name: 'robots' }).setAttribute(
      'content',
      noindex ? 'noindex, nofollow' : 'index, follow',
    );

    // A canonical URL has to be absolute, so it only exists once the build was
    // told where the site lives (SITE_URL).
    if (siteURL && path) {
      ensureTag('link', { rel: 'canonical' }).setAttribute(
        'href',
        `${siteURL}${path}`,
      );
    } else if (!siteURL) {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }
  }, [title, description, path, noindex]);
};
