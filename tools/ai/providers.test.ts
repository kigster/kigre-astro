import { describe, expect, test } from 'bun:test'
import { PROVIDERS, PROVIDER_PRIORITY, isProviderName } from './providers'

describe('isProviderName', () => {
  test('accepts the three known providers', () => {
    expect(isProviderName('anthropic')).toBe(true)
    expect(isProviderName('gemini')).toBe(true)
    expect(isProviderName('openai')).toBe(true)
  })

  test('rejects anything else', () => {
    expect(isProviderName('claude')).toBe(false)
    expect(isProviderName('Anthropic')).toBe(false)
    expect(isProviderName('')).toBe(false)
  })
})

describe('PROVIDERS registry', () => {
  test('every prioritised provider is fully specified', () => {
    for (const name of PROVIDER_PRIORITY) {
      const spec = PROVIDERS[name]
      expect(spec.name).toBe(name)
      expect(spec.keyEnvVars.length).toBeGreaterThan(0)
      expect(spec.defaultModel).toBeTruthy()
      expect(typeof spec.plugin).toBe('function')
      expect(typeof spec.model).toBe('function')
    }
  })

  test('priority order is anthropic, gemini, openai', () => {
    expect(PROVIDER_PRIORITY).toEqual(['anthropic', 'gemini', 'openai'])
  })
})
