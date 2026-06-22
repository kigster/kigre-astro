[![CI](https://github.com/kigster/kigre-astro/actions/workflows/ci.yml/badge.svg)](https://github.com/kigster/kigre-astro/actions/workflows/ci.yml)

# kig.re

Personal engineering blog of Konstantin Gredeskoul, built on [Astro](https://astro.build).
Migrated from Jekyll/AsciiDoc to Astro/Markdown, with a weekly AI-paper digest pipeline and
a fully static, client-side search.

- **Design:** "Editorial Index" — a numbered reading list, warm orange→yellow gradient, sans-serif only.
- **Themes:** six switchable color themes (default **Dark Glass**, plus Noir, Azure, Light Forest, Light Earth, Light), chosen from the nav dropdown and remembered in `localStorage`.
- **Search:** full-text, client-side via [Pagefind](https://pagefind.app) — indexes the built HTML, no server.
- **Comments:** Disqus (existing threads preserved by keeping legacy URLs).
- **Code:** syntax highlighting via Shiki, Fantasque Sans Mono (self-hosted) → Cascadia Code.
- **Callouts:** GitHub-style `> [!NOTE]` admonitions.
- **Images:** click-to-zoom via medium-zoom.

______________________________________________________________________

## Quick start

This project uses [**bun**](https://bun.sh) as its package manager and runtime, with a
[`justfile`](https://github.com/casey/just) wrapping the everyday tasks. If you have `just`
installed, that's the only interface you need:

```bash
just setup     # install bun (if missing) + project dependencies
just dev       # dev server at http://localhost:4321 (or https://dev.kig.re/)
just build     # production build into dist/ (also builds the Pagefind search index)
just preview   # preview the production build locally
just deploy    # build, then rsync dist/ to the production origin (see Deploying)
just           # interactive recipe picker
```

Prefer raw bun? The same scripts exist directly:

```bash
bun install
bun run dev
bun run build
bun run preview
```

Copy `.env.example` to `.env` and set `PUBLIC_DISQUS_SHORTNAME` (and, for the digest,
`ANTHROPIC_API_KEY`).

> [!NOTE]
> Search is built by Pagefind as a post-build step over `dist/`, so there's no search index
> in `just dev` until you've run `just build` at least once.

______________________________________________________________________

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

### Code blocks, callouts, images

````markdown
```ruby
def hello = puts "hi"   # syntax-highlighted by Shiki, in Fantasque Sans Mono
```

> [!IMPORTANT]
> This renders as a GitHub-style callout. Types: NOTE, TIP, IMPORTANT, WARNING, CAUTION.

![alt text](/assets/images/posts/diagram.png)   <!-- click to zoom (medium-zoom) -->
````

Put post images under `public/assets/images/...` and reference them with an absolute path
(`/assets/images/...`). They're served as-is and become click-to-zoom automatically inside
post bodies.

______________________________________________________________________

## Project structure

```
bin/convert.mjs            # one-time AsciiDoc → Markdown migration
scripts/ai-digest.ts       # weekly AI paper digest generator
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
  CNAME                    # custom domain (kig.re)
  resume/                  # resume PDF + redirect stub (/resume → PDF)
  assets/                  # fonts, post images, talk covers (served as-is)
justfile                   # setup / dev / build / preview / deploy recipes
astro.config.mjs           # site config, legacy-URL emit, Shiki, Pagefind, sitemap
```

______________________________________________________________________

## The content model (deeper)

Three rules are enforced by the schema in `src/content.config.ts`. A post that violates them
**fails the build loudly** rather than shipping a broken page.

1. **Permalinks are exact and permanent.** Every post sets `permalink: "/YYYY/MM/DD/slug.html"`.
   This matches the old Jekyll URLs so existing inbound links, SEO, and **Disqus comment
   threads** keep working. The build emits each post at exactly that path
   (`build.format: "file"` in `astro.config.mjs`). Don't change a permalink after publishing.
2. **One category per post.** `category` is a single string, never a list.
3. **Any number of tags.** `tags` is an array; each tag gets its own page at `/tags/<tag>`.

### Theming & fonts

- **Themes** live in `global.css` as `[data-theme="…"]` blocks. To add one, define the block
  and register its value in `BaseLayout.astro` (the validation list **and** the `<select>`
  options). The active theme is stored in `localStorage` and applied before paint to avoid a
  flash of the wrong colors.
- **Fonts:** Fantasque Sans Mono is self-hosted from `public/assets/fonts/` (`@font-face` in
  `global.css`), falling back to Cascadia Code then a system mono.

______________________________________________________________________

## Weekly AI-paper digest

`scripts/ai-digest.ts` generates a weekly post that summarizes and connects recent AI papers.

**Pipeline:** fetch arXiv (cs.AI / cs.LG / cs.CL, last 7 days) → cluster into themes (Claude)
→ draft a connected digest (Claude) → **verify** every claim against the source abstracts
(Claude) → write a `draft: true` Markdown post.

```bash
just digest                       # or: ANTHROPIC_API_KEY=sk-ant-... bun run digest
```

In CI it runs automatically (`.github/workflows/weekly-digest.yml`, Sundays 14:00 UTC) and
**opens a pull request** with the draft rather than publishing directly — so you always review
before it goes live. To publish: open the post in `src/content/blog/`, set `draft: false`, and
merge. Set `ANTHROPIC_API_KEY` as a repository secret (Settings → Secrets and variables → Actions).

______________________________________________________________________

## Migrating the old AsciiDoc posts

The old Jekyll `.adoc` posts are converted by a one-time script:

```bash
just convert                                  # reads ../kig.re/jekyll/v2/_posts → src/content/blog/*.md
bun bin/convert.mjs /path/to/_posts src/content/blog   # or specify paths
```

It maps AsciiDoc frontmatter → YAML, first-category-wins, `YYYY-MM-DD-slug.adoc` → permalink,
admonitions → GitHub callouts, `[source,lang]` → fenced blocks, and `lightbox_image` →
standard Markdown images. `{% include %}` tags (e.g. interactive quizzes) become
`<!-- TODO -->` markers for manual porting. A verification summary is saved to
`scripts/migration-report.json` (confirms permalinks are unique and every post has one category).

______________________________________________________________________

## Deploying

The site is fully static and the build runs the Pagefind indexer automatically, so search
ships with every deploy. Production lives on the origin server behind the Fastly CDN, and
deploys are a single rsync:

```bash
just deploy
```

That recipe (in the `justfile`) does two things:

1. **`just build`** — produces `dist/` (HTML, assets, and the Pagefind search index).
1. **rsync** the built tree to the production origin over SSH:

   ```bash
   rsync -Pavz -e ssh ./dist/ kig@fastly-backend.kig.re:~/workspace/kigre-astro/dist
   ```

Fastly fronts that origin and serves `https://kig.re`. The deploy is incremental — rsync only
ships changed files — and idempotent, so re-running it is safe.

**Prerequisites:** SSH access to `fastly-backend.kig.re` as `kig` (key-based auth recommended).
Nothing else is required locally beyond `bun` and `just`.

> [!IMPORTANT]
> The legacy `/YYYY/MM/DD/slug.html` URLs must keep resolving exactly. The build already emits
> them — don't add an origin or CDN rule that rewrites or strips `.html`.

> [!NOTE]
> Because the site is just static files, any host (GitHub Pages, Netlify, Vercel, Cloudflare
> Pages) also works with build command `bun run build` and output dir `dist`. The rsync flow
> above is the canonical path; the `public/CNAME` file keeps `kig.re` bound on hosts that read it.

______________________________________________________________________

## Notes

- **Newsletter:** the RSS feed at `/rss.xml` can drive an email newsletter (Buttondown,
  Beehiiv, or Substack's RSS import) without changing anything here.
- **Resume:** `public/resume/` ships the PDF plus a tiny `index.html` so `/resume` redirects
  to the latest file.

______________________________________________________________________

## Copyright

© 2012-2026 Konstantin Gredeskoul
