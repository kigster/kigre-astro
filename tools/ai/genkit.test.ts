import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { resolveProvider } from './genkit'

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
