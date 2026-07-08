# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`kig.re` — Konstantin's personal engineering blog, an Astro 5 static site migrated
from Jekyll/AsciiDoc to Astro/Markdown. Deployed to GitHub Pages. Includes a weekly
AI-paper digest pipeline that opens PRs via GitHub Actions.

## Commands

This project uses **bun** as its only package manager and script runner (pinned via
`packageManager` in `package.json`; Volta still pins the node version). Do not use
`npm` or `yarn` here — there is one lockfile, `bun.lock`.

```bash
bun install        # install deps (use --frozen-lockfile in CI)
bun run dev        # dev server at http://localhost:4321
bun run build      # production build into dist/ (also runs the content-schema check — build FAILS on invalid frontmatter)
bun run preview    # serve the production build locally
bun run digest     # generate the weekly AI digest locally (needs one provider key)
bun run typecheck  # typecheck the tools/ TypeScript toolchain (tsc --noEmit)
```

There is no test suite and no linter configured. The build is the gate: an invalid
post fails `astro build` loudly via the Zod schema, so always run `bun run build`
after touching content or content config.

## The three content rules (enforced by `src/content.config.ts`)

These are load-bearing — they preserve SEO and existing Disqus comment threads. The
Zod schema rejects violations at build time:

1. **Permalinks are exact and permanent**: every post sets
   `permalink: "/YYYY/MM/DD/slug.html"` (regex-validated). This reproduces the old
   Jekyll URL so inbound links, SEO, and Disqus threads survive. **Never change a
   permalink after publishing.**
2. **Exactly one category**: `category` is a single string, never an array.
3. **Any number of tags**: `tags` is an array; each tag auto-gets a page at `/tags/<tag>`.

## How URLs are produced (non-obvious)

The legacy `.html` URLs are reproduced by two cooperating pieces — change one and you
break the other:

- `astro.config.mjs` sets `build.format: "file"`, so a route named `foo/bar` emits
  `foo/bar.html` (not `foo/bar/index.html`).
- `src/pages/[...permalink].astro` is the single dynamic route for all posts. In
  `getStaticPaths` it strips the leading `/` and trailing `.html` from each
  `permalink`, hands the remainder to Astro as the route param, and `format: "file"`
  re-appends `.html` — yielding the exact `/YYYY/MM/DD/slug.html` path.

So the post-rendering route, the build format, and the schema regex are a single
system. There is no per-post page file; all posts flow through `[...permalink].astro`.

## Search (Pagefind)

Search is **Pagefind** via the `astro-pagefind` integration (`astro.config.mjs`). It
indexes the built HTML *after* `astro build` (a post-build pass over `dist/`, writing
`dist/pagefind/`). Non-obvious bits:

- Only the post `<article>` carries `data-pagefind-body` (in `[...permalink].astro`),
  so **only blog posts are indexed** — tag/listing/static pages are skipped, keeping
  results to one clean entry per post. The build log says "indexed 144 pages" (files
  scanned), but only the ~25 posts produce records. To make a static page searchable,
  add `data-pagefind-body` to its content.
- The nav search box is `astro-pagefind`'s `<Search>` (a `<pagefind-searchbox>` web
  component) in `BaseLayout.astro`, themed via `--pf-*` vars mapped to the palette in
  `global.css` (`.pf-search`).
- **There is no index in `astro dev` until you've run `bun run build` once** (the dev
  middleware serves `/pagefind/` from the last build's `dist/`). Searching a fresh
  checkout in dev returns nothing until a build exists.
- CI is fine on Linux: Pagefind's platform binaries are optional deps, and all of them
  (incl. `@pagefind/linux-x64`) are pinned in `bun.lock`, so `--frozen-lockfile` pulls
  the right one.

## Layout of the source

- `src/content/blog/*.{md,mdx}` — the posts. Frontmatter must satisfy the schema above.
- `src/content.config.ts` — the blog collection + schema (the content contract).
- `src/pages/` — `index.astro` (numbered archive), `[...permalink].astro` (post route),
  `tags/index.astro` + `tags/[tag].astro` (tag pages), `rss.xml.js`, and static pages
  (`about`, `speaking`, `open-source`).
