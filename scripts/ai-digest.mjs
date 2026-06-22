#!/usr/bin/env node
/**
 * Weekly AI-paper digest generator for kig.re
 *
 * Pipeline (each stage's output feeds the next):
 *   1. FETCH    — pull last 7 days of papers from arXiv (cs.AI, cs.LG, cs.CL)
 *   2. CLUSTER  — ask Claude to group them into 3-5 themes
 *   3. DRAFT    — ask Claude to write a connected digest (per-theme synthesis)
 *   4. VERIFY   — second Claude pass checks claims against the real abstracts
 *   5. EMIT     — write a Markdown post into src/content/blog/ with correct frontmatter
 *
 * Designed to run in CI (GitHub Actions) on a weekly cron. Requires ANTHROPIC_API_KEY.
 * The post is written as a DRAFT (draft: true) so a human reviews before it goes live —
 * the workflow opens a PR rather than committing to main.
 *
 * Usage: ANTHROPIC_API_KEY=... node scripts/ai-digest.mjs
 */
import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.DIGEST_MODEL || "claude-opus-4-8";
const OUT_DIR = "notes/drafts/ai-digest";
const CATEGORIES = ["cs.AI", "cs.LG", "cs.CL"];
const MAX_PAPERS = 40;

if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY is required.");
  process.exit(1);
}

// ---------- Stage 1: FETCH ----------
async function fetchArxiv() {
  const since = new Date(Date.now() - 7 * 864e5);
  const all = [];
  for (const cat of CATEGORIES) {
    const url =
      `http://export.arxiv.org/api/query?search_query=cat:${cat}` +
      `&sortBy=submittedDate&sortOrder=descending&max_results=${MAX_PAPERS}`;
    const res = await fetch(url);
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    for (const e of entries) {
      const grab = (tag) =>
        (e.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [
          ,
          "",
        ])[1].trim();
      const published = grab("published");
      if (new Date(published) < since) continue;
      const title = grab("title").replace(/\s+/g, " ");
      const summary = grab("summary").replace(/\s+/g, " ");
      const id = grab("id");
      if (!title || all.find((p) => p.id === id)) continue;
      all.push({ id, title, summary, published, category: cat });
    }
  }
  console.log(`Stage 1 FETCH: ${all.length} papers in last 7 days`);
  return all.slice(0, MAX_PAPERS);
}

// ---------- Claude helper ----------
async function claude(system, user, maxTokens = 4000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok)
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// ---------- Stage 2: CLUSTER ----------
async function cluster(papers) {
  const list = papers
    .map((p, i) => `[${i}] ${p.title}\n${p.summary.slice(0, 400)}`)
    .join("\n\n");
  const out = await claude(
    'You are an ML research editor. Group papers into 3-5 coherent themes. Respond ONLY with JSON: {"themes":[{"name":"...","paper_indices":[0,2,5]}]}. No prose, no markdown fences.',
    `Group these ${papers.length} papers from the past week into themes:\n\n${list}`,
    1500,
  );
  const json = JSON.parse(out.replace(/```json|```/g, "").trim());
  console.log(`Stage 2 CLUSTER: ${json.themes.length} themes`);
  return json.themes;
}

// ---------- Stage 3: DRAFT ----------
async function draft(themes, papers) {
  const ctx = themes
    .map((t) => {
      const ps = t.paper_indices
        .map((i) => papers[i])
        .filter(Boolean)
        .map((p) => `- "${p.title}" (${p.id}): ${p.summary.slice(0, 500)}`)
        .join("\n");
      return `## Theme: ${t.name}\n${ps}`;
    })
    .join("\n\n");
  const today = new Date().toISOString().slice(0, 10);
  return claude(
    "You write a weekly digest of AI research for an experienced engineering audience (the kig.re blog). " +
      "Write in clear prose, no hype. For each theme, synthesize what connects the papers and why it matters. " +
      "Use GitHub callouts (> [!NOTE]) sparingly for key takeaways. Link papers by their arXiv URL. " +
      "Only state findings actually supported by the abstracts provided — never invent results. " +
      "Output Markdown body only (no frontmatter).",
    `Write this week's digest (${today}). Connect the themes into a coherent narrative where possible:\n\n${ctx}`,
    6000,
  );
}

// ---------- Stage 4: VERIFY ----------
async function verify(body, papers) {
  const abstracts = papers
    .map((p) => `"${p.title}": ${p.summary}`)
    .join("\n\n");
  const out = await claude(
    "You are a fact-checker. Compare the draft against the source abstracts. " +
      'Respond ONLY with JSON: {"ok":true|false,"issues":["..."]}. ' +
      "Flag any claim, statistic, or finding in the draft NOT supported by the abstracts. No prose.",
    `SOURCE ABSTRACTS:\n${abstracts}\n\n---\nDRAFT:\n${body}`,
    2000,
  );
  try {
    const json = JSON.parse(out.replace(/```json|```/g, "").trim());
    console.log(
      `Stage 4 VERIFY: ${json.ok ? "PASS" : "ISSUES"} (${json.issues?.length || 0})`,
    );
    (json.issues || []).forEach((i) => console.log(`  ⚠ ${i}`));
    return json;
  } catch {
    return { ok: false, issues: ["verifier returned unparseable output"] };
  }
}

// ---------- Stage 5: EMIT ----------
function emit(body, verifyResult, paperCount) {
  const now = new Date();
  const [y, m, d] = now.toISOString().slice(0, 10).split("-");
  const week = `${y}-${m}-${d}`;
  const slug = `ai-papers-digest-${week}`;
  const permalink = `/${y}/${m}/${d}/${slug}.html`;
  const flagged = !verifyResult.ok;

  const fm = [
    "---",
    `title: "AI Papers This Week — ${y}.${m}.${d}"`,
    `date: ${week}`,
    `permalink: "${permalink}"`,
    'category: "ai-research"',
    'tags: ["ai", "machine-learning", "papers", "weekly-digest"]',
    `description: "A synthesized digest connecting ${paperCount} AI papers from the past week."`,
    "comments: true",
    `draft: ${flagged ? "true" : "true"}`, // always draft: human reviews before publish
    "---",
    "",
    flagged
      ? `> [!WARNING]\n> Auto-generated draft flagged by the verifier — review before publishing:\n${verifyResult.issues.map((i) => `> - ${i}`).join("\n")}\n`
      : "> [!NOTE]\n> Auto-generated weekly digest. Reviewed by the verification pass; still worth a human read before publishing.\n",
    "",
    body,
    "",
    "---",
    `*This digest was generated automatically from arXiv submissions (${CATEGORIES.join(", ")}) over the past week, then fact-checked against source abstracts.*`,
    "",
  ].join("\n");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${slug}.md`);
  fs.writeFileSync(outPath, fm);
  console.log(
    `Stage 5 EMIT: ${outPath} (draft, ${flagged ? "FLAGGED" : "clean"})`,
  );
  return outPath;
}

// ---------- run ----------
(async () => {
  const papers = await fetchArxiv();
  if (papers.length === 0) {
    console.log("No papers found; exiting.");
    return;
  }
  const themes = await cluster(papers);
  const body = await draft(themes, papers);
  const v = await verify(body, papers);
  emit(body, v, papers.length);
  console.log(
    "\nDone. Review the draft, set draft:false, and merge to publish.",
  );
})();
