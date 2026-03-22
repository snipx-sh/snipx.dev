import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Terminal, Search, Star, Copy, Code, Cpu, Cloud, GitBranch,
  Globe, ChevronRight, Shield, CheckCircle, Hash, Play, X,
  BookOpen, Bookmark, ExternalLink, Plus, FileText, Tag, Link,
  Zap, ChevronLeft, Clock, MessageSquare, Eye, EyeOff, Award, Lock
} from "lucide-react";

const T = {
  bg:'#1a1b26',bgDark:'#13131a',bgPanel:'#16161e',bgHL:'#1e2030',
  bgHover:'#252637',bgActive:'#2a2d3e',border:'#3b4261',borderBrt:'#545c7e',
  fg:'#c0caf5',fgDim:'#a9b1d6',fgMuted:'#565f89',
  blue:'#7aa2f7',cyan:'#7dcfff',green:'#9ece6a',green1:'#73daca',
  purple:'#bb9af7',orange:'#ff9e64',yellow:'#e0af68',red:'#f7768e',teal:'#2ac3de',
};
const LANG_CLR = {nushell:T.blue,bash:T.green,sh:T.green,rust:T.orange,typescript:T.cyan,javascript:T.yellow,toml:T.yellow,yaml:T.purple,vyos:T.red};
const mono = {fontFamily:"'JetBrains Mono','Cascadia Code',monospace"};
const sans = {fontFamily:"'Inter',system-ui,sans-serif"};
const row  = {display:'flex',alignItems:'center'};
const col  = {display:'flex',flexDirection:'column'};

const SNIP_CATS  = ['All','Nushell','Shell','Rust','TypeScript','Cloudflare','Git','VyOS'];
const DOC_CATS   = ['All','Nushell','Rust','TypeScript','Cloudflare','Linux','Networking','Tools'];
const BM_CATS    = ['All','Articles','Repos','Tools','Reference'];
const SNIP_ICONS = {All:Hash,Nushell:Terminal,Shell:Code,Rust:Cpu,TypeScript:Globe,Cloudflare:Cloud,Git:GitBranch,VyOS:Shield};
const DOC_ICONS  = {All:Hash,Nushell:Terminal,Rust:Cpu,TypeScript:Globe,Cloudflare:Cloud,Linux:Code,Networking:Shield,Tools:Tag};
const BM_ICONS   = {All:Hash,Articles:FileText,Repos:GitBranch,Tools:Tag,Reference:BookOpen};
const IMP = 'import';

const INIT_SNIPS = [
  {id:'nu-pipeline',title:'Process Pipeline with Filtering',desc:'Filter process data using structured pipelines',lang:'nushell',cat:'Nushell',tags:['pipeline','process','filter'],fav:false,
  code:`# List processes consuming more than 5% CPU\nps\n  | where cpu > 5.0\n  | select name pid cpu mem\n  | sort-by cpu --reverse\n  | first 10`},
  {id:'nu-http',title:'HTTP Pipeline with Path Access',desc:'Fetch JSON and traverse with native path access',lang:'nushell',cat:'Nushell',tags:['http','json','api'],fav:true,
  code:`let res = http get https://api.github.com/users/danielbodnar\n$res | select login name public_repos followers\n\n$res.repos_url\n  | http get $in\n  | where language == "Rust"\n  | select name stargazers_count\n  | sort-by stargazers_count --reverse`},
  {id:'rs-axum-handler',title:'Axum Route Handler with State',desc:'Type-safe async handler with extractors',lang:'rust',cat:'Rust',tags:['axum','web','async'],fav:false,
  code:`use axum::{extract::{Path,State}, http::StatusCode, response::Json};\nuse std::sync::Arc;\n\n#[derive(Clone)]\nstruct AppState { db: Arc<Database> }\n\nasync fn get_snippet(\n    State(state): State<AppState>,\n    Path(id): Path<String>,\n) -> Result<Json<Snippet>, StatusCode> {\n    state.db.find_snippet(&id).await\n        .map(Json).ok_or(StatusCode::NOT_FOUND)\n}`},
  {id:'ts-hono-route',title:'Hono API with Auth Middleware',desc:'Type-safe CF Worker API with Zod and bearer auth',lang:'typescript',cat:'TypeScript',tags:['hono','cloudflare','api'],fav:true,
  code:`${IMP} { Hono } from "hono";\n${IMP} { bearerAuth } from "hono/bearer-auth";\n${IMP} { zValidator } from "@hono/zod-validator";\n${IMP} { z } from "zod";\n\ntype Bindings = { KV: KVNamespace; API_TOKEN: string };\nconst app = new Hono<{ Bindings: Bindings }>();\n\napp.use("/api/*", (c, next) =>\n  bearerAuth({ token: c.env.API_TOKEN })(c, next)\n);\n\napp.post("/api/snippets", zValidator("json", z.object({\n  title: z.string().min(1), code: z.string(),\n})), async (c) => {\n  const body = c.req.valid("json");\n  const id = crypto.randomUUID();\n  await c.env.KV.put(\`snippet:\${id}\`, JSON.stringify(body));\n  return c.json({ id, ...body }, 201);\n});`},
  {id:'cf-worker-kv',title:'CF Worker Cache-First Pattern',desc:'Cache-first fetch strategy using KV with TTL',lang:'typescript',cat:'Cloudflare',tags:['workers','kv','cache'],fav:false,
  code:`export default {\n  async fetch(req: Request, env: Env, ctx: ExecutionContext) {\n    const key = new URL(req.url).pathname;\n    const hdrs = { "Content-Type": "application/json" };\n    const hit  = await env.CACHE.get(key, "text");\n    if (hit) return new Response(hit, { headers: {...hdrs,"X-Cache":"HIT"} });\n    const res  = await fetch(\`\${env.ORIGIN}\${key}\`);\n    const body = await res.text();\n    ctx.waitUntil(env.CACHE.put(key, body, { expirationTtl: 60 }));\n    return new Response(body, { headers: {...hdrs,"X-Cache":"MISS"} });\n  },\n} satisfies ExportedHandler<Env>;`},
  {id:'git-lg',title:'Pretty Git Log Alias',desc:'Colorized, graphed log with relative timestamps',lang:'bash',cat:'Git',tags:['git','alias','log'],fav:false,
  code:`git log \\\n  --graph --abbrev-commit --decorate \\\n  --format=format:'%C(bold blue)%h%C(reset) %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset)' \\\n  --all`},
];

const INIT_DOCS = [
  {id:'doc-nu-book',title:'Nushell Book',desc:'Official guide — pipelines, custom commands, data types, scripting patterns',url:'https://www.nushell.sh/book/',lang:'nushell',cat:'Nushell',topics:['reference','book'],tags:['pipelines','commands','types'],fav:false,notes:'Key: pipeline I/O sigs, error make + span metadata, custom completions'},
  {id:'doc-aya-book',title:'Aya eBPF Book',desc:'Writing Linux eBPF programs in Rust — XDP, TC, tracepoints, maps',url:'https://aya-rs.dev/book/',lang:'rust',cat:'Rust',topics:['ebpf','book'],tags:['xdp','tc','bpf','kernel'],fav:true,notes:'Focus: XDP_DROP/PASS patterns, HashMap/LruHashMap, perf event arrays, CO-RE'},
  {id:'doc-cf-workers',title:'Cloudflare Workers Docs',desc:'Complete Workers runtime reference — bindings, APIs, deploy workflow',url:'https://developers.cloudflare.com/workers/',lang:'typescript',cat:'Cloudflare',topics:['reference','runtime'],tags:['workers','wasm','bindings'],fav:true,notes:'Key: ExecutionContext.waitUntil, KV/R2/DO bindings'},
  {id:'doc-hono',title:'Hono Documentation',desc:'Fast edge-first web framework for Cloudflare Workers, Bun, Deno',url:'https://hono.dev/docs/',lang:'typescript',cat:'TypeScript',topics:['web','api'],tags:['routing','middleware','rpc'],fav:true,notes:'hono/rpc for type-safe client gen; built-in Zod validator'},
  {id:'doc-bun',title:'Bun Documentation',desc:'All-in-one JS runtime — bundler, test runner, package manager',url:'https://bun.sh/docs',lang:'typescript',cat:'Tools',topics:['runtime','tools'],tags:['bundler','test','install'],fav:false,notes:'bun run, bun test, Bun.file() streaming I/O'},
];

const INIT_BOOKMARKS = [
  {id:'bm-cf-workers-internals',title:'How Workers Works Internally',url:'https://blog.cloudflare.com/how-workers-works/',desc:'Deep-dive into V8 isolates, cold start elimination, and Workers architecture',cat:'Articles',tags:['cloudflare','v8','architecture'],date:'2025-01-22',fav:true,notes:'Key: isolate recycling, no container overhead'},
  {id:'bm-mise',title:'mise — Dev Tools Manager',url:'https://mise.jdx.dev/',desc:'Polyglot runtime manager: Node, Bun, Rust, Go, Python, more',cat:'Tools',tags:['runtime','toolchain','devtools'],date:'2025-01-10',fav:true,notes:'mise.toml per-project; global ~/.config/mise/config.toml'},
  {id:'bm-zellij',title:'Zellij Terminal Workspace',url:'https://zellij.dev/documentation/',desc:'Multiplexer with layouts, floating panes, and WASI plugin API',cat:'Tools',tags:['terminal','multiplexer','wasi'],date:'2024-12-10',fav:true,notes:'KDL layout files, plugin dev in Rust/WASI'},
  {id:'bm-tokio-tutorial',title:'Tokio Async Rust Tutorial',url:'https://tokio.rs/tokio/tutorial',desc:'Comprehensive async Rust — tasks, channels, select!, I/O',cat:'Articles',tags:['rust','async','tokio'],date:'2024-12-18',fav:false,notes:'select! macro, mpsc/broadcast channels'},
  {id:'bm-duckdb',title:'DuckDB Documentation',url:'https://duckdb.org/docs/',desc:'In-process analytical SQL — fast parquet/CSV/JSON queries',cat:'Reference',tags:['sql','analytics','parquet'],date:'2024-11-30',fav:false,notes:'ATTACH for multi-db; httpfs for S3/R2 queries'},
];

// ── Speed run levels ──────────────────────────────────────────────────────────
const LEVELS = [
  {n:1,label:'L1',desc:'Full ghost · No timer',ghost:true,par:null,color:T.green},
  {n:2,label:'L2',desc:'Ghost · 3 min',ghost:true,par:180,color:T.green1},
  {n:3,label:'L3',desc:'First line · 2 min',ghost:false,firstLine:true,par:120,color:T.yellow},
  {n:4,label:'L4',desc:'No hints · 90s',ghost:false,firstLine:false,par:90,color:T.orange},
  {n:5,label:'L5',desc:'Speed run · 60s',ghost:false,firstLine:false,par:60,color:T.red},
];

