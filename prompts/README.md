# Prompts (dotprompt)

LLM prompts live here as **`*.prompt`** files in [dotprompt](https://genkit.dev/docs/dotprompt/) format and are loaded by Genkit at runtime.

> **Extension matters:** Genkit's loader discovers `*.prompt` (not `.dotprompt`). The directory is registered via `promptDir: 'prompts'` in `tools/ai/genkit.ts`.

## How a prompt is used

```ts
const ai = createAI(resolveProvider())   // tools/ai/genkit.ts
const res = await ai.prompt('cluster')({ papers })   // loads prompts/cluster.prompt
res.text      // string output — always use this

// For JSON, go through the helper, which parses and validates with Zod:
const { themes } = await promptJson(ai, 'cluster', { papers }, ClusterOutput)
```

## Conventions

- **No model in frontmatter.** The engine resolves the provider/model once (`resolveProvider`) and sets it as the Genkit instance default, so each prompt is provider-agnostic and runs on Gemini, Anthropic, or OpenAI unchanged. Do not pin a `model:` or an inline `apiKey:` in a prompt file.
- **Declare `input.schema`** (picoschema) for every variable the caller passes.
- **Never declare `output.schema`.** It breaks Anthropic, the default provider. No Anthropic plugin for Genkit implements structured output: both `@genkit-ai/anthropic` (0.3.0 is the latest) and `genkitx-anthropic` throw `Only text output format is supported for Claude models currently` as soon as `output.format` is not `text`. Ask for JSON in the prompt body instead and call `promptJson` (`tools/ai/structured.ts`), which tolerates fences/prose, validates against a Zod schema, and retries once before failing loudly. Re-check this if a plugin ever ships structured output.
- **Tools** are registered in `tools/ai/tools.ts` via `ai.defineTool` and referenced by name in a prompt's `tools:` frontmatter list (e.g. `currentDate`).

## Current prompts

| File | Purpose | Output |
| ---- | ------- | ------ |
| `cluster.prompt` | Group recent papers into 3–5 themes | `{ themes: [{ name, paperIndices }] }` |
| `draft.prompt` | Write the connected digest body | Markdown text | '
| `verify.prompt` | Fact-check the draft vs. abstracts | `{ ok, issues[] }` |

See `.plans/003.dotprompt-prompt-library/spec.md` for the full rationale.
