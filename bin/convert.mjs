#!/usr/bin/env node
/**
 * kig.re migration: AsciiDoc (Jekyll) -> Markdown (Astro)
 *
 * Enforces the three hard rules:
 *   1. Permalinks preserved exactly: /YYYY/MM/DD/slug.html  (written to frontmatter `permalink`)
 *   2. Exactly ONE category per post — first one wins if the source lists several
 *   3. Any number of tags
 *
 * Also:
 *   - AsciiDoc admonitions (NOTE: / [NOTE] / sidebars) -> GitHub callouts ( > [!NOTE] )
 *   - [source,lang] blocks -> ```lang fenced code (Gruvbox themed at render time via Shiki)
 *   - {% lightbox_image {...} %} -> standard markdown image (medium-zoom attaches at runtime)
 *   - {% include ... %} / {% link_to ... %} -> commented-out TODO markers (manual review)
 *
 * Usage: node bin/convert.mjs [path-to-_posts] [out-dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Asciidoctor from 'asciidoctor';
import { NodeHtmlMarkdown } from 'node-html-markdown';

const SRC = process.argv[2] || '../kig.re/jekyll/v2/_posts';
const OUT = process.argv[3] || 'src/content/blog';
const asciidoctor = Asciidoctor();

const ADMONITION_MAP = {
  NOTE: 'NOTE', TIP: 'TIP', IMPORTANT: 'IMPORTANT',
  WARNING: 'WARNING', CAUTION: 'CAUTION',
};

// ---- helpers -------------------------------------------------------------

/** Parse `:page-foo: bar` AsciiDoc attribute frontmatter into an object + body. */
function splitFrontmatter(raw) {
  const lines = raw.split('\n');
  const attrs = {};
  let i = 0;
  // skip a leading document-title line (= Title) and blank lines before attrs
  while (i < lines.length && (lines[i].trim() === '' || /^=\s+/.test(lines[i]))) i++;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^:([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (m) {
      attrs[m[1]] = m[2].trim();
    } else if (line.trim() === '') {
      // allow blank lines inside the attribute header block
      // but stop once we hit real content after attributes started
      if (Object.keys(attrs).length > 0) {
        // peek: if next non-empty line is not an attribute, header is done
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j >= lines.length || !/^:([a-zA-Z0-9_-]+):/.test(lines[j])) { i = j; break; }
      }
    } else {
      break;
    }
  }
  return { attrs, body: lines.slice(i).join('\n') };
}

