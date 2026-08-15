#!/usr/bin/env bash
#
# deploy.sh — build and deploy Chattydesk as an ordinary web app.
#
# The renderer is a plain React SPA, so the same source that ships inside
# Electron also runs in a browser. This script produces a static bundle in
# release/web and hands it to the deployment target of your choice.
#
# Run ./deploy.sh --help for usage.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

WEB_DIR="release/web"
DEFAULT_BACKEND_ORIGIN="https://web-production-7ffc1.up.railway.app"
DEFAULT_API_URL="${DEFAULT_BACKEND_ORIGIN}/api/v1"

TARGET="static"
API_URL=""
PUBLIC_PATH=""
BACKEND_ORIGIN="$DEFAULT_BACKEND_ORIGIN"
PORT="5000"
IMAGE_NAME="chattydesk-web"
SKIP_INSTALL="false"
SKIP_BUILD="false"
RUN_CONTAINER="false"

# ---------------------------------------------------------------- colours ---
if [ -t 1 ]; then
  BOLD="$(printf '\033[1m')"; RED="$(printf '\033[31m')"
  GREEN="$(printf '\033[32m')"; YELLOW="$(printf '\033[33m')"
  BLUE="$(printf '\033[34m')"; RESET="$(printf '\033[0m')"
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; RESET=""
fi

info()  { printf '%s==>%s %s\n' "$BLUE$BOLD" "$RESET" "$*"; }
ok()    { printf '%s ok %s %s\n' "$GREEN$BOLD" "$RESET" "$*"; }
warn()  { printf '%swarn%s %s\n' "$YELLOW$BOLD" "$RESET" "$*" >&2; }
die()   { printf '%sfail%s %s\n' "$RED$BOLD" "$RESET" "$*" >&2; exit 1; }

usage() {
  cat <<EOF
${BOLD}Chattydesk — web deployment${RESET}

  ./deploy.sh [--target <name>] [options]

${BOLD}Targets${RESET}
  static      Build the static bundle into ${WEB_DIR} and stop. (default)
              Upload that folder to any static host: S3, Cloudflare Pages,
              nginx, Apache, Firebase Hosting, SourceForge web space, ...
  serve       Build, then serve ${WEB_DIR} locally to check it in a browser.
  docker      Build a Docker image (nginx) that serves the app *and* reverse
              proxies /api to the backend, so the browser sees one origin
              and CORS never applies. Add --run to start it immediately.
  netlify     Build, then deploy ${WEB_DIR} with the Netlify CLI.
  vercel      Build, then deploy ${WEB_DIR} with the Vercel CLI.
  gh-pages    Build, then push ${WEB_DIR} to the gh-pages branch.

${BOLD}Options${RESET}
  -t, --target <name>     Deployment target (see above).
      --api-url <url>     Backend base URL baked into the bundle.
                          Default: ${DEFAULT_API_URL}
                          Use a same-origin path (e.g. /api/v1) when a proxy
                          fronts the backend. The docker target does this
                          for you.
      --backend <origin>  Origin the docker/nginx target proxies /api to.
                          Default: ${DEFAULT_BACKEND_ORIGIN}
      --public-path <p>   Base path the app is served from. Default: ./
                          (relative, so it works at a domain root and under a
                          sub-path alike). Example: /chattydesk/
      --port <n>          Port for 'serve' and for 'docker --run'. Default: ${PORT}
      --image <name>      Docker image tag. Default: ${IMAGE_NAME}
      --run               docker target: run the image after building it.
      --skip-install      Do not run npm install before building.
      --skip-build        Reuse an existing ${WEB_DIR} instead of rebuilding.
  -h, --help              Show this help.

${BOLD}Examples${RESET}
  ./deploy.sh                                   # just build the static bundle
  ./deploy.sh -t serve                          # build + preview locally
  ./deploy.sh -t docker --run                   # containerised, no CORS issues
  ./deploy.sh -t netlify --api-url https://api.example.com/api/v1
  ./deploy.sh -t gh-pages --public-path /chattydesk/

${BOLD}CORS note${RESET}
  Inside Electron the app loads from file:// and the backend's CORS rules
  barely matter. Served from a real https origin they very much do: unless
  the backend sends Access-Control-Allow-Origin for your deployed domain,
  every request fails in the browser. Either allow the domain in the backend
  (repo: chattydesk_backend) or put the app behind a proxy that forwards
  /api to it — which is exactly what the docker target sets up.

Desktop builds live in ./generate-exe.sh.
EOF
}

