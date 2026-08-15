#!/usr/bin/env bash
#
# generate-exe.sh — build the Chattydesk Windows desktop executable.
#
# Wraps electron-builder: compiles the Electron main/preload/renderer bundles
# and packages them into release/build as an NSIS installer (.exe) and/or a
# portable single-file .exe.
#
# Run ./generate-exe.sh --help for usage.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OUT_DIR="release/build"
BUILDER_IMAGE="electronuserland/builder:wine"

WIN_TARGET="nsis"
ARCH="x64"
USE_DOCKER="false"
SKIP_INSTALL="false"
PUBLISH="never"

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
${BOLD}Chattydesk — Windows executable${RESET}

  ./generate-exe.sh [options]

Produces, in ${OUT_DIR}:
  Chattydesk Setup <version>.exe   NSIS installer   (default)
  Chattydesk <version>.exe         portable build   (--target portable)

${BOLD}Options${RESET}
      --target <t>     nsis | portable | nsis,portable. Default: ${WIN_TARGET}
      --arch <a>       x64 | ia32 | arm64. Default: ${ARCH}
      --docker         Build inside the ${BUILDER_IMAGE}
                       container. Use this on macOS/Linux — see below.
      --skip-install   Do not run npm install first.
      --publish <p>    electron-builder --publish value. Default: ${PUBLISH}
  -h, --help           Show this help.

${BOLD}Where this runs${RESET}
  Windows            Works natively. Nothing extra to install.
  macOS / Linux      Packaging a Windows .exe needs Wine. electron-builder can
                     drive a local Wine install, but on Apple Silicon that is
                     unreliable at best, so prefer --docker, which runs the
                     whole build in a Linux container that has Wine set up.
                     Requires Docker Desktop / Docker Engine. The image is
                     amd64 only, so on Apple Silicon it runs emulated and is
                     considerably slower than a native build.

${BOLD}Examples${RESET}
  ./generate-exe.sh                        # installer, x64, native
  ./generate-exe.sh --docker               # installer, x64, via Docker
  ./generate-exe.sh --target portable      # single portable .exe
  ./generate-exe.sh --target nsis,portable --arch x64

${BOLD}Note${RESET}
  --docker runs npm install inside the container against the mounted repo, so
  node_modules ends up holding Linux binaries. Run 'npm install' again on the
  host afterwards before using 'npm start'.

Web deployment lives in ./deploy.sh.
EOF
}

# ------------------------------------------------------------------ args ---
while [ $# -gt 0 ]; do
  case "$1" in
    --target)       WIN_TARGET="${2:-}"; shift 2 ;;
    --target=*)     WIN_TARGET="${1#*=}"; shift ;;
    --arch)         ARCH="${2:-}"; shift 2 ;;
    --arch=*)       ARCH="${1#*=}"; shift ;;
    --docker)       USE_DOCKER="true"; shift ;;
    --skip-install) SKIP_INSTALL="true"; shift ;;
    --publish)      PUBLISH="${2:-}"; shift 2 ;;
    --publish=*)    PUBLISH="${1#*=}"; shift ;;
    -h|--help)      usage; exit 0 ;;
    *)              usage >&2; die "unknown option: $1" ;;
  esac
done

case "$ARCH" in
  x64|ia32|arm64) ;;
  *) die "unknown arch '$ARCH' (x64 | ia32 | arm64)" ;;
esac

for t in ${WIN_TARGET//,/ }; do
  case "$t" in
    nsis|portable|zip|msi|appx) ;;
    *) die "unknown windows target '$t'" ;;
  esac
done

# electron-builder expects: --win nsis portable --x64
BUILDER_TARGETS="${WIN_TARGET//,/ }"
BUILDER_ARGS="--win $BUILDER_TARGETS --$ARCH --publish $PUBLISH"

# ------------------------------------------------------------ native path ---
build_native() {
  command -v node >/dev/null 2>&1 || die "node is not installed"
  command -v npm  >/dev/null 2>&1 || die "npm is not installed"

  local os
  os="$(uname -s 2>/dev/null || echo unknown)"
  case "$os" in
    MINGW*|MSYS*|CYGWIN*|Windows_NT) ;;  # on Windows, nothing to check
    *)
      if ! command -v wine >/dev/null 2>&1 && ! command -v wine64 >/dev/null 2>&1; then
        warn "Building a Windows .exe on $os requires Wine, which was not found."
        warn "Re-run with --docker to build in a container that has it:"
        warn "    ./generate-exe.sh --docker"
        die  "wine not available"
      fi
      warn "Using the local Wine install. If it fails, try --docker."
      ;;
  esac

  if [ "$SKIP_INSTALL" != "true" ]; then
    info "Installing dependencies (npm install)"
    npm install
  fi

  info "Cleaning previous build output"
  npx ts-node ./.erb/scripts/clean.js dist

  info "Building main + renderer bundles"
  npm run build

  info "Packaging for Windows ($BUILDER_TARGETS, $ARCH)"
  # shellcheck disable=SC2086
  npx electron-builder build $BUILDER_ARGS

  # clean.js removed .erb/dll, which the root package.json "main" points at,
  # so rebuild it or 'npm start' breaks afterwards.
  info "Restoring the development DLL bundle"
  npm run build:dll
}

# ------------------------------------------------------------ docker path ---
build_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed (see --help)"
  docker info >/dev/null 2>&1 || die "the docker daemon is not running"

  warn "node_modules will be rebuilt for Linux inside the container."
  warn "Run 'npm install' on the host afterwards before 'npm start'."

  local tty_flag=""
  [ -t 0 ] && tty_flag="-t"

  mkdir -p "$HOME/.cache/electron" "$HOME/.cache/electron-builder"

  # The builder image is amd64 only; on Apple Silicon this runs emulated.
  info "Building in $BUILDER_IMAGE ($BUILDER_TARGETS, $ARCH)"
  [ "$(uname -m)" = "arm64" ] && warn "amd64 image under emulation — expect this to be slow."
  # shellcheck disable=SC2086
  docker run --rm -i $tty_flag \
    --platform linux/amd64 \
    -v "$ROOT_DIR":/project \
    -v "$HOME/.cache/electron":/root/.cache/electron \
    -v "$HOME/.cache/electron-builder":/root/.cache/electron-builder \
    -w /project \
    "$BUILDER_IMAGE" \
    /bin/bash -c "npm install && npx ts-node ./.erb/scripts/clean.js dist && npm run build && npx electron-builder build $BUILDER_ARGS && npm run build:dll"
}

# ------------------------------------------------------------------ main ---
if [ "$USE_DOCKER" = "true" ]; then
  build_docker
else
  build_native
fi

if [ -d "$OUT_DIR" ]; then
  ok "Done. Windows artifacts in $OUT_DIR:"
  find "$OUT_DIR" -maxdepth 1 -name '*.exe' -exec ls -lh {} \; 2>/dev/null || true
else
  die "$OUT_DIR was not created — the build did not produce any artifact"
fi