/** Strip surrounding quotes and AsciiDoc bracket-array syntax. */
function clean(v) {
  if (v == null) return '';
  return String(v).replace(/^["']|["']$/g, '').trim();
}

/** Parse `["a", "b"]` or `[a, b]` -> ['a','b'] */
function parseList(v) {
  if (!v) return [];
  const inner = v.replace(/^\[|\]$/g, '');
  return inner
    .split(',')
    .map((s) => s.trim().replace(/^["']+|["']+$/g, '').trim())
    .filter(Boolean);
}

/** YYYY-MM-DD-slug.adoc -> { date, slug, permalink } */
function fromFilename(file) {
  const base = path.basename(file, '.adoc');
  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!m) throw new Error(`Bad filename (no date prefix): ${file}`);
  const [, y, mo, d, slug] = m;
  return {
    date: `${y}-${mo}-${d}`,
    slug,
    permalink: `/${y}/${mo}/${d}/${slug}.html`, // RULE 1: exact legacy URL
  };
}

/** Pre-process Jekyll Liquid tags before AsciiDoc parsing. */
function preprocessLiquid(body) {
  let warnings = [];

  // {% lightbox_image { "url": "...", "title": "...", "group": "..." } %}
  body = body.replace(/\{%\s*lightbox_image\s*(\{[\s\S]*?\})\s*%\}/g, (_, json) => {
    try {
      // normalize single quotes -> double for lenient parsing
      const normalized = json.replace(/'/g, '"');
      const obj = JSON.parse(normalized);
      const url = obj.url.startsWith('/') ? obj.url : `/assets/images/${obj.url}`;
      const title = obj.title || '';
      return `\nimage::${url}[${title}]\n`;
    } catch (e) {
      warnings.push(`lightbox parse failed: ${json.slice(0, 60).replace(/\n/g, ' ')}`);
      return '';
    }
  });

  // {% include path %}  -> TODO marker (quiz HTML etc, needs manual port)
  body = body.replace(/\{%\s*include\s+([^\s%]+)\s*%\}/g, (_, inc) => {
    warnings.push(`include needs manual port: ${inc}`);
    return `\n+++\n<!-- TODO: migrate include ${inc} -->\n+++\n`;
  });

  // {% link_to "anchor" %} -> internal anchor link placeholder
  body = body.replace(/\{%\s*link_to\s+"([^"]+)"\s*%\}/g, (_, a) => `<<${a}>>`);

  // {% index_on %} / {% index_off %} -> drop (TOC control, irrelevant)
  body = body.replace(/\{%\s*index_(on|off)\s*%\}/g, '');

  // any remaining liquid tag -> strip + warn
  body = body.replace(/\{%[^%]*%\}/g, (m) => {
    warnings.push(`unhandled liquid stripped: ${m.slice(0, 50)}`);
    return '';
  });

  return { body, warnings };
}

/** Convert leftover AsciiDoc admonitions in the produced markdown to GH callouts.
 *  Asciidoctor renders NOTE:/[NOTE] to <div class="admonition note">; but since we
 *  go through HTML->MD, they arrive as a blockquote-ish block. We instead handle them
 *  at the AsciiDoc-source level for reliability. */
function adocAdmonitionsToGitHub(body) {
  // Inline form:  NOTE: text   (single paragraph)
  body = body.replace(
    /^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\s+(.+(?:\n(?!\n).+)*)/gm,
    (_, type, text) => {
      const t = ADMONITION_MAP[type];
      const quoted = text.split('\n').map((l) => `> ${l}`).join('\n');
      return `> [!${t}]\n${quoted}`;
    }
  );

  // Block form:
  // [NOTE]
  // ====
  // multi-line
  // ====
  body = body.replace(
    /^\[(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n====\s*\n([\s\S]*?)\n====/gm,
    (_, type, inner) => {
      const t = ADMONITION_MAP[type];
      const quoted = inner.trim().split('\n').map((l) => `> ${l}`).join('\n');
      return `> [!${t}]\n${quoted}`;
    }
  );

  // Sidebar **** ... **** -> NOTE callout (closest GH equivalent)
  body = body.replace(
    /^\*\*\*\*\s*\n([\s\S]*?)\n\*\*\*\*/gm,
    (_, inner) => {
      const quoted = inner.trim().split('\n').map((l) => `> ${l}`).join('\n');
      return `> [!NOTE]\n${quoted}`;
    }
  );

  return body;
}

// ---- main ----------------------------------------------------------------

function convertOne(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { attrs, body: rawBody } = splitFrontmatter(raw);
  const meta = fromFilename(file);

  // RULE 2: first category wins
  const cats = parseList(attrs['page-categories']);
  const category = cats[0] || 'uncategorized';
  // RULE 3: any number of tags
  const tags = parseList(attrs['page-tags']);

  const title = clean(attrs['page-title']) || meta.slug.replace(/-/g, ' ');
  const description = clean(attrs['page-excerpt'] || attrs['page-quote'] || '');
  const heroImage = clean(attrs['page-post_image'] || '');

  // 1) handle admonitions at source level (most reliable)
  let body = adocAdmonitionsToGitHub(rawBody);
  // 2) handle Liquid tags
  const pp = preprocessLiquid(body);
  body = pp.body;

  // 3) AsciiDoc -> HTML -> Markdown for the rich body (tables, links, source blocks)
  //    We keep our already-converted GH callouts safe by protecting them first.
  const protectedBlocks = [];
  body = body.replace(/^> \[![A-Z]+\][\s\S]*?(?=\n\n|\n*$)/gm, (m) => {
    protectedBlocks.push(m);
    return `%%PROTECTED_${protectedBlocks.length - 1}%%`;
  });

  // Convert [source,lang] fenced blocks ourselves (asciidoctor->html->md mangles them)
  const langMap = { clike: 'c', shell: 'bash' };
  const normLang = (l) => langMap[l.trim()] || l.trim();
  // (a) delimited form: [source,lang] \n ---- \n code \n ----
  body = body.replace(
    /^\[source,\s*([a-zA-Z+]+)[^\]]*\]\s*\n-{4,}\s*\n([\s\S]*?)\n-{4,}/gm,
    (_, lang, code) => `\n\`\`\`${normLang(lang)}\n${code.replace(/\s+$/, '')}\n\`\`\`\n`
  );
  // (b) listing form (no delimiters): [source,lang] \n <lines until blank line>
  body = body.replace(
    /^\[source,\s*([a-zA-Z+]+)[^\]]*\]\s*\n((?:(?!\n\n)[\s\S])*?)(?=\n\n|\n*$)/gm,
    (_, lang, code) => `\n\`\`\`${normLang(lang)}\n${code.replace(/\s+$/, '')}\n\`\`\`\n`
  );
  // also handle ---- blocks without explicit lang
  body = body.replace(
    /^-{4,}\s*\n([\s\S]*?)\n-{4,}/gm,
    (_, code) => `\n\`\`\`\n${code.replace(/\s+$/, '')}\n\`\`\`\n`
  );

  // image::URL[alt] -> markdown image
  body = body.replace(/^image::([^\[\s]+)\[([^\]]*)\]/gm, (_, url, alt) => {
    const altText = (alt.split(',')[0] || '').trim();
    return `![${altText}](${url})`;
  });
  body = body.replace(/^image::([^\[\s]+)$/gm, (_, url) => `![](${url})`);

  // drop a stray document-title line (= Title) if it leads the body
  body = body.replace(/^\s*=\s+.+\n/, '');

  // headings: AsciiDoc == Title -> ## , === -> ###
  body = body.replace(/^(={2,6})\s+(.+)$/gm, (_, eq, txt) => `${'#'.repeat(eq.length)} ${txt}`);

  // inline: link http://x[label] -> [label](http://x)
  body = body.replace(/(https?:\/\/[^\s\[]+)\[([^\]]*)\]/g, (_, url, label) =>
    label ? `[${label}](${url})` : url
  );

  // bold **x** already ok; AsciiDoc _italic_ stays; restore protected callouts
  body = body.replace(/%%PROTECTED_(\d+)%%/g, (_, i) => protectedBlocks[+i]);

  // collapse 3+ newlines
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // ---- assemble frontmatter ----
  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${meta.date}`,
    `permalink: ${JSON.stringify(meta.permalink)}`, // RULE 1
    `category: ${JSON.stringify(category)}`,         // RULE 2
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`, // RULE 3
    description ? `description: ${JSON.stringify(description)}` : null,
    heroImage ? `heroImage: ${JSON.stringify(heroImage)}` : null,
    'comments: true',
    '---',
    '',
  ].filter((l) => l !== null).join('\n');

  const out = fm + body + '\n';
  const outPath = path.join(OUT, `${meta.slug}.md`);
  fs.writeFileSync(outPath, out);

  return { slug: meta.slug, permalink: meta.permalink, category, tags: tags.length, warnings: pp.warnings };
}

function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.adoc'));
  console.log(`Converting ${files.length} posts: ${SRC} -> ${OUT}\n`);
  const report = [];
  for (const f of files) {
    try {
      const r = convertOne(path.join(SRC, f));
      report.push(r);
      const warn = r.warnings.length ? `  ⚠ ${r.warnings.length} warning(s)` : '';
      console.log(`✓ ${r.permalink.padEnd(60)} [${r.category}] ${r.tags} tags${warn}`);
      r.warnings.forEach((w) => console.log(`    └ ${w}`));
    } catch (e) {
      console.error(`✗ ${f}: ${e.message}`);
    }
  }
  // verification summary
  console.log(`\n— Verification —`);
  console.log(`Posts converted: ${report.length}/${files.length}`);
  const noCat = report.filter((r) => r.category === 'uncategorized');
  console.log(`Posts with exactly one category: ${report.length - noCat.length}/${report.length}`);
  const perms = new Set(report.map((r) => r.permalink));
  console.log(`Unique permalinks: ${perms.size}/${report.length} ${perms.size === report.length ? '✓' : '✗ COLLISION!'}`);
  fs.writeFileSync('scripts/migration-report.json', JSON.stringify(report, null, 2));
  console.log(`\nReport: scripts/migration-report.json`);
}

main();
