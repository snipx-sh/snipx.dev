import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Terminal, Search, Star, Copy, Code, Cpu, Cloud, GitBranch,
  Globe, ChevronRight, Shield, CheckCircle, Hash, Play, X,
  BookOpen, Bookmark, ExternalLink, Plus, FileText, Tag, Link
} from "lucide-react";

const T = {
  bg:'#1a1b26',bgDark:'#13131a',bgPanel:'#16161e',bgHL:'#1e2030',
  bgHover:'#252637',bgActive:'#2a2d3e',
  border:'#3b4261',borderBrt:'#545c7e',
  fg:'#c0caf5',fgDim:'#a9b1d6',fgMuted:'#565f89',
  blue:'#7aa2f7',cyan:'#7dcfff',green:'#9ece6a',green1:'#73daca',
  purple:'#bb9af7',orange:'#ff9e64',yellow:'#e0af68',red:'#f7768e',teal:'#2ac3de',
};

const LANG_CLR = {nushell:T.blue,bash:T.green,sh:T.green,rust:T.orange,typescript:T.cyan,javascript:T.yellow,toml:T.yellow,yaml:T.purple,dockerfile:T.teal,vyos:T.red};

const SNIP_CATS  = ['All','Nushell','Shell','Rust','TypeScript','Cloudflare','Git','VyOS'];
const DOC_CATS   = ['All','Nushell','Rust','TypeScript','Cloudflare','Linux','Networking','Tools'];
const BM_CATS    = ['All','Articles','Repos','Tools','Reference'];

const SNIP_ICONS = {All:Hash,Nushell:Terminal,Shell:Code,Rust:Cpu,TypeScript:Globe,Cloudflare:Cloud,Git:GitBranch,VyOS:Shield};
const DOC_ICONS  = {All:Hash,Nushell:Terminal,Rust:Cpu,TypeScript:Globe,Cloudflare:Cloud,Linux:Code,Networking:Shield,Tools:Tag};
const BM_ICONS   = {All:Hash,Articles:FileText,Repos:GitBranch,Tools:Tag,Reference:BookOpen};

const IMP = 'import';

const INIT_SNIPS = [
  {id:'nu-pipeline',title:'Process Pipeline with Filtering',desc:'Filter process data using structured pipelines',lang:'nushell',cat:'Nushell',tags:['pipeline','process','filter'],fav:false,
  code:`# List processes consuming more than 5% CPU
ps
  | where cpu > 5.0
  | select name pid cpu mem
  | sort-by cpu --reverse
  | first 10`},
  {id:'nu-http',title:'HTTP Pipeline with Path Access',desc:'Fetch JSON and traverse with native path access',lang:'nushell',cat:'Nushell',tags:['http','json','api'],fav:true,
  code:`# Fetch and process JSON from GitHub API
let res = http get https://api.github.com/users/danielbodnar
$res | select login name public_repos followers

# Traverse nested data naturally
$res.repos_url
  | http get $in
  | where language == "Rust"
  | select name stargazers_count
  | sort-by stargazers_count --reverse`},
  {id:'nu-custom-cmd',title:'Custom Command with Typed Flags',desc:'Define typed commands with optional flags and defaults',lang:'nushell',cat:'Nushell',tags:['command','flags','types'],fav:false,
  code:`#!/usr/bin/env -S nu --stdin
# Typed deploy command with dry-run support
def deploy [
  service: string,         # Service to deploy
  --env: string = "prod",  # Target environment
  --dry-run,               # Preview only, no changes
  --tag: string = "latest" # Image tag
] {
  if $dry_run {
    print $"[DRY RUN] Would deploy ($service):($tag) to ($env)"
    return
  }
  print $"Deploying ($service):($tag) to ($env)..."
}`},
  {id:'rs-aya-xdp',title:'Aya XDP Packet Filter (eBPF)',desc:'Drop packets from a blocklist using Aya + eBPF/XDP',lang:'rust',cat:'Rust',tags:['ebpf','xdp','aya','networking'],fav:true,
  code:`#![no_std]
#![no_main]
use aya_bpf::{macros::xdp, programs::XdpContext,
    maps::HashMap, bindings::xdp_action};

#[map]
static BLOCKLIST: HashMap<u32, u32> =
    HashMap::with_max_entries(1024, 0);

#[xdp]
pub fn xdp_firewall(ctx: XdpContext) -> u32 {
    match try_filter(ctx) {
        Ok(ret) => ret,
        Err(_)  => xdp_action::XDP_ABORTED,
    }
}`},
  {id:'rs-axum-handler',title:'Axum Route Handler with State',desc:'Type-safe async handler with extractors and error types',lang:'rust',cat:'Rust',tags:['axum','web','async','api'],fav:false,
  code:`use axum::{extract::{Path,State}, http::StatusCode, response::Json};
use std::sync::Arc;

#[derive(Clone)]
struct AppState { db: Arc<Database> }

async fn get_snippet(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Snippet>, StatusCode> {
    state.db
        .find_snippet(&id)
        .await
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}`},
  {id:'ts-hono-route',title:'Hono API with Auth Middleware',desc:'Type-safe CF Worker API with Zod and bearer auth',lang:'typescript',cat:'TypeScript',tags:['hono','cloudflare','api','middleware'],fav:true,
  code:`${IMP} { Hono } from "hono";
${IMP} { bearerAuth } from "hono/bearer-auth";
${IMP} { zValidator } from "@hono/zod-validator";
${IMP} { z } from "zod";

type Bindings = { KV: KVNamespace; API_TOKEN: string };
const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", (c, next) =>
  bearerAuth({ token: c.env.API_TOKEN })(c, next)
);

app.post("/api/snippets", zValidator("json", z.object({
  title: z.string().min(1),
  code:  z.string(),
})), async (c) => {
  const body = c.req.valid("json");
  const id = crypto.randomUUID();
  await c.env.KV.put(\`snippet:\${id}\`, JSON.stringify(body));
  return c.json({ id, ...body }, 201);
});`},
  {id:'ts-zod-schema',title:'Zod Schema with Transforms',desc:'Runtime-validated schema with coercion and type inference',lang:'typescript',cat:'TypeScript',tags:['zod','validation','schema'],fav:false,
  code:`${IMP} { z } from "zod";

export const SnippetSchema = z.object({
  id:      z.string().uuid(),
  title:   z.string().min(1).max(120),
  lang:    z.enum(["nushell","bash","rust","typescript"]),
  tags:    z.array(z.string()).default([]),
  code:    z.string().min(1),
  created: z.coerce.date(),
}).transform(data => ({
  ...data,
  slug:    data.title.toLowerCase().replace(/\\s+/g, '-'),
  preview: data.code.slice(0, 80) + '…',
}));
export type Snippet = z.infer<typeof SnippetSchema>;`},
  {id:'cf-worker-kv',title:'CF Worker Cache-First Pattern',desc:'Cache-first fetch strategy using KV with TTL',lang:'typescript',cat:'Cloudflare',tags:['workers','kv','cache'],fav:false,
  code:`export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const key = new URL(req.url).pathname;
    const hdrs = { "Content-Type": "application/json" };
    const hit  = await env.CACHE.get(key, "text");
    if (hit) return new Response(hit, { headers: {...hdrs,"X-Cache":"HIT"} });
    const res  = await fetch(\`\${env.ORIGIN}\${key}\`);
    const body = await res.text();
    ctx.waitUntil(env.CACHE.put(key, body, { expirationTtl: 60 }));
    return new Response(body, { headers: {...hdrs,"X-Cache":"MISS"} });
  },
} satisfies ExportedHandler<Env>;`},
  {id:'git-lg',title:'Pretty Git Log Alias',desc:'Colorized, graphed log with relative timestamps',lang:'bash',cat:'Git',tags:['git','alias','log'],fav:false,
  code:`git log \\
  --graph --abbrev-commit --decorate \\
  --format=format:'%C(bold blue)%h%C(reset) %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)— %an%C(reset)%C(auto)%d%C(reset)' \\
  --all

# Save as alias
git config --global alias.lg "log --graph --abbrev-commit --decorate \\
  --format=format:'%C(bold blue)%h%C(reset) %C(bold green)(%ar)%C(reset) \\
  %C(white)%s%C(reset)' --all"`},
  {id:'vyos-bgp',title:'VyOS eBGP with Route Policy',desc:'Configure eBGP peering with prefix-list filtering',lang:'vyos',cat:'VyOS',tags:['bgp','routing','policy'],fav:false,
  code:`set protocols bgp system-as 65001
set protocols bgp router-id 10.0.0.1

set protocols bgp neighbor 203.0.113.1 remote-as 65002
set protocols bgp neighbor 203.0.113.1 description "Upstream ISP"
set protocols bgp neighbor 203.0.113.1 \\
  address-family ipv4-unicast route-map import UPSTREAM-IN

set policy prefix-list UPSTREAM-IN rule 10 action permit
set policy prefix-list UPSTREAM-IN rule 10 prefix 0.0.0.0/0
set policy prefix-list UPSTREAM-IN rule 10 le 24

commit && save`},
];

