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

/** Read a provider's key from the environment, treating blank as absent. */
function keyFor(name: ProviderName): string | undefined {
  for (const envVar of PROVIDERS[name].keyEnvVars) {
    const value = process.env[envVar]?.trim()
    if (value) return value
  }
  return undefined
}

/**
 * Build a ResolvedProvider, applying the model override precedence.
 *
 * `allowOverride` is false for fallback candidates: --model / DIGEST_MODEL names
 * a model of the *preferred* provider (e.g. claude-opus-4-8), and carrying it to
 * a fallback would request a Claude model from OpenAI. Fallbacks use their own
 * default instead.
 */
function resolveWith(
  name: ProviderName,
  apiKey: string,
  opts: ResolveOptions,
  allowOverride = true,
): ResolvedProvider {
  const override = opts.model ?? process.env.DIGEST_MODEL
  const model =
    (allowOverride ? override : undefined) ?? PROVIDERS[name].defaultModel
  return { name, model, apiKey }
}

/**
 * Every provider we could run with, in priority order.
 *
 * An explicit provider (--provider / AI_PROVIDER) yields exactly one candidate:
 * an explicit choice must fail loudly rather than quietly run somewhere else.
 * Otherwise this is every provider with a non-blank key, so a caller can fall
 * back when the preferred one rejects its credentials.
 */
export function providerCandidates(
  opts: ResolveOptions = {},
): ResolvedProvider[] {
  const requested = opts.provider ?? process.env.AI_PROVIDER

  if (requested) {
    if (!isProviderName(requested)) {
      throw new Error(
        `Unknown provider "${requested}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`,
      )
    }
    const apiKey = opts.apiKey ?? keyFor(requested)
    if (!apiKey) {
      throw new Error(
        `Provider "${requested}" selected, but no key set in [${PROVIDERS[requested].keyEnvVars.join(', ')}].`,
      )
    }
    return [resolveWith(requested, apiKey, opts)]
  }

  // An explicit key with no explicit provider can only mean the top priority.
  if (opts.apiKey) {
    return [resolveWith(PROVIDER_PRIORITY[0]!, opts.apiKey, opts)]
  }

  const withKeys = PROVIDER_PRIORITY.filter((name) => keyFor(name))
  const candidates = withKeys.map((name, index) =>
    // only the preferred provider honours --model / DIGEST_MODEL
    resolveWith(name, keyFor(name)!, opts, index === 0),
  )

  if (candidates.length === 0) {
    const keys = PROVIDER_PRIORITY.flatMap((p) => PROVIDERS[p].keyEnvVars)
    throw new Error(
      `No AI provider key found. Set one of [${keys.join(', ')}], ` +
        'or pass --provider / AI_PROVIDER explicitly.',
    )
  }
  return candidates
}

/**
 * Decide which provider/model/key to use. Precedence:
 *   1. explicit option, 2. env var, 3. auto-detect by first key present,
 *   4. throw with an actionable message.
 *
 * This does not check that the key actually works — see `createAIWithFallback`.
 */
export function resolveProvider(opts: ResolveOptions = {}): ResolvedProvider {
  return providerCandidates(opts)[0]!
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

/**
 * True for "these credentials were refused", which is the only failure worth
 * retrying elsewhere. A rate limit, a timeout, or a bug must surface as-is
 * rather than quietly spend money at another vendor.
 */
export function isAuthError(error: unknown): boolean {
  const e = error as { status?: unknown; code?: unknown; message?: unknown }
  if (e?.status === 'UNAUTHENTICATED' || e?.code === 401) return true
  return (
    typeof e?.message === 'string' &&
    /\b401\b|authentication_error|invalid[ _-]?(x-)?api[ _-]?key|unauthorized/i.test(
      e.message,
    )
  )
}

/** Cheapest call that proves the key is accepted. */
async function verifyCredentials(ai: ReturnType<typeof createAI>) {
  await ai.generate({ prompt: 'ping', config: { maxOutputTokens: 1 } })
}

/**
 * Pick the first candidate whose key the provider actually accepts.
 *
 * Credentials are checked up front, before the pipeline runs, so every stage
 * shares one provider. Falling back mid-run would be worse than failing: a
 * digest drafted by one vendor and fact-checked by another is incoherent.
 *
 * Falling back is announced loudly. Silently demoting Claude to a weaker model
 * from another vendor is how a bad digest gets published unnoticed.
 */
export async function createAIWithFallback(candidates: ResolvedProvider[]) {
  const rejected: string[] = []

  for (const [index, resolved] of candidates.entries()) {
    const ai = createAI(resolved)
    try {
      await verifyCredentials(ai)
    } catch (error) {
      if (!isAuthError(error)) throw error
      rejected.push(resolved.name)
      const next = candidates[index + 1]
      console.warn(
        `⚠ ${resolved.name} rejected its API key (401). ` +
          (next
            ? `Falling back to ${next.name}. Check the key in [${PROVIDERS[resolved.name].keyEnvVars.join(', ')}].`
            : 'No provider left to try.'),
      )
      continue
    }

    if (rejected.length > 0) {
      console.warn(
        `⚠ Running on ${resolved.name} (${resolved.model}) instead of ${rejected[0]} — output quality may differ.`,
      )
    }
    return { ai, resolved }
  }

  throw new Error(
    `Every provider rejected its API key (tried: ${rejected.join(', ')}). ` +
      'Regenerate the key(s), or set AI_PROVIDER to pin a working provider.',
  )
}
