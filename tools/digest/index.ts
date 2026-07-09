#!/usr/bin/env bun
/**
 * Weekly AI-paper digest generator for kig.re — Genkit + dotprompt edition.
 *
 * Pipeline (each stage feeds the next):
 *   1. FETCH    — recent papers from arXiv (cs.AI, cs.LG, cs.CL)        [arxiv.ts]
 *   2. CLUSTER  — group into 3–5 themes              [prompts/cluster.prompt]
 *   3. DRAFT    — write a connected digest             [prompts/draft.prompt]
 *   4. VERIFY   — fact-check claims vs. abstracts      [prompts/verify.prompt]
 *   5. EMIT     — write a Markdown draft post with correct frontmatter
 *
 * The provider (gemini | anthropic | openai) is chosen at runtime from the
 * environment by the engine (../ai/genkit). Output is always `draft: true`; the
 * weekly GitHub Action opens a PR for human review.
 *
 * Invoked via `tools/digest/cli.ts` (`bun run digest`), which parses the
 * -p/--period, -t/--theme, and -l/--last flags into a DigestConfig. The full
 * multi-mode CLI (--article-type, --article-depth, --compile-sources) remains
 * .plans/004.
 */
import fs from "node:fs";
import path from "node:path";
import { createAI, resolveProvider } from "../ai/genkit";
import { fetchArxiv, type Paper } from "./arxiv";

const OUT_DIR = process.env.DIGEST_OUT_DIR ?? "notes/drafts/ai-digests";
const CATEGORIES = ["cs.AI", "cs.LG", "cs.CL"];
const MAX_PAPERS = 40;

export interface DigestConfig {
  /** How many days back to fetch papers (the -p/--period flag). */
  daysBack: number;
  /** Optional topic filter narrowing the arXiv scan (-t/--theme or -l/--last). */
  theme?: string;
}

interface Theme {
  name: string;
  paperIndices: number[];
}
interface ClusterOutput {
  themes: Theme[];
}
interface VerifyOutput {
  ok: boolean;
  issues: string[];
}

export async function runDigest(config: DigestConfig): Promise<void> {
  const resolved = resolveProvider();
  console.log(`AI provider: ${resolved.name} (model: ${resolved.model})`);
  if (config.theme) console.log(`Theme filter: ${config.theme}`);
  const ai = createAI(resolved);

  // ---------- 1. FETCH ----------
  const papers = await fetchArxiv({
    categories: CATEGORIES,
    daysBack: config.daysBack,
    max: MAX_PAPERS,
    theme: config.theme,
  });
  console.log(
    `FETCH: ${papers.length} papers in the last ${config.daysBack} days`,
  );
  if (papers.length === 0) {
    console.log("No papers found; exiting.");
    return;
  }

  // ---------- 2. CLUSTER ----------
  const papersList = papers
    .map((p, i) => `[${i}] ${p.title}\n${p.summary.slice(0, 400)}`)
    .join("\n\n");
  const clusterRes = await ai.prompt("cluster")({ papers: papersList });
  const themes = (clusterRes.output as ClusterOutput | undefined)?.themes ?? [];
  console.log(`CLUSTER: ${themes.length} themes`);

  // ---------- 3. DRAFT ----------
  const themesAndPapers = themes
    .map((t) => {
      const ps = t.paperIndices
        .map((i) => papers[i])
        .filter((p): p is Paper => Boolean(p))
        .map((p) => `- "${p.title}" (${p.id}): ${p.summary.slice(0, 500)}`)
        .join("\n");
      return `## Theme: ${t.name}\n${ps}`;
    })
    .join("\n\n");
  const today = new Date().toISOString().slice(0, 10);
  const draftRes = await ai.prompt("draft")({
    themesAndPapers,
    date: today,
    paperCount: papers.length,
  });
  const body = draftRes.text;

  // ---------- 4. VERIFY ----------
  const abstracts = papers
    .map((p) => `"${p.title}": ${p.summary}`)
    .join("\n\n");
  const verifyRes = await ai.prompt("verify")({ abstracts, draft: body });
  const verdict = (verifyRes.output as VerifyOutput | undefined) ?? {
    ok: false,
    issues: ["verifier returned no structured output"],
  };
  console.log(
    `VERIFY: ${verdict.ok ? "PASS" : "ISSUES"} (${verdict.issues.length})`,
  );
  for (const issue of verdict.issues) console.log(`  ⚠ ${issue}`);

  // ---------- 5. EMIT ----------
  const outPath = emit(body, verdict, papers.length, today);
  console.log(`EMIT: ${outPath} (draft, ${verdict.ok ? "clean" : "FLAGGED"})`);
  console.log(
    "\nDone. Review the draft, set draft:false, and merge to publish.",
  );
}

function emit(
  body: string,
  verdict: VerifyOutput,
  paperCount: number,
  isoDate: string,
): string {
  const [y, m, d] = isoDate.split("-");
  // filename follows the blog post convention: date prefix, slug after
  const filename = `${isoDate}-ai-papers-digest.md`;
  const permalink = `/${y}/${m}/${d}/ai-papers-digest.html`;
  const flagged = !verdict.ok;

  const banner = flagged
    ? `> [!WARNING]\n> Auto-generated draft flagged by the verifier — review before publishing:\n${verdict.issues
        .map((i) => `> - ${i}`)
        .join("\n")}\n`
    : "> [!NOTE]\n> Auto-generated weekly digest. Reviewed by the verification pass; still worth a human read before publishing.\n";

  const frontmatter = [
    "---",
    `title: "AI Papers This Week — ${y}.${m}.${d}"`,
    `date: ${isoDate}`,
    `permalink: "${permalink}"`,
    'category: "ai-research"',
    'tags: ["ai", "machine-learning", "papers", "weekly-digest"]',
    `description: "A synthesized digest connecting ${paperCount} AI papers from the past week."`,
    "comments: true",
    "draft: true", // always a draft — a human reviews before publishing
    "---",
    "",
    banner,
    "",
    body,
    "",
    "---",
    `*This digest was generated automatically from arXiv submissions (${CATEGORIES.join(", ")}) over the past week, then fact-checked against source abstracts.*`,
    "",
  ].join("\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, frontmatter);
  return outPath;
}

// Direct invocation (`bun tools/digest/index.ts`) keeps the historic
// env-driven defaults; `bun run digest` goes through cli.ts instead.
if (import.meta.main) {
  runDigest({ daysBack: Number(process.env.DIGEST_DAYS_BACK ?? 7) }).catch(
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
