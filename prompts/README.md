# Prompts (dotprompt)

LLM prompts live here as **`*.prompt`** files in [dotprompt](https://genkit.dev/docs/dotprompt/) format and are loaded by Genkit at runtime.

> **Extension matters:** Genkit's loader discovers `*.prompt` (not `.dotprompt`). The directory is registered via `promptDir: 'prompts'` in `tools/ai/genkit.ts`.

## How a prompt is used

```ts
const ai = createAI(resolveProvider())   // tools/ai/genkit.ts
const res = await ai.prompt('cluster')({ papers })   // loads prompts/cluster.prompt
res.text      // string output
res.output    // parsed object when the prompt declares an output schema
```

## Conventions

- **No model in frontmatter.** The engine resolves the provider/model once (`resolveProvider`) and sets it as the Genkit instance default, so each prompt is provider-agnostic and runs on Gemini, Anthropic, or OpenAI unchanged. Do not pin a `model:` or an inline `apiKey:` in a prompt file.
- **Declare `input.schema`** (picoschema) for every variable the caller passes.
- **Declare `output.schema`** when you need structured output — then read `res.output` instead of parsing text. (Replaces the old "respond ONLY with JSON, no fences" + regex-stripping approach.)
- **Tools** are registered in `tools/ai/tools.ts` via `ai.defineTool` and referenced by name in a prompt's `tools:` frontmatter list (e.g. `currentDate`).

## Current prompts

| File | Purpose | Output | 
| ---- | ------- | ------ | 
| `cluster.prompt` | Group recent papers into 3–5 themes | `{ themes: [{ name, paperIndices }] }` | 
| `draft.prompt` | Write the connected digest body | Markdown text | '
| `verify.prompt` | Fact-check the draft vs. abstracts | `{ ok, issues[] }` |

See `.plans/003.dotprompt-prompt-library/spec.md` for the full rationale.
