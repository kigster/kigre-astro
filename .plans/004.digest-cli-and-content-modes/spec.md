# 004 — Digest CLI & content modes

**Status:** spec
**Owner:** Konstantin
**Depends on:** 001, 002, 003
**Blocks:** 005

## Goal

Turn the generator into a real, configurable CLI built on **commander**, with a
clear flag surface, and support **three content modes** — `digest` (default),
`article`, and `news` — plus a reading-length knob (`--article-depth`). One
command, sensible defaults, useful `--help`.

## Users

- **Konstantin**, running ad-hoc generations locally with different providers,
  themes, depths, and modes.
- **The weekly GitHub Action**, which today runs `bun run digest` headless and
  opens a PR; it must keep working (defaults = current behaviour).

## CLI surface

Command: `bun run digest [options]` (and/or `tools/digest/index.ts`). Flags:

| Flag | Type / values | Default | Notes |
| ---- | ------------- | ------- | ----- |
| `--provider` | `gemini` \| `anthropic` \| `openai` | auto-detect (002) | overrides env |
| `--api-key` | string | from provider's env var | for the chosen provider only; never logged |
| `--model` | string | provider default (002) | escape hatch |
| `--days-back` | int ≥ 1 | 7 | arXiv lookback window (replaces hard-coded 7d) |
| `--theme` | string | none | optional topical focus to search/filter for |
| `--article-depth` | int 1–10 | 3 (digest) | ≈ minutes-to-read → output length (see below) |
| `--article-type` | `digest` \| `article` \| `news` | `digest` | the mode |
| `--compile-sources` | boolean | false | discover & write the source registry, then exit (→ 005) |
| `--out` | path | `notes/drafts/ai-digests/` | output dir; keep current default |
| `--dry-run` | boolean | false | run pipeline, print to stdout, write nothing |

Validation: reject out-of-range `--article-depth`, unknown `--article-type`/
`--provider`; `--help` documents every flag with examples.

## Content modes

### `digest` (default — preserve today's behaviour)

arXiv FETCH → CLUSTER → DRAFT → VERIFY → EMIT, now provider-agnostic (002) and
prompt-driven (003). A neutral synthesis across themes. `--theme` narrows the
arXiv query/filter. `--days-back` sets the window.

### `article`

A *opinionated blog post*, not a survey. Reads the same papers **plus** curated
sources (researcher/lab/company blogs from the 005 registry) and must **make at
least one substantive point/argument** — a thesis the post defends, not just
"here's what happened." Still fact-checked (VERIFY) against its sources. Voice
matches the blog (engineering audience, no hype).

### `news`

*Newsworthy announcements/events* a reader may have missed — model/product
releases, notable lab/company posts, significant events — sourced **beyond
arXiv** from the 005 registry (blogs, feeds). Emphasis on recency and "did you
hear about this," with links. Fact-checked against the source items.

> `article` and `news` depend on the source registry (005). If the registry is
> absent, they should run in a degraded arXiv-only mode **with a loud warning**,
> never silently pretend to have read the web.

### `--article-depth` → length

Map depth (1–10) to an approximate reading time and therefore a target word
count (~200 wpm), enforced loosely via the prompt and a soft post-check:

| depth | ~minutes | ~words (target) |
| ----- | -------- | --------------- |
| 1 | 1–2 | ~300 |
| 3 | ~3–4 | ~700 |
| 5 | ~5–6 | ~1,100 |
| 7 | ~8 | ~1,700 |
| 10 | ~12+ | ~2,500 |

(Exact curve decided at plan time.) LLMs miss exact lengths — treat as guidance +
a gentle nudge, not a hard truncation.

## Requirements

1. `commander` parses/validates flags; config flows into the 002 engine and 003
   prompts. No business logic in arg parsing.
1. Mode is a strategy: shared FETCH/EMIT scaffolding, mode-specific source-gather
   + prompt selection (`digest.prompt` / `article.prompt` / `news.prompt`, the
   latter two authored here per 003's conventions).
1. `--days-back` and `--theme` thread through FETCH and the prompts.
1. EMIT keeps the frontmatter contract (permalink/category/tags/`draft: true`,
   verifier WARNING/NOTE callout) and writes to `--out`.
1. Backward compatibility: bare `bun run digest` ≡ today's weekly digest.

## Quality bar

- `--help` is self-explanatory; a new user can generate each mode from it alone.
- Each mode produces a valid draft post that passes the Astro content schema.
- `article` reliably contains an explicit thesis; `news` items are genuinely
  recent and link out.
- Depth visibly changes output length in the expected direction.
- Keys never printed; `--dry-run` writes nothing.

## Non-goals

- Source discovery itself is 005; this chunk *consumes* the registry and degrades
  loudly without it.
- No publishing/auto-merge — output stays `draft: true` for human review.
- No web UI; CLI only.

## Open questions

- Default `--article-depth` per mode (digest short, article/news longer)? Lean:
  digest 3, article 5, news 4.
- `--theme` for `digest`: filter fetched papers, or change the arXiv query, or
  both? Plan decides.

## Links

- Builds on [001], [002], [003]. Feeds [005 source-registry-and-discovery].
- Current behaviour to preserve: `scripts/ai-digest.ts`,
  `.github/workflows/weekly-digest.yml`, `CLAUDE.md` digest section.
