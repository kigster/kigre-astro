# 005 — Source registry & discovery (`--compile-sources`)

**Status:** spec
**Owner:** Konstantin
**Depends on:** 004
**Blocks:** —

## Goal

Give `article` and `news` modes something to read beyond arXiv: a **curated,
git-committed registry of AI sources** (researcher/lab/company blogs, feeds), plus
a `--compile-sources` routine that discovers and maintains it. The registry is a
YAML file in the repo — reviewable, diffable, and stable across runs.

## Why

`article`/`news` (004) need authoritative non-arXiv inputs. Scraping the open web
per-run is slow, brittle, and non-reproducible. A committed source list is fast,
auditable, and lets Konstantin curate (add/remove/trust) by editing YAML.

## Users

- **`article` / `news` modes** (004), which load the registry and fetch fresh
  items from it at generation time.
- **Konstantin**, who curates the YAML by hand and re-runs `--compile-sources`
  occasionally to suggest additions.

## Requirements

1. **Registry file**, committed (e.g. `tools/sources/sources.yaml` or
   `data/sources.yaml` — plan decides). Schema per source (draft):

   ```yaml
   - name: "Sebastian Raschka — Ahead of AI"
     kind: researcher        # researcher | lab | company | aggregator
     homepage: "https://magazine.sebastianraschka.com/"
     feed: "https://magazine.sebastianraschka.com/feed"   # RSS/Atom if available
     tags: ["llm", "training"]
     trust: high             # high | medium | low — weights inclusion
     added: 2026-06-21
     enabled: true
   ```

   Hand-edits are first-class; the file is the source of truth.

2. **`--compile-sources`** (flag from 004): discover candidate sources and write
   the registry, then exit (generates nothing). Behaviour:
   - seed from a known starter list (major labs: OpenAI/Anthropic/Google
     DeepMind/Meta FAIR/Mistral; notable researcher blogs; aggregators like
     arXiv-sanity, Hugging Face blog),
   - attempt **RSS/Atom discovery** per homepage (autodiscover `<link
     rel=alternate>`), recording the feed URL when found,
   - **merge, not clobber**: never drop or overwrite a human-curated/disabled
     entry; append new candidates as `enabled: false` for human review,
   - be deterministic and idempotent (stable ordering; re-running yields no spurious diff).

3. **Consumption** (used by 004's article/news): load enabled sources, fetch
   recent items (prefer feeds; fall back to fetching the homepage) within
   `--days-back`, normalize to `{title, url, source, published, summary}`, dedupe,
   and hand to the prompt as context. Respect `--theme` for filtering.

4. **Politeness & robustness**: set a UA, reasonable timeouts, per-host rate
   limiting, and **fail soft per source** (one dead feed must not abort a run) —
   but surface a summary of what failed (no silent gaps).

5. **No secrets, no paywalls.** Public feeds/pages only. Honor obvious access
   signals; don't try to defeat paywalls or bot walls.

## Quality bar

- `--compile-sources` produces a clean, human-readable YAML diff; a second run
  with no new sources produces *no* diff.
- Hand-disabled/edited entries always survive a recompile.
- `article`/`news` visibly incorporate registry items (cited links from non-arXiv
  sources), and a run with some dead feeds still completes with a warning summary.

## Non-goals

- Not a general web crawler or full-text scraper — feeds + light homepage fetch.
- Not real-time/continuous ingestion; on-demand at generation time.
- No ranking ML; `trust` + recency + `--theme` is enough.
- Not defeating paywalls, captchas, or bot protection.

## Open questions

- Registry location/format: single `sources.yaml` vs split by `kind`? Lean: one file.
- How aggressive should auto-discovery be (curated seed only, vs following links)?
  Lean: conservative — seed list + feed autodiscovery, human approves the rest.
- Cache fetched items between runs to cut latency/load? Possibly later.

## Links

- Consumed by [004 digest-cli-and-content-modes] (`article`, `news`).
- The `--compile-sources` flag is declared in 004's CLI surface.