# ------------------------------------------------------------------ args ---
while [ $# -gt 0 ]; do
  case "$1" in
    -t|--target)     TARGET="${2:-}"; shift 2 ;;
    --target=*)      TARGET="${1#*=}"; shift ;;
    --api-url)       API_URL="${2:-}"; shift 2 ;;
    --api-url=*)     API_URL="${1#*=}"; shift ;;
    --backend)       BACKEND_ORIGIN="${2:-}"; shift 2 ;;
    --backend=*)     BACKEND_ORIGIN="${1#*=}"; shift ;;
    --public-path)   PUBLIC_PATH="${2:-}"; shift 2 ;;
    --public-path=*) PUBLIC_PATH="${1#*=}"; shift ;;
    --port)          PORT="${2:-}"; shift 2 ;;
    --port=*)        PORT="${1#*=}"; shift ;;
    --image)         IMAGE_NAME="${2:-}"; shift 2 ;;
    --image=*)       IMAGE_NAME="${1#*=}"; shift ;;
    --run)           RUN_CONTAINER="true"; shift ;;
    --skip-install)  SKIP_INSTALL="true"; shift ;;
    --skip-build)    SKIP_BUILD="true"; shift ;;
    -h|--help)       usage; exit 0 ;;
    *)               usage >&2; die "unknown option: $1" ;;
  esac
done

case "$TARGET" in
  static|serve|docker|netlify|vercel|gh-pages) ;;
  *) die "unknown target '$TARGET' (see ./deploy.sh --help)" ;;
esac

BACKEND_ORIGIN="${BACKEND_ORIGIN%/}"

# The docker target proxies the backend on the same origin, so the bundle
# should call a relative path unless the caller insisted otherwise.
if [ -z "$API_URL" ]; then
  if [ "$TARGET" = "docker" ]; then
    API_URL="/api/v1"
  else
    API_URL="$DEFAULT_API_URL"
  fi
fi

# ----------------------------------------------------------------- build ---
build_web() {
  if [ "$SKIP_BUILD" = "true" ]; then
    [ -f "$WEB_DIR/index.html" ] || die "--skip-build given but $WEB_DIR/index.html is missing"
    info "Reusing existing bundle in $WEB_DIR"
    return
  fi

  command -v node >/dev/null 2>&1 || die "node is not installed"
  command -v npm  >/dev/null 2>&1 || die "npm is not installed"

  if [ "$SKIP_INSTALL" != "true" ]; then
    info "Installing dependencies (npm install)"
    npm install
  fi

  info "Building the web bundle"
  info "  API_BASE_URL = $API_URL"
  [ -n "$PUBLIC_PATH" ] && info "  PUBLIC_PATH  = $PUBLIC_PATH"

  if [ -n "$PUBLIC_PATH" ]; then
    API_BASE_URL="$API_URL" PUBLIC_PATH="$PUBLIC_PATH" npm run build:web
  else
    API_BASE_URL="$API_URL" npm run build:web
  fi

  [ -f "$WEB_DIR/index.html" ] || die "build finished but $WEB_DIR/index.html was not produced"

  # Static hosts that do client-side routing need a fallback document, and
  # GitHub Pages must be told not to run the output through Jekyll.
  cp "$WEB_DIR/index.html" "$WEB_DIR/404.html"
  touch "$WEB_DIR/.nojekyll"

  ok "Bundle ready: $WEB_DIR ($(du -sh "$WEB_DIR" | cut -f1))"
}