// ── Learn chapters ─────────────────────────────────────────────────────────────
const LEARN = [
  {id:'nushell',title:'Nushell',color:T.blue,icon:Terminal,lessons:[
    {id:'nu-pipelines',title:'Data Pipelines',section:'Fundamentals',lang:'nushell',
    content:[
      {type:'h2',text:'Structured data pipelines'},
      {type:'p',text:'Nushell treats every command\'s output as structured data — tables, records, and lists — rather than raw text. The pipe | passes that structure forward, so filtering and transforming feels natural.'},
      {type:'code',lang:'nushell',text:'ps | where cpu > 5.0 | sort-by cpu --reverse'},
      {type:'p',text:'where filters rows like SQL\'s WHERE. sort-by sorts by a column. The result is still a table — keep piping.'},
      {type:'tip',text:'Every column name is tab-completable. After | select, press Tab to see available columns from the piped input.'},
    ],
    starter:'# Filter processes by CPU usage\nps',
    solution:'ps\n  | where cpu > 5.0\n  | select name pid cpu mem\n  | sort-by cpu --reverse\n  | first 10',
    tasks:[
      {id:'t1',label:'Filter where cpu > 5.0',check:c=>/where\s+cpu\s*>\s*5/.test(c)},
      {id:'t2',label:'Select name, pid, cpu, mem columns',check:c=>c.includes('select')&&c.includes('name')&&c.includes('cpu')},
      {id:'t3',label:'Sort by cpu in reverse order',check:c=>c.includes('sort-by')&&c.includes('reverse')},
    ],
    output:'  name              pid     cpu    mem\n  ─────────────────────────────────────\n  node              12435   45.2   234.5 MB\n  rust-analyzer     4421    28.7   456.2 MB\n  code              3301    12.3   892.1 MB\n  docker            2201     8.9   123.4 MB\n\n  4 rows — 42ms'},
    {id:'nu-http',title:'HTTP & JSON',section:'Fundamentals',lang:'nushell',
    content:[
      {type:'h2',text:'HTTP as structured data'},
      {type:'p',text:'http get returns JSON as a Nushell record — not a string. You can immediately query it with dot notation or pipe it to where, select, and sort-by.'},
      {type:'code',lang:'nushell',text:'let res = http get https://api.github.com/users/octocat\n$res | select login name public_repos'},
      {type:'tip',text:'$res.repos_url accesses the repos_url key from the record. Pipe that URL to another http get using $in.'},
    ],
    starter:'let res = http get https://api.github.com/users/octocat\n$res | select login name',
    solution:'let res = http get https://api.github.com/users/octocat\n$res | select login name public_repos followers\n\n$res.repos_url\n  | http get $in\n  | where language == "TypeScript"\n  | select name stargazers_count\n  | sort-by stargazers_count --reverse',
    tasks:[
      {id:'t1',label:'Select login, name, public_repos, and followers',check:c=>c.includes('public_repos')&&c.includes('followers')},
      {id:'t2',label:'Follow $res.repos_url to fetch repos',check:c=>c.includes('repos_url')},
      {id:'t3',label:'Filter repos where language == "TypeScript"',check:c=>c.includes('language')&&c.includes('TypeScript')},
    ],
    output:'  login:        octocat\n  name:         The Octocat\n  public_repos: 8\n  followers:    16621\n\n  TypeScript repos:\n  ───────────────────────\n  linguist        12431 ★\n  Hello-World      3219 ★'},
    {id:'nu-custom-cmd',title:'Custom Commands',section:'Scripting',lang:'nushell',
    content:[
      {type:'h2',text:'Typed custom commands'},
      {type:'p',text:'Nushell commands have typed signatures. Parameters get types, flags are named, and the shell validates everything before running — like type safety in the terminal.'},
      {type:'code',lang:'nushell',text:'def greet [name: string, --loud] {\n  let msg = $"Hello, ($name)!"\n  if $loud { $msg | str upcase } else { $msg }\n}'},
      {type:'tip',text:'Boolean flags don\'t need : bool. Just declare --dry-run and it works as a switch automatically.'},
    ],
    starter:'def deploy [\n  service: string,\n] {\n  print $"Deploying ($service)..."\n}',
    solution:'def deploy [\n  service: string,         # Service to deploy\n  --env: string = "prod",  # Target environment\n  --dry-run,               # Preview, no changes\n  --tag: string = "latest" # Image tag\n] {\n  if $dry_run {\n    print $"[DRY RUN] ($service):($tag) → ($env)"\n    return\n  }\n  print $"Deploying ($service):($tag) → ($env)..."\n}',
    tasks:[
      {id:'t1',label:'Add --env flag with default "prod"',check:c=>c.includes('--env')&&c.includes('"prod"')},
      {id:'t2',label:'Add --dry-run flag',check:c=>c.includes('--dry-run')},
      {id:'t3',label:'Handle dry-run with early return',check:c=>c.includes('dry_run')&&c.includes('return')},
    ],
    output:'> deploy api --dry-run\n[DRY RUN] api:latest → prod\n\n> deploy worker --env staging --tag v2.1\nDeploying worker:v2.1 → staging...'},
  ]},
  {id:'bun',title:'Bun',color:T.orange,icon:Cpu,lessons:[
    {id:'bun-serve',title:'HTTP Server',section:'Getting Started',lang:'typescript',
    content:[
      {type:'h2',text:'Bun.serve()'},
      {type:'p',text:'Bun has a built-in HTTP server that starts in ~6ms. Bun.serve() takes a fetch handler using the same Web Standards API as the browser — Request in, Response out.'},
      {type:'code',lang:'typescript',text:'const server = Bun.serve({\n  port: 3000,\n  fetch(req) {\n    return new Response("Hello!")\n  }\n})'},
      {type:'tip',text:'Bun.serve() returns a server with .url, .port, and .stop(). The fetch handler can be async — awaiting upstream requests, databases, or files.'},
    ],
    starter:'const server = Bun.serve({\n  port: 3000,\n  fetch(req) {\n    // handle the request\n  }\n})',
    solution:'const server = Bun.serve({\n  port: 3000,\n  async fetch(req) {\n    const url = new URL(req.url)\n    if (url.pathname === "/health") {\n      return Response.json({ ok: true, ts: Date.now() })\n    }\n    return new Response("snipx API", { status: 200 })\n  }\n})\nconsole.log(`Listening on ${server.url}`)',
    tasks:[
      {id:'t1',label:'Return a Response for the default route',check:c=>c.includes('new Response')||c.includes('Response.json')},
      {id:'t2',label:'Add a /health route returning JSON',check:c=>c.includes('health')&&c.includes('Response.json')},
      {id:'t3',label:'Log server.url on startup',check:c=>c.includes('server.url')},
    ],
    output:'Listening on http://localhost:3000/\n\nGET /        200  "snipx API"\nGET /health  200  {"ok":true,"ts":1741908621}'},
  ]},
  {id:'cloudflare',title:'Cloudflare Workers',color:T.teal,icon:Cloud,lessons:[
    {id:'cf-worker',title:'Cache-First Worker',section:'Getting Started',lang:'typescript',
    content:[
      {type:'h2',text:'Workers at the edge'},
      {type:'p',text:'A Cloudflare Worker runs in V8 isolates at the edge — no containers, no cold start. It uses Web Standard APIs: fetch, Request, Response, URL, crypto. Bindings (KV, R2, D1) arrive via the env parameter.'},
      {type:'code',lang:'typescript',text:'export default {\n  fetch(req: Request, env: Env) {\n    return new Response("Hello from the edge!")\n  }\n} satisfies ExportedHandler<Env>'},
      {type:'tip',text:'ctx.waitUntil() lets you run async work — like writing to KV — after returning the response. The response is sent immediately; the background work continues.'},
    ],
    starter:'export interface Env {\n  CACHE: KVNamespace\n  ORIGIN: string\n}\n\nexport default {\n  async fetch(req: Request, env: Env, ctx: ExecutionContext) {\n    // implement cache-first fetch\n  }\n} satisfies ExportedHandler<Env>',
    solution:'export interface Env {\n  CACHE: KVNamespace\n  ORIGIN: string\n}\n\nexport default {\n  async fetch(req: Request, env: Env, ctx: ExecutionContext) {\n    const key  = new URL(req.url).pathname\n    const hit  = await env.CACHE.get(key, "text")\n    if (hit) return new Response(hit, { headers: { "X-Cache": "HIT" } })\n    const res  = await fetch(`${env.ORIGIN}${key}`)\n    const body = await res.text()\n    ctx.waitUntil(env.CACHE.put(key, body, { expirationTtl: 60 }))\n    return new Response(body, { headers: { "X-Cache": "MISS" } })\n  }\n} satisfies ExportedHandler<Env>',
    tasks:[
      {id:'t1',label:'Check KV cache with env.CACHE.get()',check:c=>c.includes('CACHE.get')},
      {id:'t2',label:'Return cached response with X-Cache: HIT',check:c=>c.includes('"HIT"')||c.includes("'HIT'")},
      {id:'t3',label:'Store response using ctx.waitUntil + CACHE.put',check:c=>c.includes('waitUntil')&&c.includes('CACHE.put')},
    ],
    output:'GET / (cold)  → ORIGIN 143ms → KV cached 60s  X-Cache: MISS\nGET / (warm)  → KV 4ms                        X-Cache: HIT\nGET / (warm)  → KV 3ms                        X-Cache: HIT'},
  ]},
];

