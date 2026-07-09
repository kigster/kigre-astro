#!/usr/bin/env bun
/**
 * Commander CLI for the digest generator (`bun run digest`).
 *
 * Flags map onto DigestConfig only — all pipeline logic lives in index.ts:
 *   -p, --period <days>   fetch window in days (default 7, or DIGEST_DAYS_BACK)
 *   -t, --theme <topics>  scan only papers matching the topic(s)
 *   -l, --last            derive the theme from the latest published post
 *   -d, --draft           with --last: use the latest draft post instead
 */
import { Command, InvalidArgumentError } from "commander";
import { type DigestConfig, runDigest } from "./index";
import { findLatestPost, themeFromPost, type PostMeta } from "./posts";

const BLOG_DIR = "src/content/blog";

function parsePeriod(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new InvalidArgumentError("must be a whole number of days ≥ 1.");
  }
  return n;
}

export interface RawOptions {
  period: number;
  theme?: string;
  last?: boolean;
  draft?: boolean;
}

/**
 * Pure flag→config mapping. `lookupPost` is injected so tests don't need a
 * filesystem; the real CLI passes findLatestPost over src/content/blog.
 */
export function buildConfig(
  opts: RawOptions,
  lookupPost: (query: { draft: boolean }) => PostMeta | undefined,
): DigestConfig {
  if (opts.draft && !opts.last) {
    throw new InvalidArgumentError(
      "-d/--draft only makes sense together with -l/--last.",
    );
  }

  let theme = opts.theme?.trim() || undefined;
  if (opts.last) {
    const post = lookupPost({ draft: Boolean(opts.draft) });
    if (!post) {
      throw new InvalidArgumentError(
        `no ${opts.draft ? "draft" : "published"} post found under ${BLOG_DIR}.`,
      );
    }
    theme = themeFromPost(post);
    console.log(
      `Latest ${opts.draft ? "draft" : "published"} post: ${post.file}`,
    );
  }

  return { daysBack: opts.period, theme };
}

const program = new Command()
  .name("digest")
  .description(
    "Generate an AI-paper digest draft post from recent arXiv submissions.",
  )
  .option(
    "-p, --period <days>",
    "days back to fetch and analyze papers",
    parsePeriod,
    Number(process.env.DIGEST_DAYS_BACK ?? 7),
  )
  .option(
    "-t, --theme <topics>",
    "scan only papers related to the given topic(s)",
  )
  .option(
    "-l, --last",
    "search for papers related to the latest published (non-draft) post",
  )
  .option("-d, --draft", "with --last: use the latest draft post instead")
  .addHelpText(
    "after",
    `
Examples:
  bun run digest                        # weekly digest, last 7 days
  bun run digest -p 14                  # look two weeks back
  bun run digest -t "agentic coding"    # only papers about agentic coding
  bun run digest -l                     # papers related to the latest published post
  bun run digest -l -d                  # papers related to the latest draft post`,
  );

program.hook("preAction", (cmd) => {
  const opts = cmd.opts<RawOptions>();
  if (opts.theme && opts.last) {
    cmd.error("error: -t/--theme and -l/--last are mutually exclusive.");
  }
});

program.action(async (opts: RawOptions) => {
  let config: DigestConfig;
  try {
    config = buildConfig(opts, (q) => findLatestPost(BLOG_DIR, q));
  } catch (err) {
    if (err instanceof InvalidArgumentError)
      program.error(`error: ${err.message}`);
    throw err;
  }
  await runDigest(config);
});

if (import.meta.main) {
  program.parseAsync().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
