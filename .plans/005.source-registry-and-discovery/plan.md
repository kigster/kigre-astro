# 005 — Source registry & discovery (`--compile-sources`) — plan

**Status:** plan (AI-derived from [spec.md](./spec.md))
**Owner:** Konstantin
**Depends on:** 004 (declares the `--compile-sources` flag and consumes this module)
**Blocks:** —

______________________________________________________________________

## 1. Overview / approach

This chunk builds a small, self-contained module — `tools/sources/` — that does two things:

1. **Compile** a curated, git-committed YAML registry of AI sources (`--compile-sources`): seed a known-good starter list, autodiscover each homepage's RSS/Atom feed, and **merge** the result into the existing file without ever clobbering human curation. Idempotent: a second run with no new candidates produces a byte-identical file (no git diff).
1. **Consume** the registry at generation time for 004's `article`/`news` modes: load enabled sources, fetch recent items from their feeds (falling back to a light homepage fetch), normalize → dedupe → window-filter → theme-filter, and return both the items and a per-source failure list so the caller can warn loudly.

The design mirrors the house pattern established by `tools/digest/arxiv.ts`: **a thin network wrapper around extracted PURE functions**. Every piece of real logic (autodiscovery parse, feed parse, merge, serialize/parse, dedupe, theme/window filters) is a pure, synchronous, network-free function with `*.test.ts` fixtures. `fetch` lives only in two tiny wrappers, injected so tests never touch the network.

Scope discipline (from spec non-goals): feeds + light homepage fetch only — **not** a crawler or full-text scraper; on-demand, no caching layer (left for later); no ranking ML (`trust` + recency + `--theme` is enough); **no paywall/bot-wall defeat** — public pages only, honor obvious access signals.

______________________________________________________________________

## 2. Architecture & key decisions

### 2.1 Module layout (one cohesive folder)

```text
tools/sources/
  index.ts            # public surface (canonical interface) + thin fetch wrappers
  index.test.ts       # wiring tests for fetchRecentItems/compileSources w/ injected fetch
  registry.ts         # parseRegistry / serializeRegistry / mergeRegistry / sortSources (PURE)
  registry.test.ts
  feeds.ts            # parseFeedAutodiscovery / parseFeedItems / RawItem (PURE)
  feeds.test.ts
  items.ts            # dedupeItems / filterByTheme / withinWindow / normalizeItem (PURE)
  items.test.ts
  seeds.ts            # the seed starter list (data, no logic)
  http.ts             # fetchText(url, opts) — the ONLY module that calls fetch (UA, timeout)
  sources.yaml        # the committed registry (the source of truth)
```

`index.ts` re-exports the canonical types/functions so 004 imports only from `tools/sources` (it must not reach into submodules). Pure logic is split by concern; `http.ts` is the single network choke point.

### 2.2 Key decisions & rationale

