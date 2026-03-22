# snipx.dev

Web interface and official documentation for [snipx](https://snipx.sh).

Deployed at [snipx.dev](https://snipx.dev) on Cloudflare Pages.

---

## What's in this repo

```
snipx.dev/
├── app/                # Cloudflare Pages app — the snipx web interface
├── workers/            # Cloudflare Workers — routing, auth, GitHub proxy
├── docs/               # Official snipx documentation (snipx.dev/docs)
│   ├── README.md
│   ├── architecture.md
│   ├── api.md
│   ├── nushell.md
│   ├── scripts.md
│   ├── package-format.md
│   ├── skill-guide.md
│   ├── tutorial-guide.md
│   ├── overlay-guide.md
│   ├── routing.md
│   ├── self-hosting.md
│   └── dev-setup.md
└── public/             # static assets
```

## Local dev

```bash
git clone https://github.com/snipx-sh/snipx.dev
cd snipx.dev
bun install
bun run dev
```

## How snipx.dev/[username] works

No account is required to view a public repo. A request to `snipx.dev/danielbodnar` fetches `github.com/danielbodnar/snipx` via the GitHub API and serves the snipx interface with that repo as the data source.

The convention assumes `[user]/snipx` as the public repo name. Authenticated users can point snipx.dev at any repo they own, with any name.

```
https://snipx.dev/danielbodnar
  → public read-only view of github.com/danielbodnar/snipx
  → no account required

https://snipx.dev/danielbodnar/private-knowledge
  → requires snipx.dev account + repo access grant
  → repo can be named anything
```

Authentication is handled via GitHub OAuth. A snipx.dev account is only needed for private repo access — the desktop app, CLI, and Nushell module work entirely without one.

## Cloudflare stack

- **Pages** — hosts the web app
- **Workers** — routing, GitHub API proxy, auth middleware
- **KV** — session storage, public content cache
- **R2** — vector index sync, knowledge content mirror

## Docs

The `docs/` directory is the canonical home for all snipx documentation. It is served at `snipx.dev/docs` and covers the full stack — core app, API, Nushell module, package format, skill authoring, tutorial authoring, and overlay authoring.

Contributing to docs follows the same PR process as contributing to code.

## License

MIT
