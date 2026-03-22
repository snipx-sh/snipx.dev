<!-- =========================================================
     SNIPX — HANDOFF PACK
     snipx.sh / snipx.dev
     Contains: PRD · README · AGENTS · PLAN · HANDOFF PROMPT
     Split each section into its own file before use.
     ========================================================= -->

<!-- =========================================================
     NOTE FOR ANY AGENT OR COLLABORATOR READING THIS:

     Two things that must survive every session:

     1. PROSE STYLE — write in plain, direct prose throughout.
        No theatrical pivots, no "X — they're actually Y" reframes,
        no dramatic setups before a point. Just say the thing.
        The Core Pain section of the vision checkpoint is the
        target register. When in doubt, write shorter and flatter.

     2. SCOPE DISCIPLINE — the v1 implementation plan (Phase 0-6)
        is fixed. The longer-term vision (doc ingestion, interactive
        tutorials, speed runs) lives in P2 and must not bleed into
        the current phases. "Gently interspersed" means the vision
        sharpens the language and direction of v1 without adding
        scope, restructuring phases, or over-promising on launch.
     ========================================================= -->

---

# FILE: PRD.md

# snipx — Product Requirements Document

**Version:** 1.0.0
**Status:** Ready for Implementation
**Owner:** Daniel Bodnar (daniel@bodnar.sh)
**Domain:** snipx.sh / snipx.dev
**Binary:** `snipx`
**Repo:** github.com/danielbodnar/snipx

---

## Vision

Learning is becoming increasingly difficult as the rate of technology accelerates. Every new language, framework, and CLI comes with its own DSL, schema, flags, and grammar, increasing both the surface area and cognitive burden beyond what any individual can absorb. The instinctive response is hoarding — bookmarks, stars, open tabs — an accumulation of declarative knowledge that never converts into capability. You end up familiar with tools without having internalized them.

snipx is a local-first developer knowledge manager that starts to close that gap. It gives developers fast, keyboard-driven access to their own snippets, documentation references, and bookmarks — reducing retrieval friction enough that the things you've learned stay reachable, and the things you're learning have somewhere useful to land.

The longer arc of the project is a system that moves knowledge from collection through to muscle memory: curated, dependency-ordered learning paths; auto-generated interactive tutorials built from real documentation; and progressive speed-run drills that strip away scaffolding until syntax becomes reflex. v1 lays the foundation. Every design decision should be made with that pipeline in mind.

The guiding philosophy throughout is **Sane Defaults**: be thin glue, align with the upstream platform, never compete with it. Data lives in native formats. The app is a viewer and organizer, not a walled garden.

---

## Target Users

- Principal/Staff engineers and SREs managing large personal knowledge bases
- Developers who live in the terminal and want fast, keyboard-driven access to their own references without leaving the shell
- Nushell users who want completions-backed snippet retrieval from within scripts and pipelines

---

## Core Concepts

| Concept    | Description |
|------------|-------------|
| Snippet    | A named, tagged block of code with a language, category, and optional description |
| Doc        | A saved reference to external documentation with topic tags, notes, and a URL |
| Bookmark   | A saved URL (article, repo, tool, reference) with category, tags, date, and notes |
| Tag        | Arbitrary lowercase string. Applied to any item type. Powers search and completions |
| Collection | A named group of items (future scope, v2) |

---

## Feature Requirements

### P0 — Launch Blockers

- [ ] Snippet CRUD with language, category, tag, description, code body
- [ ] Doc entry CRUD with URL, language, category, topics, tags, personal notes
- [ ] Bookmark CRUD with URL, category, tags, date added, personal notes
- [ ] Full-text + tag search across all three types simultaneously
- [ ] Syntax-highlighted code viewer (shiki, Tokyo Night theme)
- [ ] Copy-to-clipboard from viewer
- [ ] Favorite / star any item
- [ ] Persistent local storage (SQLite via `bun:sqlite`, single `snipx.db` file)
- [ ] HTTP API server (Hono + Bun, runs as Tauri sidecar on `localhost:7878`)
- [ ] Nushell completions module (`snipx.nu`) that queries the API
- [ ] REPL panel with command history, arrow-key navigation, and all CRUD commands

### P1 — High Value

