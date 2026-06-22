/**
 * Stage 1 (FETCH): pull recent papers from the arXiv Atom API.
 *
 * Kept provider-agnostic and side-effect-free so it can be reused by the future
 * `article` / `news` modes (see .plans/004). No XML library — the Atom feed is
 * simple enough to slice by `<entry>` and grab tags with a small regex.
 */
export interface Paper {
  id: string
  title: string
  summary: string
  published: string
  category: string
}

export interface FetchOptions {
  /** arXiv categories, e.g. ['cs.AI', 'cs.LG', 'cs.CL']. */
  categories: string[]
  /** How many days back to include. */
  daysBack: number
  /** Hard cap on total papers returned. */
  max: number
}

/**
 * Pure parser for an arXiv Atom feed. Extracted from `fetchArxiv` so the
 * date-filtering / dedup / field-extraction logic can be unit-tested without a
 * network round-trip. Appends new, non-duplicate papers into `into`.
 */
export function parseArxivFeed(
  xml: string,
  category: string,
  since: Date,
  into: Paper[],
): void {
  const entries = xml.split('<entry>').slice(1)

  for (const e of entries) {
    const grab = (tag: string): string => {
      const m = e.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
      return (m?.[1] ?? '').trim()
    }

    const published = grab('published')
    if (new Date(published) < since) continue

    const title = grab('title').replace(/\s+/g, ' ')
    const summary = grab('summary').replace(/\s+/g, ' ')
    const id = grab('id')

    // skip untitled entries and duplicates (by arXiv id or title)
    if (!title || into.some((p) => p.id === id || p.title === title)) continue
    into.push({ id, title, summary, published, category })
  }
}

export async function fetchArxiv(opts: FetchOptions): Promise<Paper[]> {
  const since = new Date(Date.now() - opts.daysBack * 864e5)
  const all: Paper[] = []

  for (const cat of opts.categories) {
    const url =
      `http://export.arxiv.org/api/query?search_query=cat:${cat}` +
      `&sortBy=submittedDate&sortOrder=descending&max_results=${opts.max}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`arXiv API ${res.status} for ${cat}`)
    parseArxivFeed(await res.text(), cat, since, all)
  }

  return all.slice(0, opts.max)
}
