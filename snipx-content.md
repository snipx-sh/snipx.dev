# snipx

The official snipx knowledge base.

This is the community-maintained collection of curated knowledge for developer tools, languages, and frameworks. It works exactly like your own `github.com/[user]/snipx` — same structure, same commands — just maintained by the snipx community and used as the default source when you run `snipx add`.

---

## Adding knowledge to your snipx

```bash
# add from the official knowledge base
snipx add cloudflare/containers
snipx add dagger
snipx add nushell --no-tutorials

# add from someone else's snipx
snipx add danielbodnar/cloudflare
snipx add [username]/neovim

# add from any GitHub repo following the same structure
snipx add github:[username]/[repo]/[tool]
```

When you run `snipx add`, the skill is added to your local snipx at `~/.snipx/` and made available as a Claude Code skill, Nushell overlay, and snipx learning unit depending on what the source provides.

## Browse

```
cloudflare/
├── containers/
├── workers/
├── r2/
└── durable-objects/
dagger/
nushell/
neovim/
systemd/
bun/
...
```

Or explore at [snipx.dev/explore](https://snipx.dev/explore).

## Your own snipx

Your personal knowledge base lives at `github.com/[user]/snipx`. It follows the same structure as this repo. Anything you add here, you can share with others via `snipx add [your-username]/[tool]`. Your public snipx is served automatically at `snipx.dev/[username]`.

There's no account or registration required to maintain your own snipx — it's just a GitHub repo.

## Authoring

Full authoring documentation at [snipx.dev/docs](https://snipx.dev/docs):

- [Skill guide](https://snipx.dev/docs/skill-guide)
- [Overlay guide](https://snipx.dev/docs/overlay-guide)
- [Tutorial guide](https://snipx.dev/docs/tutorial-guide)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
