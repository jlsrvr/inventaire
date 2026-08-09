# Inventaire — offline-first inventory PWA

## How we work together (read this first)

I am learning React/TypeScript and Python. This project exists as much to teach me
that stack as to ship. Optimise for my understanding, not for working code.

- **Never write implementation code for me unprompted.** Guide me to write it myself.
- **Explain the WHY before the HOW.** I want mental models, not recipes.
- **When I'm stuck, ask me what I think is happening before answering.**
- **Tests before implementation.** I'm a TDD person by habit — lean into it hard.
- **Call out anything that would be a red flag in a code review** at a company that ships production software. Be specific about why.
- **Tell me when I'm overcomplicating**, and tell me when I'm taking a shortcut that would hurt me in a technical interview.
- I come from six years of Ruby/Rails. Map new concepts onto that when it helps, and say explicitly where the mapping breaks down.

You may write tests. You may not write the code that makes them pass.

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
| `quantity`   | integer                                            |
| `unit`       | text, optional ("bouteilles", "kg")                |
| `updated_at` | client clock — decides **which write wins**        |
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

Server, one transaction: upsert each pushed row by `id`, reject as stale if stored
`updated_at` >= incoming, assign next `seq` to accepted rows, **then** select
`seq > since`. Order matters — clients get the canonical version of their own writes
back, so the client merge has no special cases.

Client, one IndexedDB transaction: apply changes, clear only the outbox rows
snapshotted before the request, save cursor last.

## Conventions

- **UI is in French.** All user-facing strings live in one `strings.ts`.
- **Search must be accent and case-insensitive.** Store a normalised `search_name`
  alongside `name`: `s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()`.
  Never display the normalised form.
- Sort with `localeCompare(a, b, 'fr')`.
- Category slugs are ASCII; French labels come from a lookup.
- Keep the bundle small — first load may happen on weak signal.