// ── Tokenizer ─────────────────────────────────────────────────────────────────
const RAW = {
  nushell:[[/#.*$/,'#565f89'],[/\b(def|let|mut|if|else|for|each|where|select|return|use|export|from|into|match|true|false|null)\b/,'#bb9af7'],[/\b(ls|ps|cd|echo|print|http|open|sort-by|group-by|length|first|last|math|describe|str)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/'(?:[^'\\]|\\.)*'/,'#9ece6a'],[/\$[\w_]+/,'#7dcfff'],[/--[\w-]+|-[a-zA-Z]\b/,'#7dcfff'],[/\b\d+(\.\d+)?(\s*(MB|GB|KB|ms|s))?\b/,'#ff9e64'],[/[|&;=<>!+\-*/^%]/,'#89ddff'],[/[{}()\[\],]/,'#a9b1d6']],
  bash:[[/#.*$/,'#565f89'],[/\b(if|then|else|fi|for|while|do|done|function|return|local|export|set)\b/,'#bb9af7'],[/\b(echo|printf|cd|ls|grep|sed|find|sort|xargs|curl|mkdir|rm)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/'[^']*'/,'#9ece6a'],[/\$\{[^}]+\}|\$[\w_@#?*0-9]+/,'#7dcfff'],[/--[\w-]+|-[a-zA-Z]+\b/,'#7dcfff'],[/\b\d+\b/,'#ff9e64'],[/[|&;><+=\-*/\\]/,'#89ddff']],
  rust:[[/\/\/.*$/,'#565f89'],[/\b(fn|let|mut|if|else|match|for|while|return|use|pub|struct|enum|impl|trait|async|await|move|type|const|unsafe|dyn|as|break)\b/,'#bb9af7'],[/\b(String|Vec|Option|Result|Box|Arc|HashMap|u8|u32|u64|usize|i32|i64|bool|str|Ok|Err|Some|None|true|false)\b/,'#2ac3de'],[/\b(println!|vec!|format!|assert!|panic!|todo!)/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/\b\d+(\.\d+)?/,'#ff9e64'],[/[A-Z][A-Za-z0-9_]*/,'#2ac3de'],[/[a-z_]\w*(?=\s*[(<])/,'#7aa2f7'],[/[=<>!+\-*/&|^%?:@]/,'#89ddff'],[/[{}()\[\],;.]/,'#a9b1d6']],
  typescript:[[/\/\/.*$/,'#565f89'],[/\b(const|let|var|function|class|interface|type|import|export|return|if|else|for|while|async|await|extends|from|as|satisfies|readonly|new)\b/,'#bb9af7'],[/\b(string|number|boolean|null|undefined|true|false|any|Record|Partial|Promise|Array)\b/,'#2ac3de'],[/\b(console|process|Object|Map|JSON|fetch|crypto|Response|Request|ExecutionContext|URL)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,'#9ece6a'],[/\b\d+(\.\d+)?\b/,'#ff9e64'],[/[A-Z][A-Za-z0-9_]*/,'#2ac3de'],[/[a-z_]\w*(?=\s*[(<])/,'#7aa2f7'],[/[=<>!+\-*/&|^%?:@]/,'#89ddff'],[/[{}()\[\],;.]/,'#a9b1d6']],
  vyos:[[/#.*$/,'#565f89'],[/\b(set|delete|commit|save|show|run|configure|exit)\b/,'#bb9af7'],[/\b(protocols|bgp|neighbor|address-family|route-map|policy|prefix-list)\b/,'#e0af68'],[/"[^"]*"/,'#9ece6a'],[/\b\d+(\.\d+){0,3}(\/\d+)?\b/,'#ff9e64']],
};
const COMPILED = {};
for (const [l,rules] of Object.entries(RAW)) COMPILED[l] = rules.map(([re,c])=>[new RegExp('^(?:'+re.source+')'),c]);

function tokLine(line,lang) {
  const rules=COMPILED[lang]||COMPILED.bash; const out=[]; let pos=0;
  while(pos<line.length){
    const sub=line.slice(pos); let hit=false;
    for(const [re,c] of rules){const m=re.exec(sub);if(m){out.push({t:m[0],c});pos+=m[0].length;hit=true;break;}}
    if(!hit){if(out.length&&out[out.length-1].c==='#c0caf5')out[out.length-1].t+=line[pos];else out.push({t:line[pos],c:'#c0caf5'});pos++;}
  }
  return out;
}
const tokCode=(code,lang)=>code.split('\n').map(l=>tokLine(l,lang));

// ── Small shared components ───────────────────────────────────────────────────
function LangBadge({lang}) {
  const c=LANG_CLR[lang]||'#565f89';
  return <span style={{fontSize:10,fontWeight:700,letterSpacing:'.06em',color:c,background:c+'20',border:`1px solid ${c}40`,padding:'1px 6px',borderRadius:4,...mono,textTransform:'uppercase'}}>{lang}</span>;
}
function CatBadge({cat,color}) {
  const c=color||T.purple;
  return <span style={{fontSize:10,fontWeight:600,color:c,background:c+'18',border:`1px solid ${c}35`,padding:'1px 7px',borderRadius:4,...sans}}>{cat}</span>;
}
function Pill({tag}) {
  return <span style={{fontSize:10,color:T.fgMuted,background:T.bgHL,border:`1px solid ${T.border}`,padding:'1px 6px',borderRadius:4}}>#{tag}</span>;
}
function HLCode({code,lang}) {
  const lines=useMemo(()=>tokCode(code||' ',lang),[code,lang]);
  return (
    <div style={{...mono,fontSize:13,lineHeight:1.65,padding:'14px 0',minWidth:'max-content'}}>
      {lines.map((toks,i)=>(
        <div key={i} style={{display:'flex',alignItems:'flex-start'}}>
          <span style={{userSelect:'none',minWidth:44,textAlign:'right',paddingRight:16,color:T.fgMuted,fontSize:11,paddingTop:1,flexShrink:0}}>{i+1}</span>
          <span style={{flex:1}}>{toks.map((tok,j)=><span key={j} style={{color:tok.c}}>{tok.t}</span>)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Ghost text editor ─────────────────────────────────────────────────────────
function GhostEditor({code,onChange,ghostRemainder,lang,readOnly}) {
  const taRef=useRef(null);

  // Build full display: user code + ghost remainder, track ghost boundary
  const displayLines=useMemo(()=>{
    const full=code+ghostRemainder;
    const lines=tokCode(full||' ',lang);
    const codeLen=code.length;
    let pos=0;
    return lines.map(lineToks=>{
      const result=lineToks.map(tok=>{
        const start=pos; pos+=tok.t.length;
        return {...tok,ghost:start>=codeLen};
      });
      pos++; // newline
      return result;
    });
  },[code,ghostRemainder,lang]);

  const handleKey=useCallback(e=>{
    if(e.key==='Tab'){
      e.preventDefault();
      const s=e.target.selectionStart, en=e.target.selectionEnd;
      const next=code.slice(0,s)+'  '+code.slice(en);
      onChange(next);
      setTimeout(()=>{if(taRef.current){taRef.current.selectionStart=taRef.current.selectionEnd=s+2;}},0);
    }
  },[code,onChange]);

  return (
    <div style={{position:'relative',flex:1,overflow:'auto',background:T.bgPanel}}>
      {/* Highlight + ghost layer */}
      <div style={{position:'absolute',top:0,left:0,right:0,pointerEvents:'none',padding:'14px 0',...mono,fontSize:13,lineHeight:1.65,minWidth:'max-content',minHeight:'100%'}}>
        {displayLines.map((toks,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start'}}>
            <span style={{userSelect:'none',minWidth:44,textAlign:'right',paddingRight:16,color:T.fgMuted,fontSize:11,paddingTop:1,flexShrink:0}}>{i+1}</span>
            <span>{toks.map((tok,j)=><span key={j} style={{color:tok.c,opacity:tok.ghost?0.32:1}}>{tok.t}</span>)}</span>
          </div>
        ))}
      </div>
      {/* Transparent input layer */}
      <textarea ref={taRef} value={code} onChange={e=>onChange(e.target.value)} onKeyDown={handleKey}
        readOnly={readOnly} spellCheck={false}
        style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'transparent',
          color:'transparent',caretColor:readOnly?'transparent':T.blue,
          padding:'14px 14px 14px 60px',...mono,fontSize:13,lineHeight:1.65,
          border:'none',outline:'none',resize:'none',zIndex:2,boxSizing:'border-box',
          minHeight:'100%',whiteSpace:'pre',overflowWrap:'normal',cursor:readOnly?'default':'text'}}/>
    </div>
  );
}

// ── Content renderer ───────────────────────────────────────────────────────────
function ContentBlock({blocks,lang}) {
  return blocks.map((b,i)=>{
    if(b.type==='h2') return <div key={i} style={{fontSize:17,fontWeight:600,color:T.fg,marginBottom:10,marginTop:i>0?18:0,lineHeight:1.3}}>{b.text}</div>;
    if(b.type==='p')  return <div key={i} style={{fontSize:13,color:T.fgDim,lineHeight:1.8,marginBottom:14}}>{b.text}</div>;
    if(b.type==='code') return (
      <div key={i} style={{background:T.bgDark,border:`1px solid ${T.border}`,borderRadius:6,overflowX:'auto',marginBottom:14}}>
        <HLCode code={b.text} lang={b.lang||lang}/>
      </div>
    );
    if(b.type==='tip') return (
      <div key={i} style={{background:T.teal+'12',border:`1px solid ${T.teal}30`,borderLeft:`3px solid ${T.teal}`,borderRadius:6,padding:'10px 12px',marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,color:T.teal,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Tip</div>
        <div style={{fontSize:12,color:T.fgDim,lineHeight:1.7}}>{b.text}</div>
      </div>
    );
    return null;
  });
}

// ── Task list ─────────────────────────────────────────────────────────────────
function TaskList({tasks,code}) {
  const checks=tasks.map(t=>({...t,done:t.check(code)}));
  const all=checks.every(t=>t.done);
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,color:T.fgMuted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Assignment</div>
      {checks.map(t=>(
        <div key={t.id} style={{...row,gap:8,alignItems:'flex-start',marginBottom:8}}>
          <div style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${t.done?T.green:T.border}`,
            background:t.done?T.green+'18':'transparent',...row,alignItems:'center',justifyContent:'center',
            flexShrink:0,marginTop:1,transition:'all .2s'}}>
            {t.done&&<CheckCircle size={11} color={T.green}/>}
          </div>
          <span style={{fontSize:12,color:t.done?T.fg:T.fgDim,lineHeight:1.55,
            textDecoration:t.done?'line-through':'none',opacity:t.done?0.7:1,transition:'all .2s'}}>
            {t.label}
          </span>
        </div>
      ))}
      {all&&(
        <div style={{marginTop:12,padding:'8px 12px',background:T.green+'15',border:`1px solid ${T.green}30`,borderRadius:6,fontSize:12,color:T.green}}>
          All tasks complete — try the next lesson or raise the level.
        </div>
      )}
    </div>
  );
}

// ── Speed run bar ─────────────────────────────────────────────────────────────
function SpeedBar({level,setLevel,timer,par}) {
  const lv=LEVELS[level-1];
  const remaining=par?Math.max(0,par-timer):null;
  const pct=par?Math.min(timer/par,1):0;
  const urgent=remaining!==null&&remaining<15;
  const fmt=s=>s==null?'--:--':`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  return (
    <div style={{...row,gap:10,padding:'5px 14px',borderBottom:`1px solid ${T.border}`,background:T.bgDark,flexShrink:0}}>
      <div style={{...row,gap:3}}>
        {LEVELS.map(l=>(
          <button key={l.n} onClick={()=>setLevel(l.n)} style={{
            width:26,height:22,borderRadius:4,border:`1px solid ${level===l.n?l.color:T.border}`,
            background:level===l.n?l.color+'22':'transparent',
            color:level===l.n?l.color:T.fgMuted,
            fontSize:10,fontWeight:700,cursor:'pointer',...mono,transition:'all .15s'}}>
            {l.n}
          </button>
        ))}
      </div>
      <span style={{fontSize:11,color:T.fgMuted,...sans}}>{lv.desc}</span>
      {par&&(
        <div style={{...row,gap:8,marginLeft:'auto'}}>
          <div style={{width:80,height:3,background:T.border,borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct*100}%`,background:urgent?T.red:lv.color,transition:'width .9s linear',borderRadius:2}}/>
          </div>
          <div style={{...mono,fontSize:12,color:urgent?T.red:T.fgDim,minWidth:38}}>{fmt(remaining)}</div>
          <Clock size={11} color={urgent?T.red:T.fgMuted}/>
        </div>
      )}
    </div>
  );
}

// ── Ask Claude panel ──────────────────────────────────────────────────────────
function AskPanel({lesson,code,onClose}) {
  const [msgs,setMsgs]=useState([]);
  const [inp,setInp]=useState('');
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const send=async()=>{
    const q=inp.trim(); if(!q) return;
    setInp(''); setMsgs(p=>[...p,{role:'user',text:q}]); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:600,
          messages:[{role:"user",content:`I'm working through a snipx tutorial on ${lesson.title}.\n\nTasks:\n${lesson.tasks.map(t=>'- '+t.label).join('\n')}\n\nMy code so far:\n\`\`\`${lesson.lang}\n${code||'(empty)'}\n\`\`\`\n\nQuestion: ${q}\n\nBe concise. Don't give away the full solution — guide me. Speak like a knowledgeable peer.`}]
        })
      });
      const data=await res.json();
      setMsgs(p=>[...p,{role:'ai',text:data.content?.[0]?.text||'No response.'}]);
    } catch(e) {
      setMsgs(p=>[...p,{role:'err',text:'Connection failed.'}]);
    }
    setLoading(false);
  };

  return (
    <div style={{...col,width:290,flexShrink:0,borderLeft:`1px solid ${T.border}`,background:T.bgDark}}>
      <div style={{...row,justifyContent:'space-between',padding:'0 14px',height:38,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{...row,gap:6}}>
          <MessageSquare size={12} color={T.purple}/>
          <span style={{...sans,fontSize:12,color:T.purple,fontWeight:600}}>Ask Claude</span>
        </div>
        <X size={13} color={T.fgMuted} style={{cursor:'pointer'}} onClick={onClose}/>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'10px 12px',...col,gap:8}}>
        {msgs.length===0&&<div style={{fontSize:12,color:T.fgMuted,lineHeight:1.7}}>Ask anything — hints, concepts, why your code isn't working. Claude won't give away the answer directly.</div>}
        {msgs.map((m,i)=>(
          <div key={i} style={{padding:'7px 10px',borderRadius:6,fontSize:12,lineHeight:1.65,
            background:m.role==='user'?T.blue+'18':m.role==='err'?T.red+'15':T.bgHL,
            border:`1px solid ${m.role==='user'?T.blue+'30':m.role==='err'?T.red+'30':T.border}`,
            color:m.role==='err'?T.red:T.fg,
            alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'95%',whiteSpace:'pre-wrap'}}>
            {m.text}
          </div>
        ))}
        {loading&&<div style={{fontSize:12,color:T.fgMuted,fontStyle:'italic'}}>thinking...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{...row,padding:'8px 12px',borderTop:`1px solid ${T.border}`,gap:8,flexShrink:0}}>
        <input value={inp} onChange={e=>setInp(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask a question..." style={{flex:1,background:T.bgHL,border:`1px solid ${T.border}`,
            borderRadius:5,padding:'5px 9px',color:T.fg,fontSize:12,...sans,outline:'none'}}/>
        <button onClick={send} disabled={loading||!inp.trim()} style={{...row,padding:'5px 9px',borderRadius:5,
          background:T.purple+'20',border:`1px solid ${T.purple}40`,color:T.purple,
          fontSize:11,...sans,cursor:'pointer',flexShrink:0,opacity:loading||!inp.trim()?0.5:1}}>
          Send
        </button>
      </div>
    </div>
  );
}

// ── REPL ──────────────────────────────────────────────────────────────────────
const WELCOME=[
  {k:'info',v:'  ╭─────────────────────────────────────────────╮'},
  {k:'info',v:'  │  snipx v0.2.0  ·  snippets · docs · bookmarks│'},
  {k:'info',v:"  │  Type 'help' for available commands          │"},
  {k:'info',v:'  ╰─────────────────────────────────────────────╯'},
];
const LC={input:T.fg,info:T.cyan,ok:T.green,err:T.red,row:T.fgDim,cmd:T.fgDim};

// ── Form defs ─────────────────────────────────────────────────────────────────
const FORM_DEFS={
  snippet:[
    {k:'title',label:'Title',type:'text',req:true},
    {k:'desc',label:'Desc',type:'text',req:false},
    {k:'lang',label:'Language',type:'select',req:true,opts:['nushell','bash','rust','typescript','vyos','yaml']},
    {k:'cat',label:'Category',type:'select',req:true,opts:['Nushell','Shell','Rust','TypeScript','Cloudflare','Git','VyOS']},
    {k:'tags',label:'Tags',type:'text',req:false,hint:'comma-separated'},
    {k:'code',label:'Code',type:'textarea',req:true},
  ],
  doc:[
    {k:'title',label:'Title',type:'text',req:true},
    {k:'url',label:'URL',type:'text',req:true},
    {k:'desc',label:'Desc',type:'text',req:false},
    {k:'lang',label:'Language',type:'select',req:false,opts:['nushell','bash','rust','typescript','sh']},
    {k:'cat',label:'Category',type:'select',req:true,opts:DOC_CATS.slice(1)},
    {k:'topics',label:'Topics',type:'text',req:false,hint:'comma-separated'},
    {k:'tags',label:'Tags',type:'text',req:false,hint:'comma-separated'},
    {k:'notes',label:'Notes',type:'textarea',req:false},
  ],
  bookmark:[
    {k:'title',label:'Title',type:'text',req:true},
    {k:'url',label:'URL',type:'text',req:true},
    {k:'desc',label:'Desc',type:'textarea',req:false},
    {k:'cat',label:'Category',type:'select',req:true,opts:BM_CATS.slice(1)},
    {k:'tags',label:'Tags',type:'text',req:false,hint:'comma-separated'},
    {k:'notes',label:'Notes',type:'textarea',req:false},
  ],
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [height,setHeight]=useState(window.innerHeight);
  const [mode,setMode]=useState('snippets');
  const [snips,setSnips]=useState(INIT_SNIPS);
  const [docs,setDocs]=useState(INIT_DOCS);
  const [bms,setBms]=useState(INIT_BOOKMARKS);
  const [selSnip,setSelSnip]=useState('nu-pipeline');
  const [selDoc,setSelDoc]=useState('doc-nu-book');
  const [selBm,setSelBm]=useState('bm-cf-workers-internals');
  const [snipCat,setSnipCat]=useState('All');
  const [docCat,setDocCat]=useState('All');
  const [bmCat,setBmCat]=useState('All');
  const [q,setQ]=useState('');
  const [replOpen,setReplOpen]=useState(true);
  const [replH,setReplH]=useState(210);
  const [lines,setLines]=useState(WELCOME);
  const [inp,setInp]=useState('');
  const [iHist,setIHist]=useState([]);
  const [hIdx,setHIdx]=useState(-1);
  const [copied,setCopied]=useState(false);
  const [addMode,setAddMode]=useState(null);
  const [form,setForm]=useState({});
  const [formErr,setFormErr]=useState({});

  // Learn state
  const [learnChap,setLearnChap]=useState('nushell');
  const [learnLes,setLearnLes]=useState('nu-pipelines');
  const [edCode,setEdCode]=useState('');
  const [runOut,setRunOut]=useState(null);
  const [running,setRunning]=useState(false);
  const [speedLvl,setSpeedLvl]=useState(1);
  const [timer,setTimer]=useState(0);
  const [timerOn,setTimerOn]=useState(false);
  const [showAns,setShowAns]=useState(false);
  const [askOpen,setAskOpen]=useState(false);
  const [lessonsDone,setLessonsDone]=useState({});

  const searchRef=useRef(null);
  const replRef=useRef(null);
  const endRef=useRef(null);

  // Inject styles
  useEffect(()=>{
    const onR=()=>setHeight(window.innerHeight);
    window.addEventListener('resize',onR);
    const s=document.createElement('style');
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#3b4261;border-radius:3px}
@keyframes si{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
@keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
.si{animation:si .12s ease both}.fi{animation:fi .15s ease both}
input,textarea,select{outline:none}input::placeholder,textarea::placeholder{color:#565f89}button:active{transform:scale(0.97)}`;
    document.head.appendChild(s);
    return()=>{window.removeEventListener('resize',onR);document.head.removeChild(s);};
  },[]);

  useEffect(()=>{
    const h=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();searchRef.current?.focus();}
      if((e.metaKey||e.ctrlKey)&&e.key==='`'){e.preventDefault();setReplOpen(v=>!v);}
    };
    document.addEventListener('keydown',h);
    return()=>document.removeEventListener('keydown',h);
  },[]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[lines]);

  // ── Learn: current lesson ──
  const curChap=useMemo(()=>LEARN.find(c=>c.id===learnChap)||LEARN[0],[learnChap]);
  const curLes=useMemo(()=>curChap.lessons.find(l=>l.id===learnLes)||curChap.lessons[0],[curChap,learnLes]);
  const lvCfg=LEVELS[speedLvl-1];

  const taskStatus=useMemo(()=>curLes.tasks.map(t=>({...t,done:t.check(edCode)})),[edCode,curLes]);
  const allDone=taskStatus.every(t=>t.done);

  // Ghost text: remaining solution after what user has typed
  const ghostRem=useMemo(()=>{
    if(showAns) return '';
    if(!lvCfg.ghost&&!lvCfg.firstLine) return '';
    const sol=curLes.solution;
    if(lvCfg.firstLine) return sol.split('\n')[0];
    const trimmed=edCode.trimEnd();
    if(trimmed==='') return sol;
    if(sol.startsWith(trimmed)) return sol.slice(trimmed.length);
    return '';
  },[edCode,curLes,lvCfg,showAns]);

  // Timer
  useEffect(()=>{
    if(!timerOn) return;
    const id=setInterval(()=>setTimer(t=>t+1),1000);
    return()=>clearInterval(id);
  },[timerOn]);

  useEffect(()=>{
    setTimer(0); setTimerOn(speedLvl>=2);
  },[speedLvl,curLes.id]);

  useEffect(()=>{
    setEdCode(speedLvl===1?curLes.starter:'');
    setRunOut(null); setShowAns(false); setTimer(0);
  },[curLes.id,speedLvl]);

  useEffect(()=>{
    if(allDone&&!lessonsDone[curLes.id]) setLessonsDone(p=>({...p,[curLes.id]:true}));
  },[allDone,curLes.id]);

  // Flat lessons for prev/next
  const flatLes=useMemo(()=>LEARN.flatMap(c=>c.lessons.map(l=>({...l,chapId:c.id}))),[]);
  const curIdx=flatLes.findIndex(l=>l.id===curLes.id);
  const prevLes=flatLes[curIdx-1];
  const nextLes=flatLes[curIdx+1];
  const goTo=useCallback(l=>{
    const ch=LEARN.find(c=>c.lessons.some(x=>x.id===l.id));
    if(ch){setLearnChap(ch.id);setLearnLes(l.id);}
  },[]);

  const doRun=useCallback(()=>{
    setRunning(true); setRunOut(null);
    setTimeout(()=>{setRunOut(curLes.output);setRunning(false);},400);
  },[curLes]);

  const switchMode=useCallback(m=>{setMode(m);setQ('');setAddMode(null);},[]);

  // ── Snippet/doc/bookmark filters ──
  const ql=q.toLowerCase();
  const filtSnips=useMemo(()=>snips.filter(s=>{
    const mc=snipCat==='All'||(snipCat==='★'?s.fav:s.cat===snipCat);
    return mc&&(!ql||s.title.toLowerCase().includes(ql)||s.tags.some(t=>t.includes(ql))||s.desc.toLowerCase().includes(ql));
  }),[snips,snipCat,ql]);
  const filtDocs=useMemo(()=>docs.filter(d=>{
    const mc=docCat==='All'||(docCat==='★'?d.fav:d.cat===docCat);
    return mc&&(!ql||d.title.toLowerCase().includes(ql)||d.tags.some(t=>t.includes(ql))||d.desc.toLowerCase().includes(ql));
  }),[docs,docCat,ql]);
  const filtBms=useMemo(()=>bms.filter(b=>{
    const mc=bmCat==='All'||(bmCat==='★'?b.fav:b.cat===bmCat);
    return mc&&(!ql||b.title.toLowerCase().includes(ql)||b.tags.some(t=>t.includes(ql))||b.desc.toLowerCase().includes(ql));
  }),[bms,bmCat,ql]);

  useEffect(()=>{if(filtSnips.length&&!filtSnips.find(s=>s.id===selSnip))setSelSnip(filtSnips[0].id);},[filtSnips]);
  useEffect(()=>{if(filtDocs.length&&!filtDocs.find(d=>d.id===selDoc))setSelDoc(filtDocs[0].id);},[filtDocs]);
  useEffect(()=>{if(filtBms.length&&!filtBms.find(b=>b.id===selBm))setSelBm(filtBms[0].id);},[filtBms]);

  const selSnipObj=snips.find(s=>s.id===selSnip);
  const selDocObj=docs.find(d=>d.id===selDoc);
  const selBmObj=bms.find(b=>b.id===selBm);

  const toggleFav=useCallback((id,type)=>{
    if(type==='snippet')setSnips(p=>p.map(s=>s.id===id?{...s,fav:!s.fav}:s));
    else if(type==='doc')setDocs(p=>p.map(d=>d.id===id?{...d,fav:!d.fav}:d));
    else setBms(p=>p.map(b=>b.id===id?{...b,fav:!b.fav}:b));
  },[]);

  const doCopy=useCallback(async()=>{
    if(!selSnipObj)return;
    await navigator.clipboard.writeText(selSnipObj.code);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  },[selSnipObj]);

  // REPL
  const processCmd=useCallback(raw=>{
    const parts=raw.trim().split(/\s+/);const verb=parts[0]?.toLowerCase();const arg=parts.slice(1).join(' ');
    switch(verb){
      case 'help':return[
        {k:'info',v:'╭── snipx commands ──────────────────────────────────╮'},
        {k:'cmd',v:'  list [cat]     list snippets by category'},
        {k:'cmd',v:'  show <id>      open item in viewer'},
        {k:'cmd',v:'  search <q>     search all items'},
        {k:'cmd',v:'  copy <id>      copy snippet code'},
        {k:'cmd',v:'  fav <id>       toggle favorite'},
        {k:'cmd',v:'  tags           list all tags'},
        {k:'cmd',v:'  clear          clear terminal'},
        {k:'info',v:'╰────────────────────────────────────────────────────╯'},
      ];
      case 'clear':return null;
      case 'list':{const list=snips.filter(s=>!arg||s.cat.toLowerCase()===arg.toLowerCase());
        if(!list.length)return[{k:'err',v:`No snippets in: ${arg}`}];
        return[{k:'info',v:`${list.length} snippets:`},...list.map(s=>({k:'row',v:`  ${s.id.padEnd(20)} ${s.lang.padEnd(12)} ${s.title}`}))];}
      case 'search':{if(!arg)return[{k:'err',v:'usage: search <query>'}];
        const ql2=arg.toLowerCase();const r=snips.filter(s=>s.title.toLowerCase().includes(ql2)||s.tags.some(t=>t.includes(ql2)));
        if(!r.length)return[{k:'err',v:`No results for "${arg}"`}];
        return[{k:'info',v:`${r.length} results:`},...r.map(s=>({k:'row',v:`  ${s.id.padEnd(20)} ${s.title}`}))];}
      case 'show':{const s=snips.find(s=>s.id===arg);if(!s)return[{k:'err',v:`Not found: ${arg}`}];
        setSelSnip(arg);switchMode('snippets');return[{k:'ok',v:`Opened: ${s.title}`}];}
      case 'copy':{const s=snips.find(s=>s.id===arg);if(!s)return[{k:'err',v:`Not found: ${arg}`}];
        navigator.clipboard.writeText(s.code);return[{k:'ok',v:`Copied: "${s.title}"`}];}
      case 'fav':{const s=snips.find(s=>s.id===arg);if(!s)return[{k:'err',v:`Not found: ${arg}`}];
        const was=s.fav;toggleFav(arg,'snippet');return[{k:'ok',v:`${was?'Removed from':'Added to'} favorites: "${s.title}"`}];}
      case 'tags':{const tags=[...new Set(snips.flatMap(s=>s.tags))].sort();
        return[{k:'info',v:`${tags.length} tags:`},{k:'row',v:'  '+tags.map(t=>`#${t}`).join('  ')}];}
      default:return[{k:'err',v:`Unknown: "${verb}". Type 'help'.`}];
    }
  },[snips,toggleFav,switchMode]);

  const submitRepl=useCallback(override=>{
    const cmd=(override??inp).trim();if(!cmd)return;
    const res=processCmd(cmd);
    setLines(p=>res===null?WELCOME:[...p,{k:'input',v:cmd},...(res||[])]);
    if(!override){setIHist(p=>[cmd,...p.filter(c=>c!==cmd).slice(0,49)]);setHIdx(-1);setInp('');}
  },[inp,processCmd]);

  const onReplKey=useCallback(e=>{
    if(e.key==='Enter'){e.preventDefault();submitRepl();}
    else if(e.key==='ArrowUp'){e.preventDefault();const i=Math.min(hIdx+1,iHist.length-1);setHIdx(i);if(iHist[i]!==undefined)setInp(iHist[i]);}
    else if(e.key==='ArrowDown'){e.preventDefault();const i=Math.max(hIdx-1,-1);setHIdx(i);setInp(i===-1?'':iHist[i]);}
  },[submitRepl,hIdx,iHist]);

  const startDrag=useCallback(e=>{
    e.preventDefault();const sy=e.clientY,sh=replH;
    const move=e=>setReplH(Math.max(130,Math.min(480,sh+sy-e.clientY)));
    const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
  },[replH]);

  // Add form
  const openAdd=useCallback(type=>{setAddMode(type);setForm({});setFormErr({});},[]);
  const setF=useCallback((k,v)=>setForm(p=>({...p,[k]:v})),[]);
  const saveForm=useCallback(()=>{
    const defs=FORM_DEFS[addMode]||[];const err={};
    defs.forEach(d=>{if(d.req&&!form[d.k]?.trim())err[d.k]='Required';});
    if(Object.keys(err).length){setFormErr(err);return;}
    const tags=(form.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
    const id=`${addMode}-${Date.now()}`;
    if(addMode==='snippet'){
      const n={id,title:form.title||'',desc:form.desc||'',lang:form.lang||'bash',cat:form.cat||'Shell',tags,fav:false,code:form.code||''};
      setSnips(p=>[n,...p]);setSelSnip(id);switchMode('snippets');
    } else if(addMode==='doc'){
      const topics=(form.topics||'').split(',').map(t=>t.trim()).filter(Boolean);
      const n={id,title:form.title||'',desc:form.desc||'',url:form.url||'',lang:form.lang||'',cat:form.cat||'Tools',topics,tags,fav:false,notes:form.notes||''};
      setDocs(p=>[n,...p]);setSelDoc(id);switchMode('docs');
    } else {
      const n={id,title:form.title||'',url:form.url||'',desc:form.desc||'',cat:form.cat||'Reference',tags,date:new Date().toISOString().slice(0,10),fav:false,notes:form.notes||''};
      setBms(p=>[n,...p]);setSelBm(id);switchMode('bookmarks');
    }
    setAddMode(null);
  },[addMode,form,switchMode]);

  // Counts
  const snipCats=useMemo(()=>{const c={All:snips.length};snips.forEach(s=>{c[s.cat]=(c[s.cat]||0)+1;});return c;},[snips]);
  const docCats=useMemo(()=>{const c={All:docs.length};docs.forEach(d=>{c[d.cat]=(c[d.cat]||0)+1;});return c;},[docs]);
  const bmCats=useMemo(()=>{const c={All:bms.length};bms.forEach(b=>{c[b.cat]=(c[b.cat]||0)+1;});return c;},[bms]);
  const favCounts=useMemo(()=>({s:snips.filter(s=>s.fav).length,d:docs.filter(d=>d.fav).length,b:bms.filter(b=>b.fav).length}),[snips,docs,bms]);

  const cats=mode==='snippets'?SNIP_CATS:mode==='docs'?DOC_CATS:BM_CATS;
  const icons=mode==='snippets'?SNIP_ICONS:mode==='docs'?DOC_ICONS:BM_ICONS;
  const curCat=mode==='snippets'?snipCat:mode==='docs'?docCat:bmCat;
  const setCat=mode==='snippets'?setSnipCat:mode==='docs'?setDocCat:setBmCat;
  const catCnts=mode==='snippets'?snipCats:mode==='docs'?docCats:bmCats;
  const favCnt=mode==='snippets'?favCounts.s:mode==='docs'?favCounts.d:favCounts.b;
  const filtered=mode==='snippets'?filtSnips:mode==='docs'?filtDocs:filtBms;

  const inp0={width:'100%',background:T.bgHL,border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',color:T.fg,fontSize:13,...sans};
  const lab={fontSize:11,fontWeight:500,color:T.fgMuted,letterSpacing:'.04em',marginBottom:4};
  const btn=(active,clr)=>({...row,gap:5,padding:'5px 11px',borderRadius:6,border:`1px solid ${active?clr+'55':T.border}`,background:active?clr+'18':'transparent',color:active?clr:T.fgDim,fontSize:12,...sans,fontWeight:500,cursor:'pointer',transition:'all .15s'});

  const MODES=[
    {id:'snippets',label:'Snippets',icon:Code,accent:T.blue},
    {id:'docs',label:'Docs',icon:BookOpen,accent:T.purple},
    {id:'bookmarks',label:'Bookmarks',icon:Bookmark,accent:T.teal},
    {id:'learn',label:'Learn',icon:Zap,accent:T.yellow},
  ];
  const modeAccent=mode==='snippets'?T.blue:mode==='docs'?T.purple:mode==='bookmarks'?T.teal:T.yellow;

  const SideItem=({label,cnt,active,onClick,Icon,accent})=>(
    <div onClick={onClick} style={{...row,gap:9,padding:'7px 12px',cursor:'pointer',
      borderLeft:`2px solid ${active?accent||T.blue:'transparent'}`,
      background:active?T.bgActive:'transparent',color:active?T.fg:T.fgDim,transition:'all .1s'}}>
      <Icon size={13} color={active?accent||T.blue:T.fgMuted} strokeWidth={active?2.5:2}/>
      <span style={{flex:1,fontSize:13,fontWeight:active?500:400}}>{label}</span>
      <span style={{fontSize:10,color:T.fgMuted,background:T.bgHL,padding:'1px 5px',borderRadius:3,...mono}}>{cnt||0}</span>
    </div>
  );

  const DocDetail=({d})=>{
    const accent=LANG_CLR[d.lang]||T.purple;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:6,overflow:'hidden'}}>
            <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{d.cat}</span>
            <ChevronRight size={11} color={T.fgMuted}/>
            <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title}</span>
          </div>
          <div style={{...row,gap:7,flexShrink:0}}>
            <button onClick={()=>toggleFav(d.id,'doc')} style={btn(d.fav,T.yellow)}><Star size={12} fill={d.fav?T.yellow:'none'} color={d.fav?T.yellow:T.fgMuted}/></button>
            <a href={d.url} target="_blank" rel="noreferrer" style={{...row,gap:5,padding:'4px 10px',borderRadius:5,background:T.purple+'18',border:`1px solid ${T.purple}35`,color:T.purple,fontSize:11,...sans,fontWeight:500,textDecoration:'none'}}>
              <ExternalLink size={11}/> Open
            </a>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20}} className="fi">
          <div style={{fontSize:18,fontWeight:600,color:T.fg,marginBottom:8}}>{d.title}</div>
          <div style={{...mono,fontSize:11,color:T.teal,background:T.teal+'12',border:`1px solid ${T.teal}30`,padding:'5px 10px',borderRadius:6,marginBottom:14,display:'inline-block',wordBreak:'break-all'}}>{d.url}</div>
          <div style={{fontSize:13,color:T.fgDim,lineHeight:1.75,marginBottom:16}}>{d.desc}</div>
          <div style={{...row,gap:5,flexWrap:'wrap',marginBottom:16}}>
            {d.lang&&<LangBadge lang={d.lang}/>}<CatBadge cat={d.cat} color={T.purple}/>
            {d.topics?.map(t=><span key={t} style={{fontSize:10,color:T.teal,background:T.teal+'15',border:`1px solid ${T.teal}30`,padding:'1px 7px',borderRadius:4}}>{t}</span>)}
            {d.tags?.map(t=><Pill key={t} tag={t}/>)}
          </div>
          {d.notes&&<div style={{background:T.bgHL,border:`1px solid ${T.border}`,borderLeft:`3px solid ${accent}`,borderRadius:6,padding:'12px 14px'}}>
            <div style={{fontSize:10,fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Quick Notes</div>
            <div style={{fontSize:12,...mono,color:T.fgDim,lineHeight:1.9,whiteSpace:'pre-wrap'}}>{d.notes}</div>
          </div>}
        </div>
        <div style={{...row,gap:10,padding:'0 16px',height:28,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
          {d.lang&&<LangBadge lang={d.lang}/>}<span>{d.topics?.join(' · ')}</span>
          <span style={{marginLeft:'auto',...mono,fontSize:10}}>{d.id}</span>
        </div>
      </div>
    );
  };

  const BmDetail=({b})=>{
    const cc={Articles:T.blue,Repos:T.orange,Tools:T.green,Reference:T.purple};
    const accent=cc[b.cat]||T.teal;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:6,overflow:'hidden'}}>
            <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{b.cat}</span>
            <ChevronRight size={11} color={T.fgMuted}/>
            <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</span>
          </div>
          <div style={{...row,gap:7,flexShrink:0}}>
            <button onClick={()=>toggleFav(b.id,'bookmark')} style={btn(b.fav,T.yellow)}><Star size={12} fill={b.fav?T.yellow:'none'} color={b.fav?T.yellow:T.fgMuted}/></button>
            <a href={b.url} target="_blank" rel="noreferrer" style={{...row,gap:5,padding:'4px 10px',borderRadius:5,background:accent+'18',border:`1px solid ${accent}35`,color:accent,fontSize:11,...sans,fontWeight:500,textDecoration:'none'}}>
              <ExternalLink size={11}/> Open
            </a>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20}} className="fi">
          <div style={{...row,gap:10,marginBottom:12}}>
            <div style={{width:38,height:38,borderRadius:8,background:accent+'18',border:`1px solid ${accent}35`,...row,justifyContent:'center',flexShrink:0}}><Link size={16} color={accent}/></div>
            <div><div style={{fontSize:16,fontWeight:600,color:T.fg,marginBottom:3}}>{b.title}</div><CatBadge cat={b.cat} color={accent}/></div>
          </div>
          <div style={{...mono,fontSize:11,color:T.cyan,background:T.cyan+'10',border:`1px solid ${T.cyan}25`,padding:'5px 10px',borderRadius:6,marginBottom:14,wordBreak:'break-all',display:'inline-block'}}>{b.url}</div>
          <div style={{fontSize:13,color:T.fgDim,lineHeight:1.75,marginBottom:14}}>{b.desc}</div>
          <div style={{...row,gap:5,flexWrap:'wrap',marginBottom:14}}>{b.tags?.map(t=><Pill key={t} tag={t}/>)}</div>
          {b.notes&&<div style={{background:T.bgHL,border:`1px solid ${T.border}`,borderLeft:`3px solid ${accent}`,borderRadius:6,padding:'12px 14px',marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Notes</div>
            <div style={{fontSize:12,...mono,color:T.fgDim,lineHeight:1.9,whiteSpace:'pre-wrap'}}>{b.notes}</div>
          </div>}
          <div style={{fontSize:11,color:T.fgMuted,...mono}}>Added {b.date}</div>
        </div>
        <div style={{...row,gap:10,padding:'0 16px',height:28,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
          <CatBadge cat={b.cat} color={accent}/><span>{b.tags?.slice(0,3).map(t=>`#${t}`).join(' ')}</span>
          <span style={{marginLeft:'auto',...mono,fontSize:10}}>{b.id}</span>
        </div>
      </div>
    );
  };

  const AddFormPanel=()=>{
    const defs=FORM_DEFS[addMode]||[];
    const titles={snippet:'New Snippet',doc:'New Doc',bookmark:'New Bookmark'};
    const accents={snippet:T.blue,doc:T.purple,bookmark:T.teal};
    const acc=accents[addMode]||T.blue;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:8}}><Plus size={14} color={acc}/><span style={{fontSize:13,fontWeight:600,color:T.fg}}>{titles[addMode]}</span></div>
          <button onClick={()=>setAddMode(null)} style={{background:'none',border:'none',color:T.fgMuted,cursor:'pointer',padding:4}}><X size={15}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:18,...col,gap:12}}>
          {defs.map(d=>(
            <div key={d.k}>
              <div style={lab}>{d.label}{d.req&&<span style={{color:T.red}}> *</span>}{d.hint&&<span style={{fontWeight:400,opacity:.7}}> — {d.hint}</span>}</div>
              {d.type==='select'?(<select value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)} style={{...inp0,cursor:'pointer'}}><option value="">Select…</option>{(d.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>)
              :d.type==='textarea'?(<textarea value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)} rows={d.k==='code'?7:3} spellCheck={false} style={{...inp0,resize:'vertical',lineHeight:1.6,...(d.k==='code'?mono:{})}}/>)
              :(<input value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)} style={inp0}/>)}
              {formErr[d.k]&&<div style={{fontSize:11,color:T.red,marginTop:3}}>{formErr[d.k]}</div>}
            </div>
          ))}
        </div>
        <div style={{...row,gap:10,padding:'12px 18px',borderTop:`1px solid ${T.border}`,flexShrink:0,background:T.bgDark}}>
          <button onClick={saveForm} style={{...row,gap:6,padding:'7px 16px',borderRadius:6,background:acc+'22',border:`1px solid ${acc}55`,color:acc,fontSize:13,...sans,fontWeight:500,cursor:'pointer'}}>
            <CheckCircle size={13}/> Save
          </button>
          <button onClick={()=>setAddMode(null)} style={{padding:'7px 14px',borderRadius:6,background:'transparent',border:`1px solid ${T.border}`,color:T.fgMuted,fontSize:13,...sans,cursor:'pointer'}}>Cancel</button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{...col,height,background:T.bg,color:T.fg,...sans,overflow:'hidden',fontSize:13}}>

      {/* HEADER */}
      <div style={{...row,justifyContent:'space-between',height:48,padding:'0 16px',background:T.bgDark,borderBottom:`1px solid ${T.border}`,flexShrink:0,gap:12}}>
        <div style={{...row,gap:12}}>
          <div style={{...row,gap:6}}>
            {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=>(<div key={i} style={{width:12,height:12,borderRadius:6,background:c}}/>))}
          </div>
          <div style={{...row,gap:7}}>
            <Terminal size={14} color={T.blue}/>
            <span style={{...mono,fontWeight:700,fontSize:14,color:T.fg,letterSpacing:'.06em'}}>SNIPX</span>
            <span style={{fontSize:9,color:T.fgMuted,background:T.bgHL,padding:'2px 6px',borderRadius:4,...mono}}>v0.2.0</span>
          </div>
          <div style={{...row,gap:2,marginLeft:8,padding:'3px',background:T.bgHL,borderRadius:8,border:`1px solid ${T.border}`}}>
            {MODES.map(m=>{const Icon=m.icon;const act=mode===m.id;return(
              <button key={m.id} onClick={()=>switchMode(m.id)} style={{...row,gap:5,padding:'4px 10px',borderRadius:6,border:'none',background:act?m.accent+'22':'transparent',color:act?m.accent:T.fgMuted,fontSize:12,...sans,fontWeight:act?600:400,cursor:'pointer',transition:'all .15s'}}>
                <Icon size={12} strokeWidth={act?2.5:2}/>{m.label}
              </button>
            );})}
          </div>
        </div>
        {mode!=='learn'&&(
          <div style={{...row,gap:8,padding:'0 12px',borderRadius:8,background:T.bgHL,border:`1px solid ${T.border}`,width:260,height:32}}>
            <Search size={12} color={T.fgMuted}/>
            <input ref={searchRef} placeholder={`Search ${mode}…`} value={q} onChange={e=>setQ(e.target.value)}
              style={{background:'none',border:'none',outline:'none',color:T.fg,flex:1,fontSize:12,...sans}}/>
            {q?<X size={12} color={T.fgMuted} style={{cursor:'pointer'}} onClick={()=>setQ('')}/>
              :<span style={{...mono,fontSize:9,color:T.fgMuted,background:T.bgActive,padding:'1px 5px',borderRadius:3}}>⌘K</span>}
          </div>
        )}
        <div style={{...row,gap:7}}>
          {mode!=='learn'&&(
            <>
              <button onClick={()=>openAdd(mode==='snippets'?'snippet':mode==='docs'?'doc':'bookmark')} style={btn(false,modeAccent)}>
                <Plus size={12}/> Add {mode==='snippets'?'Snippet':mode==='docs'?'Doc':'Bookmark'}
              </button>
              <button onClick={()=>setReplOpen(v=>!v)} style={btn(replOpen,T.green1)}>
                <Terminal size={12}/> REPL
              </button>
            </>
          )}
          {mode==='learn'&&(
            <div style={{...row,gap:10,fontSize:11,color:T.fgMuted}}>
              <span style={{color:curChap.color,fontWeight:500}}>{curChap.title}</span>
              <span style={{color:T.border}}>·</span>
              <span style={{color:T.fg}}>{curLes.title}</span>
              <span style={{color:T.border}}>·</span>
              <span>{curIdx+1} / {flatLes.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{display:'flex',alignItems:'stretch',flex:1,overflow:'hidden'}}>

        {/* LEARN MODE */}
        {mode==='learn'&&(
          <>
            {/* Tutorial nav sidebar */}
            <div style={{...col,width:186,flexShrink:0,background:T.bgPanel,borderRight:`1px solid ${T.border}`,overflowY:'auto',padding:'10px 0'}}>
              <div style={{padding:'0 12px 6px',fontSize:10,fontWeight:600,color:T.fgMuted,textTransform:'uppercase',letterSpacing:'.1em'}}>Topics</div>
              {LEARN.map(ch=>{
                const Icon=ch.icon; const active=learnChap===ch.id;
                return (
                  <div key={ch.id}>
                    <div onClick={()=>{setLearnChap(ch.id);setLearnLes(ch.lessons[0].id);}}
                      style={{...row,gap:8,padding:'7px 12px',cursor:'pointer',borderLeft:`2px solid ${active?ch.color:'transparent'}`,background:active?T.bgActive:'transparent',transition:'all .1s'}}>
                      <Icon size={13} color={active?ch.color:T.fgMuted} strokeWidth={active?2.5:2}/>
                      <span style={{fontSize:13,fontWeight:active?600:400,color:active?T.fg:T.fgDim}}>{ch.title}</span>
                    </div>
                    {active&&ch.lessons.map(l=>{
                      const isActive=learnLes===l.id;
                      const done=lessonsDone[l.id];
                      return (
                        <div key={l.id} onClick={()=>setLearnLes(l.id)}
                          style={{...row,gap:6,padding:'5px 12px 5px 32px',cursor:'pointer',
                            borderLeft:`2px solid ${isActive?ch.color:'transparent'}`,
                            background:isActive?T.bgActive:'transparent',transition:'all .1s'}}>
                          <div style={{width:14,height:14,borderRadius:'50%',border:`1.5px solid ${done?ch.color:T.border}`,background:done?ch.color+'20':'transparent',...row,alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}>
                            {done&&<CheckCircle size={9} color={ch.color}/>}
                          </div>
                          <span style={{fontSize:12,color:isActive?T.fg:T.fgDim,fontWeight:isActive?500:400}}>{l.title}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{margin:'10px 0 6px',borderTop:`1px solid ${T.border}`,padding:'10px 12px 6px',fontSize:10,fontWeight:600,color:T.fgMuted,textTransform:'uppercase',letterSpacing:'.1em'}}>Progress</div>
              <div style={{padding:'0 12px'}}>
                <div style={{...row,justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:11,color:T.fgMuted}}>Completed</span>
                  <span style={{fontSize:11,color:T.yellow,...mono}}>{Object.keys(lessonsDone).length} / {flatLes.length}</span>
                </div>
                <div style={{height:3,background:T.border,borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(Object.keys(lessonsDone).length/flatLes.length)*100}%`,background:T.yellow,borderRadius:2,transition:'width .4s'}}/>
                </div>
              </div>
            </div>

            {/* Tutorial content */}
            <div style={{...col,width:340,flexShrink:0,borderRight:`1px solid ${T.border}`,background:T.bg,overflow:'hidden'}}>
              <div style={{flex:1,overflowY:'auto',padding:'18px 18px 0'}}>
                <ContentBlock blocks={curLes.content} lang={curLes.lang}/>
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:6,paddingBottom:18}}>
                  <TaskList tasks={taskStatus} code={edCode}/>
                </div>
              </div>
              {/* Prev/Next */}
              <div style={{...row,justifyContent:'space-between',padding:'10px 14px',borderTop:`1px solid ${T.border}`,flexShrink:0,background:T.bgDark}}>
                <button onClick={()=>prevLes&&goTo(prevLes)} disabled={!prevLes}
                  style={{...row,gap:4,padding:'5px 10px',borderRadius:5,background:'transparent',
                    border:`1px solid ${prevLes?T.border:'transparent'}`,color:prevLes?T.fgDim:T.fgMuted+'40',
                    fontSize:11,...sans,cursor:prevLes?'pointer':'default',transition:'all .15s'}}>
                  <ChevronLeft size={12}/> Prev
                </button>
                <span style={{fontSize:10,color:T.fgMuted}}>{curIdx+1} / {flatLes.length}</span>
                <button onClick={()=>nextLes&&goTo(nextLes)} disabled={!nextLes}
                  style={{...row,gap:4,padding:'5px 10px',borderRadius:5,
                    background:nextLes&&allDone?T.yellow+'18':'transparent',
                    border:`1px solid ${nextLes?allDone?T.yellow+'50':T.border:'transparent'}`,
                    color:nextLes?allDone?T.yellow:T.fgDim:T.fgMuted+'40',
                    fontSize:11,...sans,cursor:nextLes?'pointer':'default',transition:'all .15s'}}>
                  Next <ChevronRight size={12}/>
                </button>
              </div>
            </div>

            {/* Editor + Output + Ask */}
            <div style={{...col,flex:1,overflow:'hidden',minWidth:0}}>
              <SpeedBar level={speedLvl} setLevel={setSpeedLvl} timer={timer} par={lvCfg.par}/>

              {/* Editor header */}
              <div style={{...row,justifyContent:'space-between',height:40,padding:'0 14px',borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bgDark}}>
                <div style={{...row,gap:6}}>
                  <LangBadge lang={curLes.lang}/>
                  <span style={{fontSize:11,color:T.fgMuted,...mono}}>
                    {curLes.lang==='nushell'?'exercise.nu':curLes.lang==='typescript'?'worker.ts':'script.sh'}
                  </span>
                  {lvCfg.ghost&&!showAns&&<span style={{fontSize:10,color:T.green1,background:T.green1+'15',border:`1px solid ${T.green1}30`,padding:'1px 6px',borderRadius:4,...sans}}>ghost on</span>}
                </div>
                <div style={{...row,gap:7}}>
                  <button onClick={()=>{setShowAns(p=>!p);if(!showAns)setEdCode(curLes.solution);}}
                    style={{...row,gap:4,padding:'3px 8px',borderRadius:4,fontSize:10,...sans,
                      background:showAns?T.yellow+'18':'transparent',border:`1px solid ${showAns?T.yellow+'40':T.border}`,
                      color:showAns?T.yellow:T.fgMuted,cursor:'pointer'}}>
                    {showAns?<><EyeOff size={10}/> Hide</>:<><Eye size={10}/> Answer</>}
                  </button>
                  <button onClick={doRun} style={{...row,gap:5,padding:'4px 10px',borderRadius:5,
                    background:T.green+'18',border:`1px solid ${T.green}35`,color:T.green,
                    fontSize:11,...sans,cursor:'pointer'}}>
                    <Play size={11}/>{running?'Running…':'Run'}
                  </button>
                  <button onClick={()=>setAskOpen(p=>!p)} style={btn(askOpen,T.purple)}>
                    <MessageSquare size={11}/> Ask Claude
                  </button>
                </div>
              </div>

              {/* Editor row */}
              <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>
                <div style={{...col,flex:1,overflow:'hidden'}}>
                  {/* Ghost editor */}
                  <GhostEditor
                    code={showAns?curLes.solution:edCode}
                    onChange={v=>{if(!showAns)setEdCode(v);}}
                    ghostRemainder={ghostRem}
                    lang={curLes.lang}
                    readOnly={showAns}
                  />

                  {/* Output panel */}
                  {runOut!==null&&(
                    <div style={{height:150,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,...col}}>
                      <div style={{...row,height:26,padding:'0 14px',borderBottom:`1px solid ${T.border}`,gap:6,flexShrink:0}}>
                        <div style={{width:7,height:7,borderRadius:'50%',background:running?T.yellow:T.green}}/>
                        <span style={{fontSize:10,color:T.fgMuted,...mono}}>output</span>
                        <X size={11} color={T.fgMuted} style={{cursor:'pointer',marginLeft:'auto'}} onClick={()=>setRunOut(null)}/>
                      </div>
                      <pre style={{flex:1,overflow:'auto',padding:'8px 14px',...mono,fontSize:12,color:T.green1,lineHeight:1.65,margin:0,whiteSpace:'pre'}}>
                        {runOut}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Ask Claude panel */}
                {askOpen&&<AskPanel lesson={curLes} code={edCode} onClose={()=>setAskOpen(false)}/>}
              </div>
            </div>
          </>
        )}

        {/* SNIPPETS / DOCS / BOOKMARKS MODES */}
        {mode!=='learn'&&(
          <>
            {/* Sidebar */}
            <div style={{...col,width:186,flexShrink:0,background:T.bgPanel,borderRight:`1px solid ${T.border}`,overflowY:'auto',padding:'10px 0'}}>
              <div style={{padding:'0 12px 6px',fontSize:10,fontWeight:600,letterSpacing:'.1em',color:T.fgMuted,textTransform:'uppercase'}}>
                {mode==='snippets'?'Language':mode==='docs'?'Technology':'Category'}
              </div>
              {cats.map(c=>{const Icon=icons[c]||Hash;const act=curCat===c;return(
                <SideItem key={c} label={c} cnt={catCnts[c]||0} active={act} onClick={()=>setCat(c)} Icon={Icon} accent={modeAccent}/>
              );})}
              <div style={{margin:'10px 0 6px',borderTop:`1px solid ${T.border}`,padding:'10px 12px 6px',fontSize:10,fontWeight:600,letterSpacing:'.1em',color:T.fgMuted,textTransform:'uppercase'}}>Favorites</div>
              <SideItem label="Starred" cnt={favCnt} active={curCat==='★'} onClick={()=>setCat('★')} Icon={Star} accent={T.yellow}/>
            </div>

            {/* List panel */}
            <div style={{...col,width:275,flexShrink:0,background:T.bg,borderRight:`1px solid ${T.border}`,overflowY:'auto'}}>
              {filtered.length===0?(
                <div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:8,color:T.fgMuted,padding:32}}>
                  <Search size={22} style={{opacity:.3}}/><span>No results</span>
                </div>
              ):filtered.map((item,i)=>{
                const isSnip=mode==='snippets',isBm=mode==='bookmarks',isDoc=mode==='docs';
                const selId=isSnip?selSnip:isDoc?selDoc:selBm;
                const setSel=isSnip?setSelSnip:isDoc?setSelDoc:setSelBm;
                const act=item.id===selId;
                const lc=isSnip?(LANG_CLR[item.lang]||T.blue):isDoc?(LANG_CLR[item.lang]||T.purple):T.teal;
                const cc={Articles:T.blue,Repos:T.orange,Tools:T.green,Reference:T.purple};
                const bc=cc[item.cat]||T.teal;
                return (
                  <div key={item.id} onClick={()=>setSel(item.id)}
                    style={{padding:'10px 13px',cursor:'pointer',borderBottom:`1px solid ${T.border}`,
                      borderLeft:`2px solid ${act?lc:'transparent'}`,background:act?T.bgHL:'transparent',
                      transition:'all .1s',animation:`si .12s ease ${i*.02}s both`}}>
                    <div style={{...row,justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontWeight:500,fontSize:12,color:act?T.fg:T.fgDim,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,paddingRight:6}}>{item.title}</span>
                      {item.fav&&<Star size={10} color={T.yellow} fill={T.yellow}/>}
                    </div>
                    {(isDoc||isBm)&&<div style={{fontSize:10,...mono,color:T.fgMuted,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',opacity:.8}}>{item.url?.replace(/^https?:\/\//,'')}</div>}
                    {isSnip&&<div style={{fontSize:11,color:T.fgMuted,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.desc}</div>}
                    <div style={{...row,gap:4,flexWrap:'wrap'}}>
                      {isSnip&&<LangBadge lang={item.lang}/>}
                      {isDoc&&item.lang&&<LangBadge lang={item.lang}/>}
                      {isBm&&<CatBadge cat={item.cat} color={bc}/>}
                      {isDoc&&<CatBadge cat={item.cat} color={T.purple}/>}
                      {item.tags?.slice(0,2).map(t=><Pill key={t} tag={t}/>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right panel */}
            <div style={{...col,flex:1,overflow:'hidden',minWidth:0}}>
              <div style={{...col,flex:1,overflow:'hidden'}}>
                {addMode?<AddFormPanel/>
                :mode==='snippets'?(selSnipObj?(
                  <div style={{...col,flex:1,overflow:'hidden',background:T.bgPanel}}>
                    <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
                      <div style={{...row,gap:6,overflow:'hidden'}}>
                        <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{selSnipObj.cat}</span>
                        <ChevronRight size={11} color={T.fgMuted}/>
                        <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selSnipObj.title}</span>
                      </div>
                      <div style={{...row,gap:7,flexShrink:0,marginLeft:12}}>
                        {selSnipObj.tags.slice(0,2).map(t=><Pill key={t} tag={t}/>)}
                        <button onClick={()=>toggleFav(selSnipObj.id,'snippet')} style={btn(selSnipObj.fav,T.yellow)}><Star size={12} fill={selSnipObj.fav?T.yellow:'none'} color={selSnipObj.fav?T.yellow:T.fgMuted}/></button>
                        <button onClick={doCopy} style={btn(copied,T.blue)}>
                          {copied?<CheckCircle size={11}/>:<Copy size={11}/>}{copied?'Copied!':'Copy'}
                        </button>
                      </div>
                    </div>
                    <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
                      <HLCode key={selSnipObj.id} code={selSnipObj.code} lang={selSnipObj.lang}/>
                    </div>
                    <div style={{...row,gap:14,padding:'0 16px',height:30,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
                      <LangBadge lang={selSnipObj.lang}/>
                      <span>{selSnipObj.code.split('\n').length} lines</span>
                      <span>{selSnipObj.code.length} chars</span>
                      <span style={{marginLeft:'auto',...mono,fontSize:10}}>{selSnipObj.id}</span>
                    </div>
                  </div>
                ):<div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><Code size={28} style={{opacity:.3}}/><span>Select a snippet</span></div>)
                :mode==='docs'?(selDocObj?<DocDetail key={selDocObj.id} d={selDocObj}/>:<div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><BookOpen size={28} style={{opacity:.3}}/><span>Select a doc</span></div>)
                :(selBmObj?<BmDetail key={selBmObj.id} b={selBmObj}/>:<div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><Bookmark size={28} style={{opacity:.3}}/><span>Select a bookmark</span></div>)}
              </div>

              {/* REPL */}
              {replOpen&&(
                <div style={{...col,height:replH,flexShrink:0,background:T.bgDark,borderTop:`1px solid ${T.border}`}}>
                  <div onMouseDown={startDrag} style={{height:8,cursor:'row-resize',flexShrink:0,...row,justifyContent:'center',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{width:36,height:3,borderRadius:2,background:T.borderBrt,opacity:.6}}/>
                  </div>
                  <div style={{...row,justifyContent:'space-between',padding:'0 14px',height:30,flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
                    <div style={{...row,gap:8}}>
                      <Terminal size={12} color={T.green1}/>
                      <span style={{...mono,fontSize:12,color:T.green1,fontWeight:700}}>snipx</span>
                      <span style={{fontSize:10,color:T.fgMuted}}>— snippets · docs · bookmarks</span>
                    </div>
                    <div style={{...row,gap:8}}>
                      <button onClick={()=>setLines(WELCOME)} style={{background:'none',color:T.fgMuted,fontSize:10,padding:'1px 7px',borderRadius:4,border:`1px solid ${T.border}`,cursor:'pointer',...sans}}>clear</button>
                      <X size={13} color={T.fgMuted} style={{cursor:'pointer'}} onClick={()=>setReplOpen(false)}/>
                    </div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:'8px 14px 4px',...mono,fontSize:12,lineHeight:1.75}} onClick={()=>replRef.current?.focus()}>
                    {lines.map((l,i)=>(
                      <div key={i} style={{color:LC[l.k]||T.fgDim,whiteSpace:'pre'}}>
                        {l.k==='input'?(<span><span style={{color:T.cyan}}>snipx </span><span style={{color:T.green}}>❯ </span><span style={{color:T.fg}}>{l.v}</span></span>):l.v}
                      </div>
                    ))}
                    <div ref={endRef}/>
                  </div>
                  <div style={{...row,padding:'0 14px',height:34,flexShrink:0,borderTop:`1px solid ${T.border}`}}>
                    <span style={{...mono,fontSize:12,color:T.cyan,userSelect:'none'}}>snipx </span>
                    <span style={{...mono,fontSize:12,color:T.green,userSelect:'none',marginRight:6}}>❯</span>
                    <input ref={replRef} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={onReplKey}
                      spellCheck={false} autoFocus
                      style={{flex:1,background:'none',border:'none',outline:'none',...mono,fontSize:12,color:T.fg,caretColor:T.blue}}/>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* STATUS BAR */}
      <div style={{...row,gap:10,padding:'0 16px',height:26,flexShrink:0,background:T.bgDark,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.fgMuted}}>
        <span style={{color:modeAccent,fontWeight:500}}>{mode}</span>
        <span style={{color:T.border}}>·</span>
        {mode==='learn'?(
          <>
            <span>{curChap.title} — {curLes.title}</span>
            <span style={{color:T.border}}>·</span>
            <span style={{color:LEVELS[speedLvl-1].color}}>Level {speedLvl}</span>
            <span style={{color:T.border}}>·</span>
            <span>{taskStatus.filter(t=>t.done).length}/{taskStatus.length} tasks</span>
            <span style={{color:T.border}}>·</span>
            <span>{Object.keys(lessonsDone).length}/{flatLes.length} lessons done</span>
          </>
        ):(
          <>
            <span>{snips.length} snippets · {docs.length} docs · {bms.length} bookmarks</span>
            <span style={{color:T.border}}>·</span>
            <span>{favCounts.s+favCounts.d+favCounts.b} starred</span>
          </>
        )}
        <span style={{marginLeft:'auto',...mono,fontSize:10}}>snipx.sh · ⌘K search · ⌘` repl</span>
      </div>
    </div>
  );
}
