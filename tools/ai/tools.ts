/**
 * Dotprompt tools, registered on the Genkit instance so prompts can reference
 * them by name in their `tools:` frontmatter.
 */
import { genkit, z } from 'genkit'

type AI = ReturnType<typeof genkit>

/** Register all toolchain tools on the given Genkit instance. */
export function registerTools(ai: AI): void {
  ai.defineTool(
    {
      name: 'currentDate',
      description: "Returns today's date as an ISO string (YYYY-MM-DD).",
      inputSchema: z.object({}),
      outputSchema: z.string(),
    },
    async () => new Date().toISOString().slice(0, 10),
  )
}
