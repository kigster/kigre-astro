/**
 * Provider-agnostic structured output.
 *
 * Genkit's native `output.schema` (dotprompt) is not usable here: no Anthropic
 * plugin in the Genkit ecosystem implements it. Both `@genkit-ai/anthropic`
 * (0.3.0, the latest) and `genkitx-anthropic` throw
 * "Only text output format is supported for Claude models currently" the moment
 * `request.output.format` is anything but `text`. Since Anthropic is the first
 * entry in PROVIDER_PRIORITY, declaring `output.schema` in a prompt breaks the
 * default provider outright.
 *
 * So prompts ask for JSON in their instructions and stay text-only, and the
 * shape is enforced here with Zod. This keeps the "one prompt, any provider"
 * contract: no per-provider branching, and the schema lives in one place.
 *
 * The tradeoff is that we give up constrained decoding on providers that do
 * support it (OpenAI, Gemini), so a model can hand back prose or fenced JSON.
 * `extractJsonText` tolerates both, and `promptJson` retries once before
 * failing loudly rather than silently yielding an empty result.
 */
import type { Genkit } from "genkit";
import type { z } from "genkit";

export class StructuredOutputError extends Error {
  override name = "StructuredOutputError";
}

/**
 * Pull the JSON payload out of a model's text response.
 *
 * Handles the three shapes models actually emit: bare JSON, JSON in a ```json
 * fence, and JSON wrapped in explanatory prose. Slices between the outermost
 * brackets rather than parsing incrementally — sufficient because the payload is
 * always the response's single top-level value.
 */
export function extractJsonText(raw: string): string {
  const text = raw.trim();
  if (!text) throw new StructuredOutputError("model returned an empty response");

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text;

  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new StructuredOutputError(
      `no JSON object found in response: ${truncate(text)}`,
    );
  }
  const closer = candidate[start] === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(closer);
  if (end <= start) {
    throw new StructuredOutputError(
      `unterminated JSON in response: ${truncate(text)}`,
    );
  }
  return candidate.slice(start, end + 1);
}

/**
 * Render a prompt and parse its response as JSON matching `schema`.
 *
 * Retries once on malformed output; a second failure throws, because every
 * caller here would otherwise carry on with an empty digest.
 */
export async function promptJson<S extends z.ZodTypeAny>(
  ai: Genkit,
  name: string,
  input: Record<string, unknown>,
  schema: S,
  attempts = 2,
): Promise<z.infer<S>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await ai.prompt(name)(input);
    try {
      return schema.parse(JSON.parse(extractJsonText(response.text)));
    } catch (error) {
      lastError = error;
      console.warn(
        `  ↻ prompt "${name}" returned unusable JSON (attempt ${attempt}/${attempts}): ${describe(error)}`,
      );
    }
  }
  throw new StructuredOutputError(
    `prompt "${name}" did not return JSON matching its schema after ${attempts} attempts: ${describe(lastError)}`,
  );
}

function truncate(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
