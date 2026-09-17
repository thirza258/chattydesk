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
| `/courses` | Free beginner AI courses, available in the web app only |
| `/courses/:courseId/:lessonId` | A lesson, practice prompt, and knowledge check |

## Conversation memory and learning

Open **Conversation memory** above the chat to turn recall on or off, choose
how many previous turns to include (up to 50), or reset the current thread's
memory. A reset keeps the visible chat history and excludes older messages from
future context. Preferences are saved per account and conversation on the backend.
Changing models keeps the same thread; **New chat** starts with fresh context.

The backend also limits the amount of history sent in a request, keeping complete
recent turns. Deploy the matching backend and run its migrations before using
these controls; they use `GET/PATCH /openrouter/conversations/<id>/memory/`.

The web app includes four introductory courses covering AI basics, prompting,
checking answers, and everyday tasks. Each has three lessons, a practice prompt,
and a knowledge check. Completion is stored in this browser after a correct
answer; it is not synced across devices. Course routes and links are not exposed
in the Electron app.

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
| `SITE_URL` | – | Public origin of the site, e.g. `https://chattydesk.example.com`. Needed for the canonical link, the social preview tags and `sitemap.xml` — see [SEO](#seo) |
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

## SEO

The landing page is the only page meant to be found, and it is built to be:

- **Title, description, Open Graph and Twitter tags, and `SoftwareApplication`
  JSON-LD live in the HTML shell** ([`src/renderer/index.ejs`](src/renderer/index.ejs)),
  not in React — so a crawler or a link unfurler that never runs JavaScript still
  gets them. The desktop build skips the whole block (`isBrowser`), which keeps a
  marketing title out of the app's window bar.
- **`robots.txt`, `sitemap.xml`, favicons and a social preview image** are emitted
  by the build ([`.erb/configs/seo-assets.ts`](.erb/configs/seo-assets.ts)) rather
  than by `deploy.sh`, because the Docker image runs `npm run build:web` directly.
- **Per-route titles, and `noindex, nofollow` on `/chat`, `/login`, `/register`
  and `/settings`** ([`src/renderer/pageMeta.ts`](src/renderer/pageMeta.ts)). Those
  routes are *not* blocked in `robots.txt` on purpose: a disallowed URL can still
  be indexed from an external link, since the crawler never gets to read the tag.
- **A canonical URL** — which also stops a crawler that does not run JavaScript
  from filing `/chat` and `/login` as duplicates of the landing page, given they
  all serve the same shell.

Anything absolute needs to know where the site lives, so build with `SITE_URL`:

```sh
SITE_URL=https://chattydesk.example.com ./deploy.sh --site-url https://chattydesk.example.com
```

Without it, the canonical, `og:url`, `og:image` and `sitemap.xml` are omitted
rather than pointing at an invented address, and the build says so.

**The known limit:** the page body is client-rendered, so the shell ships an
empty `<div id="root">` plus a one-paragraph `<noscript>` fallback. Google runs
JavaScript and will index the real copy; crawlers that don't will only see the
head tags and that fallback. If the landing page ever needs to rank hard,
pre-rendering it to static HTML at build time is the next step — the page has no
dynamic content, so nothing about it fights that.

To swap the preview image for a proper wide card, drop a 1200×630 PNG in as
`assets/icons/512x512.png`'s replacement in
[`.erb/configs/seo-assets.ts`](.erb/configs/seo-assets.ts) and change
`twitter:card` to `summary_large_image` in the template.

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
