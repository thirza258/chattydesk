# Chattydesk

The Backend : https://github.com/thirza258/chattydesk_backend

Chattydesk puts every model OpenRouter proxies — Claude, GPT, Gemini, Mistral and
a few hundred more — behind one chat window. It runs two ways from the same
source: as a desktop app (Electron) and as an ordinary web app in the browser.

## Features

- A landing page that introduces the web version and points at the chat
- Accounts: username and password, JWT-backed, with per-account history
- One catalogue of 400+ models, searchable and grouped by provider
- Switch models mid-conversation; your choice is remembered
- Multi-turn conversations with server-side memory, and a history sidebar you
  can click to reopen an earlier thread
- A settings page for saving your own OpenRouter key, used when the server's
  key runs out of credit — or on every request, if you prefer
- Markdown answers, token usage, and upstream errors surfaced verbatim
- Ships as a Windows installer, a macOS/Linux desktop build, or a static website

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page. The desktop app skips it and opens the chat instead |
| `/login`, `/register` | Sign in and sign up — same forms in the browser and on the desktop |
| `/chat` | The app. Needs an account; sends you to `/login` if you have none |
| `/settings` | Account details and your own OpenRouter key |

The browser build uses real URLs, so every page is linkable and the host must
serve `index.html` for unknown paths (`deploy.sh` writes a `404.html` for the
static targets, and the Docker image's nginx already does this). The desktop
build routes on the hash instead: packaged, it loads from `file://`, where there
is no server to answer a request for `/chat`.

## Configuring the backend

The frontend talks to one base URL, baked in at build time:

```sh
API_BASE_URL=https://your-backend.example.com/api/v1 npm run build:web
```

It defaults to the URL in [`src/constant.ts`](src/constant.ts). Point it at your
own deployment — the address hardcoded there is no longer live. Endpoints used
are `/auth/{register,login,refresh,me,settings}/`, `GET /openrouter/models/`,
`POST /openrouter/chat/` and `GET /openrouter/history/`; see
[handover.md](handover.md) for the contract.

> A same-origin value such as `/api/v1` is right when a proxy fronts the backend
> (the Docker deployment below does this). The desktop build loads from
> `file://`, where a relative URL means nothing, so leave it absolute there.

Two other build-time variables:

| Variable | Default | Meaning |
|---|---|---|
| `WEB_CHAT_URL` | – | Publishes the landing page pointing at a chat hosted elsewhere: every call to action becomes a link to this URL instead of the in-page `/chat` route |
| `PUBLIC_PATH` | `./` | Asset prefix. A real sub-path (`/chattydesk/`, for a GitHub Pages project site) is used as the router basename too |

## Development

```sh
npm install
npm start        # desktop app (Electron)
npm run start:web   # browser at http://localhost:3000
```

`start:web` proxies `/api` to the backend, so the browser sees a single origin
and CORS never enters the picture. Point it elsewhere with
`API_PROXY_TARGET=https://your-backend.example.com npm run start:web`.

## Deploying as a web app

```sh
./deploy.sh                      # build the static bundle into release/web
./deploy.sh --target serve       # build, then preview it locally
./deploy.sh --target docker --run   # nginx image, /api proxied to the backend
./deploy.sh --target netlify --api-url https://api.example.com/api/v1
./deploy.sh --target gh-pages --public-path /chattydesk/
```

`release/web` is a plain static site — any host will serve it. Targets for
Netlify, Vercel, GitHub Pages and Docker are built in; `./deploy.sh --help`
lists every option.

**On CORS:** served from a real origin, the browser enforces the backend's
`Access-Control-Allow-Origin`. The backend currently allows all origins, so the
static targets work as-is; the `docker` target additionally reverse-proxies
`/api` so the app and the API share one origin regardless.

## Building the desktop executable

```sh
./generate-exe.sh                  # Windows installer (.exe) -> release/build
./generate-exe.sh --docker         # same, from macOS/Linux, via a Wine container
./generate-exe.sh --target portable   # single portable .exe
```

Packaging a Windows binary needs Wine, which is unreliable on macOS (especially
Apple Silicon) — use `--docker` there. `./generate-exe.sh --help` covers arches
and targets. For a macOS or Linux build, `npm run package` still does the usual
electron-builder run.

## Installation

You can download the latest version of Chattydesk from [SourceForge](https://chattydesk.sourceforge.io/).

## Contributing

We welcome contributions! If you would like to contribute, please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.