- [ ] Import from JSON / TOML / CSV
- [ ] Export to JSON / TOML / Markdown
- [ ] Keyboard-only navigation (Vim-style `j`/`k` in list, `/` to search, `Enter` to open)
- [ ] `snipx` CLI binary installable via `cargo install` or `bun run build`
- [ ] Tag autocomplete in add/edit form
- [ ] Bulk tag operations (add/remove tag across multiple items)
- [ ] Configurable storage path via `~/.config/snipx/config.toml`

### P2 — Future Scope

- [ ] Doc corpus ingestion — automatic downloading, parsing, and vectorization of official docs, API schemas, and tree-sitter / pest grammars into a local index that feeds search, completions, and later the tutorial layer
- [ ] Auto-generated interactive tutorials — extract and sequence every code example from an ingested doc corpus into a typing interface where the learner produces each example rather than reads it; completed examples are saved directly to the snippet library
- [ ] Progressive speed-run challenges — run tutorial content at increasing difficulty levels, stripping scaffolding (ghost text, completions, par time) with each pass until the learner can execute from a blank file with no assistance; applies to Vim motions, shell patterns, CLI flags, Nushell pipelines, and any other learnable motor pattern
- [ ] Whole-file ghost text — project-aware inline suggestions that model what the entire file should become, not just the next token; accuracy grounded in the ingested doc corpus for the specific library version in use
- [ ] Collections / folders
- [ ] Git-backed sync (push/pull `snipx.db` or export folder to a bare repo)
- [ ] Shared team collections over a self-hosted API
- [ ] MCP server exposing snippets as tools for Claude/LLM agents
- [ ] Cloudflare Workers deployment of the API for cross-device sync
- [ ] VS Code / Neovim plugin (reads from the same API)

---

## Architecture

```
snipx/
├── src-tauri/          # Rust — Tauri v2 app shell + sidecar bridge
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs # Tauri IPC commands (thin — delegate to API)
│   │   └── db.rs       # rusqlite schema + migrations
│   └── Cargo.toml
├── src/                # TypeScript — React frontend (Vite + Tauri plugin)
│   ├── app.tsx
│   ├── components/
│   ├── hooks/
│   └── lib/
│       ├── api.ts      # Typed API client (fetch + Zod)
│       ├── theme.ts    # Tokyo Night color tokens (T object)
│       └── types.ts    # Shared Zod schemas + inferred types
├── api/                # Bun + Hono — HTTP API (also runs as sidecar)
│   ├── index.ts
│   ├── routes/
│   │   ├── snippets.ts
│   │   ├── docs.ts
│   │   └── bookmarks.ts
│   └── db.ts           # bun:sqlite schema, migrations, query functions
├── nu/                 # Nushell completions + CLI module
│   ├── snipx.nu        # `use snipx.nu *` drops all commands into scope
│   └── completions.nu  # custom completions backed by API
├── docs/
└── tests/
```

### Data Flow

```
Nushell shell  -->  snipx.nu module  -->  HTTP API (localhost:7878)
Tauri frontend -->  Tauri IPC        -->  HTTP API (localhost:7878)
snipx CLI      -->  HTTP API (localhost:7878)
                                          |
                                    SQLite (snipx.db)

Future (P2):
Doc corpus  -->  ingestion pipeline  -->  local vector index
                                          |           |
                                    completions   tutorial generator
                                                      |
                                              snippet library
```

The API is the single source of truth. The Tauri shell is a thin wrapper. Nushell talks directly to the API. The app works headlessly — the API can run as a systemd user service with no GUI.

---

## API Specification

Base URL: `http://localhost:7878/api/v1`

### Snippets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/snippets` | List all. Query: `?q=`, `?lang=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/snippets/:id` | Get one |
| POST | `/snippets` | Create |
| PATCH | `/snippets/:id` | Update |
| DELETE | `/snippets/:id` | Delete |

### Docs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | List all. Query: `?q=`, `?lang=`, `?cat=`, `?topic=`, `?tag=` |
| GET | `/docs/:id` | Get one |
| POST | `/docs` | Create |
| PATCH | `/docs/:id` | Update |
| DELETE | `/docs/:id` | Delete |

