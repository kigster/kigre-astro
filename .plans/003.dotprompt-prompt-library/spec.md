# 003 — Dotprompt prompt library

**Status:** spec
**Owner:** Konstantin
**Depends on:** 002
**Blocks:** 004, 005

## Goal

Move every LLM prompt out of TypeScript string literals and into versioned
**dotprompt** files under `prompts/`, loaded and executed through Genkit. Prompts
become first-class, reviewable, diff-able artifacts with declared inputs, model,
and tools — the standard for all future prompts.

## Why now

The user has already started (`prompts/ai-digest.dotprompt`) and wants this as the
convention going forward. Today's prompts are scattered: the *cluster* and
*verify* system prompts are inline strings in `ai-digest.ts`, and the *draft*
prompt was extracted to a dotprompt that is currently a placeholder ("Say hello to
{{userName}} and ask how their day is going.") wired through a non-existent
`genkit().loadPrompt(...).invoke()` API.

## Users

- **The generation stages** (002 engine), which load a named prompt and run it.
- **Konstantin**, who tunes wording/tone by editing a `.prompt` file, not code.
- **The dotprompt tools** (e.g. `currentDate`), referenced by name from frontmatter.

## Requirements

1. **File convention.** Prompts live in `prompts/` as **`*.prompt`** files —
   Genkit's loader (`promptDir` + `ai.prompt('name')`) discovers `*.prompt` by
   default. **The current `ai-digest.dotprompt` extension will not be
   auto-loaded; rename to `ai-digest.prompt`** (or configure the loader — but
   prefer the convention). Confirm at implementation.

2. **Migrate all existing prompts** into the library, one file each:
   - `cluster.prompt` — group papers into 3–5 themes; **structured output**
     (`output.schema`) instead of "respond ONLY with JSON … no fences".
   - `draft.prompt` — the real digest-synthesis prompt (replacing the hello-world
     placeholder), carrying the system guidance already drafted in
     `ai-digest.dotprompt` (no hype, synthesize per theme, cite arXiv URLs, only
     claims supported by abstracts, Markdown body only).
   - `verify.prompt` — fact-check the draft against source abstracts; structured
     `{ ok: boolean, issues: string[] }` output.

3. **Frontmatter standard** for each prompt:
   - `name`, `description`.
   - `input.schema` (picoschema preferred) describing the variables the stage
     passes (e.g. papers/themes context, date, depth, theme/topic).
   - **Model is selected by the engine (002) at call time, not hard-pinned in the
     file** — so one prompt works across providers. If a default `model:` line is
     kept for editor ergonomics, the engine override must win. (The current file
     hard-pins `gpt-4o-mini`/openai with an inline `apiKey: ${env:OPENAI_API_KEY}`
     — drop the inline key; let 002 own provider/key.)
   - `tools:` listing any tool names the prompt may call.

4. **Tools as dotprompt tools.** Convert `scripts/tools.mjs`'s `currentDate` into
   the toolchain (TS, under `tools/ai/`), registered via `ai.defineTool`, and
   referenced by name from frontmatter where a prompt needs "today's date" rather
   than the caller injecting it. (Today `draft()` injects `date` manually — either
   is fine; pick one and be consistent.)

5. **Variables, not concatenation.** Stages pass typed inputs; the `.prompt`
   handles templating (Handlebars). No more building giant strings in TS and
   shoving them into a `user` turn.

6. **Output contracts.** Where a stage needs JSON, the prompt declares
   `output.schema` and the engine returns parsed, validated objects — deleting the
   `out.replace(/```json|```/g,'')` hack.

## Quality bar

- All three stages run end-to-end from `prompts/*.prompt` files via Genkit, with
  no inline prompt strings left in the pipeline code.
- Editing tone/instructions requires touching only a `.prompt` file.
- Structured stages (cluster, verify) return validated objects, no regex JSON.
- A short `prompts/README.md` documents the convention (naming, frontmatter, how
  the engine selects the model).

## Non-goals

- Not authoring the *article* and *news* prompts yet — those ship with 004 once
  their pipelines exist (this chunk may scaffold filenames, but content is 004).
- Not a prompt-eval/test harness. Nice later; not now.
- Not changing what the digest *says* beyond faithfully porting current intent.

## Risks / verify at implementation

- **Extension**: `.dotprompt` vs `.prompt` — verify Genkit's default discovery
  and rename accordingly.
- **Picoschema limits**: keep schemas flat; deeply nested schemas can break on
  some providers (esp. Gemini).
- **Per-prompt model override**: confirm the engine can override a file's `model:`
  at call time across all three providers.

## Links

- Existing: `prompts/ai-digest.dotprompt`, `scripts/tools.mjs`, the inline prompts
  in `scripts/ai-digest.ts` (cluster/draft/verify).
- Upstream: [002 genkit-multi-provider-engine].
- Downstream: [004 digest-cli-and-content-modes].
