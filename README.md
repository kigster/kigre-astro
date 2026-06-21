# kig.re

Personal engineering blog of Konstantin Gredeskoul, rebuilt on [Astro](https://astro.build).
Migrated from Jekyll/AsciiDoc to Astro/Markdown, with a weekly AI-paper digest pipeline.

- **Design:** "Editorial Index" — a numbered reading list, warm orange→yellow gradient, sans-serif only.
- **Themes:** six switchable color themes (default **Dark Glass**, plus Noir, Azure, Light Forest, Light Earth, Light), chosen from the nav dropdown and remembered in `localStorage`.
- **Search:** full-text, client-side via [Pagefind](https://pagefind.app) — indexes the built HTML, no server.
- **Comments:** Disqus (existing threads preserved by keeping legacy URLs).
- **Code:** syntax highlighting via Shiki, Fantasque Sans Mono (self-hosted) → Cascadia Code.
- **Callouts:** GitHub-style `> [!NOTE]` admonitions.
- **Images:** click-to-zoom via medium-zoom.

---

## Quick start

This project uses [**bun**](https://bun.sh) as its package manager and runtime
(`curl -fsSL https://bun.sh/install | bash`, or `brew install oven-sh/bun/bun`).

```bash
bun install
bun run dev        # local dev server at http://localhost:4321
bun run build      # production build into dist/ (also builds the Pagefind search index)
bun run preview    # preview the production build locally
```

A `justfile` wraps the same tasks (`just setup`, `just dev`, `just build`, …) if you
prefer [`just`](https://github.com/casey/just).

Copy `.env.example` to `.env` and set `PUBLIC_DISQUS_SHORTNAME` (and, for the
digest, `ANTHROPIC_API_KEY`).

> [!NOTE]
> Search is built by Pagefind as a post-build step over `dist/`, so there's no
> search index in `bun run dev` until you've run `bun run build` at least once.

---

## Writing a new post

Posts live in `src/content/blog/` as Markdown (`.md`) or MDX (`.mdx`).
Create a file and add frontmatter:

```markdown
---
title: "My Post Title"
date: 2026-07-01
permalink: "/2026/07/01/my-post-slug.html"
category: "devops"                       # exactly ONE category
tags: ["terraform", "aws", "ci"]         # any number of tags
description: "One-sentence summary shown on the index."
heroImage: "/assets/images/posts/foo.jpg" # optional
comments: true
---

Your content here. Standard Markdown.
```

### The three content rules (enforced by the schema in `src/content.config.ts`)

1. **Permalinks are exact and permanent.** Every post sets `permalink: "/YYYY/MM/DD/slug.html"`.
   This matches the old Jekyll URLs so existing inbound links, SEO, and **Disqus comment
   threads** keep working. The build emits each post at exactly that path. Don't change a
   permalink after publishing.
2. **One category per post.** `category` is a single string, never a list.
3. **Any number of tags.** `tags` is an array; each tag gets its own page at `/tags/<tag>`.

If a post violates the schema (bad permalink format, missing category, etc.) the build
**fails loudly** rather than shipping a broken page.

### Code blocks, callouts, images

````markdown
```ruby
def hello = puts "hi"   # syntax-highlighted by Shiki, in Fantasque Sans Mono
```

> [!IMPORTANT]
> This renders as a GitHub-style callout. Types: NOTE, TIP, IMPORTANT, WARNING, CAUTION.

![alt text](/assets/images/posts/diagram.png)   <!-- click to zoom (medium-zoom) -->
````

### Images

Put post images under `public/assets/images/...` and reference them with an absolute path
(`/assets/images/...`). They're served as-is and become click-to-zoom automatically inside
post bodies.

---

## Migrating the old AsciiDoc posts

The old Jekyll `.adoc` posts are converted by a one-time script:

```bash
# reads ../kig.re/jekyll/v2/_posts, writes src/content/blog/*.md
bun run convert
# or specify paths:
bun bin/convert.mjs /path/to/_posts src/content/blog
```

What it does:
- AsciiDoc attribute frontmatter → YAML frontmatter
- First category wins; tags preserved
- Permalinks derived from the `YYYY-MM-DD-slug.adoc` filename → `/YYYY/MM/DD/slug.html`
- AsciiDoc admonitions (`NOTE:`, `[NOTE]`, sidebars) → GitHub `> [!NOTE]` callouts
- `[source,lang]` blocks → fenced code blocks
- old `lightbox_image` Liquid tags → standard Markdown images
- `{% include %}` (e.g. the interactive quizzes) → `<!-- TODO -->` markers for manual porting

A verification summary prints at the end and is saved to `scripts/migration-report.json`
(confirms all permalinks are unique and every post has exactly one category).

> [!NOTE]
> Two posts use interactive quiz `include`s that need a manual port (flagged in the report).

---

## Weekly AI-paper digest

`scripts/ai-digest.mjs` generates a weekly post summarizing and connecting recent AI papers.

**Pipeline:** fetch arXiv (cs.AI / cs.LG / cs.CL, last 7 days) → cluster into themes (Claude)
→ draft a connected digest (Claude) → **verify** every claim against the source abstracts
(Claude) → write a `draft: true` Markdown post.

Run locally:

```bash
ANTHROPIC_API_KEY=sk-ant-... bun run digest
```

In CI it runs automatically: see `.github/workflows/weekly-digest.yml` (Sundays 14:00 UTC).
It **opens a pull request** with the draft rather than publishing directly — so you always
review before it goes live. To publish: open the post in `src/content/blog/`, set
`draft: false`, and merge.

Set `ANTHROPIC_API_KEY` as a repository secret (Settings → Secrets and variables → Actions).

---

## Deploying

The site is fully static (`dist/`), so any static host works. The build runs the
Pagefind indexer automatically, so search ships with every deploy — nothing extra to
configure. Two options:

### Option A — GitHub Pages (included)

1. **Settings → Pages → Source: GitHub Actions.**
2. Push to `main`. `.github/workflows/deploy.yml` runs `bun install` + `bun run build`
   and publishes `dist/` (no Node/Bun setup needed beyond the workflow).
3. **Custom domain (kig.re):** `public/CNAME` contains `kig.re`, so it's copied into
   every build and keeps the domain bound. Also set it once under **Settings → Pages →
   Custom domain**, point the DNS (`CNAME` → `kigster.github.io`, or apex `A`/`AAAA`
   records per GitHub's docs), and enable **Enforce HTTPS**.

The first deploy can take a minute for Pages to provision; subsequent pushes are quick.

### Option B — Netlify / Vercel / Cloudflare Pages
Connect the repo and use:
- **Build command:** `bun run build`
- **Output directory:** `dist`
- **Runtime:** Bun (Netlify/Vercel/Cloudflare auto-detect `bun.lock`; node 22+ also fine)

These build on every push automatically — if you use one of them, delete `deploy.yml`
and set the custom domain in the host's dashboard (the `CNAME` file is ignored there).
Pull requests (including the weekly digest PR) get automatic preview deploys on all three.

> [!IMPORTANT]
> Whatever host you choose, make sure the legacy `/YYYY/MM/DD/slug.html` URLs resolve
> exactly. The build already emits them; just don't add a host-level rule that rewrites or
> strips `.html`.

---

## Project structure

```
bin/convert.mjs            # one-time AsciiDoc → Markdown migration
scripts/ai-digest.mjs      # weekly AI paper digest generator
src/
  content/blog/*.md        # posts (the content)
  content.config.ts        # schema enforcing the 3 content rules
  layouts/BaseLayout.astro # nav, search box, theme dropdown, footer, medium-zoom
  components/Comments.astro # Disqus
  pages/
    index.astro            # the numbered editorial index (homepage)
    [...permalink].astro   # post pages at exact legacy URLs
    about.astro            # bio + author photo
    speaking.astro         # talks (covers + in-page PDF viewer modal)
    open-source.astro      # top GitHub repos
    tags/                  # tag index + per-tag pages
    rss.xml.js             # RSS feed (also feeds email newsletters)
  styles/global.css        # the Editorial Index design system + all six themes
public/
  CNAME                    # custom domain (kig.re) for GitHub Pages
  assets/                  # fonts, post images, talk covers (served as-is)
.github/workflows/         # deploy + weekly digest
```

---

## Notes

- **Newsletter:** the RSS feed at `/rss.xml` can drive an email newsletter (Buttondown,
  Beehiiv, or Substack's RSS import) without changing anything here.
- **Theme:** the selected theme (default Dark Glass) is stored in `localStorage` and applied
  before paint to avoid a flash. Add or edit themes in `global.css` (`[data-theme="…"]`) and
  register the value in `BaseLayout.astro` (the validation list + the `<select>` options).
- **Fonts:** Fantasque Sans Mono is self-hosted from `public/assets/fonts/` (`@font-face` in
  `global.css`), falling back to Cascadia Code then a system mono.
