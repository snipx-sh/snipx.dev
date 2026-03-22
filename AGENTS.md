# AGENTS.md — snipx.dev

Instructions for Claude Code and any other AI agent working in this repository.

## Repo overview

This repo has two distinct concerns that should be kept separate:

1. **The web app** (`app/`, `workers/`) — the snipx interface served at snipx.dev, the GitHub proxy, and auth middleware
2. **The docs** (`docs/`) — canonical documentation for the entire snipx project, served at snipx.dev/docs

Changes to the web app do not require docs changes and vice versa. Identify which concern a change belongs to before starting work.

## Prose and communication style

Write in plain direct prose throughout. No theatrical pivots, no dramatic setups, no preamble before a point. This applies equally to docs content, code comments, error messages, and commit messages.

Docs in particular should be direct and specific. Prefer showing a concrete example over describing one. Avoid "you can" and "you might want to" — state what to do. Every code example must be runnable as written.

## Web app conventions

- Same Tokyo Night token system as `snipx.sh` — import from the shared package, never redefine
- Cloudflare Workers: TypeScript strict, Zod for all external data boundaries
- No server-side rendering of user content — the Worker fetches from GitHub, the client renders
- KV keys: `user:[username]`, `repo:[owner]:[repo]:[path]` — no slashes in key segments
- R2 keys: `packages/[tool]/[file]` — mirrors the registry structure exactly
- Auth: GitHub OAuth only — no email/password, no third-party providers in v1
- The public username route (`/[username]`) must never require auth

## Routing model

```
snipx.dev                        → marketing / demo page
snipx.dev/docs/[...]             → documentation (docs/ in this repo)
snipx.dev/[username]             → public repo view, no auth required
snipx.dev/[username]/[repo]      → any named repo, auth required if private
snipx.dev/registry               → package registry browser
```

The Worker determines auth requirements by attempting a public GitHub API fetch first. A 404 or 403 response triggers the auth redirect flow.

## Docs conventions

- One file per topic — no mega-documents
- Start each doc with a one-sentence description of what it covers
- Every code example must be runnable as written — no placeholder values that silently fail
- Link to the relevant source file when referencing implementation details
- Docs are written for readers who have read the org README — don't re-explain the vision
- No version-specific claims unless the version is pinned in the example
- Keep `docs/README.md` in sync whenever a file is added or renamed
- Cross-link between docs rather than duplicating content

## What not to do

- Do not add authentication requirements to the public username route
- Do not store user content in KV or R2 — only cache and index it
- Do not introduce a database — KV and R2 are the only persistence layers here
- Do not duplicate content between docs files — cross-link instead
- Do not commit Cloudflare credentials or `.dev.vars` files
- Do not redefine Tokyo Night color tokens — import them