- `src/layouts/BaseLayout.astro` — the shared shell. `src/components/Comments.astro` —
  Disqus, keyed on the permalink so threads stay attached to legacy URLs.
- `src/styles/global.css` + Tailwind v4 (via `@tailwindcss/vite`, configured in
  `astro.config.mjs` — there is no `tailwind.config`).
- `public/assets/images/...` — post images, referenced by absolute path
  (`/assets/images/...`); they become click-to-zoom (medium-zoom) inside post bodies.

## Design / rendering decisions (don't silently change)

- Code highlighting: Shiki with the `horizon` theme, `wrap: false` (set in
  `astro.config.mjs`). The README describes the intended look as Gruvbox Dark.
- Callouts: GitHub-style `> [!NOTE]` admonitions via `remark-github-blockquote-alert`
  (types: NOTE, TIP, IMPORTANT, WARNING, CAUTION).
- Mermaid diagrams: a ` ```mermaid ` fence in a post renders client-side.
  `src/lib/remark-mermaid.mjs` swaps the fence for a hidden `.mermaid-src` shell
  before Shiki sees it; `src/components/MermaidRenderer.astro` lazy-imports mermaid,
  maps the active theme's CSS variables into `themeVariables`, and re-renders on
  theme switch. Two non-obvious constraints, both consequences of the site-wide
  `:root { zoom }` (see below): the renderer must preload all four body-font
  variants before measuring (lazy-loading bold/italic faces mis-measure labels),
  and `flowchart.wrappingWidth` is kept above any real label line because zoom
  breaks mermaid's `bbox.width === wrappingWidth` wrap detection (labels would
  silently overflow their nodes instead of wrapping). Prefer explicit `<br/>`
  line breaks in diagram labels.
- The whole site scales via `:root { zoom: 1.2 }` on desktop / `1.3` on tablets
  (end of `global.css`). Any library that measures the DOM with
  `getBoundingClientRect` gets zoomed values — beware exact-width comparisons.
- `/speaking` slide viewer: talk data lives in `src/data/talks.json`; clicking a
  talk opens a react-pdf modal (`TalkPdfModal.tsx` — the site's only React
  island — lazy-loads `TalkSlidesViewer.tsx`), and `?talk=<slug>` deep-links to
  an open deck. The PDFs (218MB) are NOT in git: `bin/fetch-talk-pdfs.sh`
  mirrors them from reinvent.one into the gitignored
  `public/assets/talks/pdfs/` — run locally via `just pdfs` (a `just build`
  dependency) and in CI as a deploy.yml step. They must be same-origin because
  react-pdf fetches via XHR and reinvent.one sends no CORS headers.
- `site: "https://kig.re"`, `trailingSlash: "ignore"`.

## Weekly AI digest pipeline (`tools/digest/`)

Five sequential stages, each feeding the next: FETCH (arXiv cs.AI/cs.LG/cs.CL, last
`DIGEST_DAYS_BACK` days) → CLUSTER → DRAFT → VERIFY (fact-checks claims against the
real abstracts) → EMIT (writes a post into `notes/drafts/ai-digests/` with
`draft: true`). Built on **Genkit**, with prompts in `prompts/*.prompt` (dotprompt;
see `prompts/README.md`). The provider is chosen at runtime by `tools/ai/genkit.ts`
(`AI_PROVIDER`, else the first key present among Anthropic → Gemini → OpenAI);
override the model with `DIGEST_MODEL`. The GitHub Action
(`.github/workflows/weekly-digest.yml`, Sundays 14:00 UTC) runs it and opens a PR —
it never commits to `main`. Drafts (`draft: true`) are excluded from the index, post
routes, and RSS via the `!data.draft` filter, so a human reviews and sets
`draft: false` to publish.

The broader plan (configurable CLI, `article`/`news` modes, source registry) lives
in `.plans/`.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`.

## Environment

Copy `.env.example` to `.env`. `PUBLIC_DISQUS_SHORTNAME` enables comments; the
digest needs one provider key — `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or
`GEMINI_API_KEY`/`GOOGLE_API_KEY` (the CI secret is `ANTHROPIC_API_KEY`).
