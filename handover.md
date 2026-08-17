# Frontend Handover — ChattyDesk backend on OpenRouter

**What changed:** the backend no longer talks to OpenAI, Google, Anthropic and Mistral
through four separate SDKs and four separate endpoints. Everything now goes through
**OpenRouter**, a single OpenAI-compatible gateway that proxies 400+ text models.

**What this means for the frontend:** instead of one endpoint per provider, there is
one chat endpoint plus a model-catalogue endpoint. The user picks any model from the
catalogue and the same request shape works for all of them.

Your existing endpoints still work (see [Legacy endpoints](#legacy-endpoints)), so
nothing breaks the moment this deploys. Migrate when convenient.

---

## Base URL

```
<host>/api/v1/openrouter/
```

All responses use the same envelope you already handle:

```jsonc
{
  "status": 200,          // mirrors the HTTP status
  "message": "Success",   // error text when status >= 400
  "data": { ... }         // absent on errors
}
```

## Authentication

Chat and history now belong to an account and need a bearer token:

```
Authorization: Bearer <access token>
```

| Method | Path | Token needed |
|---|---|---|
| `POST` | `/api/v1/auth/register/` | no |
| `POST` | `/api/v1/auth/login/`    | no |
| `POST` | `/api/v1/auth/refresh/`  | no (send the refresh token in the body) |
| `GET`  | `/api/v1/auth/me/`       | yes |
| `GET`/`PATCH` | `/api/v1/auth/settings/` | yes |
| `GET`  | `/api/v1/openrouter/models/` | no — public catalogue |
| `POST` | `/api/v1/openrouter/chat/`    | yes |
| `GET`  | `/api/v1/openrouter/history/` | yes |

**Register / sign in** — `POST` `{"username": "ada", "password": "…"}` (register also
takes an optional `email`):

```jsonc
{
  "status": 200,
  "message": "Signed in",
  "data": {
    "access": "eyJhbGciOi…",     // send on every request; expires in an hour
    "refresh": "eyJhbGciOi…",    // exchange for a new access token; lasts a week
    "user": { "id": 1, "username": "ada", "email": "", "date_joined": "2026-08-17T07:40:57Z" }
  }
}
```

**Refresh** — `POST /api/v1/auth/refresh/` with `{"refresh": "…"}` returns
`{"data": {"access": "…"}}`. A `401` here means the session is over: sign in again.

**Signing out** is entirely client-side — drop both tokens. There is no server-side
token store, so nothing has to be told.

Wrong password, unknown user, missing token and expired token all come back as `401`
with the reason in `message`. Sign-in, sign-up and refresh are rate limited per IP
(20/min by default) and answer `429` when that is exceeded.

> The deprecated `/api/v1/<vendor>_handler/` chat routes need a token as well —
> they are the same view with a preset model, and inference costs money either way.

---

## 1. List models — `GET /api/v1/openrouter/models/`

Feeds the model picker. Public and cached server-side for 1 hour.

| Query param | Default | Meaning |
|---|---|---|
| `search`    | –       | Case-insensitive substring match on model id and name |
| `free`      | `false` | Only models whose prompt and completion price are both 0 |
| `text_only` | `true`  | Only models that can output text (vision *inputs* are still included) |
| `refresh`   | `false` | Bypass the server cache |

**Response**

```jsonc
{
  "status": 200,
  "message": "Success",
  "data": {
    "count": 413,
    "default_model": "openai/gpt-4o-mini",
    "models": [
      {
        "id": "anthropic/claude-haiku-4.5",       // <- send this as `model`
        "name": "Anthropic: Claude Haiku 4.5",     // <- display this
        "provider": "anthropic",                   // <- good for grouping/icons
        "description": "…",
        "context_length": 200000,
        "max_completion_tokens": 64000,
        "input_modalities": ["text", "image", "file"],
        "output_modalities": ["text"],
        "supported_parameters": ["max_tokens", "temperature", "tools", "…"],
        "pricing": { "prompt": "0.000001", "completion": "0.000005" },  // USD per token, as strings
        "is_free": false
      }
    ]
  }
}
```

Notes for the picker UI:

- `models` comes back sorted by display name.
- Group by `provider` to get the old "ChatGPT / Gemini / Claude / Mistral" tabs back —
  they are just `openai`, `google`, `anthropic`, `mistralai` now.
- `is_free: true` is a nice "Free" badge; there are ~19 such models today.
- Pricing is USD **per token** as a string. Multiply by 1,000,000 for the usual
  "per 1M tokens" display.
- Ids can change over time. Don't hardcode a list — always read it from this endpoint,
  and fall back to `data.default_model` if a stored user preference is no longer present.

---

## 2. Send a chat message — `POST /api/v1/openrouter/chat/`

(`POST /api/v1/openrouter/` is an alias for the same view.)

**Request**

```jsonc
{
  "message": "Explain WebSockets",              // required
  "model": "anthropic/claude-haiku-4.5",        // optional, defaults to data.default_model
  "conversation_id": "5f0f…",                   // optional, omit on the first turn
  "system_prompt": "You are…",                  // optional, overrides the server default
  "use_history": true,                          // optional, default true
  "temperature": 0.7,                           // optional
  "max_tokens": 2048                            // optional
}
```

**Response** — `200`

```jsonc
{
  "status": 200,
  "message": "Success",
  "data": {
    "response": "## WebSockets\n\nA WebSocket is …",   // Markdown, render as before
    "model": "anthropic/claude-haiku-4.5",             // model that actually served it
    "conversation_id": "5f0f…",                        // store and send back on the next turn
    "usage": { "prompt_tokens": 412, "completion_tokens": 380, "total_tokens": 792 },
    "used_own_key": false                              // true when the caller's own key paid
  }
}
```

### Three behaviour changes worth reading

1. **`data.response` is now plain Markdown text.**
   The old handlers forced every model to answer with a JSON object `{"response": "..."}`
   and parsed it server-side. That trick doesn't survive 400 models — many don't support
   structured outputs and would have leaked ` ```json ` fences into your chat bubbles.
   The field name is unchanged, so existing Markdown rendering keeps working.

2. **Conversations now have real memory.**
   `conversation_id` used to be stored and ignored. Now, when you send one back, the
   server replays the last 10 turns of that conversation to the model. Send the
   `conversation_id` you got from the previous response to continue a thread; omit it to
   start a fresh one (the server generates and returns a new UUID). Set
   `"use_history": false` for a genuinely one-off request.

3. **`usage` is new.** Use it if you want to show token counts or cost.

### Full manual control (optional)

If you'd rather own the conversation state client-side, send an OpenAI-style
`messages` array instead. When present it replaces the server-built context entirely:

```jsonc
{
  "message": "…",       // still required — this is what gets logged to history
  "model": "openai/gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a terse assistant." },
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello." },
    { "role": "user", "content": "…" }
  ]
}
```

### Errors

| HTTP | When | `message` |
|---|---|---|
| 400 | `message` missing/empty, or `temperature`/`max_tokens` not numeric | `Bad Request: …` |
| 401 | **No or expired bearer token** — refresh, then retry | `Authentication credentials were not provided.` |
| 402 | Every available OpenRouter key is out of credit | `OpenRouter error: …` |
| 403 | OpenRouter's moderation refused the prompt | `OpenRouter error: …` |
| 404 | The `model` id doesn't exist on OpenRouter | `OpenRouter error: …` |
| 429 | Rate limited upstream | `OpenRouter error: …` |
| 502 / 504 | OpenRouter unreachable, timed out (>120s), or it rejected our key | `OpenRouter error: …` |
| 500 | No OpenRouter key available at all, or an unexpected failure | `Internal Server Error: …` / `OpenRouter error: …` |

Upstream status codes are passed through, so a 402 or 429 is genuinely OpenRouter's and
worth surfacing to the user ("out of credit", "too many requests"). The one exception is
an upstream **401**, which becomes a 502: a rejected OpenRouter key is not the client's
session going stale, and a client that treats every 401 as "refresh my token" must not be
told otherwise. Nothing is written to history when a request fails.

---

## 3. History — `GET /api/v1/openrouter/history/`

| Query param | Default | Meaning |
|---|---|---|
| `conversation_id` | – | Only this thread |
| `model` | – | Only rows served by this exact model id |
| `limit` | `100` | Max 500 |
| `offset` | `0` | Pagination offset |

```jsonc
{
  "status": 200,
  "message": "Success",
  "data": {
    "count": 132,          // total matching rows, not the page size
    "limit": 100,
    "offset": 0,
    "results": [           // newest first
      {
        "id": 13,
        "prompt": "Hello",
        "response": "Hello! How can I help you today?",
        "conversation_id": "81146677-…",
        "model_name": "openai/gpt-4o-mini",
        "created_at": "2025-05-29T17:08:45.463267Z"
      }
    ]
  }
}
```

To rebuild a thread in the UI: `?conversation_id=<id>` and reverse the list.

**History is per account.** Only rows belonging to the bearer token's user come back,
and a `conversation_id` from somebody else's thread returns nothing rather than their
conversation. Rows written before accounts existed have no owner and are no longer
served to anyone.

**Your existing history data was migrated** into the new table, timestamps intact. Rows
created before this change carry the old display names in `model_name` (`ChatGPT`,
`claude`, `gemini`, `Mistral`); new rows carry real OpenRouter ids
(`openai/gpt-4o-mini`). Treat `model_name` as a label, not a key — if you filter by
`?model=`, expect old rows not to match.

---

## 4. Settings — `GET`/`PATCH` `/api/v1/auth/settings/`

Where a user hands over their own OpenRouter key, so their chats keep working when the
server's key runs out of credit.

```jsonc
// GET
{
  "status": 200,
  "message": "Success",
  "data": {
    "has_own_key": true,
    "key_hint": "9f3a",        // last four characters of the saved key
    "prefer_own_key": false,   // false: only used once the server's key fails
    "updated_at": "2026-08-17T08:12:03Z"
  }
}
```

`PATCH` accepts either field, and only changes what it is sent:

```jsonc
{
  "openrouter_key": "sk-or-v1-…",   // "" removes the saved key
  "prefer_own_key": true            // rejected with 400 if no key is saved
}
```

The key is **write-only** — it is stored encrypted and never returned, so the UI shows
`key_hint` and offers an empty field for replacing it. A new key is checked against
OpenRouter before it is saved: a rejected key is a `400` here rather than a failed chat
later, and a successful save adds `data.key_check` with OpenRouter's own view of it
(`label`, `usage`, `limit`, `limit_remaining`, `is_free_tier`).

Which key pays for a chat:

| Situation | Key used |
|---|---|
| No key saved | the server's |
| Key saved, `prefer_own_key: false` | the server's, falling back to theirs on `401/402/429` |
| Key saved, `prefer_own_key: true` | theirs, falling back to the server's |

A `400` from OpenRouter (bad model, malformed request) is *not* retried with the other
key — nothing about it would change. The chat response says which key paid via
`used_own_key`.

---

## Legacy endpoints

These still work and are unchanged in shape. Each is pinned to one model:

| Old endpoint | Now calls |
|---|---|
| `POST /api/v1/gpt_handler/` | `openai/gpt-4o-mini` |
| `POST /api/v1/gemini_handler/` | `google/gemini-2.5-flash` |
| `POST /api/v1/claude_handler/` | `anthropic/claude-haiku-4.5` |
| `POST /api/v1/mistral_handler/` | `mistralai/mistral-large` |
| `GET /api/v1/gpt_handler/history/` | Same bare-array `data` as before |

They accept `message` + `conversation_id` and return `data.response` exactly as before.
Two of them are on newer models than the originals (`claude-3-5-haiku` and
`gemini-2.0-flash-exp` are retired); the backend can repoint them via env vars without a
frontend change.

**Please migrate to `/api/v1/openrouter/`** — these paths are deprecated and only exist
so the switchover isn't a hard cutover.

---

## Suggested migration path

1. Point the existing chat call at `POST /api/v1/openrouter/chat/`, sending
   `model` from wherever the user's provider choice lives today. Everything else in your
   code stays the same — `data.response` is still Markdown.
2. Swap the hardcoded 4-provider selector for a picker populated from
   `GET /api/v1/openrouter/models/`. Persist the chosen `model` id in local storage.
3. Start round-tripping `conversation_id` to get multi-turn memory.
4. Switch the history view to `/api/v1/openrouter/history/` and read `data.results`
   instead of `data`.

### Minimal TypeScript client

```ts
const API = `${import.meta.env.VITE_API_URL}/api/v1/openrouter`;

