import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { isAuthError, providerCandidates, resolveProvider } from './genkit'

const ENV_KEYS = [
  'AI_PROVIDER',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'DIGEST_MODEL',
] as const

describe('resolveProvider', () => {
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {}
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      const v = saved[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  test('throws an actionable error when no key is set', () => {
    expect(() => resolveProvider()).toThrow(/No AI provider key found/)
  })

  test('auto-detects by priority (anthropic wins over openai)', () => {
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    const r = resolveProvider()
    expect(r.name).toBe('anthropic')
    expect(r.apiKey).toBe('sk-ant')
    expect(r.model).toBe('claude-sonnet-4-5')
  })

  test('AI_PROVIDER overrides auto-detect', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.AI_PROVIDER = 'openai'
    const r = resolveProvider()
    expect(r.name).toBe('openai')
    expect(r.apiKey).toBe('sk-openai')
  })

  test('explicit options beat env vars', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    const r = resolveProvider({
      provider: 'gemini',
      apiKey: 'g-key',
      model: 'gemini-2.5-pro',
    })
    expect(r.name).toBe('gemini')
    expect(r.apiKey).toBe('g-key')
    expect(r.model).toBe('gemini-2.5-pro')
  })

  test('gemini falls back to GOOGLE_API_KEY', () => {
    process.env.GOOGLE_API_KEY = 'goog'
    expect(resolveProvider({ provider: 'gemini' }).apiKey).toBe('goog')
  })

  test('unknown provider is rejected', () => {
    expect(() => resolveProvider({ provider: 'claude' })).toThrow(/Unknown provider/)
  })

  test('selecting a provider without its key throws naming the var', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    expect(() => resolveProvider({ provider: 'openai' })).toThrow(/OPENAI_API_KEY/)
  })

  test('DIGEST_MODEL overrides the provider default', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    process.env.DIGEST_MODEL = 'claude-opus-4-8'
    expect(resolveProvider().model).toBe('claude-opus-4-8')
  })
})

describe('providerCandidates', () => {
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {}
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      const v = saved[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  test('lists every keyed provider in priority order', () => {
    process.env.OPENAI_API_KEY = 'sk-openai'
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    expect(providerCandidates().map((c) => c.name)).toEqual(['anthropic', 'openai'])
  })

  test('treats a blank key as absent', () => {
    // the exact shape that silently demoted claude-sonnet-4-5 to gpt-4o-mini
    process.env.ANTHROPIC_API_KEY = ''
    process.env.OPENAI_API_KEY = 'sk-openai'
    expect(providerCandidates().map((c) => c.name)).toEqual(['openai'])
  })

  test('treats a whitespace-only key as absent', () => {
    process.env.ANTHROPIC_API_KEY = '   '
    process.env.OPENAI_API_KEY = 'sk-openai'
    expect(providerCandidates().map((c) => c.name)).toEqual(['openai'])
  })

  test('trims whitespace off a key', () => {
    process.env.ANTHROPIC_API_KEY = '  sk-ant  '
    expect(providerCandidates()[0]?.apiKey).toBe('sk-ant')
  })

  test('an explicit provider offers no fallback', () => {
    process.env.AI_PROVIDER = 'openai'
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    process.env.OPENAI_API_KEY = 'sk-openai'
    expect(providerCandidates().map((c) => c.name)).toEqual(['openai'])
  })

  test('DIGEST_MODEL applies to the preferred provider only', () => {
    process.env.DIGEST_MODEL = 'claude-opus-4-8'
    process.env.ANTHROPIC_API_KEY = 'sk-ant'
    process.env.OPENAI_API_KEY = 'sk-openai'
    const [preferred, fallback] = providerCandidates()
    expect(preferred?.model).toBe('claude-opus-4-8')
    // carrying the override over would ask OpenAI for a Claude model
    expect(fallback?.model).toBe('gpt-4o-mini')
  })

  test('an explicitly chosen provider still honours DIGEST_MODEL', () => {
    process.env.AI_PROVIDER = 'openai'
    process.env.DIGEST_MODEL = 'gpt-4o'
    process.env.OPENAI_API_KEY = 'sk-openai'
    expect(providerCandidates()[0]?.model).toBe('gpt-4o')
  })

  test('throws when no key is set at all', () => {
    expect(() => providerCandidates()).toThrow(/No AI provider key found/)
  })
})

describe('isAuthError', () => {
  test("matches Genkit's UNAUTHENTICATED status", () => {
    expect(isAuthError({ status: 'UNAUTHENTICATED', code: 401 })).toBe(true)
  })

  test('matches the Anthropic 401 body verbatim', () => {
    expect(
      isAuthError(
        new Error(
          '401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}',
        ),
      ),
    ).toBe(true)
  })

  test('does not match a rate limit', () => {
    expect(isAuthError({ status: 'RESOURCE_EXHAUSTED', code: 429 })).toBe(false)
  })

  test('does not match an unrelated bug', () => {
    expect(isAuthError(new TypeError('undefined is not a function'))).toBe(false)
  })

  test('tolerates null', () => {
    expect(isAuthError(null)).toBe(false)
  })
})
