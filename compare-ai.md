# Compare AI — plan

A new **Compare** page: one prompt, answered by 2–5 models from the OpenRouter
catalogue, shown side by side in a row. Linked from the chat navbar.

Signed-in only (inference costs money), same gate as `/chat`.

---

## Behaviour

1. User opens **/compare** (link in the chat navbar).
2. Page starts with **2 slots**; each slot is a model selector from the
   OpenRouter catalogue (same data as the sidebar picker).
3. `+` adds a slot (up to **5**), `−` removes one (down to **2**). Slot order is
   the display order, left to right.
4. One query input. Enter sends the **same prompt** to every slot's model.
5. Responses render **side by side in a row** — one column per model. Each
   column: mono model id header, response body (markdown, same rendering as
   chat), mono footer with `tokens · duration · your key` when applicable.
6. A single model failing (402 out of credit, 429, moderation refusal) shows an
   error block in **that column only**; the other columns still render.
7. Nothing is written to chat history. Compare is ephemeral (v1).

Out of scope for v1: streaming, follow-ups/threading, persisting compares.

---

## Backend — `chattydesk_backend`

### 1. `openrouter_handler/views.py` — add `CompareModels(APIView)`

`POST /api/v1/openrouter/compare/`

- **Request**: `{ "message": str, "models": [ids, …], "system_prompt"?, "temperature"?, "max_tokens"? }`
  - `message` required, non-blank (same rule as `GenerateChat`).
  - `models` must be a list of **2–5** ids → else `400`.
- **Per model**: reuse the existing `_complete(messages, _api_keys_to_try(user), model=…)`
  — the server/user key fallback works for each slot for free. Messages built
  once from the prompt (no history — `use_history` is irrelevant here).
- **Parallelism**: run the N upstream calls with
  `concurrent.futures.ThreadPoolExecutor` (max_workers = N, cap 5) so wall-clock
  ≈ slowest model, not the sum. Measure `time.perf_counter()` around each call
  for `duration_ms`.
- **Per-slot errors**: catch `OpenRouterError` per future; a slot that fails
  returns `{ model, error }` instead of crashing the request. If **all** slots
  fail, return the first error's status (e.g. 502) so the UI has something to
  say; otherwise 200 with mixed results.
- **Response**:
  ```json
  {
    "data": {
      "prompt": "…",
      "results": [
        {
          "model": "anthropic/claude-3.5-sonnet",
          "response": "…",            // absent when error is set
          "usage": { "total_tokens": … },
          "used_own_key": true,
          "duration_ms": 2140,
          "error": null                // "OpenRouter error: …" when it failed
        }
      ]
    }
  }
  ```
- **No `HistoryPrompt.objects.create`** — compares don't pollute the history
  sidebar. (Revisit if users ask for compare history.)

### 2. `openrouter_handler/urls.py`

```python
path("compare/", CompareModels.as_view(), name="openrouter-compare"),
```

No new models, no migrations.

---

## Frontend — `chattydesk`

### 3. `src/interface.ts` — types

```ts
export interface CompareResult {
  model: string;
  response?: string;
  usage?: { total_tokens?: number };
  used_own_key?: boolean;
  duration_ms?: number;
  error?: string;
}
export interface CompareResponse {
  prompt: string;
  results: CompareResult[];
}
```

### 4. `src/services/services.ts` — `compareModels`

```ts
const compareModels = async (message: string, models: string[]): Promise<CompareResponse>
// POST `${openRouterURL}/compare/`, same envelope + toApiError handling as sendMessage.
```

No client timeout (same reasoning as `sendMessage`: slowest model wins, server
gives up at 120s per call).

### 5. `src/renderer/App.tsx` — route

```tsx
<Route path="/compare" element={<RequireAuth><Compare /></RequireAuth>} />
```

### 6. `src/renderer/components/NavBar.tsx` — link

Add a **Compare** entry (new `IconCompare` + mono label) next to the Settings
icon button. Only meaningful signed-in — NavBar already only renders behind the
gate.

### 7. `src/renderer/components/icons.tsx` — `IconCompare`

Hand-rolled like the rest: 24×24, 1.5 stroke, round caps — two side-by-side
columns of different heights (a "split view" glyph).

### 8. `src/renderer/pages/Compare.tsx` — the page

Paper/ink design language, same as the rest:

- **Header**: slim, `border-b-2 border-ink`, serif wordmark, "back to chat" link.
- **Controls strip** (mono): `01–NN — pick the panel` with one select per slot
  (`<select>` with `<optgroup>` per provider, from `services.listModels()`),
  plus `+ add` (hidden at 5) and `− remove` (hidden at 2). Default slots:
  `default_model` + the first free model in the catalogue. Duplicates allowed —
  two columns of the same model are two independent samples.
- **Query input**: identical compose box to Chatbot (border-2 ink, hard offset
  shadow, Enter to send, mono kbd hints) with a "Compare" send button. Disabled
  until the catalogue has loaded and 2+ slots are chosen.
- **Results grid**: one column per slot, `divide-x divide-hairline`,
  `lg:grid-cols-{n}` matched to slot count (2 → `sm:grid-cols-2` … 5 →
  `lg:grid-cols-5`), wrapping on narrow screens. Column anatomy (echoes the bot
  message style):
  - mono uppercase model id header,
  - `border-l-2 border-rust pl-4` response block with `.chat-markdown`,
  - mono footer `1,204 tok · 2.14s · your key`,
  - error state: ember-soft block with the message.
- **Loading**: all slots spin (`border-ink/20 border-t-rust`) with
  `streaming from {model}…` until the single response returns.
- **Empty state**: mono label `compare — one prompt, many models`, serif heading
  "Ask once. Read five answers."
- `usePageMeta({ title: 'Compare · ChattyDesk', path: '/compare', noindex: true })`.

### 9. Tests — `src/__tests__/Compare.test.tsx`

Mock `services.listModels`/`compareModels`:
- renders with 2 default slots; `+` grows to 5 and then disappears; `−` shrinks
  to 2 and then disappears;
- sending one prompt renders one column per slot, with the model id per column;
- a per-slot `error` renders the error block in that column while others render.

---

## Order of work

1. Backend view + URL (can be verified alone with curl against the dev server).
2. Types + service method.
3. Icon + navbar link + route.
4. `Compare.tsx` page.
5. Tests, `npm run lint`, `npx tsc --noEmit` (known pre-existing
   glob/minimatch noise), `npx jest --runInBand`.

## Notes / decisions worth confirming

- **No history writes** for compares (v1) — keeps the history sidebar clean.
- **Duplicates allowed** — useful for sampling variance; trivially disallowable
  in the view if unwanted.
- **Single-shot response, no streaming** — results arrive when the slowest
  model finishes. A v2 with per-slot SSE streaming is possible but touches the
  request/response machinery.
- Costs scale with slot count; the existing key fallback logic already covers
  "server key runs out mid-compare" per slot.
