// A tag page that lists a single post is a near-duplicate of that post's row
// on the index: thin content that dilutes crawl budget and ranks for nothing.
// Tags with fewer posts than this are noindex'd (tags/[tag].astro) and dropped
// from the sitemap (astro.config.mjs) — both read this one definition.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export const MIN_POSTS_TO_INDEX_TAG = 2;

/**
 * Tags below the threshold, read straight from the post frontmatter.
 * astro.config.mjs runs before the content layer exists, so getCollection()
 * is not available there.
 */
export function thinTags(blogDir = path.resolve('src/content/blog')) {
  const counts = new Map();
  for (const file of fs.readdirSync(blogDir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const match = fs.readFileSync(path.join(blogDir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const data = parse(match[1]) ?? {};
    if (data.draft) continue;
    for (const tag of data.tags ?? []) counts.set(String(tag), (counts.get(String(tag)) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n < MIN_POSTS_TO_INDEX_TAG).map(([tag]) => tag));
}