# --------------------------------------------------------------- targets ---
deploy_static() {
  cat <<EOF

${BOLD}Next step${RESET}
  Upload the contents of ${WEB_DIR} to any static host, e.g.

    aws s3 sync ${WEB_DIR} s3://your-bucket --delete
    rsync -av --delete ${WEB_DIR}/ user@host:/var/www/chattydesk/
    npx --yes wrangler pages deploy ${WEB_DIR}

  Serve index.html for unknown paths, and make sure the backend allows your
  domain in Access-Control-Allow-Origin (or proxy /api to it).
EOF
}

deploy_serve() {
  info "Serving $WEB_DIR at http://localhost:$PORT (Ctrl-C to stop)"
  if command -v npx >/dev/null 2>&1; then
    npx --yes serve@14 -s "$WEB_DIR" -l "$PORT"
  elif command -v python3 >/dev/null 2>&1; then
    (cd "$WEB_DIR" && python3 -m http.server "$PORT")
  else
    die "need npx or python3 to serve locally"
  fi
}

deploy_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed"
  [ -f Dockerfile ] || die "Dockerfile not found in $ROOT_DIR"

  info "Building image $IMAGE_NAME (backend proxy target: $BACKEND_ORIGIN)"
  docker build \
    --build-arg "API_BASE_URL=$API_URL" \
    --build-arg "BACKEND_ORIGIN=$BACKEND_ORIGIN" \
    -t "$IMAGE_NAME" .
  ok "Image built: $IMAGE_NAME"

  if [ "$RUN_CONTAINER" = "true" ]; then
    info "Starting container on http://localhost:$PORT (Ctrl-C to stop)"
    docker run --rm -p "$PORT:80" \
      -e "BACKEND_ORIGIN=$BACKEND_ORIGIN" \
      "$IMAGE_NAME"
  else
    cat <<EOF

${BOLD}Next step${RESET}
  docker run --rm -p ${PORT}:80 ${IMAGE_NAME}

  Or push it to a registry and deploy it anywhere containers run
  (Railway, Fly.io, Cloud Run, ECS, a plain VPS):

    docker tag ${IMAGE_NAME} <registry>/${IMAGE_NAME}:latest
    docker push <registry>/${IMAGE_NAME}:latest

  Override the backend at run time with -e BACKEND_ORIGIN=https://...
EOF
  fi
}

deploy_netlify() {
  command -v npx >/dev/null 2>&1 || die "npx is required for the netlify target"
  info "Deploying to Netlify"
  npx --yes netlify-cli deploy --dir "$WEB_DIR" --prod
  ok "Deployed to Netlify"
}

deploy_vercel() {
  command -v npx >/dev/null 2>&1 || die "npx is required for the vercel target"
  info "Deploying to Vercel"
  npx --yes vercel deploy "$WEB_DIR" --prod
  ok "Deployed to Vercel"
}

deploy_gh_pages() {
  command -v git >/dev/null 2>&1 || die "git is not installed"
  command -v npx >/dev/null 2>&1 || die "npx is required for the gh-pages target"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repository"

  if [ -z "$PUBLIC_PATH" ]; then
    warn "No --public-path given. That is right for a user/organisation page"
    warn "(user.github.io) but a project page is served from /<repo>/ — if"
    warn "assets 404, rebuild with --public-path /<repo>/"
  fi

  info "Publishing $WEB_DIR to the gh-pages branch"
  npx --yes gh-pages@6 --dist "$WEB_DIR" --dotfiles --message "deploy: chattydesk web build"
  ok "Pushed to gh-pages. Enable Pages for that branch in the repo settings."
}

# ------------------------------------------------------------------ main ---
info "Target: $TARGET"

case "$TARGET" in
  docker)
    # The image builds the bundle itself, inside the container.
    deploy_docker
    ;;
  *)
    build_web
    case "$TARGET" in
      static)   deploy_static ;;
      serve)    deploy_serve ;;
      netlify)  deploy_netlify ;;
      vercel)   deploy_vercel ;;
      gh-pages) deploy_gh_pages ;;
    esac
    ;;
esac