| Decision | Choice | Rationale |
| --- | --- | --- |
| **Registry location** | `tools/sources/sources.yaml` (co-located with the code that owns it) | The spec leans "one file"; co-locating with the module keeps the data next to its only writer/reader and its tests, consistent with the `tools/`-everything layout. `data/` is for Astro content collections — this file is a build-tool input, not site content, so it does **not** belong there. Path is overridable via the `path?` arg on `loadSources`/`compileSources` so tests write to a temp file. |
| **YAML library** | New dep: [`yaml`](https://www.npmjs.com/package/yaml) (eemeli/yaml) | Bun has **no** stable built-in YAML *writer* (`Bun.YAML` is read-leaning/unstable). `yaml` gives `parse` + `stringify` with deterministic key order and is the de-facto standard. See §7. |
| **Network isolation** | All `fetch` in `http.ts`; `compileSources`/`fetchRecentItems` accept an optional `fetchText` injectable (defaults to the real one) | Mirrors arXiv's pure-parser split and satisfies the hard rule "no network in tests" without a global mock. |
| **Autodiscovery scope** | Conservative: seed list + `<link rel=alternate>` autodiscovery only; **never** follow page links to find more sources | Matches the spec's "human approves the rest" lean; keeps `compile` deterministic and cheap. |
| **Merge identity** | A source's identity key = normalized `homepage` (lowercased, scheme/trailing-slash-normalized); fall back to `name` | Homepage is the stable natural key; feeds/tags/trust are mutable metadata humans edit. |
| **New entries default** | Appended `enabled: false`, `trust: low`, `added: <today>` | Spec: candidates land disabled for human review. |
| **Determinism** | Stable sort by `(kind, name)` case-insensitive; `serializeRegistry` emits fixed field order + sorted `tags`; dates as `YYYY-MM-DD` strings | Guarantees the "no-diff on recompile" quality bar. |
| **Politeness** | Explicit `User-Agent`, per-request `AbortController` timeout (~10s), sequential per-host fetches with a small inter-request delay | Spec requirement #4; sequential-per-host avoids hammering a single origin. |
| **Fail-soft** | Per-source try/catch → push `{source, error}` into `failures`; one dead feed never aborts | Spec #4: surface a summary, no silent gaps. This is intentional collection, **not** a swallow (Hard Rule #4) — errors are reported up, never discarded. |

### 2.3 Compile flow

```mermaid
flowchart TD
  A["--compile-sources (from 004 CLI)"] --> B[loadSources(path) → existing Source[]\n([] if file absent)]
  A --> C[SEEDS: tools/sources/seeds.ts]
  C --> D{for each seed\nsequential, per-host polite}
  D --> E[fetchText(homepage)]
  E -->|ok| F[parseFeedAutodiscovery(html)\n→ feed url?]
  E -->|fail| G[discovered w/o feed\n(record, don't abort)]
  F --> H[candidate Source\nenabled:false trust:low]
  G --> H
  H --> I[mergeRegistry(existing, discovered)]
  B --> I
  I --> J[sortSources → serializeRegistry(yaml)]
  J --> K{bytes == current file?}
  K -->|yes| L[write skipped → NO diff]
  K -->|no| M[write sources.yaml]
  L --> N[print summary, exit\n(generates nothing)]
  M --> N
```

### 2.4 Consume flow (used by 004 `article`/`news`)

```mermaid
flowchart TD
  A[article/news mode] --> B[loadSources(path)]
  B -->|file absent → []| Z[caller degrades to arXiv-only\nwith LOUD warning (004)]
  B --> C[filter enabled:true]
  C --> D{for each source\nsequential per host}
  D --> E[fetchText(feed ?? homepage)]
  E -->|ok| F[parseFeedItems(xml/html) → RawItem[]]
  E -->|fail| G[push to failures[]]
  F --> H[normalizeItem → SourceItem]
  H --> I[accumulate items]
  I --> J[dedupeItems (url, else title)]
  J --> K[withinWindow(daysBack)]
  K --> L["filterByTheme(theme) — substring over title+summary+tags"]
  L --> M[return {items, failures}]
  G --> M
```

______________________________________________________________________

## 3. Registry YAML schema + example

### 3.1 Per-source schema (matches the canonical `Source` type)

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Human label, unique-ish. |
| `kind` | `'researcher' \| 'lab' \| 'company' \| 'aggregator'` | Validated on parse; unknown kinds rejected with a clear error. |
| `homepage` | string (URL) | Natural identity key. |
| `feed` | string (URL), optional | RSS/Atom URL when known/discovered. |
| `tags` | string\[] | Lowercased, sorted on serialize. |
| `trust` | `'high' \| 'medium' \| 'low'` | Weights inclusion (high curated; discovered → low). |
| `added` | string `YYYY-MM-DD` | Set once on first append; never rewritten on merge. |
| `enabled` | boolean | `false` hides from consumption; survives recompile. |

`parseRegistry` is strict: a malformed entry (missing `name`/`homepage`, bad `kind`/`trust`) throws with the offending entry named — we never want to silently drop a hand-curated row (Hard Rule #4).

### 3.2 Example `tools/sources/sources.yaml` (real seeds)

```yaml
# AI source registry for the kig.re digest tool (chunk 005).
# Hand-edits are the source of truth. `--compile-sources` MERGES new
# candidates as `enabled: false`; it never overwrites or drops a row here.
- name: OpenAI Blog
  kind: lab
  homepage: https://openai.com/blog/
  feed: https://openai.com/blog/rss.xml
  tags: [llm, releases]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Anthropic News
  kind: lab
  homepage: https://www.anthropic.com/news
  tags: [llm, safety]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Google DeepMind Blog
  kind: lab
  homepage: https://deepmind.google/discover/blog/
  feed: https://deepmind.google/blog/rss.xml
  tags: [research, rl]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Meta AI (FAIR) Blog
  kind: lab
  homepage: https://ai.meta.com/blog/
  tags: [research, open-models]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Mistral AI News
  kind: company
  homepage: https://mistral.ai/news/
  tags: [llm, open-models]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Hugging Face Blog
  kind: aggregator
  homepage: https://huggingface.co/blog
  feed: https://huggingface.co/blog/feed.xml
  tags: [open-models, community]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Sebastian Raschka — Ahead of AI
  kind: researcher
  homepage: https://magazine.sebastianraschka.com/
  feed: https://magazine.sebastianraschka.com/feed
  tags: [llm, training]
  trust: high
  added: 2026-06-21
  enabled: true
- name: Simon Willison's Weblog
  kind: researcher
  homepage: https://simonwillison.net/
  feed: https://simonwillison.net/atom/everything/
  tags: [llm, tooling]
  trust: medium
  added: 2026-06-21
  enabled: true
```

> Feed URLs above are seed *hints*; `compileSources` confirms/fills them via autodiscovery. Where a lab serves no public feed (e.g. Anthropic/Meta/Mistral at time of writing), the row simply has no `feed` and consumption falls back to a light homepage fetch.

______________________________________________________________________

## 4. `compileSources` algorithm (seed → autodiscover → merge → deterministic write)

```text
compileSources({ path = DEFAULT_PATH, fetchText = http.fetchText, today = todayISO() }):
  existing  = loadSources(path)                      # [] if absent
  discovered = []
  for seed in SEEDS (sequential, polite per host):
    candidate = { ...seed, enabled:false, trust:'low', added: today }  # base
    try:
      html = await fetchText(seed.homepage)
      feed = parseFeedAutodiscovery(html)[0] ?? seed.feed
      if feed: candidate.feed = feed
    catch e:
      record warning (no feed); keep candidate         # fail-soft, never abort
    discovered.push(candidate)
  merged = mergeRegistry(existing, discovered)
  yaml   = serializeRegistry(merged)                   # sorted + fixed field order
  if readFileOrNull(path) === yaml: print "no changes" # IDEMPOTENT: skip write
  else: writeFile(path, yaml); print added/updated summary
  # generates no posts; returns void
```

### 4.1 `mergeRegistry(existing, discovered)` — the rules (PURE)

```text
mergeRegistry(existing: Source[], discovered: Source[]): Source[]
  byKey = Map(existing keyed by identityKey(homepage))
  for d in discovered:
    k = identityKey(d.homepage)
    if byKey.has(k):
      cur = byKey.get(k)
      # PRESERVE human curation. Only fill a genuinely missing feed:
      if !cur.feed && d.feed: cur.feed = d.feed        # additive only
      # NEVER touch: enabled, trust, tags, name, added, kind of an existing row
    else:
      byKey.set(k, d)                                   # new → enabled:false
  return sortSources([...byKey.values()])
```

Merge invariants (each gets a test in §9):

- **Never drop** an existing row — not even `enabled:false` ones.
- **Never overwrite** a human field on an existing row; the only mutation is filling an *empty* `feed`.
- **New rows** arrive `enabled:false` for review.
- **`added` is immutable** once set.
- **Idempotent:** running on already-merged input yields the same array; serialize→write is byte-stable, so a no-new-source recompile writes nothing.

`identityKey(url)` = lowercase host+path, strip `www.`, strip trailing `/`, drop scheme. `sortSources` orders by `(kind, name.toLowerCase())`. `serializeRegistry` uses `yaml.stringify` with a fixed key order (`name,kind,homepage,feed,tags,trust,added,enabled`), sorted `tags`, and a leading comment header; flow style for `tags`.

______________________________________________________________________

## 5. `fetchRecentItems` algorithm (fetch → parse → normalize → dedupe → theme → fail-soft)

```text
fetchRecentItems(sources, { daysBack, theme }, fetchText = http.fetchText):
  enabled = sources.filter(s => s.enabled)
  items: SourceItem[] = []
  failures: {source,error}[] = []
  for s in enabled (sequential, polite per host):
    url = s.feed ?? s.homepage
    try:
      text = await fetchText(url)
      raw  = parseFeedItems(text)        # RSS <item> + Atom <entry>; [] if not a feed
      for r in raw: items.push(normalizeItem(r, s.name))
    catch e:
      failures.push({ source: s.name, error: String(e?.message ?? e) })
  deduped  = dedupeItems(items)                 # by url; fall back to title
  recent   = deduped.filter(i => withinWindow(i.published, daysBack))
  filtered = theme ? filterByTheme(recent, theme) : recent
  return { items: filtered, failures }
```

Pure helpers:

- **`parseFeedItems(xml): RawItem[]`** — handles both RSS (`<item>` with `<link>`, `<pubDate>`, `<description>`) and Atom (`<entry>` with `<link href>`, `<published>/<updated>`, `<summary>/<content>`). Same regex-slice approach as `parseArxivFeed` (no XML lib dep), whitespace-collapsed, HTML-stripped summaries, returns `[]` for non-feed HTML (homepage fallback yields no items rather than throwing).
- **`normalizeItem(raw, sourceName): SourceItem`** — maps to `{title, url, source, published, summary}`; `published` normalized to ISO; absolute-izes relative Atom links against the source where possible.
- **`dedupeItems(items): SourceItem[]`** — keeps first occurrence keyed by normalized `url`; if `url` empty, key by `title`.
- **`withinWindow(published, daysBack): boolean`** — `new Date(published) >= now - daysBack*864e5`; unparseable dates are treated as **out of window** (conservative — don't surface undated junk).
- **`filterByTheme(items, theme): SourceItem[]`** — case-insensitive substring of `theme` over `title + ' ' + summary + ' ' + tags.join(' ')` (item summary/title; tag context where carried). Multi-word `theme` matches if any whitespace-split token hits.

______________________________________________________________________

## 6. File-by-file task list

> All new files under `tools/sources/`. Signatures below **are** the canonical interface — 004's plan already references them.

### Create

- **`tools/sources/index.ts`** — public surface + thin wrappers:

  ```ts
  export type SourceKind = 'researcher' | 'lab' | 'company' | 'aggregator'
  export type Trust = 'high' | 'medium' | 'low'
  export interface Source {
    name: string; kind: SourceKind; homepage: string; feed?: string
    tags: string[]; trust: Trust; added: string; enabled: boolean
  }
  export interface SourceItem {
    title: string; url: string; source: string; published: string; summary: string
  }
  export interface FetchResult {
    items: SourceItem[]; failures: { source: string; error: string }[]
  }
  export const DEFAULT_REGISTRY_PATH: string // tools/sources/sources.yaml

  export function loadSources(path?: string): Source[]        // [] if file absent
  export function fetchRecentItems(
    sources: Source[],
    opts: { daysBack: number; theme?: string },
    fetchText?: (url: string) => Promise<string>,            // injectable; defaults to http
  ): Promise<FetchResult>
  export function compileSources(opts?: {
    path?: string
    fetchText?: (url: string) => Promise<string>
    today?: string
  }): Promise<void>
  ```

  Re-exports the pure helpers for direct testing.

- **`tools/sources/registry.ts`** — `parseRegistry(yaml): Source[]`, `serializeRegistry(sources): string`, `mergeRegistry(existing, discovered): Source[]`, `sortSources(s): Source[]`, `identityKey(url): string`. (PURE; imports `yaml`.)
- **`tools/sources/feeds.ts`** — `parseFeedAutodiscovery(html): string[]`, `parseFeedItems(xml): RawItem[]`, `interface RawItem { title; link; published; summary }`. (PURE.)
- **`tools/sources/items.ts`** — `normalizeItem`, `dedupeItems`, `withinWindow`, `filterByTheme`. (PURE.)
- **`tools/sources/seeds.ts`** — `export const SEEDS: Omit<Source,'enabled'|'added'|'trust'>[]` (data only) — the labs/researchers/aggregators from §3.2.
- **`tools/sources/http.ts`** — `fetchText(url, opts?): Promise<string>` with `User-Agent: kigre-digest/1.0 (+https://kig.re)`, `AbortController` timeout (~10s), throws on non-2xx. The **only** module importing `fetch`.
- **`tools/sources/sources.yaml`** — the committed seed registry (§3.2).
- **Tests:** `registry.test.ts`, `feeds.test.ts`, `items.test.ts`, `index.test.ts` (see §9).

### Modify

- **`package.json`** — add `"yaml": "^2.x"` to `dependencies` (§7). No script change needed (004 owns the CLI flag).
- **`bun.lock`** — regenerated by `bun add yaml` (commit the lockfile).
- *(No edits to 004's files — this chunk only provides the module 004 imports. The `--compile-sources` flag, validation, and the `loadSources`/`fetchRecentItems` call sites live in 004.)*

______________________________________________________________________

## 7. New dependency note

- **`yaml`** (eemeli/yaml), `^2.x`, added to **`dependencies`** (it runs at tool runtime, not just dev/build).
  - **Why:** Bun ships no stable YAML *serializer*; we need deterministic `stringify` for the "no-diff recompile" guarantee and tolerant `parse` for hand-edited files. `yaml` is the standard, zero-native-dep, well-typed choice.
  - **Install:** `bun add yaml` (updates `package.json` + `bun.lock`).
  - **Footprint:** pure TS/JS, no transitive bloat; typecheck (`tsc -p tools/tsconfig.json`) and CI install step absorb it with no config change.

______________________________________________________________________

## 8. Sequencing & dependency

- **Consumed by 004.** 004 declares `--compile-sources` (boolean flag) and the `--theme`/`--days-back` knobs; its `article`/`news` strategies call `loadSources()` + `fetchRecentItems()`, and its CLI wires `--compile-sources` → `compileSources()` then exits. This chunk must land the module with the **exact** canonical signatures so 004 compiles against them.
- **Degrade-loud contract:** `loadSources` returns `[]` when the file is absent so 004 can drop to arXiv-only mode with a visible warning (never silently pretend to have read the web).
- **Build order:** ideally 005's module lands first (or in the same PR slice as 004's consumers). If 004 is built first against these signatures, 005 fills them in — the interface is frozen here either way.
- **No coupling to 002/003** (no LLM/API key in this chunk — public web feeds only).

______________________________________________________________________

## 9. Test plan (PURE unit tests, fixtures, fetch mocked)

All tests are colocated `*.test.ts` using `bun:test` (`describe/test/expect`), mirroring `arxiv.test.ts`. **No network**: pure functions take fixture strings; the two async entry points take an injected `fetchText` returning canned HTML/XML.

### `registry.test.ts`

- **Round-trip:** `parseRegistry(serializeRegistry(seeds))` deep-equals `seeds` (field order, tags, dates preserved).
- **Idempotent serialize:** `serializeRegistry(s) === serializeRegistry(parseRegistry(serializeRegistry(s)))` (byte-stable).
- **Merge — preserve disabled:** an existing `enabled:false` row survives a merge that re-discovers the same homepage (not dropped, not re-enabled).
- **Merge — no clobber:** existing `trust:high`, custom `tags`, custom `name`, `added` are unchanged when the same source is rediscovered with different values.
- **Merge — fill empty feed only:** existing row with no `feed` gains the discovered feed; an existing row *with* a feed keeps its own.
- **Merge — new candidate:** unknown homepage appended `enabled:false`, `trust:low`, `added:today`.
- **Merge idempotency:** `mergeRegistry(merged, discovered)` equals `merged` (second pass is a no-op).
- **Identity normalization:** `https://www.x.com/` and `http://x.com` map to the same key.
- **Strict parse:** malformed entry (bad `kind`, missing `homepage`) throws naming the entry.
- **Absent file:** `loadSources('/no/such.yaml')` returns `[]` (no throw).

### `feeds.test.ts`

- **Autodiscovery:** extracts `href` from `<link rel="alternate" type="application/rss+xml">` and `…atom+xml`; ignores stylesheets/icons; handles attribute order and single/double quotes; returns `[]` when none.
- **RSS parse:** sample `<rss><channel><item>` → `RawItem[]` with title/link/pubDate/description, whitespace collapsed, CDATA + entities handled.
- **Atom parse:** sample `<feed><entry>` → link from `<link href>`, `published`/`updated`, `summary`/`content`.
- **HTML stripping:** tags removed from summaries.
- **Non-feed input:** plain homepage HTML → `[]` (no throw — enables homepage fallback).

### `items.test.ts`

- **dedupe:** same `url` twice → one; empty url falls back to title key.
- **withinWindow:** in-window true, out-of-window false, unparseable → false.
- **filterByTheme:** substring case-insensitive over title+summary+tags; multi-word any-token match; no theme → identity.
- **normalizeItem:** maps RawItem→SourceItem; relative Atom link absolutized; ISO `published`.

### `index.test.ts` (wiring; injected `fetchText`, still no network)

- **fetchRecentItems happy path:** two stub feeds → merged, deduped, windowed, theme-filtered items; `failures: []`.
- **fail-soft:** one stub `fetchText` throws → that source appears in `failures`, the others' items still returned; run does **not** reject.
- **disabled skipped:** `enabled:false` sources never fetched.
- **compileSources idempotency (no-diff):** point `path` at a temp file pre-seeded with the merged output; stub `fetchText` returns the same autodiscovery HTML; assert the file is **unchanged** (byte-identical) after a run (the headline acceptance test).
- **compileSources merge:** start from a temp file with one hand-curated `enabled:false` row; run with seeds; assert that row still present + disabled, and new rows appended `enabled:false`.
- **compileSources fail-soft:** a seed whose homepage fetch throws still yields a (feed-less) row; the run completes.

### CI

- Covered by existing `.github/workflows/ci.yml` (install → typecheck → test → build); `bun test tools/` auto-discovers the new `*.test.ts`. `bun add yaml` keeps the install step green. No CI config change required.

______________________________________________________________________

## 10. "Done when" (acceptance, mapped to the spec quality bar)

- **Idempotent no-diff recompile** — running `--compile-sources` twice with no new sources produces a byte-identical `sources.yaml` (no `git diff`). *(spec quality bar #1; tested in `index.test.ts`.)*
- **Disabled/edited entries survive** — a hand-`enabled:false`/edited row is never dropped, re-enabled, or overwritten by a recompile (only an empty `feed` may be filled). *(spec #2/#3; tested in `registry.test.ts`.)*
- **Human-readable diff** — added candidates appear as a clean, reviewable YAML block, `enabled:false`. *(spec #1.)*
- **Consumption works** — `article`/`news` (004) can load the registry and incorporate non-arXiv items with links; `loadSources` returns `[]` (degrade-loud) when the file is absent. *(spec consumption requirement.)*
- **Fail-soft with summary** — a run where some feeds are dead still completes and returns a populated `failures[]` for the caller to warn on; nothing is silently swallowed. *(spec #4; Hard Rule #4.)*
- **Politeness/public-only** — explicit UA, timeouts, sequential per-host; feeds + light homepage only; no paywall/bot-wall circumvention. *(spec #4/#5.)*
- **Quality gates green** — `tsc -p tools/tsconfig.json`, `bun test tools/`, and Biome all pass in CI; `yaml` added to `dependencies` and committed in `bun.lock`.
