/**
 * Emits the files a landing page needs but a bundler would not otherwise
 * produce: favicons, a social preview image, robots.txt and sitemap.xml.
 *
 * It belongs in the build rather than in deploy.sh because the Docker image
 * runs `npm run build:web` directly — anything done only by the deploy script
 * would be missing from that deployment.
 *
 * `siteURL` is the public origin of the site (SITE_URL at build time). Without
 * it there is no sitemap: a sitemap of relative URLs is invalid, and inventing
 * an origin would be worse than omitting the file.
 */

import fs from 'fs';
import path from 'path';
import webpack, { Compiler, Compilation } from 'webpack';
import webpackPaths from './webpack.paths';

/** Copied out of assets/ under the names the HTML template links to. */
const ICONS: Array<{ from: string; to: string }> = [
  { from: 'icon.svg', to: 'icon.svg' },
  { from: path.join('icons', '32x32.png'), to: 'favicon.png' },
  { from: path.join('icons', '256x256.png'), to: 'apple-touch-icon.png' },
  // Square, so the social cards are declared as `summary` rather than
  // `summary_large_image`. Replace this with a 1200×630 image and update the
  // card type in src/renderer/index.ejs if you want the wide treatment.
  { from: path.join('icons', '512x512.png'), to: 'og-image.png' },
];

/** Only `/` is worth indexing; the app routes say so themselves via `noindex`. */
const INDEXABLE_PATHS = ['/'];

const robotsTxt = (siteURL: string): string => {
  const lines = [
    '# Everything is crawlable on purpose. The app routes (/chat, /login,',
    '# /register, /settings) carry a noindex meta tag instead of being blocked',
    '# here: a path disallowed in robots.txt can still be indexed from an',
    '# external link, because the crawler never gets to read the tag.',
    'User-agent: *',
    'Content-Signal: ai-train=yes, search=yes, ai-input=yes',
    'Allow: /',
  ];
  if (siteURL) lines.push('', `Sitemap: ${siteURL}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
};

const sitemapXml = (siteURL: string): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...INDEXABLE_PATHS.map(
      (route) =>
        `  <url><loc>${siteURL}${route}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

export default class SeoAssetsPlugin {
  private readonly siteURL: string;

  constructor(options: { siteURL?: string } = {}) {
    // A trailing slash would produce "https://site//sitemap.xml".
    this.siteURL = (options.siteURL || '').replace(/\/+$/, '');
  }

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap('SeoAssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'SeoAssetsPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const emit = (name: string, contents: string | Buffer) => {
            if (compilation.getAsset(name)) return;
            compilation.emitAsset(
              name,
              new webpack.sources.RawSource(contents as string),
            );
          };

          ICONS.forEach(({ from, to }) => {
            const source = path.join(webpackPaths.rootPath, 'assets', from);
            if (fs.existsSync(source)) {
              emit(to, fs.readFileSync(source));
            } else {
              compilation.warnings.push(
                new webpack.WebpackError(
                  `SeoAssetsPlugin: assets/${from} is missing, so ${to} was not emitted.`,
                ),
              );
            }
          });

          emit('robots.txt', robotsTxt(this.siteURL));
          emit('ads.txt', 'google.com, pub-3592604467898331, DIRECT, f08c47fec0942fa0\n');

          if (this.siteURL) {
            emit('sitemap.xml', sitemapXml(this.siteURL));
          } else if (compiler.options.mode === 'production') {
            // Only worth saying about a real build: locally there is no origin
            // to advertise and nobody is submitting a sitemap.
            compilation.warnings.push(
              new webpack.WebpackError(
                'SeoAssetsPlugin: SITE_URL is not set, so no sitemap.xml or canonical URL was written.',
              ),
            );
          }
        },
      );
    });
  }
}
