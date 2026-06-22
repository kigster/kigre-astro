import { describe, expect, test } from 'bun:test'
import { parseArxivFeed, type Paper } from './arxiv'

const entry = (id: string, title: string, summary: string, published: string) =>
  `<entry><id>${id}</id><title>${title}</title>` +
  `<summary>${summary}</summary><published>${published}</published></entry>`

const SINCE = new Date('2026-06-01T00:00:00Z')

describe('parseArxivFeed', () => {
  test('extracts fields and collapses whitespace', () => {
    const xml = `<feed>${entry('http://arxiv.org/abs/1', 'A  Title\n  here', 'Multi\n line  summary', '2026-06-20T00:00:00Z')}</feed>`
    const into: Paper[] = []
    parseArxivFeed(xml, 'cs.AI', SINCE, into)
    expect(into).toHaveLength(1)
    expect(into[0]!.title).toBe('A Title here')
    expect(into[0]!.summary).toBe('Multi line summary')
    expect(into[0]!.id).toBe('http://arxiv.org/abs/1')
    expect(into[0]!.category).toBe('cs.AI')
  })

  test('drops entries older than `since`', () => {
    const xml = `<feed>${entry('1', 'Old', 'x', '2020-01-01T00:00:00Z')}${entry('2', 'New', 'y', '2026-06-20T00:00:00Z')}</feed>`
    const into: Paper[] = []
    parseArxivFeed(xml, 'cs.LG', SINCE, into)
    expect(into.map((p) => p.title)).toEqual(['New'])
  })

  test('dedupes by id or title against the accumulator', () => {
    const into: Paper[] = [
      { id: '1', title: 'Dup', summary: '', published: '2026-06-20T00:00:00Z', category: 'cs.AI' },
    ]
    const xml =
      `<feed>${entry('1', 'Different', 'x', '2026-06-20T00:00:00Z')}` + // dup id
      `${entry('9', 'Dup', 'y', '2026-06-20T00:00:00Z')}` + // dup title
      `${entry('3', 'Fresh', 'z', '2026-06-20T00:00:00Z')}</feed>` // new
    parseArxivFeed(xml, 'cs.CL', SINCE, into)
    expect(into.map((p) => p.title)).toEqual(['Dup', 'Fresh'])
  })

  test('skips untitled entries', () => {
    const xml = `<feed>${entry('1', '', 'x', '2026-06-20T00:00:00Z')}</feed>`
    const into: Paper[] = []
    parseArxivFeed(xml, 'cs.AI', SINCE, into)
    expect(into).toHaveLength(0)
  })
})
