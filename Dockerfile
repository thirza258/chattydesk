# Chattydesk as an ordinary web app: build the renderer for the browser, then
# serve it from nginx with /api reverse proxied to the backend.
#
# Built by ./deploy.sh --target docker, or directly:
#   docker build -t chattydesk-web .
#   docker run --rm -p 5000:80 chattydesk-web

# ------------------------------------------------------------------ build ---
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Same-origin by default — nginx proxies /api to the backend below.
ARG API_BASE_URL=/api/v1
ARG PUBLIC_PATH=./
# Public origin of the site, for canonical/og:/sitemap URLs. Empty means those
# are left out rather than pointing at an invented address.
ARG SITE_URL=
ENV API_BASE_URL=$API_BASE_URL
ENV PUBLIC_PATH=$PUBLIC_PATH
ENV SITE_URL=$SITE_URL

COPY package.json package-lock.json ./

# --ignore-scripts skips the Electron postinstall (native rebuilds, DLL build,
# ~100MB binary download): none of it is needed to bundle the browser build.
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build:web

# ------------------------------------------------------------------ serve ---
FROM nginx:1.27-alpine AS serve

# Overridable at run time: docker run -e BACKEND_ORIGIN=https://api.example.com
# Defaults to the backend container on the compose network (host port 9001).
ENV BACKEND_ORIGIN=http://backend:9001

COPY --from=build /app/release/web /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# 127.0.0.1, not localhost: nginx binds IPv4 only, and busybox wget does
# not fall back from ::1 when localhost resolves to IPv6 first.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
