/**
 * The AI engine: resolves one provider (Gemini / Anthropic / OpenAI) from the
 * environment (or explicit overrides) and builds a Genkit instance with that
 * provider's plugin, default model, and the dotprompt library wired in.
 *
 * Multi-provider strategy: rather than overriding the model per prompt call
 * (which Genkit does not document for loaded prompts), we set the resolved model
 * as the instance default via `genkit({ model })`. The `prompts/*.prompt` files
 * therefore declare no model and stay provider-agnostic — one prompt, any provider.
 */
import { genkit } from 'genkit'
import {
  PROVIDERS,
  PROVIDER_PRIORITY,
  isProviderName,
  type ProviderName,
} from './providers'
import { registerTools } from './tools'

export interface ResolveOptions {
  /** Explicit provider (overrides AI_PROVIDER and auto-detect). */
  provider?: string
  /** Explicit model id (overrides DIGEST_MODEL and the provider default). */
  model?: string
  /** Explicit API key (overrides the provider's key env vars). */
  apiKey?: string
}

export interface ResolvedProvider {
  name: ProviderName
  model: string
  apiKey: string
}

/**
 * Decide which provider/model/key to use. Precedence:
 *   1. explicit option, 2. env var, 3. auto-detect by first key present,
 *   4. throw with an actionable message.
 */
export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  const requested = opts.provider ?? process.env.AI_PROVIDER

  let name: ProviderName | undefined
  if (requested) {
    if (!isProviderName(requested)) {
      throw new Error(
        `Unknown provider "${requested}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`,
      )
    }
    name = requested
  } else {
    name = PROVIDER_PRIORITY.find((p) =>
      PROVIDERS[p].keyEnvVars.some((v) => process.env[v]),
    )
  }

  if (!name) {
    const keys = PROVIDER_PRIORITY.flatMap((p) => PROVIDERS[p].keyEnvVars)
    throw new Error(
      `No AI provider key found. Set one of [${keys.join(', ')}], ` +
        'or pass --provider / AI_PROVIDER explicitly.',
    )
  }

  const spec = PROVIDERS[name]
  const apiKey =
    opts.apiKey ??
    spec.keyEnvVars.map((v) => process.env[v]).find((v): v is string => !!v)
  if (!apiKey) {
    throw new Error(
      `Provider "${name}" selected, but no key set in [${spec.keyEnvVars.join(', ')}].`,
    )
  }

  const model = opts.model ?? process.env.DIGEST_MODEL ?? spec.defaultModel
  return { name, model, apiKey }
}

/** Build a Genkit instance for the resolved provider, prompts + tools wired in. */
export function createAI(resolved: ResolvedProvider) {
  const spec = PROVIDERS[resolved.name]
  const ai = genkit({
    plugins: [spec.plugin(resolved.apiKey)],
    model: spec.model(resolved.model),
    promptDir: 'prompts',
  })
  registerTools(ai)
  return ai
}
