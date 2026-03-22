import { T } from "./theme"
import type { Chapter, Level } from "./types"

export const LEVELS: Level[] = [
  { n: 1, label: "L1", desc: "Full ghost · No timer", ghost: true, par: null, color: T.green },
  { n: 2, label: "L2", desc: "Ghost · 3 min", ghost: true, par: 180, color: T.green1 },
  { n: 3, label: "L3", desc: "First line · 2 min", ghost: false, firstLine: true, par: 120, color: T.yellow },
  { n: 4, label: "L4", desc: "No hints · 90s", ghost: false, firstLine: false, par: 90, color: T.orange },
  { n: 5, label: "L5", desc: "Speed run · 60s", ghost: false, firstLine: false, par: 60, color: T.red },
]

export const LEARN: Chapter[] = [
  {
    id: "nushell",
    title: "Nushell",
    color: T.blue,
    lessons: [
      {
        id: "nu-pipelines",
        title: "Data Pipelines",
        section: "Fundamentals",
        lang: "nushell",
        content: [
          { type: "h2", text: "Structured data pipelines" },
          {
            type: "p",
            text: "Nushell treats every command's output as structured data — tables, records, and lists — rather than raw text. The pipe | passes that structure forward, so filtering and transforming feels natural.",
          },
          { type: "code", lang: "nushell", text: "ps | where cpu > 5.0 | sort-by cpu --reverse" },
          {
            type: "p",
            text: "where filters rows like SQL's WHERE. sort-by sorts by a column. The result is still a table — keep piping.",
          },
          {
            type: "tip",
            text: "Every column name is tab-completable. After | select, press Tab to see available columns from the piped input.",
          },
        ],
        starter: "# Filter processes by CPU usage\nps",
        solution:
          "ps\n  | where cpu > 5.0\n  | select name pid cpu mem\n  | sort-by cpu --reverse\n  | first 10",
        tasks: [
          { id: "t1", label: "Filter where cpu > 5.0", check: (c) => /where\s+cpu\s*>\s*5/.test(c) },
          {
            id: "t2",
            label: "Select name, pid, cpu, mem columns",
            check: (c) => c.includes("select") && c.includes("name") && c.includes("cpu"),
          },
          {
            id: "t3",
            label: "Sort by cpu in reverse order",
            check: (c) => c.includes("sort-by") && c.includes("reverse"),
          },
        ],
        output:
          "  name              pid     cpu    mem\n  ─────────────────────────────────────\n  node              12435   45.2   234.5 MB\n  rust-analyzer     4421    28.7   456.2 MB\n  code              3301    12.3   892.1 MB\n  docker            2201     8.9   123.4 MB\n\n  4 rows — 42ms",
      },
      {
        id: "nu-http",
        title: "HTTP & JSON",
        section: "Fundamentals",
        lang: "nushell",
        content: [
          { type: "h2", text: "HTTP as structured data" },
          {
            type: "p",
            text: "http get returns JSON as a Nushell record — not a string. You can immediately query it with dot notation or pipe it to where, select, and sort-by.",
          },
          {
            type: "code",
            lang: "nushell",
            text: "let res = http get https://api.github.com/users/octocat\n$res | select login name public_repos",
          },
          {
            type: "tip",
            text: "$res.repos_url accesses the repos_url key from the record. Pipe that URL to another http get using $in.",
          },
        ],
        starter: "let res = http get https://api.github.com/users/octocat\n$res | select login name",
        solution:
          'let res = http get https://api.github.com/users/octocat\n$res | select login name public_repos followers\n\n$res.repos_url\n  | http get $in\n  | where language == "TypeScript"\n  | select name stargazers_count\n  | sort-by stargazers_count --reverse',
        tasks: [
          {
            id: "t1",
            label: "Select login, name, public_repos, and followers",
            check: (c) => c.includes("public_repos") && c.includes("followers"),
          },
          {
            id: "t2",
            label: "Follow $res.repos_url to fetch repos",
            check: (c) => c.includes("repos_url"),
          },
          {
            id: "t3",
            label: 'Filter repos where language == "TypeScript"',
            check: (c) => c.includes("language") && c.includes("TypeScript"),
          },
        ],
        output:
          "  login:        octocat\n  name:         The Octocat\n  public_repos: 8\n  followers:    16621\n\n  TypeScript repos:\n  ───────────────────────\n  linguist        12431 ★\n  Hello-World      3219 ★",
      },
      {
        id: "nu-custom-cmd",
        title: "Custom Commands",
        section: "Scripting",
        lang: "nushell",
        content: [
          { type: "h2", text: "Typed custom commands" },
          {
            type: "p",
            text: "Nushell commands have typed signatures. Parameters get types, flags are named, and the shell validates everything before running — like type safety in the terminal.",
          },
          {
            type: "code",
            lang: "nushell",
            text: 'def greet [name: string, --loud] {\n  let msg = $"Hello, ($name)!"\n  if $loud { $msg | str upcase } else { $msg }\n}',
          },
          {
            type: "tip",
            text: "Boolean flags don't need : bool. Just declare --dry-run and it works as a switch automatically.",
          },
        ],
        starter: 'def deploy [\n  service: string,\n] {\n  print $"Deploying ($service)..."\n}',
        solution:
          'def deploy [\n  service: string,         # Service to deploy\n  --env: string = "prod",  # Target environment\n  --dry-run,               # Preview, no changes\n  --tag: string = "latest" # Image tag\n] {\n  if $dry_run {\n    print $"[DRY RUN] ($service):($tag) → ($env)"\n    return\n  }\n  print $"Deploying ($service):($tag) → ($env)..."\n}',
        tasks: [
          {
            id: "t1",
            label: 'Add --env flag with default "prod"',
            check: (c) => c.includes("--env") && c.includes('"prod"'),
          },
          { id: "t2", label: "Add --dry-run flag", check: (c) => c.includes("--dry-run") },
          {
            id: "t3",
            label: "Handle dry-run with early return",
            check: (c) => c.includes("dry_run") && c.includes("return"),
          },
        ],
        output:
          "> deploy api --dry-run\n[DRY RUN] api:latest → prod\n\n> deploy worker --env staging --tag v2.1\nDeploying worker:v2.1 → staging...",
      },
    ],
  },
  {
    id: "bun",
    title: "Bun",
    color: T.orange,
    lessons: [
      {
        id: "bun-serve",
        title: "HTTP Server",
        section: "Getting Started",
        lang: "typescript",
        content: [
          { type: "h2", text: "Bun.serve()" },
          {
            type: "p",
            text: "Bun has a built-in HTTP server that starts in ~6ms. Bun.serve() takes a fetch handler using the same Web Standards API as the browser — Request in, Response out.",
          },
          {
            type: "code",
            lang: "typescript",
            text: 'const server = Bun.serve({\n  port: 3000,\n  fetch(req) {\n    return new Response("Hello!")\n  }\n})',
          },
          {
            type: "tip",
            text: "Bun.serve() returns a server with .url, .port, and .stop(). The fetch handler can be async — awaiting upstream requests, databases, or files.",
          },
        ],
        starter:
          "const server = Bun.serve({\n  port: 3000,\n  fetch(req) {\n    // handle the request\n  }\n})",
        solution:
          'const server = Bun.serve({\n  port: 3000,\n  async fetch(req) {\n    const url = new URL(req.url)\n    if (url.pathname === "/health") {\n      return Response.json({ ok: true, ts: Date.now() })\n    }\n    return new Response("snipx API", { status: 200 })\n  }\n})\nconsole.log(`Listening on ${server.url}`)',
        tasks: [
          {
            id: "t1",
            label: "Return a Response for the default route",
            check: (c) => c.includes("new Response") || c.includes("Response.json"),
          },
          {
            id: "t2",
            label: "Add a /health route returning JSON",
            check: (c) => c.includes("health") && c.includes("Response.json"),
          },
          { id: "t3", label: "Log server.url on startup", check: (c) => c.includes("server.url") },
        ],
        output:
          'Listening on http://localhost:3000/\n\nGET /        200  "snipx API"\nGET /health  200  {"ok":true,"ts":1741908621}',
      },
    ],
  },
  {
    id: "cloudflare",
    title: "Cloudflare Workers",
    color: T.teal,
    lessons: [
      {
        id: "cf-worker",
        title: "Cache-First Worker",
        section: "Getting Started",
        lang: "typescript",
        content: [
          { type: "h2", text: "Workers at the edge" },
          {
            type: "p",
            text: "A Cloudflare Worker runs in V8 isolates at the edge — no containers, no cold start. It uses Web Standard APIs: fetch, Request, Response, URL, crypto. Bindings (KV, R2, D1) arrive via the env parameter.",
          },
          {
            type: "code",
            lang: "typescript",
            text: 'export default {\n  fetch(req: Request, env: Env) {\n    return new Response("Hello from the edge!")\n  }\n} satisfies ExportedHandler<Env>',
          },
          {
            type: "tip",
            text: "ctx.waitUntil() lets you run async work — like writing to KV — after returning the response. The response is sent immediately; the background work continues.",
          },
        ],
        starter:
          "export interface Env {\n  CACHE: KVNamespace\n  ORIGIN: string\n}\n\nexport default {\n  async fetch(req: Request, env: Env, ctx: ExecutionContext) {\n    // implement cache-first fetch\n  }\n} satisfies ExportedHandler<Env>",
        solution:
          'export interface Env {\n  CACHE: KVNamespace\n  ORIGIN: string\n}\n\nexport default {\n  async fetch(req: Request, env: Env, ctx: ExecutionContext) {\n    const key  = new URL(req.url).pathname\n    const hit  = await env.CACHE.get(key, "text")\n    if (hit) return new Response(hit, { headers: { "X-Cache": "HIT" } })\n    const res  = await fetch(`${env.ORIGIN}${key}`)\n    const body = await res.text()\n    ctx.waitUntil(env.CACHE.put(key, body, { expirationTtl: 60 }))\n    return new Response(body, { headers: { "X-Cache": "MISS" } })\n  }\n} satisfies ExportedHandler<Env>',
        tasks: [
          {
            id: "t1",
            label: "Check KV cache with env.CACHE.get()",
            check: (c) => c.includes("CACHE.get"),
          },
          {
            id: "t2",
            label: "Return cached response with X-Cache: HIT",
            check: (c) => c.includes('"HIT"') || c.includes("'HIT'"),
          },
          {
            id: "t3",
            label: "Store response using ctx.waitUntil + CACHE.put",
            check: (c) => c.includes("waitUntil") && c.includes("CACHE.put"),
          },
        ],
        output:
          "GET / (cold)  → ORIGIN 143ms → KV cached 60s  X-Cache: MISS\nGET / (warm)  → KV 4ms                        X-Cache: HIT\nGET / (warm)  → KV 3ms                        X-Cache: HIT",
      },
    ],
  },
]
