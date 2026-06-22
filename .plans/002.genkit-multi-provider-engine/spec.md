# 002 — Genkit multi-provider AI engine

**Status:** spec
**Owner:** Konstantin
**Depends on:** 001
**Blocks:** 003, 004, 005

## Goal

Replace the hand-rolled `fetch('https://api.anthropic.com/...')` calls with a
single **Genkit**-based engine that can talk to **Google Gemini**, **Anthropic
Claude**, or **OpenAI**, chosen at runtime by a CLI flag and/or environment.
This is the abstraction every generation stage (cluster, draft, verify, and the
future article/news modes) calls.

## Why now

The current `ai-digest.ts` is hard-wired to Anthropic via raw HTTP, and the file
is broken (`const PROVIDER` is never assigned; `break` inside `forEach`;
`API_KEY` is undefined; `import` statements sit inside a function body). The user
explicitly wants provider choice and Genkit. This chunk + 003 is the "do it now"
slice.

## Users

- **The digest CLI** (004), which passes a provider + model down.
- **Prompts** (003), whose dotprompt frontmatter names a provider/model that this
  engine must have registered.
- **CI**, where only one provider's key is present (an Anthropic repo secret today).

## Requirements

1. **Single Genkit instance** (`ai`) configured with the available provider
   plugins, created once and shared. Plugins to wire (verify exact package names
   at implementation — see Risks):

   - Gemini: **`@genkit-ai/google-genai`** (note: `@genkit-ai/googleai`, currently
     in `package.json`, is the deprecated predecessor — migrate to the new one).
   - OpenAI: **`@genkit-ai/compat-oai`** (import `openAI` from
     `@genkit-ai/compat-oai/openai`).
   - Anthropic: the Anthropic plugin — **verify whether `@genkit-ai/anthropic`
     exists**; if not, use community **`genkitx-anthropic`**. Do not assume.

2. **Provider selection precedence** (highest wins):
   1. explicit `--provider` CLI flag (004),
   1. `AI_PROVIDER` env var,
   1. auto-detect: first provider whose API key env var is set, in a defined
      priority order (e.g. anthropic → gemini → openai),
   1. hard error with a clear message listing the accepted key names if none.

   The old "loop and `break`" intent is right; the implementation must actually
   work.

3. **Per-provider config** as data, not scattered literals: provider name,
   default model id, API-key env-var name, and the Genkit model reference. A
   `--model` override and a `--api-key` override (004) must flow through.

4. **Default models** per provider, current as of 2026 (pick sane, cost-aware
   defaults; the digest is long-context summarization, not frontier reasoning):
   e.g. Anthropic Claude Sonnet-class, Gemini Flash-class, OpenAI GPT-4o-class —
   final ids decided at plan time and centralized in one place.

5. **A thin `generate()` helper** the stages call, accepting a resolved model and
   either an inline prompt or (preferably) a loaded dotprompt (003), returning
   text and, where needed, structured output via a Zod/`output.schema`. The
   existing JSON-by-regex-stripping (cluster/verify parse `out.replace(/```json/…)`)
   should be replaced by Genkit structured output where practical.

6. **Keys never logged.** Log the *chosen provider and model*, never the key.

7. **Graceful capability differences.** If a provider lacks a feature a stage
   needs (e.g. a tool, or structured output), fail with a clear message rather
   than silently degrading.

## Quality bar

- `AI_PROVIDER=gemini`, `=anthropic`, `=openai` each produce a working generation
  given the matching key — verified by a real call in at least one mode.
- With no keys set, the CLI exits non-zero with an actionable message.
- The Anthropic path reproduces today's behaviour (so the weekly GitHub Action,
  which sets `ANTHROPIC_API_KEY`, keeps working unchanged).

## Non-goals

- Not the CLI flag parsing itself (004) — this exposes a typed config object; 004
  populates it.
- Not the prompt files (003) — this registers models so prompts can name them.
- Not embeddings, image, or audio models. Text generation only.
- No streaming UI; a CLI batch call is fine.

## Risks / things to verify at implementation

- **Anthropic plugin identity**: research suggested an official `@genkit-ai/anthropic`,
  but the long-standing one is community `genkitx-anthropic`. Confirm via npm
  before committing to a name/version.
- **Version skew**: align plugin versions with `genkit@1.37.x`. The installed
  `@genkit-ai/googleai@1.28.0` is both deprecated *and* behind.
- **Bun runtime**: Genkit is primarily exercised under Node. Smoke-test each
  provider under bun; fall back to documenting `node` if a provider SDK misbehaves.
- **Structured output** support/quality varies by provider — verify the cluster
  and verify stages still get parseable structure on all three.

## Links

- Replaces the raw-HTTP `claude()` helper and `PROVIDERS` map in `scripts/ai-digest.ts`.
- Upstream: [001 typescript-toolchain-and-layout].
- Downstream: [003 dotprompt-prompt-library], [004 digest-cli-and-content-modes].
