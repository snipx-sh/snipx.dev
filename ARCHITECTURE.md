# Architecture

snipx has four layers. Each has a single responsibility and communicates with the others through narrow, typed interfaces.

---

## The four layers

**API** (`api/` in snipx.sh) is the single source of truth. It owns the SQLite database, validates all writes with Zod, and exposes a typed HTTP interface on `localhost:7878`. Nothing reads the database directly except the API. It runs as a Tauri sidecar when the desktop app is open, and can run as a standalone process or systemd user service without the GUI.

**Frontend** (`src/` in snipx.sh) is a React app that renders data from the API. It holds local UI state only — selected item, search query, REPL visibility. All network calls go through `src/lib/api.ts`. No business logic lives here.

**Tauri shell** (`src-tauri/` in snipx.sh) is a thin Rust wrapper. It launches the API as a sidecar, manages the window, and provides native clipboard and system tray access. No business logic.

**Nushell module** (`nu/snipx.nu` in snipx.sh) talks directly to the API over HTTP. It does not use Tauri IPC. It works independently — the desktop app does not need to be running.

## Data flow

```
Nushell shell     →  snipx.nu module  →  HTTP API (localhost:7878)
Tauri frontend    →  Tauri IPC        →  HTTP API (localhost:7878)
snipx CLI         →                  →  HTTP API (localhost:7878)
snipx.dev Worker  →  GitHub API       →  user's content repo
                                              |
                                        SQLite (snipx.db)
```

The web interface at snipx.dev does not connect to the local API. It reads from GitHub repos directly via a Cloudflare Worker.

## File locations

```
~/.local/share/snipx/snipx.db    database
~/.config/snipx/config.toml      configuration
~/.config/snipx/snipx.nu         Nushell module (installed copy)
~/.snipx/packages/               installed package content
~/.snipx/skills/                 user-level skill symlink dirs
```

All paths follow XDG and are independently overridable:

```
SNIPX_HOME           overrides ~/.snipx/
SNIPX_CONFIG_DIR     overrides ~/.config/snipx/
SNIPX_CONFIG_FILE    overrides ~/.config/snipx/config.toml
SNIPX_CONFIG         alias for SNIPX_CONFIG_FILE
```

## Config resolution

Every configurable value resolves in this order:

```
CLI flag
  → $env.SNIPX_*
    → ~/.config/snipx/config.toml
      → hard-coded default
```

## Package and skill resolution

Skills are resolved by walking up from the current directory, then falling back to user-level paths. First match wins.

```
./.agents/skills/[tool]/          project-local (agentskills.io convention)
./.claude/skills/[tool]/          project-local (claude-code convention)
[parent directories...]
~/.agents/skills/[tool]/          user-level
~/.claude/skills/[tool]/          user-level claude-code
~/.snipx/skills/[tool]/           user-level snipx canonical
```

The skill directory at any location is always thin — `SKILL.md` and symlinks only. All package content lives at `~/.snipx/packages/[tool]/` and is symlinked in. Content exists in exactly one place.

## The web layer

`snipx.dev` is a Cloudflare Pages app backed by Workers. The routing model:

```
snipx.dev                        → marketing / demo
snipx.dev/docs/[...]             → documentation
snipx.dev/[username]             → serves github.com/[username]/snipx (public, no auth)
snipx.dev/[username]/[repo]      → serves any named repo (auth required if private)
snipx.dev/explore                → browse the official knowledge base
```

Persistence in the web layer is KV (sessions, cache) and R2 (package mirror, vector index). No database.

## Scripts

`scripts/` in snipx.sh contains Nushell bootstrap tooling that calls `claude --print` to generate files and run commands. Each subcommand maps to one or more claude invocations. The scripts use `lib.nu` for shared helpers (`call_claude`, `claude_json`, `claude_text`, `confirm_and_run`, `write_file`, `resolve_config`). See [scripts.md](scripts.md) for the full reference.
