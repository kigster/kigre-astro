/**
 * Provider registry for the AI toolchain.
 *
 * One entry per supported LLM provider: which env vars hold its API key, its
 * default model, and how to build the Genkit plugin + a model reference. The
 * engine (genkit.ts) resolves exactly one provider at runtime and registers it.
 */
import { anthropic } from '@genkit-ai/anthropic'
import { googleAI } from '@genkit-ai/google-genai'
import { openAI } from '@genkit-ai/compat-oai/openai'

export type ProviderName = 'anthropic' | 'gemini' | 'openai'

// Derive the plugin / model-reference types from the real plugin functions, so
// they always match exactly what `genkit({ plugins, model })` accepts — no need
// to chase Genkit's internal type names (GenkitPluginV2, ModelReference<…>).
type GenkitProviderPlugin = ReturnType<typeof anthropic>
type GenkitModelRef = ReturnType<typeof anthropic.model>

export interface ProviderSpec {
  name: ProviderName
  /** Accepted API-key env vars, in priority order. */
  keyEnvVars: string[]
  /** Default model id used when none is requested. */
  defaultModel: string
  /** Build the Genkit plugin for this provider with the given key. */
  plugin: (apiKey: string) => GenkitProviderPlugin
  /** Build a model reference understood by `ai.generate`/`genkit({ model })`. */
  model: (id: string) => GenkitModelRef
}

export const PROVIDERS: Record<ProviderName, ProviderSpec> = {
  anthropic: {
    name: 'anthropic',
    keyEnvVars: ['ANTHROPIC_API_KEY'],
    defaultModel: 'claude-sonnet-4-5',
    plugin: (apiKey) => anthropic({ apiKey }),
    model: (id) => anthropic.model(id),
  },
  gemini: {
    name: 'gemini',
    keyEnvVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    defaultModel: 'gemini-flash-latest',
    plugin: (apiKey) => googleAI({ apiKey }),
    model: (id) => googleAI.model(id),
  },
  openai: {
    name: 'openai',
    keyEnvVars: ['OPENAI_API_KEY'],
    defaultModel: 'gpt-4o-mini',
    plugin: (apiKey) => openAI({ apiKey }),
    model: (id) => openAI.model(id),
  },
}

/** Auto-detect order when no provider is explicitly requested. */
export const PROVIDER_PRIORITY: ProviderName[] = ['anthropic', 'gemini', 'openai']

export function isProviderName(value: string): value is ProviderName {
  return value === 'anthropic' || value === 'gemini' || value === 'openai'
}
