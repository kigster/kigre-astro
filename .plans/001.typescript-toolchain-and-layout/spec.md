# 001 — TypeScript toolchain & code layout

**Status:** spec
**Owner:** Konstantin
**Depends on:** —
**Blocks:** 002, 003, 004, 005

## Goal

Give the repo a coherent, conventional home for TypeScript/CLI code that lives
*beside* the Astro blog without the two stepping on each other. Today there is a
single `scripts/` grab-bag (`ai-digest.ts`, `tools.mjs`, a `migration-report.json`),
no `tsconfig`, no linter/formatter, and `.mjs`/`.ts` mixed arbitrarily. Before we
build a configurable multi-provider AI CLI, the foundation needs to be real.

## Why now

Everything downstream (002–005) imports shared code: the Genkit engine, the
provider/config layer, the dotprompt loader, CLI commands, the source registry.
Without a decided layout and a `tsconfig`, each of those would invent its own
ad-hoc structure and we'd refactor twice.

## Users

- **Konstantin**, running the CLI locally (`bun run digest …`) and editing the code.
- **CI** (GitHub Actions), running the same entrypoints headless with
  `--frozen-lockfile`.
- **Future-me / contributors**, who should be able to find "where does the AI
  code live" in one guess.

## Requirements

1. **Decided layout: `tools/` at the repo root** (chosen over `scripts/` and
   `src/cli/`). Astro owns `src/`; the toolchain owns `tools/`. Proposed shape
   (final structure is the plan's job):

   ```text
   tools/
     lib/         # shared, framework-agnostic helpers (env, fs, dates, http)
     ai/          # Genkit engine, provider config (002), prompt loading (003)
     digest/      # the digest/article/news CLI + pipelines (004)
     sources/     # source registry + discovery (005)
   prompts/       # *.prompt dotprompt files (003) — stays at repo root
   ```

   `scripts/` is retired; `bin/convert.mjs` (the one-time Jekyll migration) may
   stay where it is or move under `tools/` — decide in the plan, low priority.

2. **One `tsconfig.json` for the toolchain**, scoped to `tools/` (and `prompts/`
   if needed), `strict: true`, `module`/`moduleResolution` set for bun + ESM,
   `verbatimModuleSyntax` so imports stay clean. Astro keeps its own config; the
   two must not fight. A `bun run typecheck` (`tsc --noEmit`) must pass.

3. **Runtime: bun, ESM, `.ts` everywhere.** No new `.mjs`. Existing `.mjs`
   (`tools.mjs`) is converted to `.ts`. Scripts run via `bun tools/…/index.ts`.

4. **CLI library: `commander`** (decided). Added as a dependency in this chunk so
   004 can build on it; a trivial `--help`-only entry is enough here to prove
   wiring. (Full flag surface is 004.)

5. **Formatting + linting.** The repo currently has neither. Add one tool —
   recommend **Biome** (single fast binary: lint + format, zero-config-ish, great
   bun/TS story) over ESLint+Prettier. Provide `bun run lint` and `bun run format`.
   Keep the ruleset light; this is a personal blog, not a 40-person team.

6. **Scripts & justfile.** Update `package.json` scripts and the `justfile` so the
   new entrypoints, `typecheck`, `lint`, and `format` are first-class. `bun run
   digest` must keep working (it's referenced by the weekly-digest GitHub Action
   and `CLAUDE.md`).

7. **Docs.** Update `CLAUDE.md`'s "Layout of the source" and "Commands" sections
   to describe `tools/` and the new commands.

## Quality bar

- A newcomer can locate the AI/CLI code in one guess and run it with one command.
- `bun run typecheck`, `bun run lint`, and `bun run build` (Astro) all pass on a
  clean checkout.
- No `.mjs` left in the toolchain; no TypeScript in `src/` that Astro would try to
  build as part of the site.

## Non-goals

- No behavioural change to the digest pipeline (that's 002–004). This chunk is
  pure structure + tooling.
- Not introducing a test runner yet. The repo has none; if 004 needs unit tests
  we'll add `bun test` then. Don't gold-plate here.
- Not touching the Astro/content config, schema, or anything under `src/`.

## Open questions

- Biome vs ESLint+Prettier — recommend Biome; confirm at plan time.
- Does `bin/convert.mjs` move into `tools/` or stay put? (Lean: leave it; it's a
  one-shot already run.)
- Single root `tsconfig` with `references`, or a standalone `tools/tsconfig.json`?
  Plan decides based on whether Astro's tsconfig can cleanly exclude `tools/`.

## Links

- Current state: `scripts/ai-digest.ts`, `scripts/tools.mjs`, `package.json`, `justfile`.
- Downstream: [002 genkit-multi-provider-engine], [003 dotprompt-prompt-library],
  [004 digest-cli-and-content-modes], [005 source-registry-and-discovery].
