/**
 * Dev server for the browser ("ordinary web app") build.
 *
 * Runs the renderer on its own in a normal browser tab — no Electron main
 * process, no preload script. Requests to /api are proxied to the backend so
 * the page talks to a same-origin URL and never trips CORS in development.
 *
 *   npm run start:web
 */

import 'webpack-dev-server';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import webpackPaths from './webpack.paths';
import SeoAssetsPlugin from './seo-assets';

const port = Number(process.env.WEB_PORT || 3000);
const apiProxyTarget =
  process.env.API_PROXY_TARGET || 'https://web-production-7ffc1.up.railway.app';

const configuration: webpack.Configuration = {
  devtool: 'inline-source-map',

  mode: 'development',

  target: 'web',

  entry: [path.join(webpackPaths.srcRendererPath, 'index.tsx')],

  output: {
    path: webpackPaths.webBuildPath,
    publicPath: '/',
    filename: 'renderer.dev.js',
  },

  stats: 'errors-only',

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    plugins: [new TsconfigPathsPlugins()],
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
            },
          },
        },
      },
      {
        test: /\.s?(c|a)ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          'sass-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('tailwindcss'), require('autoprefixer')],
              },
            },
          },
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      {
        test: /\.s?(c|a)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('tailwindcss'), require('autoprefixer')],
              },
            },
          },
        ],
        exclude: /\.module\.s?(c|a)ss$/,
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      // SVG
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
              titleProp: true,
              ref: true,
            },
          },
          'file-loader',
        ],
      },
    ],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      // Same-origin by default so the devServer proxy below handles CORS.
      API_BASE_URL: '/api/v1',
      // Empty: the chat is served from this dev server, so the landing page
      // links to /chat rather than out to a hosted deployment.
      WEB_CHAT_URL: process.env.WEB_CHAT_URL || '',
      PUBLIC_PATH: '/',
      // Absolute canonical/social URLs are a production concern; locally
      // they would advertise a machine nobody else can reach.
      SITE_URL: '',
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
      isBrowser: true,
      isDevelopment: true,
    }),

    // Served from memory here, so the favicon and robots.txt can be checked
    // locally instead of only after a production build.
    new SeoAssetsPlugin(),
  ],

  devServer: {
    port,
    // BROWSER=none starts the server without opening a tab.
    open: process.env.BROWSER !== 'none',
    compress: true,
    hot: false,
    liveReload: true,
    historyApiFallback: true,
    static: {
      publicPath: '/',
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
};

export default configuration;
