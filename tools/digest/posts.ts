/**
 * Blog-post introspection for the digest CLI's `--last` / `--draft` flags.
 *
 * Parsing is deliberately regex-light and frontmatter-only: we need just
 * `title`, `tags`, `date`, and `draft` from `src/content/blog/*.md`, and the
 * pure functions here are unit-tested without touching the filesystem.
 */
import fs from "node:fs";
import path from "node:path";

export interface PostMeta {
  file: string;
  title: string;
  tags: string[];
  date: string;
  draft: boolean;
}

/** Parse the YAML frontmatter of a blog post. Returns null if there is none. */
export function parsePostMeta(raw: string, file: string): PostMeta | null {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1]!;

  const grab = (key: string): string => {
    const line = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return (line?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  };

  const tagsRaw = fm.match(/^tags:\s*\[(.*)\]$/m)?.[1] ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  // fall back to the YYYY-MM-DD filename prefix used by every post
  const date = grab("date") || (file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "");

  return {
    file,
    title: grab("title"),
    tags,
    date,
    draft: grab("draft") === "true",
  };
}

/** Most recent post matching the draft filter, by date (filename as tiebreak). */
export function latestPost(
  posts: PostMeta[],
  opts: { draft: boolean },
): PostMeta | undefined {
  return posts
    .filter((p) => p.draft === opts.draft)
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.file.localeCompare(a.file),
    )[0];
}

/**
 * Derive a search theme from a post: its tags when present (the strongest
 * topical signal), otherwise its title.
 */
export function themeFromPost(post: PostMeta): string {
  return post.tags.length > 0 ? post.tags.join(", ") : post.title;
}

/** Impure wrapper: scan `dir` and return the latest (non-)draft post, if any. */
export function findLatestPost(
  dir: string,
  opts: { draft: boolean },
): PostMeta | undefined {
  const posts = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => parsePostMeta(fs.readFileSync(path.join(dir, f), "utf8"), f))
    .filter((p): p is PostMeta => p !== null);
  return latestPost(posts, opts);
}