const INIT_DOCS = [
  {id:'doc-nu-book',title:'Nushell Book',desc:'Official guide — pipelines, custom commands, data types, scripting patterns',url:'https://www.nushell.sh/book/',lang:'nushell',cat:'Nushell',topics:['reference','book'],tags:['pipelines','commands','types','scripting'],fav:false,notes:'Key: pipeline I/O sigs, error make + span metadata, custom completions backend for CLIs'},
  {id:'doc-nu-cookbook',title:'Nushell Cookbook',desc:'Practical recipes — file ops, HTTP, JSON, process management, data wrangling',url:'https://www.nushell.sh/cookbook/',lang:'nushell',cat:'Nushell',topics:['recipes','examples'],tags:['http','json','files','process'],fav:true,notes:'Great for: CLI tooling patterns, structured data transforms, parallel job runners'},
  {id:'doc-aya-book',title:'Aya eBPF Book',desc:'Writing Linux eBPF programs in Rust — XDP, TC, tracepoints, maps',url:'https://aya-rs.dev/book/',lang:'rust',cat:'Rust',topics:['ebpf','book'],tags:['xdp','tc','bpf','kernel','networking'],fav:true,notes:'Focus: XDP_DROP/PASS patterns, HashMap/LruHashMap, perf event arrays, CO-RE'},
  {id:'doc-axum',title:'Axum Documentation',desc:'Type-safe async web framework on Tower — routing, extractors, middleware',url:'https://docs.rs/axum/latest/axum/',lang:'rust',cat:'Rust',topics:['web','api'],tags:['http','router','extractors','tower'],fav:false,notes:'Essential: State extractor, IntoResponse trait, nested routers, error handling'},
  {id:'doc-cf-workers',title:'Cloudflare Workers Docs',desc:'Complete Workers runtime reference — bindings, APIs, deploy workflow',url:'https://developers.cloudflare.com/workers/',lang:'typescript',cat:'Cloudflare',topics:['reference','runtime'],tags:['workers','wasm','bindings','fetch'],fav:true,notes:'Key: ExecutionContext.waitUntil, KV/R2/DO bindings, workers-rs for Wasm'},
  {id:'doc-cf-do',title:'Durable Objects Reference',desc:'Strongly-consistent stateful compute — WebSockets, alarms, storage API',url:'https://developers.cloudflare.com/durable-objects/',lang:'typescript',cat:'Cloudflare',topics:['reference','state'],tags:['durable-objects','websockets','coordination','alarms'],fav:false,notes:'Hibernation API for WS scale, alarm() for scheduled work, transactional storage'},
  {id:'doc-hono',title:'Hono Documentation',desc:'Fast edge-first web framework for Cloudflare Workers, Bun, Deno',url:'https://hono.dev/docs/',lang:'typescript',cat:'TypeScript',topics:['web','api'],tags:['routing','middleware','rpc','validator'],fav:true,notes:'hono/rpc for type-safe client gen; built-in Zod validator, bearer auth middleware'},
  {id:'doc-vyos',title:'VyOS Documentation',desc:'Network OS config reference — BGP, OSPF, VPN, firewall, NAT, QoS',url:'https://docs.vyos.io/en/latest/',lang:'vyos',cat:'Networking',topics:['reference','routing'],tags:['bgp','ospf','vpn','firewall','nat'],fav:false,notes:'Rolling vs LTS, set/commit/save workflow, config archive & versioning, ipsec site-to-site'},
  {id:'doc-alpine',title:'Alpine Linux Wiki',desc:'Minimal distro — apk, musl libc, OpenRC, hardening, containers',url:'https://wiki.alpinelinux.org/',lang:'sh',cat:'Linux',topics:['reference','linux'],tags:['apk','musl','openrc','security'],fav:false,notes:'pivot_root/switch_root for container takeover; musl compat notes for Rust binaries'},
  {id:'doc-bun',title:'Bun Documentation',desc:'All-in-one JS runtime — bundler, test runner, package manager, node compat',url:'https://bun.sh/docs',lang:'typescript',cat:'Tools',topics:['runtime','tools'],tags:['bundler','test','install','node-compat'],fav:false,notes:'bun run, bun test, Bun.file() streaming I/O, bun build for Workers bundles'},
];

const INIT_BOOKMARKS = [
  {id:'bm-aya-examples',title:'Aya Integration Tests',url:'https://github.com/aya-rs/aya/tree/main/test/integration-test',desc:'Real XDP/TC/tracepoint examples from Aya\'s own test suite — best reference code',cat:'Repos',tags:['ebpf','xdp','rust','examples'],date:'2025-02-14',fav:false,notes:'xdp_pass, xdp_drop patterns; HashMap map usage; perf_event_array examples'},
  {id:'bm-cf-workers-internals',title:'How Workers Works Internally',url:'https://blog.cloudflare.com/how-workers-works/',desc:'Deep-dive into V8 isolates, cold start elimination, and Workers architecture',cat:'Articles',tags:['cloudflare','v8','isolates','architecture'],date:'2025-01-22',fav:true,notes:'Key: isolate recycling, no container overhead, per-request memory isolation'},
  {id:'bm-mise',title:'mise — Dev Tools Manager',url:'https://mise.jdx.dev/',desc:'Polyglot runtime manager (asdf replacement): Node, Bun, Rust, Go, Python, more',cat:'Tools',tags:['runtime','toolchain','devtools'],date:'2025-01-10',fav:true,notes:'mise.toml per-project; global ~/.config/mise/config.toml; hooks + task runner'},
  {id:'bm-universal-blue',title:'Universal Blue',url:'https://universal-blue.org/',desc:'OCI-based immutable Fedora desktops built with bootc/rpm-ostree image layering',cat:'Reference',tags:['linux','immutable','oci','bootc','fedora'],date:'2025-01-05',fav:false,notes:'Build custom images via Containerfile; Hyprland variant; ZFS/NVIDIA kernel modules'},
  {id:'bm-tokio-tutorial',title:'Tokio Async Rust Tutorial',url:'https://tokio.rs/tokio/tutorial',desc:'Comprehensive async Rust — tasks, channels, select!, I/O, networking primitives',cat:'Articles',tags:['rust','async','tokio','channels'],date:'2024-12-18',fav:false,notes:'select! macro, mpsc/broadcast channels, async streams, cancellation safety patterns'},
  {id:'bm-zellij',title:'Zellij Terminal Workspace',url:'https://zellij.dev/documentation/',desc:'Multiplexer with layouts, floating panes, and WASI plugin API',cat:'Tools',tags:['terminal','multiplexer','wasi','plugins','layout'],date:'2024-12-10',fav:true,notes:'KDL layout files, plugin dev in Rust/WASI, sessionizer workflow with zoxide'},
  {id:'bm-duckdb',title:'DuckDB Documentation',url:'https://duckdb.org/docs/',desc:'In-process analytical SQL — fast parquet/CSV/JSON queries with zero setup',cat:'Reference',tags:['sql','analytics','parquet','olap','embedded'],date:'2024-11-30',fav:false,notes:'ATTACH for multi-db; httpfs for S3/R2 queries; JSON path extraction; bkmr backend'},
  {id:'bm-chezmoi',title:'chezmoi — Dotfiles Manager',url:'https://www.chezmoi.io/',desc:'Manage dotfiles across machines with templates, secrets, and OS-conditional logic',cat:'Tools',tags:['dotfiles','config','templates','1password'],date:'2024-11-20',fav:false,notes:'chezmoi + 1Password integration, run_once_ scripts, OS/arch templates'},
  {id:'bm-ebpf-io',title:'eBPF.io Learning Hub',url:'https://ebpf.io/what-is-ebpf/',desc:'eBPF primer: maps, programs, verifier, CO-RE, BTF, and the BPF syscall',cat:'Articles',tags:['ebpf','kernel','bpf','co-re','btf'],date:'2024-11-15',fav:false,notes:'CO-RE for kernel version portability; BTF type info; vmlinux.h generation via bpftool'},
  {id:'bm-typesense',title:'Typesense Docs',url:'https://typesense.org/docs/',desc:'Fast typo-tolerant open-source search — schema-based, API-first, self-hosted',cat:'Reference',tags:['search','api','schema','ranking','vector'],date:'2024-11-01',fav:true,notes:'v30.1 on CF Containers + R2 FUSE; instant search, faceting, hybrid vector search'},
];