### Bookmarks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bookmarks` | List all. Query: `?q=`, `?cat=`, `?tag=`, `?fav=true` |
| GET | `/bookmarks/:id` | Get one |
| POST | `/bookmarks` | Create |
| PATCH | `/bookmarks/:id` | Update |
| DELETE | `/bookmarks/:id` | Delete |

### Shared

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=` | Search across all three types |
| GET | `/tags` | All unique tags with counts |
| GET | `/health` | `{ ok: true, version: "..." }` |

### Request/Response Shape (Snippet)

```typescript
// POST /api/v1/snippets
{
  title:    string,       // required, max 120
  code:     string,       // required
  lang:     SnipxLang,    // "nushell" | "bash" | "rust" | "typescript" | ...
  cat:      string,       // required
  tags:     string[],     // optional, default []
  desc:     string,       // optional
  fav:      boolean,      // optional, default false
}

// Response (all endpoints)
{
  id:       string,       // nanoid
  ...fields,
  created:  string,       // ISO 8601
  updated:  string,       // ISO 8601
}
```

---

## Nushell Integration

The `nu/snipx.nu` module exposes these commands with full tab-completion backed by the live API:

```nushell
snipx list                          # list all snippets as table
snipx list --lang rust              # filter by language
snipx get <id>                      # print code to stdout (pipeable)
snipx add                           # interactive add prompt
snipx copy <id>                     # copy code to clipboard via xclip/pbcopy
snipx search <query>                # search all types, return structured table
snipx docs list                     # list docs
snipx docs open <id>                # open URL in browser
snipx bm list                       # list bookmarks
snipx bm open <id>                  # open URL in browser
snipx tags                          # list all tags with counts
```

`snipx get <id>` piping to stdout makes snippets composable:

```nushell
snipx get nu-pipeline | save my-script.nu
snipx get rs-axum-handler | pbcopy
snipx list --lang nushell | where fav == true | get id | each { snipx get $in }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 |
| Frontend | React 19, Vite, TypeScript strict |
| Styling | Inline styles, Tokyo Night palette (no CSS framework) |
| Syntax highlight | shiki (WASM, lazy-loaded per language) |
| API server | Bun + Hono |
| Validation | Zod (shared between frontend and API) |
| Database | SQLite via `bun:sqlite` (API) + `rusqlite` (Tauri commands) |
| CLI / shell | Nushell module (`snipx.nu`) |
| Build tooling | Bun (JS/TS), Cargo (Rust), mise for toolchain |
| Config | `~/.config/snipx/config.toml` (TOML, serde) |

---

## Non-Goals for v1

- No cloud sync (local-first only)
- No team or multi-user features
- No AI-powered features — the doc corpus, tutorial generator, and ghost text layer are P2; v1 is purely a knowledge manager and retrieval tool
- No Electron (Tauri only)
- No CSS framework (styled inline, Tokyo Night tokens in `src/lib/theme.ts`)

---
---

# FILE: README.md

# snipx

> A local-first, keyboard-driven developer knowledge manager.
> Snippets, docs, and bookmarks — searchable from your shell.

**snipx.sh** · **snipx.dev**