export type Model = {
  id: string; name: string; provider: string; description: string;
  context_length: number | null; is_free: boolean;
  pricing: { prompt: string | null; completion: string | null };
};

export async function listModels(search = ""): Promise<Model[]> {
  const res = await fetch(`${API}/models/?search=${encodeURIComponent(search)}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message);
  return body.data.models;
}

export async function sendMessage(opts: {
  message: string; model?: string; conversationId?: string | null;
}) {
  const res = await fetch(`${API}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Required: chat is per account. On 401, refresh once, then retry.
      Authorization: `Bearer ${localStorage.getItem("chattydesk.accessToken")}`,
    },
    body: JSON.stringify({
      message: opts.message,
      model: opts.model,
      conversation_id: opts.conversationId ?? undefined,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message);          // surface OpenRouter errors verbatim
  return body.data as {
    response: string; model: string; conversation_id: string;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
}
```

---

## Things to know

- **Latency varies a lot by model.** A big reasoning model can take 60s+ where
  `gpt-4o-mini` takes 2s. Keep the send button disabled and the spinner up; the server
  gives up at 120s (gunicorn at 180s). Consider warning the user on models with high
  `pricing` or huge `context_length`.
- **No streaming yet.** Responses arrive in one piece. OpenRouter supports SSE and the
  backend can add a `/chat/stream/` endpoint if you want token-by-token rendering — it
  needs a gunicorn worker-class change on the server, so ask before building UI for it.
- **Model availability shifts.** A model in your cache today can disappear next month;
  handle a 404 from `/chat/` by re-fetching the catalogue and falling back to
  `default_model`.
- **`text_only=true` is the default** and keeps image-generation models out of the
  picker. Vision models (image *input*) are included — but this API only accepts text
  prompts today, so image upload would need a backend change.
- **CORS** is currently open (`CORS_ALLOW_ALL_ORIGINS = True`), unchanged from before.
