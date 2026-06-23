import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/content/blog";
const files = readdirSync(dir).filter((f) => /\.(md|mdx)$/.test(f));
let changed = 0;

for (const f of files) {
  const path = join(dir, f);
  const raw = readFileSync(path, "utf8");
  if (!raw.startsWith("---")) {
    console.log(`SKIP (no frontmatter): ${f}`);
    continue;
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    console.log(`SKIP (unterminated frontmatter): ${f}`);
    continue;
  }
  const fm = raw.slice(0, end);
  if (/^author:/m.test(fm)) continue;
  const updated = fm + "\nauthor: kig" + raw.slice(end);
  writeFileSync(path, updated);
  changed++;
  console.log(`ADDED: ${f}`);
}
console.log(`\nDone. Added author to ${changed} file(s).`);