![version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square&color=7aa2f7)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square&color=9ece6a)
![tauri](https://img.shields.io/badge/tauri-v2-orange?style=flat-square&color=ff9e64)
![bun](https://img.shields.io/badge/bun-1.1+-yellow?style=flat-square&color=e0af68)

---

## What it is

snipx is a desktop app and CLI for developers who accumulate a lot of knowledge and need it to stay reachable. It stores code snippets, documentation references, and bookmarks in a single local SQLite file, and surfaces them through a fast three-pane interface and a Nushell module with tab-completion backed by a local API.

The immediate problem it solves is retrieval friction — the gap between knowing something exists and being able to reach it without breaking flow. The longer arc is a system that moves knowledge from collection through to muscle memory, via auto-generated interactive tutorials and progressive speed-run drills built from the same doc corpus. That's where this is heading.

- **Snippets** — syntax-highlighted code blocks with language tagging, categories, and copy-to-clipboard
- **Docs** — saved documentation references with topic tags and personal notes
- **Bookmarks** — articles, repos, and tools with date tracking and annotations
- **REPL** — an in-app terminal for querying and managing your library with command history
- **Nushell module** — `use snipx.nu *` brings your entire library into your shell with tab-completion

No cloud. No account. No subscription.

---

## Install

### Prerequisites

- [Rust](https://rustup.rs/) stable
- [Bun](https://bun.sh/) >= 1.1
- [mise](https://mise.jdx.dev/) (recommended for toolchain management)
- Tauri v2 CLI: `cargo install tauri-cli --version "^2"`

### Build from source

```bash
git clone https://github.com/danielbodnar/snipx
cd snipx
bun install
cargo tauri build
```

### Run in development

```bash
bun run dev          # starts Vite + Tauri in watch mode
bun run api:dev      # starts the Hono API server standalone (port 7878)
```

### Nushell module

```nushell
# In your config.nu or env.nu:
use ~/.config/snipx/snipx.nu *
```

---

## Usage

### Desktop app

```bash
snipx-app     # if installed to PATH, or launch from applications menu
```

### CLI

```bash
snipx list                     # table of all snippets
snipx list --lang rust         # filter by language
snipx get nu-pipeline          # print code to stdout
snipx get nu-pipeline | pbcopy # copy to clipboard
snipx search "axum handler"    # search all types
snipx add                      # interactive add wizard
snipx docs open doc-hono       # open a doc in the browser
snipx bm open bm-mise          # open a bookmark in the browser
snipx tags                     # all tags with counts
```

### REPL (in-app)

Toggle with the REPL button or `Ctrl+\``. Type `help` for all commands.

---

## Configuration

`~/.config/snipx/config.toml`:

```toml
[api]
port = 7878
host = "127.0.0.1"

[storage]
db_path = "~/.local/share/snipx/snipx.db"

[ui]
theme = "tokyo-night"
default_lang = "nushell"
```

---

## Data

snipx stores everything in a single SQLite file at `~/.local/share/snipx/snipx.db`.
Back it up like any file. Export at any time:

```bash
snipx export --format json > snipx-backup.json
snipx import snipx-backup.json
```

---

## Architecture

```
Tauri desktop app  (React + Vite)
        |
        v
  Hono API server  (Bun, localhost:7878)
        |
        v
    SQLite DB  (~/.local/share/snipx/snipx.db)
        ^
        |
  snipx.nu module  (Nushell, tab-complete backed)
```

---

## Stack

Tauri v2 · React 19 · TypeScript strict · Bun · Hono · Zod · SQLite · Nushell · shiki

---

## License

MIT — Daniel Bodnar (daniel@bodnar.sh)

---
---

# FILE: AGENTS.md

# AGENTS.md — Claude Code Agent Instructions for snipx

This file tells Claude Code (and any other AI coding agent) how to work in this repository. Read it fully before making any changes.

---

## Project overview

snipx is a local-first developer knowledge manager. Binary: `snipx`. Domains: snipx.sh / snipx.dev.

It has four layers:

1. **API** (`api/`) — Bun + Hono HTTP server, the single source of truth, talks to SQLite
2. **Frontend** (`src/`) — React + TypeScript, talks to the API via typed fetch client
3. **Tauri shell** (`src-tauri/`) — thin Rust wrapper, window management + sidecar launch
4. **Nushell module** (`nu/snipx.nu`) — completions backed by the API

Always ask: which layer does this change belong to? Keep layers thin. The API layer owns data. The frontend owns UI state only.

---

## Prose and communication style

When writing documentation, comments, UI strings, commit messages, or any other human-readable text in this repo, write in plain direct prose. No theatrical pivots, no "X — they're actually Y" reframe constructions, no dramatic setups before a point. Just say the thing. The vision statement in PRD.md is the target register. When in doubt, write shorter and flatter.

This applies to inline code comments, error messages, README copy, and any documentation you generate. It does not affect code style.

---

## Non-negotiable conventions

### Philosophy: Sane Defaults

> Align with the upstream platform. Be thin glue. Don't compete. Data is data — store it in native formats.

- Never add abstraction for its own sake
- Prefer the platform's own primitives (SQLite, HTTP, filesystem) over invented ones
- If a request contradicts this philosophy, stop and ask before proceeding

### Naming

- Binary, CLI commands, module file, repo, and config directory are all `snipx`
- Module file: `nu/snipx.nu` — all Nushell commands are subcommands of `snipx`
- Config dir: `~/.config/snipx/`
- Data dir: `~/.local/share/snipx/`
- Database file: `snipx.db`
- Tauri app name: `snipx`
- Never write "SNIPX" in all-caps in UI strings — use `snipx` lowercase everywhere except the in-app wordmark which uses `SNIPX` in the header only

### Code style

- **TypeScript**: strict mode, no `any`, Zod for all I/O boundaries, infer types from schemas
- **Rust**: idiomatic, safe, no `unwrap()` in production paths — use `?` and proper error types
- **Nushell**: kebab-case commands, snake_case variables, SCREAMING_SNAKE_CASE env vars
- **No em-dashes** anywhere in code, comments, docs, or UI strings. Use ` - ` or restructure
- Max 2 positional params in Nushell commands, rest as flags
- Nushell shebangs: `#!/usr/bin/env -S nu --stdin`

### Formatting

- 2-space indent everywhere (TS/JS/Nu), 4-space for Rust
- No trailing whitespace, trailing newline on all files

### Imports

- TypeScript: named imports only, no default imports from library code
- Avoid barrel files — import directly from source

---

## File layout rules

```
api/routes/       One file per resource (snippets.ts, docs.ts, bookmarks.ts)
api/db.ts         Schema, migrations, all query functions — no SQL elsewhere
src/components/   One component per file, PascalCase filename
src/hooks/        One hook per file, camelCase with "use" prefix
src/lib/api.ts    Typed API client ONLY — no business logic
src/lib/theme.ts  Tokyo Night color tokens — the T object, canonical
src/lib/types.ts  Zod schemas + inferred types — shared source of truth
nu/snipx.nu       Single module file — all commands, completions, helpers
```

---

## Database rules

- Schema lives in `api/db.ts` only — no inline SQL anywhere else
- All migrations are append-only numbered functions: `migrate_001`, `migrate_002`, etc.
- Every table has `id TEXT PRIMARY KEY` (nanoid), `created TEXT`, `updated TEXT` (ISO 8601)
- Tags are stored as a JSON array string in a `tags TEXT` column — no join table for v1
- Never use an ORM — raw `bun:sqlite` prepared statements only

---

## API rules

- All routes in `api/routes/`, registered in `api/index.ts`
- Every handler uses `zValidator` for request bodies
- Every handler returns `c.json(...)` — no raw `Response` construction
- Errors: `c.json({ error: "message" }, statusCode)`
- 404 for unknown IDs, 400 for validation failures, 500 for unexpected errors
- No authentication in v1 — API binds to `127.0.0.1` only

---

## Frontend rules

- No CSS framework — Tokyo Night color tokens are in `src/lib/theme.ts` as `const T`
- All layout uses inline styles. No Tailwind, no CSS modules, no styled-components
- All API calls go through `src/lib/api.ts` — components never call `fetch` directly
- Use React Query (`@tanstack/react-query`) for server state, `useState` for local UI state
- No `useEffect` for data fetching — use React Query
- Use `window.innerHeight` for layout height, never `100vh`
- Components are pure functions — no class components

---

## Nushell module rules

- Module must work with Nushell >= 0.110.0
- All exported commands are subcommands of `snipx` (e.g., `def "snipx list" []`)
- HTTP calls use `http get`/`http post` with structured result parsing
- Completions use `@` closure syntax pointing to a function that queries the API
- Boolean flags must not have `: bool` annotation or `= false` default
- Use `each` not `for` when a return value is needed from a loop
- Error handling: `error make { msg: "...", label: { text: "...", span: (metadata $x).span } }`

---

## Testing rules

- API: `bun test` with `@std/assert`
- Every route has at minimum: happy path, 404 case, validation failure case
- Rust: `cargo test` for db and command logic
- No mocking the database in API tests — use an in-memory SQLite instance

---

## Scope discipline

The v1 implementation plan (Phase 0-6 in PLAN.md) is fixed. The P2 vision items — doc corpus ingestion, interactive tutorials, speed-run challenges, whole-file ghost text — are future scope and must not influence any Phase 0-6 implementation decisions. Do not add tables, columns, routes, or abstractions in anticipation of P2. When P2 work begins it will arrive with its own plan.

---

## What not to do

- Do not introduce new dependencies without checking with the user first
- Do not use `localStorage` or `sessionStorage` anywhere
- Do not write platform-specific code without a clear `#[cfg(...)]` or runtime check
- Do not add Prettier/ESLint configs that conflict with the existing biome config
- Do not rename or restructure directories without explicit instruction
- Do not commit `snipx.db`, `node_modules/`, or `target/`
- Do not use `unwrap()` in production Rust code

---

## Startup sequence

```bash
bun install && cargo fetch   # install all dependencies
bun run api:dev              # start API on port 7878
bun run dev                  # start Tauri + Vite (second terminal)
```

---
---

# FILE: PLAN.md

# snipx — Implementation Plan

Work phases in order. Do not start Phase N+1 until Phase N passes all done-when checks.

---

## Phase 0 — Scaffold (0.5 days)

**Goal:** Repo structure, toolchain, CI skeleton, empty-but-compiling project.

- [ ] `cargo create-tauri-app snipx --template react-ts` with Bun as package manager
- [ ] `mise.toml` with pinned Bun, Rust, Node versions
- [ ] `api/` directory with `bun init`, `nu/` with empty `snipx.nu` skeleton
- [ ] `.gitignore`: `target/`, `node_modules/`, `*.db`, `dist/`
- [ ] `biome.json` for TS/JS formatting
- [ ] `rustfmt.toml` with `edition = "2021"`
- [ ] Verify `bun run dev` launches Tauri with a blank React page
- [ ] Verify `bun run api:dev` starts Hono and `GET /health` returns `{ ok: true }`

**Done when:** both `bun run dev` and `bun run api:dev` start without errors.

---

## Phase 1 — Database and API (1 day)

**Goal:** Full CRUD API for all three resource types, backed by SQLite.

- [ ] `api/db.ts` — `snippets`, `docs`, `bookmarks` tables, `migrate_001`
- [ ] `api/lib/id.ts` — nanoid wrapper, `newId()`
- [ ] `api/routes/snippets.ts` — CRUD + list filters (`q`, `lang`, `cat`, `tag`, `fav`)
- [ ] `api/routes/docs.ts` — CRUD + list filters (`q`, `lang`, `cat`, `topic`, `tag`)
- [ ] `api/routes/bookmarks.ts` — CRUD + list filters (`q`, `cat`, `tag`, `fav`)
- [ ] `api/routes/search.ts` — `GET /search?q=` across all three tables
- [ ] `api/routes/tags.ts` — `GET /tags` returning `{ tag, count, types }[]`
- [ ] `api/index.ts` — register all routes, CORS for localhost, error middleware
- [ ] `src/lib/types.ts` — Zod schemas for all three types
- [ ] `src/lib/api.ts` — typed fetch client
- [ ] `api/seed.ts` — populates the 10+10+10 sample items from the prototype

**Done when:** `bun test api/` passes all route tests including filters and 404s.

---

## Phase 2 — Frontend Core (1.5 days)

**Goal:** Pixel-faithful port of the React prototype to Tauri with live data.

#### 2a — Layout
- [ ] `src/lib/theme.ts` — Tokyo Night `T` token object (canonical, matches prototype exactly)
- [ ] Three-pane layout: sidebar (186px) + list (275px) + detail (flex-1)
- [ ] `window.innerHeight` for full height, resize listener
- [ ] Header: mode tabs, search, Add button, REPL toggle
- [ ] Sidebar: category filter with live counts, Favorites section
- [ ] Status bar

#### 2b — Snippet view
- [ ] List panel with lang badge, tag pills, fav star
- [ ] Detail panel with shiki syntax highlighting, Copy, Run, Favorite
- [ ] shiki integration: lazy-load grammar per language, Tokyo Night theme

#### 2c — Docs view
- [ ] List panel: title, URL preview, lang/topic/tag badges
- [ ] Detail panel: URL link, description, topics, tags, Quick Notes callout

#### 2d — Bookmarks view
- [ ] List panel: title, URL preview, category badge, tags
- [ ] Detail panel: icon, URL, description, tags, notes, date added

#### 2e — Search
- [ ] Debounced input hitting `GET /search?q=`, results grouped by type

#### 2f — Add / Edit form
- [ ] Inline right-panel form for all three types
- [ ] Zod validation on client before submit
- [ ] Auto-select newly created item

**Done when:** all three modes show live API data, search works, items persist across restarts.

---

## Phase 3 — REPL (0.5 days)

**Goal:** Fully functional in-app REPL matching the prototype.

- [ ] Drag-to-resize panel (min 130px, max 480px)
- [ ] Command history with arrow-key navigation
- [ ] All commands: `help`, `list`, `docs`, `bookmarks`, `show`, `search`, `copy`, `fav`, `run`, `open`, `tags`, `clear`
- [ ] `show <id>` navigates to correct mode and selects item
- [ ] `open <id>` calls `window.__TAURI__.shell.open(url)`

**Done when:** all REPL commands work, history persists across sessions, `open` launches browser.

---

## Phase 4 — Tauri Integration (0.5 days)

**Goal:** Tauri-native features — sidecar, tray, native clipboard.

- [ ] API server as Tauri sidecar in `tauri.conf.json`
- [ ] `commands.rs` — `start_api`, `stop_api`, `api_health` IPC commands
- [ ] Replace `navigator.clipboard` with Tauri clipboard plugin
- [ ] System tray: "Show snipx", "Toggle REPL", "Quit"
- [ ] Persist window size/position via Tauri window state plugin
- [ ] `~/.config/snipx/config.toml` — read on startup, pass `port` and `db_path` to sidecar

**Done when:** app launches API sidecar automatically, tray works, clipboard works on Linux/macOS/Windows.

---

## Phase 5 — Nushell Module (0.5 days)

**Goal:** `use snipx.nu *` makes the full library available in the shell.

- [ ] `nu/snipx.nu` — all subcommands per PRD spec
- [ ] Custom completions for `--lang`, `--cat`, `--tag` backed by `GET /tags`
- [ ] `snipx get <id>` prints code to stdout (pipeable)
- [ ] `snipx list` returns a Nushell table (structured)
- [ ] `snipx search <query>` returns a typed table with `type`, `id`, `title`, `tags`
- [ ] `snipx add` launches an interactive multi-step prompt using `input`
- [ ] `nu/completions.nu` — completion providers that lazy-query the API
- [ ] Install instructions for `config.nu`

**Done when:** `snipx list | where lang == "rust"` works in a fresh Nushell session.

---

## Phase 6 — Polish and Release (0.5 days)

**Goal:** Keyboard nav, import/export, packaging.

- [ ] Keyboard nav: `j`/`k` in list, `/` to focus search, `Esc` to clear, `Enter` to open
- [ ] `snipx export --format json` and `snipx import`
- [ ] `cargo tauri build` produces signed `.dmg` / `.AppImage` / `.msi`
- [ ] README verified against actual build
- [ ] Seed data stripped from production build (`SNIPX_SEED=1 bun run api:dev`)

**Done when:** `cargo tauri build` produces a working artifact on all three platforms.

---

## Milestone summary

| Phase | Name | Duration | Cumulative |
|-------|------|----------|-----------|
| 0 | Scaffold | 0.5d | 0.5d |
| 1 | API + DB | 1.0d | 1.5d |
| 2 | Frontend | 1.5d | 3.0d |
| 3 | REPL | 0.5d | 3.5d |
| 4 | Tauri | 0.5d | 4.0d |
| 5 | Nushell | 0.5d | 4.5d |
| 6 | Polish | 0.5d | 5.0d |

---
---

# FILE: HANDOFF.md + CLAUDE CODE PROMPT

---

## HANDOFF.md — Context for Agent Takeover

### What has been built

A high-fidelity React prototype of snipx was built interactively and is fully functional as a browser artifact. It demonstrates the complete UI: three-pane layout (sidebar / list / detail), syntax-highlighted code viewer with a custom tokenizer, REPL panel with command history, Docs and Bookmarks detail views, inline add forms, and a status bar. The prototype is the visual and behavioral spec for the real implementation.

### Key design decisions already locked in

- **Brand:** `snipx`, domains `snipx.sh` (primary) and `snipx.dev`. Binary is `snipx`.
- **Tokyo Night** is the color system. The `T` token object in the prototype is canonical. Do not deviate.
- **Inline styles only** — no CSS framework.
- **`window.innerHeight`** for full-height layout — not `100vh` (breaks in Tauri WebView).
- **Three-pane layout**: sidebar 186px + list 275px + detail flex-1.
- **REPL is resizable** by drag on its top border. Min 130px, max 480px.
- **Add form is inline** in the detail panel — no floating modals.
- **API is the single source of truth** — the frontend is a typed skin over fetch calls.
- **Nushell module talks directly to the API** — no IPC bridge for shell integration.
- **shiki** for syntax highlighting — not tree-sitter, not a custom tokenizer.

### Scope discipline

The v1 implementation plan is Phase 0-6 and it does not change. The longer-term vision — doc corpus ingestion, interactive tutorials, speed-run challenges, whole-file ghost text — is documented in PRD.md under P2. It informs the direction of the project but must not influence any Phase 0-6 implementation decisions. Do not add schema columns, API routes, or abstractions in anticipation of P2. When that work begins it will arrive with its own plan.

### Prose style

All documentation, comments, UI strings, and commit messages should be written in plain direct prose. No theatrical pivots, no reframe constructions, no preamble before a point. The vision statement in PRD.md is the target register.

### Files to create from this pack

| File | Description |
|------|-------------|
| `PRD.md` | Full product requirements |
| `README.md` | Project readme |
| `AGENTS.md` | Agent instructions — read this first, every session |
| `PLAN.md` | Phased implementation plan |

### Reference artifacts

The prototype source is available as a React component. Ask the user to paste it if you need to reference exact component structure, color values, or layout measurements.

---

## CLAUDE CODE AGENT PROMPT

Paste this verbatim as your first message when starting a Claude Code session:

---

```
You are implementing snipx — a local-first developer knowledge manager.
Domains: snipx.sh (primary), snipx.dev. Binary: snipx. Repo: github.com/danielbodnar/snipx.

Read AGENTS.md fully before doing anything else. It is authoritative.

Project documents are in the repo root:
  PRD.md     — requirements, API spec, data shapes, and long-term vision (P2)
  PLAN.md    — phased implementation plan, work in order
  AGENTS.md  — your instructions, conventions, non-negotiables
  README.md  — user-facing docs

A working React prototype exists demonstrating the exact target UI.
If you need to reference it, ask me to paste the source.

Key facts to internalize before writing a single line:
  - Stack: Tauri v2, Bun, Hono, React 19, TypeScript strict, Zod, SQLite (bun:sqlite), Nushell >= 0.110.0
  - No CSS framework. Tokyo Night inline styles only. Color tokens live in src/lib/theme.ts as const T.
  - No em-dashes anywhere — not in code, comments, strings, or docs. Use " - " or restructure.
  - Write in plain direct prose. No theatrical pivots or reframe constructions anywhere.
  - API runs on localhost:7878. The frontend never queries SQLite directly.
  - The Nushell module (nu/snipx.nu) talks HTTP to the API. No IPC.
  - All Nushell commands are subcommands of snipx (e.g. "snipx list", "snipx get").
  - Use bun:sqlite for the API, rusqlite only for Tauri IPC commands if needed.
  - Tags are stored as JSON arrays in a TEXT column. No join tables in v1.
  - Use nanoid for IDs. All timestamps are ISO 8601 strings.
  - Nushell shebangs: #!/usr/bin/env -S nu --stdin
  - Boolean flags in Nushell must not have ": bool" annotation.
  - No unwrap() in production Rust. Use ? and proper error types.
  - window.innerHeight for layout height, never 100vh.
  - Syntax highlighting: shiki with Tokyo Night theme, lazy-loaded per language.
  - Config dir: ~/.config/snipx/ — Data dir: ~/.local/share/snipx/
  - Database file: snipx.db — never commit it.
  - The P2 vision items in PRD.md (doc ingestion, tutorials, speed runs) are future scope.
    Do not add schema, routes, or abstractions in anticipation of them.

Start with Phase 0 from PLAN.md.
After each phase, run the done-when verification steps and confirm with me before proceeding.
Do not skip ahead. Do not introduce dependencies not in the PRD without asking first.

Owner: Daniel Bodnar — daniel@bodnar.sh
```

---