// ── Tokenizer ─────────────────────────────────────────────────────────────────
const RAW = {
  nushell:[[/#.*$/,'#565f89'],[/\b(def|let|mut|if|else|for|each|where|select|return|use|export|from|into|match|true|false|null)\b/,'#bb9af7'],[/\b(ls|ps|cd|echo|print|http|open|sort-by|group-by|length|first|last|math|describe)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/'(?:[^'\\]|\\.)*'/,'#9ece6a'],[/\$[\w_]+/,'#7dcfff'],[/--[\w-]+|-[a-zA-Z]\b/,'#7dcfff'],[/\b\d+(\.\d+)?(\s*(MB|GB|KB|ms|s))?\b/,'#ff9e64'],[/[|&;=<>!+\-*/^%]/,'#89ddff'],[/[{}()\[\],]/,'#a9b1d6']],
  bash:[[/#.*$/,'#565f89'],[/\b(if|then|else|fi|for|while|do|done|function|return|local|export|set)\b/,'#bb9af7'],[/\b(echo|printf|read|cd|ls|grep|sed|find|sort|xargs|curl|wait|mkdir|rm)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/'[^']*'/,'#9ece6a'],[/\$\{[^}]+\}|\$[\w_@#?*0-9]+/,'#7dcfff'],[/--[\w-]+|-[a-zA-Z]+\b/,'#7dcfff'],[/\b\d+\b/,'#ff9e64'],[/[|&;><+=\-*/\\]/,'#89ddff']],
  rust:[[/\/\/.*$/,'#565f89'],[/\b(fn|let|mut|if|else|match|for|while|return|use|pub|struct|enum|impl|trait|async|await|move|type|const|unsafe|dyn|as|break)\b/,'#bb9af7'],[/\b(String|Vec|Option|Result|Box|Arc|HashMap|u8|u16|u32|u64|usize|i32|i64|bool|str|Ok|Err|Some|None|true|false)\b/,'#2ac3de'],[/\b(println!|vec!|format!|assert!|panic!|todo!)/,'#e0af68'],[/"(?:[^"\\]|\\.)*"/,'#9ece6a'],[/\b\d+(\.\d+)?/,'#ff9e64'],[/[A-Z][A-Za-z0-9_]*/,'#2ac3de'],[/[a-z_]\w*(?=\s*[(<])/,'#7aa2f7'],[/[=<>!+\-*/&|^%?:@]/,'#89ddff'],[/[{}()\[\],;.]/,'#a9b1d6']],
  typescript:[[/\/\/.*$/,'#565f89'],[/\b(const|let|var|function|class|interface|type|import|export|return|if|else|for|while|async|await|extends|from|as|satisfies|readonly)\b/,'#bb9af7'],[/\b(string|number|boolean|null|undefined|true|false|any|Record|Partial|Promise|Array)\b/,'#2ac3de'],[/\b(console|process|Object|Map|JSON|fetch|crypto|Response|Request|ExecutionContext)\b/,'#e0af68'],[/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,'#9ece6a'],[/\b\d+(\.\d+)?\b/,'#ff9e64'],[/[A-Z][A-Za-z0-9_]*/,'#2ac3de'],[/[a-z_]\w*(?=\s*[(<])/,'#7aa2f7'],[/[=<>!+\-*/&|^%?:@]/,'#89ddff'],[/[{}()\[\],;.]/,'#a9b1d6']],
  vyos:[[/#.*$/,'#565f89'],[/\b(set|delete|commit|save|show|run|configure|exit)\b/,'#bb9af7'],[/\b(protocols|bgp|neighbor|address-family|route-map|policy|prefix-list|system-as|router-id|description|action|permit|rule|prefix)\b/,'#e0af68'],[/"[^"]*"/,'#9ece6a'],[/\b\d+(\.\d+){0,3}(\/\d+)?\b/,'#ff9e64']],
};
const COMPILED = {};
for (const [l,rules] of Object.entries(RAW)) COMPILED[l] = rules.map(([re,c])=>[new RegExp('^(?:'+re.source+')'),c]);

function tokLine(line,lang) {
  const rules = COMPILED[lang]||COMPILED.bash; const out=[]; let pos=0;
  while(pos<line.length){
    const sub=line.slice(pos); let hit=false;
    for(const [re,c] of rules){ const m=re.exec(sub); if(m){out.push({t:m[0],c});pos+=m[0].length;hit=true;break;} }
    if(!hit){if(out.length&&out[out.length-1].c==='#c0caf5')out[out.length-1].t+=line[pos];else out.push({t:line[pos],c:'#c0caf5'});pos++;}
  }
  return out;
}
const tokCode = (code,lang) => code.split('\n').map(l=>tokLine(l,lang));

// ── Small components ──────────────────────────────────────────────────────────
const mono = {fontFamily:"'JetBrains Mono','Cascadia Code',monospace"};
const sans = {fontFamily:"'Inter',system-ui,sans-serif"};
const row  = {display:'flex',alignItems:'center'};
const col  = {display:'flex',flexDirection:'column'};

function LangBadge({lang}) {
  const c=LANG_CLR[lang]||T.fgMuted;
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
  const lines=useMemo(()=>tokCode(code,lang),[code,lang]);
  return (
    <div style={{...mono,fontSize:13,lineHeight:1.65,padding:'16px 0',minWidth:'max-content'}}>
      {lines.map((toks,i)=>(
        <div key={i} style={{display:'flex',alignItems:'flex-start'}}>
          <span style={{userSelect:'none',minWidth:44,textAlign:'right',paddingRight:16,color:T.fgMuted,fontSize:11,paddingTop:1,flexShrink:0}}>{i+1}</span>
          <span style={{flex:1}}>{toks.map((tok,j)=><span key={j} style={{color:tok.c}}>{tok.t}</span>)}</span>
        </div>
      ))}
    </div>
  );
}

// ── REPL ──────────────────────────────────────────────────────────────────────
const WELCOME = [
  {k:'info',v:'  ╭─────────────────────────────────────────────╮'},
  {k:'info',v:'  │  snipx v0.2.0  ·  snippets · docs · bookmarks│'},
  {k:'info',v:"  │  Type 'help' for available commands          │"},
  {k:'info',v:'  ╰─────────────────────────────────────────────╯'},
];
const LC = {input:T.fg,info:T.cyan,ok:T.green,err:T.red,row:T.fgDim,cmd:T.fgDim};
const RUN_OUT = {
  'nu-pipeline':[{k:'info',v:'── Running: Process Pipeline ──'},{k:'row',v:'  name              pid     cpu    mem'},{k:'row',v:'  ─────────────────────────────────────'},{k:'row',v:'  node              12435   45.2   234.5 MB'},{k:'row',v:'  rust-analyzer     4421    28.7   456.2 MB'},{k:'row',v:'  code              3301    12.3   892.1 MB'},{k:'ok',v:'✓ Completed in 42ms'}],
  'rs-aya-xdp':[{k:'info',v:'── Compiling: Aya XDP Filter ──'},{k:'row',v:'  Compiling aya-bpf v0.12.0'},{k:'row',v:'  Loading XDP program onto eth0...'},{k:'row',v:'  BLOCKLIST map initialized (1024 entries)'},{k:'ok',v:'✓ XDP program loaded. Packet filtering active.'}],
};

// ── Add form field definitions ─────────────────────────────────────────────
const FORM_DEFS = {
  snippet:[
    {k:'title',  label:'Title',     type:'text',    req:true},
    {k:'desc',   label:'Desc',      type:'text',    req:false},
    {k:'lang',   label:'Language',  type:'select',  req:true,  opts:['nushell','bash','rust','typescript','vyos','yaml','toml']},
    {k:'cat',    label:'Category',  type:'select',  req:true,  opts:['Nushell','Shell','Rust','TypeScript','Cloudflare','Git','VyOS']},
    {k:'tags',   label:'Tags',      type:'text',    req:false, hint:'comma-separated'},
    {k:'code',   label:'Code',      type:'textarea',req:true},
  ],
  doc:[
    {k:'title',  label:'Title',     type:'text',    req:true},
    {k:'url',    label:'URL',       type:'text',    req:true},
    {k:'desc',   label:'Desc',      type:'text',    req:false},
    {k:'lang',   label:'Language',  type:'select',  req:false, opts:['nushell','bash','rust','typescript','sh','vyos']},
    {k:'cat',    label:'Category',  type:'select',  req:true,  opts:DOC_CATS.slice(1)},
    {k:'topics', label:'Topics',    type:'text',    req:false, hint:'comma-separated'},
    {k:'tags',   label:'Tags',      type:'text',    req:false, hint:'comma-separated'},
    {k:'notes',  label:'Notes',     type:'textarea',req:false},
  ],
  bookmark:[
    {k:'title',  label:'Title',     type:'text',    req:true},
    {k:'url',    label:'URL',       type:'text',    req:true},
    {k:'desc',   label:'Desc',      type:'textarea',req:false},
    {k:'cat',    label:'Category',  type:'select',  req:true,  opts:BM_CATS.slice(1)},
    {k:'tags',   label:'Tags',      type:'text',    req:false, hint:'comma-separated'},
    {k:'notes',  label:'Notes',     type:'textarea',req:false},
  ],
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode,   setMode]   = useState('snippets');
  const [height, setHeight] = useState(window.innerHeight);
  const [snips,  setSnips]  = useState(INIT_SNIPS);
  const [docs,   setDocs]   = useState(INIT_DOCS);
  const [bms,    setBms]    = useState(INIT_BOOKMARKS);
  const [selSnip,setSelSnip]= useState('nu-pipeline');
  const [selDoc, setSelDoc] = useState('doc-nu-book');
  const [selBm,  setSelBm]  = useState('bm-aya-examples');
  const [snipCat,setSnipCat]= useState('All');
  const [docCat, setDocCat] = useState('All');
  const [bmCat,  setBmCat]  = useState('All');
  const [q,      setQ]      = useState('');
  const [replOpen,setReplOpen]=useState(true);
  const [replH,  setReplH]  = useState(220);
  const [lines,  setLines]  = useState(WELCOME);
  const [input,  setInput]  = useState('');
  const [iHist,  setIHist]  = useState([]);
  const [hIdx,   setHIdx]   = useState(-1);
  const [copied, setCopied] = useState(false);
  const [addMode,setAddMode]= useState(null);
  const [form,   setForm]   = useState({});
  const [formErr,setFormErr]= useState({});
  const searchRef   = useRef(null);
  const replInpRef  = useRef(null);
  const endRef      = useRef(null);

  // inject fonts + scrollbar styles
  useEffect(()=>{
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    const s=document.createElement('style');
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#3b4261;border-radius:3px}
@keyframes slidein{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadein{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.si{animation:slidein .12s ease both}.fi{animation:fadein .15s ease both}
.cursor{display:inline-block;width:7px;height:14px;background:#7aa2f7;animation:blink 1.2s step-start infinite;vertical-align:text-bottom;margin-left:2px}
input,textarea,select{outline:none}input::placeholder,textarea::placeholder{color:#565f89}
button:active{transform:scale(0.97)}`;
    document.head.appendChild(s);
    return ()=>{ document.head.removeChild(s); window.removeEventListener('resize', onResize); };
  },[]);

  useEffect(()=>{
    const h=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();searchRef.current?.focus();}
      if((e.metaKey||e.ctrlKey)&&e.key==='`'){e.preventDefault();setReplOpen(v=>!v);}
    };
    document.addEventListener('keydown',h);
    return ()=>document.removeEventListener('keydown',h);
  },[]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[lines]);

  const switchMode = useCallback(m=>{ setMode(m); setQ(''); setAddMode(null); },[]);

  // ── Filtered lists ──
  const ql = q.toLowerCase();
  const filteredSnips = useMemo(()=>snips.filter(s=>{
    const mc = snipCat==='All'||(snipCat==='★'?s.fav:s.cat===snipCat);
    return mc&&(!ql||s.title.toLowerCase().includes(ql)||s.tags.some(t=>t.includes(ql))||s.lang.includes(ql)||s.desc.toLowerCase().includes(ql));
  }),[snips,snipCat,ql]);

  const filteredDocs = useMemo(()=>docs.filter(d=>{
    const mc = docCat==='All'||(docCat==='★'?d.fav:d.cat===docCat);
    return mc&&(!ql||d.title.toLowerCase().includes(ql)||d.tags.some(t=>t.includes(ql))||d.topics.some(t=>t.includes(ql))||d.desc.toLowerCase().includes(ql));
  }),[docs,docCat,ql]);

  const filteredBms = useMemo(()=>bms.filter(b=>{
    const mc = bmCat==='All'||(bmCat==='★'?b.fav:b.cat===bmCat);
    return mc&&(!ql||b.title.toLowerCase().includes(ql)||b.tags.some(t=>t.includes(ql))||b.desc.toLowerCase().includes(ql));
  }),[bms,bmCat,ql]);

  // auto-select first when filter changes
  useEffect(()=>{if(filteredSnips.length&&!filteredSnips.find(s=>s.id===selSnip))setSelSnip(filteredSnips[0].id);},[filteredSnips]);
  useEffect(()=>{if(filteredDocs.length&&!filteredDocs.find(d=>d.id===selDoc))setSelDoc(filteredDocs[0].id);},[filteredDocs]);
  useEffect(()=>{if(filteredBms.length&&!filteredBms.find(b=>b.id===selBm))setSelBm(filteredBms[0].id);},[filteredBms]);

  const selSnipObj = snips.find(s=>s.id===selSnip);
  const selDocObj  = docs.find(d=>d.id===selDoc);
  const selBmObj   = bms.find(b=>b.id===selBm);

  const toggleFav = useCallback((id,type)=>{
    if(type==='snippet') setSnips(p=>p.map(s=>s.id===id?{...s,fav:!s.fav}:s));
    else if(type==='doc') setDocs(p=>p.map(d=>d.id===id?{...d,fav:!d.fav}:d));
    else setBms(p=>p.map(b=>b.id===id?{...b,fav:!b.fav}:b));
  },[]);

  const doCopy = useCallback(async()=>{
    if(!selSnipObj) return;
    await navigator.clipboard.writeText(selSnipObj.code);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  },[selSnipObj]);

  // ── REPL ──
  const processCmd = useCallback(raw=>{
    const parts=raw.trim().split(/\s+/); const verb=parts[0]?.toLowerCase(); const arg=parts.slice(1).join(' ');
    switch(verb){
      case 'help': return [
        {k:'info',v:'╭── snipx commands ─────────────────────────────────╮'},
        {k:'cmd', v:'  list [cat]        list snippets by category'},
        {k:'cmd', v:'  docs [cat]        list docs by category'},
        {k:'cmd', v:'  bookmarks [cat]   list bookmarks by category'},
        {k:'cmd', v:'  show <id>         open item in viewer'},
        {k:'cmd', v:'  search <query>    search across all items'},
        {k:'cmd', v:'  copy <id>         copy snippet code'},
        {k:'cmd', v:'  run <id>          simulate snippet execution'},
        {k:'cmd', v:'  fav <id>          toggle favorite'},
        {k:'cmd', v:'  open <id>         open doc/bookmark URL'},
        {k:'cmd', v:'  tags              show all tags'},
        {k:'cmd', v:'  clear             clear terminal'},
        {k:'info',v:'╰───────────────────────────────────────────────────╯'},
      ];
      case 'clear': return null;
      case 'list': {
        const list=snips.filter(s=>!arg||s.cat.toLowerCase()===arg.toLowerCase());
        if(!list.length) return [{k:'err',v:`No snippets in: ${arg||'all'}`}];
        return [{k:'info',v:`${list.length} snippet${list.length!==1?'s':''}:`},...list.map(s=>({k:'row',v:`  ${s.id.padEnd(22)} ${s.lang.padEnd(12)} ${s.title}`}))];
      }
      case 'docs': {
        const list=docs.filter(d=>!arg||d.cat.toLowerCase()===arg.toLowerCase());
        if(!list.length) return [{k:'err',v:`No docs in: ${arg||'all'}`}];
        return [{k:'info',v:`${list.length} doc${list.length!==1?'s':''}:`},...list.map(d=>({k:'row',v:`  ${d.id.padEnd(22)} ${d.cat.padEnd(12)} ${d.title}`}))];
      }
      case 'bookmarks': {
        const list=bms.filter(b=>!arg||b.cat.toLowerCase()===arg.toLowerCase());
        if(!list.length) return [{k:'err',v:`No bookmarks in: ${arg||'all'}`}];
        return [{k:'info',v:`${list.length} bookmark${list.length!==1?'s':''}:`},...list.map(b=>({k:'row',v:`  ${b.id.padEnd(22)} ${b.cat.padEnd(12)} ${b.title}`}))];
      }
      case 'search': {
        if(!arg) return [{k:'err',v:'usage: search <query>'}];
        const ql=arg.toLowerCase();
        const sr=[...snips.filter(s=>s.title.toLowerCase().includes(ql)||s.tags.some(t=>t.includes(ql))).map(s=>({...s,_type:'snippet'})),
                  ...docs.filter(d=>d.title.toLowerCase().includes(ql)||d.tags.some(t=>t.includes(ql))).map(d=>({...d,_type:'doc'})),
                  ...bms.filter(b=>b.title.toLowerCase().includes(ql)||b.tags.some(t=>t.includes(ql))).map(b=>({...b,_type:'bookmark'}))];
        if(!sr.length) return [{k:'err',v:`No results for "${arg}"`}];
        return [{k:'info',v:`${sr.length} result${sr.length!==1?'s':''} for "${arg}":`},...sr.map(r=>({k:'row',v:`  [${r._type.padEnd(8)}] ${r.id.padEnd(22)} ${r.title}`}))];
      }
      case 'show': {
        const s=snips.find(s=>s.id===arg); if(s){setSelSnip(arg);switchMode('snippets');return [{k:'ok',v:`Opened snippet: ${s.title}`}];}
        const d=docs.find(d=>d.id===arg);  if(d){setSelDoc(arg);switchMode('docs');return [{k:'ok',v:`Opened doc: ${d.title}`}];}
        const b=bms.find(b=>b.id===arg);   if(b){setSelBm(arg);switchMode('bookmarks');return [{k:'ok',v:`Opened bookmark: ${b.title}`}];}
        return [{k:'err',v:`Not found: ${arg}`}];
      }
      case 'open': {
        const d=docs.find(d=>d.id===arg); if(d){window.open(d.url,'_blank');return [{k:'ok',v:`Opening: ${d.url}`}];}
        const b=bms.find(b=>b.id===arg);  if(b){window.open(b.url,'_blank');return [{k:'ok',v:`Opening: ${b.url}`}];}
        return [{k:'err',v:`Not found: ${arg}`}];
      }
      case 'copy': {
        const s=snips.find(s=>s.id===arg); if(!s) return [{k:'err',v:`Not found: ${arg}`}];
        navigator.clipboard.writeText(s.code);
        return [{k:'ok',v:`Copied: "${s.title}"`}];
      }
      case 'fav': {
        const s=snips.find(s=>s.id===arg); if(s){toggleFav(arg,'snippet');return [{k:'ok',v:`${s.fav?'Removed from':'Added to'} favorites: "${s.title}"`}];}
        const d=docs.find(d=>d.id===arg);  if(d){toggleFav(arg,'doc');return [{k:'ok',v:`${d.fav?'Removed from':'Added to'} favorites: "${d.title}"`}];}
        const b=bms.find(b=>b.id===arg);   if(b){toggleFav(arg,'bookmark');return [{k:'ok',v:`${b.fav?'Removed from':'Added to'} favorites: "${b.title}"`}];}
        return [{k:'err',v:`Not found: ${arg}`}];
      }
      case 'run': {
        const s=snips.find(s=>s.id===arg); if(!s) return [{k:'err',v:`Snippet not found: ${arg}`}];
        return RUN_OUT[arg]||[{k:'info',v:`── Running: ${s.title} ──`},{k:'row',v:'  → Simulated execution complete.'},{k:'ok',v:`✓ ${Math.floor(Math.random()*200+20)}ms`}];
      }
      case 'tags': {
        const tags=[...new Set([...snips,...docs,...bms].flatMap(s=>s.tags))].sort();
        return [{k:'info',v:`${tags.length} unique tags:`},{k:'row',v:'  '+tags.map(t=>`#${t}`).join('  ')}];
      }
      default: return [{k:'err',v:`Unknown: "${verb}". Type 'help'.`}];
    }
  },[snips,docs,bms,toggleFav,switchMode]);

  const submitRepl = useCallback(override=>{
    const cmd=(override??input).trim(); if(!cmd) return;
    const res=processCmd(cmd);
    setLines(p=>res===null?WELCOME:[...p,{k:'input',v:cmd},...(res||[])]);
    if(!override){setIHist(p=>[cmd,...p.filter(c=>c!==cmd).slice(0,49)]);setHIdx(-1);setInput('');}
  },[input,processCmd]);

  const onReplKey = useCallback(e=>{
    if(e.key==='Enter'){e.preventDefault();submitRepl();}
    else if(e.key==='ArrowUp'){e.preventDefault();const i=Math.min(hIdx+1,iHist.length-1);setHIdx(i);if(iHist[i]!==undefined)setInput(iHist[i]);}
    else if(e.key==='ArrowDown'){e.preventDefault();const i=Math.max(hIdx-1,-1);setHIdx(i);setInput(i===-1?'':iHist[i]);}
  },[submitRepl,hIdx,iHist]);

  const startDrag = useCallback(e=>{
    e.preventDefault(); const sy=e.clientY, sh=replH;
    const move=e=>setReplH(Math.max(130,Math.min(480,sh+sy-e.clientY)));
    const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
  },[replH]);

  // ── Add form ──
  const openAdd = useCallback(type=>{
    setAddMode(type); setForm({}); setFormErr({});
  },[]);

  const setF = useCallback((k,v)=>setForm(p=>({...p,[k]:v})),[]);

  const saveForm = useCallback(()=>{
    const defs=FORM_DEFS[addMode]||[]; const err={};
    defs.forEach(d=>{ if(d.req&&!form[d.k]?.trim()) err[d.k]='Required'; });
    if(Object.keys(err).length){setFormErr(err);return;}
    const tags=(form.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
    const id=`${addMode}-${Date.now()}`;
    if(addMode==='snippet'){
      const n={id,title:form.title||'',desc:form.desc||'',lang:form.lang||'bash',cat:form.cat||'Shell',tags,fav:false,code:form.code||''};
      setSnips(p=>[n,...p]); setSelSnip(id); switchMode('snippets');
    } else if(addMode==='doc'){
      const topics=(form.topics||'').split(',').map(t=>t.trim()).filter(Boolean);
      const n={id,title:form.title||'',desc:form.desc||'',url:form.url||'',lang:form.lang||'',cat:form.cat||'Tools',topics,tags,fav:false,notes:form.notes||''};
      setDocs(p=>[n,...p]); setSelDoc(id); switchMode('docs');
    } else {
      const n={id,title:form.title||'',url:form.url||'',desc:form.desc||'',cat:form.cat||'Reference',tags,date:new Date().toISOString().slice(0,10),fav:false,notes:form.notes||''};
      setBms(p=>[n,...p]); setSelBm(id); switchMode('bookmarks');
    }
    setAddMode(null);
  },[addMode,form,switchMode]);

  // ── Counts ──
  const snipCats = useMemo(()=>{ const c={All:snips.length}; snips.forEach(s=>{c[s.cat]=(c[s.cat]||0)+1;}); return c; },[snips]);
  const docCats  = useMemo(()=>{ const c={All:docs.length};  docs.forEach(d=>{c[d.cat]=(c[d.cat]||0)+1;}); return c; },[docs]);
  const bmCats   = useMemo(()=>{ const c={All:bms.length};   bms.forEach(b=>{c[b.cat]=(c[b.cat]||0)+1;}); return c; },[bms]);
  const favCounts= useMemo(()=>({s:snips.filter(s=>s.fav).length,d:docs.filter(d=>d.fav).length,b:bms.filter(b=>b.fav).length}),[snips,docs,bms]);

  const cats    = mode==='snippets'?SNIP_CATS:mode==='docs'?DOC_CATS:BM_CATS;
  const icons   = mode==='snippets'?SNIP_ICONS:mode==='docs'?DOC_ICONS:BM_ICONS;
  const curCat  = mode==='snippets'?snipCat:mode==='docs'?docCat:bmCat;
  const setCat  = mode==='snippets'?setSnipCat:mode==='docs'?setDocCat:setBmCat;
  const catCnts = mode==='snippets'?snipCats:mode==='docs'?docCats:bmCats;
  const favCnt  = mode==='snippets'?favCounts.s:mode==='docs'?favCounts.d:favCounts.b;
  const filtered= mode==='snippets'?filteredSnips:mode==='docs'?filteredDocs:filteredBms;

  // ── Style helpers ──
  const inp0 = {width:'100%',background:T.bgHL,border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',color:T.fg,fontSize:13,...sans,transition:'border-color .15s'};
  const lab  = {fontSize:11,fontWeight:500,color:T.fgMuted,letterSpacing:'.04em',marginBottom:4};
  const btn  = (active,clr)=>({...row,gap:5,padding:'5px 11px',borderRadius:6,border:`1px solid ${active?clr+'55':T.border}`,background:active?clr+'18':'transparent',color:active?clr:T.fgDim,fontSize:12,...sans,fontWeight:500,cursor:'pointer',transition:'all .15s'});

  const MODES = [
    {id:'snippets',label:'Snippets',icon:Code,accentColor:T.blue},
    {id:'docs',    label:'Docs',    icon:BookOpen,accentColor:T.purple},
    {id:'bookmarks',label:'Bookmarks',icon:Bookmark,accentColor:T.teal},
  ];

  // ── Sidebar item ──
  const SideItem = ({label,cnt,active,onClick,Icon,accentColor}) => (
    <div onClick={onClick} style={{...row,gap:9,padding:'7px 12px',cursor:'pointer',
      borderLeft:`2px solid ${active?accentColor||T.blue:'transparent'}`,
      background:active?T.bgActive:'transparent',color:active?T.fg:T.fgDim,transition:'all .1s'}}>
      <Icon size={13} color={active?accentColor||T.blue:T.fgMuted} strokeWidth={active?2.5:2}/>
      <span style={{flex:1,fontSize:13,fontWeight:active?500:400}}>{label}</span>
      <span style={{fontSize:10,color:T.fgMuted,background:T.bgHL,padding:'1px 5px',borderRadius:3,...mono}}>{cnt||0}</span>
    </div>
  );

  // ── Detail cards for docs / bookmarks ──
  const DocDetail = ({d}) => {
    const [noteCopied,setNC]=useState(false);
    const accent = LANG_CLR[d.lang]||T.purple;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:6,overflow:'hidden'}}>
            <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{d.cat}</span>
            <ChevronRight size={11} color={T.fgMuted}/>
            <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title}</span>
          </div>
          <div style={{...row,gap:7,flexShrink:0,marginLeft:12}}>
            <button onClick={()=>toggleFav(d.id,'doc')} style={btn(d.fav,T.yellow)}>
              <Star size={12} fill={d.fav?T.yellow:'none'} color={d.fav?T.yellow:T.fgMuted}/>
            </button>
            <a href={d.url} target="_blank" rel="noreferrer"
              style={{...row,gap:5,padding:'4px 10px',borderRadius:5,background:T.purple+'18',
                border:`1px solid ${T.purple}35`,color:T.purple,fontSize:11,...sans,fontWeight:500,
                textDecoration:'none',transition:'all .15s'}}>
              <ExternalLink size={11}/> Open Docs
            </a>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:24}} className="fi">
          <div style={{fontSize:20,fontWeight:600,color:T.fg,marginBottom:8}}>{d.title}</div>
          <div style={{...mono,fontSize:11,color:T.teal,background:T.teal+'12',border:`1px solid ${T.teal}30`,
            padding:'5px 10px',borderRadius:6,marginBottom:16,display:'inline-block',wordBreak:'break-all'}}>
            {d.url}
          </div>
          <div style={{fontSize:13,color:T.fgDim,lineHeight:1.75,marginBottom:20}}>{d.desc}</div>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginBottom:16}}>
            <div style={{...row,gap:6,flexWrap:'wrap'}}>
              {d.lang && <LangBadge lang={d.lang}/>}
              <CatBadge cat={d.cat} color={T.purple}/>
              {d.topics.map(t=><span key={t} style={{fontSize:10,color:T.teal,background:T.teal+'15',border:`1px solid ${T.teal}30`,padding:'1px 7px',borderRadius:4}}>{t}</span>)}
              {d.tags.map(t=><Pill key={t} tag={t}/>)}
            </div>
          </div>
          {d.notes && (
            <div style={{background:T.bgHL,border:`1px solid ${T.border}`,borderLeft:`3px solid ${accent}`,
              borderRadius:6,padding:'12px 14px'}}>
              <div style={{...row,gap:6,marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:accent,textTransform:'uppercase'}}>Quick Notes</span>
              </div>
              <div style={{fontSize:12,...mono,color:T.fgDim,lineHeight:1.9,whiteSpace:'pre-wrap'}}>{d.notes}</div>
            </div>
          )}
        </div>
        <div style={{...row,gap:12,padding:'0 16px',height:30,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
          {d.lang && <LangBadge lang={d.lang}/>}
          <span>{d.topics.join(' · ')}</span>
          <span style={{marginLeft:'auto',...mono,fontSize:10}}>{d.id}</span>
        </div>
      </div>
    );
  };

  const BmDetail = ({b}) => {
    const catColors = {Articles:T.blue,Repos:T.orange,Tools:T.green,Reference:T.purple};
    const accent = catColors[b.cat]||T.teal;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:6,overflow:'hidden'}}>
            <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{b.cat}</span>
            <ChevronRight size={11} color={T.fgMuted}/>
            <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</span>
          </div>
          <div style={{...row,gap:7,flexShrink:0,marginLeft:12}}>
            <button onClick={()=>toggleFav(b.id,'bookmark')} style={btn(b.fav,T.yellow)}>
              <Star size={12} fill={b.fav?T.yellow:'none'} color={b.fav?T.yellow:T.fgMuted}/>
            </button>
            <a href={b.url} target="_blank" rel="noreferrer"
              style={{...row,gap:5,padding:'4px 10px',borderRadius:5,background:accent+'18',
                border:`1px solid ${accent}35`,color:accent,fontSize:11,...sans,fontWeight:500,
                textDecoration:'none',transition:'all .15s'}}>
              <ExternalLink size={11}/> Open
            </a>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:24}} className="fi">
          <div style={{...row,gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:accent+'20',
              border:`1px solid ${accent}40`,...row,justifyContent:'center',flexShrink:0}}>
              <Link size={18} color={accent}/>
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:600,color:T.fg,marginBottom:2}}>{b.title}</div>
              <CatBadge cat={b.cat} color={accent}/>
            </div>
          </div>
          <div style={{...mono,fontSize:11,color:T.cyan,background:T.cyan+'10',border:`1px solid ${T.cyan}25`,
            padding:'5px 10px',borderRadius:6,marginBottom:16,wordBreak:'break-all',display:'inline-block'}}>
            {b.url}
          </div>
          <div style={{fontSize:13,color:T.fgDim,lineHeight:1.75,marginBottom:16}}>{b.desc}</div>
          <div style={{...row,gap:5,flexWrap:'wrap',marginBottom:16}}>
            {b.tags.map(t=><Pill key={t} tag={t}/>)}
          </div>
          {b.notes && (
            <div style={{background:T.bgHL,border:`1px solid ${T.border}`,borderLeft:`3px solid ${accent}`,
              borderRadius:6,padding:'12px 14px',marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:accent,textTransform:'uppercase',marginBottom:8}}>Notes</div>
              <div style={{fontSize:12,...mono,color:T.fgDim,lineHeight:1.9,whiteSpace:'pre-wrap'}}>{b.notes}</div>
            </div>
          )}
          <div style={{fontSize:11,color:T.fgMuted,...mono}}>Added {b.date}</div>
        </div>
        <div style={{...row,gap:12,padding:'0 16px',height:30,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
          <CatBadge cat={b.cat} color={accent}/>
          <span>{b.tags.slice(0,3).map(t=>`#${t}`).join(' ')}</span>
          <span style={{marginLeft:'auto',...mono,fontSize:10}}>{b.id}</span>
        </div>
      </div>
    );
  };

  // ── Add Form ──
  const AddFormPanel = () => {
    const defs = FORM_DEFS[addMode]||[];
    const titles = {snippet:'New Snippet',doc:'New Doc',bookmark:'New Bookmark'};
    const accents = {snippet:T.blue,doc:T.purple,bookmark:T.teal};
    const acc = accents[addMode]||T.blue;
    return (
      <div style={{...col,flex:1,overflow:'hidden'}}>
        <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
          <div style={{...row,gap:8}}>
            <Plus size={14} color={acc}/>
            <span style={{fontSize:13,fontWeight:600,color:T.fg}}>{titles[addMode]}</span>
          </div>
          <button onClick={()=>setAddMode(null)} style={{background:'none',border:'none',color:T.fgMuted,cursor:'pointer',padding:4}}>
            <X size={15}/>
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:14}}>
          {defs.map(d=>(
            <div key={d.k}>
              <div style={lab}>{d.label}{d.req&&<span style={{color:T.red}}> *</span>}{d.hint&&<span style={{fontWeight:400,opacity:.7}}> — {d.hint}</span>}</div>
              {d.type==='select'?(
                <select value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)}
                  style={{...inp0,cursor:'pointer'}}>
                  <option value="">Select…</option>
                  {(d.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ):d.type==='textarea'?(
                <textarea value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)} rows={d.k==='code'?8:3}
                  spellCheck={false}
                  style={{...inp0,resize:'vertical',lineHeight:1.6,...(d.k==='code'?mono:{})}}/>
              ):(
                <input value={form[d.k]||''} onChange={e=>setF(d.k,e.target.value)} style={inp0}/>
              )}
              {formErr[d.k]&&<div style={{fontSize:11,color:T.red,marginTop:3}}>{formErr[d.k]}</div>}
            </div>
          ))}
        </div>
        <div style={{...row,gap:10,padding:'12px 20px',borderTop:`1px solid ${T.border}`,flexShrink:0,background:T.bgDark}}>
          <button onClick={saveForm} style={{...row,gap:6,padding:'7px 18px',borderRadius:6,
            background:acc+'22',border:`1px solid ${acc}55`,color:acc,fontSize:13,...sans,fontWeight:500,cursor:'pointer',transition:'all .15s'}}>
            <CheckCircle size={13}/> Save
          </button>
          <button onClick={()=>setAddMode(null)} style={{padding:'7px 14px',borderRadius:6,
            background:'transparent',border:`1px solid ${T.border}`,color:T.fgMuted,fontSize:13,...sans,cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const modeAccent = mode==='snippets'?T.blue:mode==='docs'?T.purple:T.teal;

  return (
    <div style={{...col,height,background:T.bg,color:T.fg,...sans,overflow:'hidden',fontSize:13}}>

      {/* HEADER */}
      <div style={{...row,justifyContent:'space-between',height:48,padding:'0 16px',
        background:T.bgDark,borderBottom:`1px solid ${T.border}`,flexShrink:0,gap:12}}>
        {/* Logo */}
        <div style={{...row,gap:12}}>
          <div style={{...row,gap:6}}>
            {['#ff5f57','#ffbd2e','#28c840'].map((c,i)=>(
              <div key={i} style={{width:12,height:12,borderRadius:6,background:c}}/>
            ))}
          </div>
          <div style={{...row,gap:7}}>
            <Terminal size={14} color={T.blue}/>
            <span style={{...mono,fontWeight:700,fontSize:14,color:T.fg,letterSpacing:'.06em'}}>SNIPX</span>
            <span style={{fontSize:9,color:T.fgMuted,background:T.bgHL,padding:'2px 6px',borderRadius:4,...mono}}>v0.2.0</span>
          </div>
          {/* Mode tabs */}
          <div style={{...row,gap:2,marginLeft:8,padding:'3px',background:T.bgHL,borderRadius:8,border:`1px solid ${T.border}`}}>
            {MODES.map(m=>{
              const Icon=m.icon; const act=mode===m.id;
              return (
                <button key={m.id} onClick={()=>switchMode(m.id)}
                  style={{...row,gap:5,padding:'4px 10px',borderRadius:6,border:'none',
                    background:act?m.accentColor+'22':'transparent',
                    color:act?m.accentColor:T.fgMuted,fontSize:12,...sans,fontWeight:act?600:400,
                    cursor:'pointer',transition:'all .15s'}}>
                  <Icon size={12} strokeWidth={act?2.5:2}/>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{...row,gap:8,padding:'0 12px',borderRadius:8,background:T.bgHL,
          border:`1px solid ${T.border}`,width:260,height:32}}>
          <Search size={12} color={T.fgMuted}/>
          <input ref={searchRef} placeholder={`Search ${mode}…`} value={q}
            onChange={e=>setQ(e.target.value)}
            style={{background:'none',border:'none',outline:'none',color:T.fg,flex:1,fontSize:12,...sans}}/>
          {q?<X size={12} color={T.fgMuted} style={{cursor:'pointer'}} onClick={()=>setQ('')}/>
            :<span style={{...mono,fontSize:9,color:T.fgMuted,background:T.bgActive,padding:'1px 5px',borderRadius:3}}>⌘K</span>}
        </div>

        {/* Right actions */}
        <div style={{...row,gap:7}}>
          <button onClick={()=>openAdd(mode==='snippets'?'snippet':mode==='docs'?'doc':'bookmark')}
            style={btn(false,modeAccent)}>
            <Plus size={12}/> Add {mode==='snippets'?'Snippet':mode==='docs'?'Doc':'Bookmark'}
          </button>
          <button onClick={()=>setReplOpen(v=>!v)} style={btn(replOpen,T.green1)}>
            <Terminal size={12}/> REPL
          </button>
        </div>
      </div>

              {/* BODY */}
      <div style={{display:'flex',alignItems:'stretch',flex:1,overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{...col,width:186,flexShrink:0,background:T.bgPanel,
          borderRight:`1px solid ${T.border}`,overflowY:'auto',padding:'10px 0'}}>
          <div style={{padding:'0 12px 6px',fontSize:10,fontWeight:600,letterSpacing:'.1em',color:T.fgMuted,textTransform:'uppercase'}}>
            {mode==='snippets'?'Language':mode==='docs'?'Technology':'Category'}
          </div>
          {cats.map(c=>{
            const Icon=icons[c]||Hash; const act=curCat===c;
            return (
              <SideItem key={c} label={c} cnt={catCnts[c]||0} active={act}
                onClick={()=>setCat(c)} Icon={Icon} accentColor={modeAccent}/>
            );
          })}
          <div style={{margin:'10px 0 6px',borderTop:`1px solid ${T.border}`,padding:'10px 12px 6px',
            fontSize:10,fontWeight:600,letterSpacing:'.1em',color:T.fgMuted,textTransform:'uppercase'}}>Favorites</div>
          <SideItem label="Starred" cnt={favCnt} active={curCat==='★'}
            onClick={()=>setCat('★')} Icon={Star} accentColor={T.yellow}/>
        </div>

        {/* LIST PANEL */}
        <div style={{...col,width:275,flexShrink:0,background:T.bg,borderRight:`1px solid ${T.border}`,overflowY:'auto'}}>
          {filtered.length===0?(
            <div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:8,color:T.fgMuted,padding:32}}>
              <Search size={22} style={{opacity:.3}}/>
              <span>No results</span>
            </div>
          ):filtered.map((item,i)=>{
            const isSnip = mode==='snippets';
            const isBm   = mode==='bookmarks';
            const isDoc  = mode==='docs';
            const selId  = isSnip?selSnip:isDoc?selDoc:selBm;
            const setSel = isSnip?setSelSnip:isDoc?setSelDoc:setSelBm;
            const act    = item.id===selId;
            const lc     = isSnip?(LANG_CLR[item.lang]||T.blue):isDoc?(LANG_CLR[item.lang]||T.purple):T.teal;
            const catColors={Articles:T.blue,Repos:T.orange,Tools:T.green,Reference:T.purple};
            const bc     = catColors[item.cat]||T.teal;
            return (
              <div key={item.id} onClick={()=>setSel(item.id)}
                style={{padding:'10px 13px',cursor:'pointer',borderBottom:`1px solid ${T.border}`,
                  borderLeft:`2px solid ${act?lc:'transparent'}`,
                  background:act?T.bgHL:'transparent',transition:'all .1s',
                  animation:`slidein .12s ease ${i*.02}s both`}}>
                <div style={{...row,justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontWeight:500,fontSize:12,color:act?T.fg:T.fgDim,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,paddingRight:6}}>
                    {item.title}
                  </span>
                  {item.fav&&<Star size={10} color={T.yellow} fill={T.yellow}/>}
                </div>
                {(isDoc||isBm)&&(
                  <div style={{fontSize:10,...mono,color:T.fgMuted,marginBottom:5,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',opacity:.8}}>
                    {item.url?.replace(/^https?:\/\//,'')}
                  </div>
                )}
                {!isDoc&&!isBm&&(
                  <div style={{fontSize:11,color:T.fgMuted,marginBottom:6,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.desc}</div>
                )}
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

        {/* RIGHT PANEL */}
        <div style={{...col,flex:1,overflow:'hidden',minWidth:0}}>
          <div style={{...col,flex:1,overflow:'hidden'}}>
            {addMode ? (
              <AddFormPanel/>
            ) : mode==='snippets' ? (
              selSnipObj ? (
                <div style={{...col,flex:1,overflow:'hidden',background:T.bgPanel}}>
                  {/* snippet header */}
                  <div style={{...row,justifyContent:'space-between',height:44,padding:'0 16px',
                    flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.bgDark}}>
                    <div style={{...row,gap:6,overflow:'hidden'}}>
                      <span style={{fontSize:11,color:T.fgMuted,flexShrink:0}}>{selSnipObj.cat}</span>
                      <ChevronRight size={11} color={T.fgMuted}/>
                      <span style={{fontSize:12,color:T.fg,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selSnipObj.title}</span>
                    </div>
                    <div style={{...row,gap:7,flexShrink:0,marginLeft:12}}>
                      {selSnipObj.tags.slice(0,2).map(t=><Pill key={t} tag={t}/>)}
                      <button onClick={()=>toggleFav(selSnipObj.id,'snippet')} style={btn(selSnipObj.fav,T.yellow)}>
                        <Star size={12} fill={selSnipObj.fav?T.yellow:'none'} color={selSnipObj.fav?T.yellow:T.fgMuted}/>
                      </button>
                      <button onClick={()=>{
                        setReplOpen(true);
                        const cmd=`run ${selSnipObj.id}`;
                        const res=processCmd(cmd);
                        setLines(p=>[...p,{k:'input',v:cmd},...(res||[])]);
                      }} style={btn(false,T.green)}>
                        <Play size={11}/>Run
                      </button>
                      <button onClick={doCopy} style={btn(copied,T.blue)}>
                        {copied?<CheckCircle size={11}/>:<Copy size={11}/>}
                        {copied?'Copied!':'Copy'}
                      </button>
                    </div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
                    <HLCode key={selSnipObj.id} code={selSnipObj.code} lang={selSnipObj.lang}/>
                  </div>
                  <div style={{...row,gap:14,padding:'0 16px',height:30,flexShrink:0,
                    borderTop:`1px solid ${T.border}`,background:T.bgDark,fontSize:11,color:T.fgMuted}}>
                    <LangBadge lang={selSnipObj.lang}/>
                    <span>{selSnipObj.code.split('\n').length} lines</span>
                    <span>{selSnipObj.code.length} chars</span>
                    <span style={{marginLeft:'auto',...mono,fontSize:10}}>{selSnipObj.id}</span>
                  </div>
                </div>
              ) : <div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><Code size={28} style={{opacity:.3}}/><span>Select a snippet</span></div>
            ) : mode==='docs' ? (
              selDocObj ? <DocDetail key={selDocObj.id} d={selDocObj}/> : <div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><BookOpen size={28} style={{opacity:.3}}/><span>Select a doc</span></div>
            ) : (
              selBmObj ? <BmDetail key={selBmObj.id} b={selBmObj}/> : <div style={{...col,alignItems:'center',justifyContent:'center',flex:1,gap:10,color:T.fgMuted}}><Bookmark size={28} style={{opacity:.3}}/><span>Select a bookmark</span></div>
            )}
          </div>

          {/* REPL */}
          {replOpen&&(
            <div style={{...col,height:replH,flexShrink:0,background:T.bgDark,borderTop:`1px solid ${T.border}`}}>
              <div onMouseDown={startDrag} style={{height:8,cursor:'row-resize',flexShrink:0,
                ...row,justifyContent:'center',borderBottom:`1px solid ${T.border}`}}>
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
              <div style={{flex:1,overflowY:'auto',padding:'8px 14px 4px',...mono,fontSize:12,lineHeight:1.75}}
                onClick={()=>replInpRef.current?.focus()}>
                {lines.map((l,i)=>(
                  <div key={i} style={{color:LC[l.k]||T.fgDim,whiteSpace:'pre'}}>
                    {l.k==='input'?(
                      <span>
                        <span style={{color:T.cyan}}>snipx </span>
                        <span style={{color:T.green}}>❯ </span>
                        <span style={{color:T.fg}}>{l.v}</span>
                      </span>
                    ):l.v}
                  </div>
                ))}
                <div ref={endRef}/>
              </div>
              <div style={{...row,padding:'0 14px',height:34,flexShrink:0,borderTop:`1px solid ${T.border}`}}>
                <span style={{...mono,fontSize:12,color:T.cyan,userSelect:'none'}}>snipx </span>
                <span style={{...mono,fontSize:12,color:T.green,userSelect:'none',marginRight:6}}>❯</span>
                <input ref={replInpRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={onReplKey} spellCheck={false} autoFocus
                  style={{flex:1,background:'none',border:'none',outline:'none',...mono,fontSize:12,color:T.fg,caretColor:T.blue}}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{...row,gap:10,padding:'0 16px',height:26,flexShrink:0,
        background:T.bgDark,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.fgMuted}}>
        <span style={{color:modeAccent,fontWeight:500}}>{mode}</span>
        <span style={{color:T.border}}>·</span>
        <span>{snips.length} snippets · {docs.length} docs · {bms.length} bookmarks</span>
        <span style={{color:T.border}}>·</span>
        <span>{favCounts.s+favCounts.d+favCounts.b} starred</span>
        <span style={{marginLeft:'auto',...mono,fontSize:10}}>snipx.sh · ⌘K search · ⌘` repl</span>
      </div>
    </div>
  );
}
