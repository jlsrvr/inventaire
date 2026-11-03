# Inventaire — offline-first inventory PWA

## What this is

Inventory app for a holiday home with no network coverage. Works fully offline,
syncs when signal returns, several people use it independently.

## Stack

- Client: Vite + React + TypeScript, `vite-plugin-pwa` (registerType: 'prompt')
- Local storage: Dexie (IndexedDB), `dexie-react-hooks` / `useLiveQuery`
- Server: FastAPI + SQLite, Pydantic models
- Types: generated from the server's OpenAPI schema via `openapi-typescript` —
  never hand-written on the client
- Tests: pytest server-side, Vitest client-side

Deliberately NOT using TanStack Query. IndexedDB is the source of truth here and the server is a peer, not an origin. Don't suggest it.

## Data model

Single `items` table:

| field        | notes                                              |
|--------------|----------------------------------------------------|
| `id`         | uuid, **generated client-side** (makes push idempotent) |
| `name`       | text, editable                                     |
| `category`   | slug from a code-defined list, editable, defaults to `other` |
| `quantity`   | number ≥ 0, decimals allowed (1.5 kg), kept to 3 places |
| `unit`       | text, optional ("bouteilles", "kg")                |
| `updated_at` | client clock — decides **which write wins**. Always tz-aware; stored/returned as UTC `YYYY-MM-DDTHH:MM:SS.sssZ` (= JS `toISOString()`) |
| `updated_by` | first name, captured once at enrolment             |
| `seq`        | server-assigned counter — decides **what a client has seen** |

`updated_at` and `seq` are two different fields doing two different jobs. Never
collapse them.

## Design decisions already made — challenge them only with a concrete reason

- **No delete.** Items are set to quantity zero. Zeros double as a shopping list.
- **Name is editable** — that's how typos get fixed, instead of archiving.
- **Per-item last-write-wins** on `updated_at`. No event log, no CRDT. Concurrent
  edits are near-impossible in this deployment.
- **Cursor is a `seq`, never a timestamp.** Timestamps tie and lose writes.
- **Locations deferred.** Nullable column later, non-breaking.
- **Shared passphrase → long-lived token → Bearer on `/sync`.** Real gate on the
  server, deliberately none offline (the app must never refuse to open offline).
- **Duplicate items are tolerated**, prevented by search-first UI rather than by
  merge logic.

## Sync protocol

`POST /sync` — `{ since: seq, changes: [...] }` → `{ cursor, changes, rejected }`

Server, one `BEGIN IMMEDIATE` transaction: upsert each pushed row by `id`, reject as
stale if stored `updated_at` >= incoming, assign next `seq` to accepted rows, **then**
select `seq > since` **plus every rejected id**. Order matters — clients get the
canonical version of their own writes back, and the winner of every rejected write,
so the client merge has no special cases. A `since` ahead of the server's max seq
(DB restored from backup) is treated as 0. Max 500 changes per request.

Client, one IndexedDB transaction: apply changes, clear only the outbox rows
snapshotted before the request, save cursor last. The client never compares
timestamps: a returned row replaces the local one unless the local row is dirty and
no longer the exact version that was sent (edited while the request was in flight).

## Running locally

Backend: `cd backend && INVENTAIRE_DEV=1 uv run uvicorn main:app --reload`.
Without `INVENTAIRE_DEV=1` the server refuses to start unless `INVENTAIRE_PASSPHRASE`
and `INVENTAIRE_TOKEN` are set — no silent `chalet` fallback in production.
After changing server models, regenerate client types (`npm run gen:types`).

## Conventions

- **UI is in French.** All user-facing strings live in one `strings.ts`.
- **Search must be accent and case-insensitive.** Store a normalised `search_name`
  alongside `name`: `s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()`.
  Never display the normalised form.
- Sort with `localeCompare(a, b, 'fr')`.
- Category slugs are ASCII; French labels come from a lookup. The slug list lives in
  `frontend/src/lib/categories.ts` **and** the `Category` literal in
  `backend/models.py` — add a slug to both, deploy the server first.
- Keep the bundle small — first load may happen on weak signal.
