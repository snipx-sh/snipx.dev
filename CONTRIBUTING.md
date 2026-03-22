# Contributing to snipx.dev

Contributions to the web app and official documentation are both welcome here.

## Where things live

If you're not sure which repo to open a PR against:

- Core app, API, Nushell module → [snipx-sh/snipx.sh](https://github.com/snipx-sh/snipx.sh)
- Web interface, docs → here
- Registry packages → [snipx-sh/snipx](https://github.com/snipx-sh/snipx)

## Docs contributions

Documentation lives in `docs/` and is served at [snipx.dev/docs](https://snipx.dev/docs). This is the easiest place to start — fixing an unclear explanation, adding a missing example, or writing a new guide.

```bash
git clone https://github.com/snipx-sh/snipx.dev
cd snipx.dev
bun install
bun run docs:dev   # preview docs locally at localhost:4000
```

Every docs PR should:
- Include a runnable example for any command or code shown
- Update `docs/README.md` if adding or renaming a file
- Follow the prose conventions in `AGENTS.md` — direct, specific, no preamble

## Web app contributions

```bash
bun install
bun run dev
```

Set up a `.dev.vars` file with a GitHub OAuth app for local auth testing. See [docs/dev-setup.md](docs/dev-setup.md) for the full guide.

Before opening a PR:
- `bun run typecheck` — no TypeScript errors
- `bun test` — all tests pass
- Test the public route (`/[username]`) without auth
- Test the private route (`/[username]/[repo]`) with and without auth

## Adding a new docs page

1. Create `docs/[topic].md`
2. Start with a one-sentence description of what it covers
3. Add it to the index in `docs/README.md`
4. Link to it from any related docs pages
5. All code examples must run as written

## Adding a new Worker route

1. Add the handler in `workers/[name].ts`
2. Register it in `workers/index.ts`
3. Keep auth and routing logic separate from data fetching
4. Add tests for the authed and unauthed cases

## Code review

PRs are reviewed for correctness, consistency with `AGENTS.md`, and — for docs — accuracy and completeness of examples. A docs PR that adds an example that doesn't run will be sent back.
