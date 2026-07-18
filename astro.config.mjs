// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMermaid from "./src/lib/remark-mermaid.mjs";

// the pdf.js worker ships as an .mjs asset; nginx (which now serves kig.re)
// has no MIME mapping for .mjs and answers application/octet-stream, which
// Chrome rejects for module scripts — the /speaking slide viewer then renders
// nothing. Astro pins rollup's assetFileNames, so rename .mjs assets to .js
// after bundling (and patch every reference) — text/javascript everywhere.
const mjsAssetsAsJs = {
  name: "mjs-assets-as-js",
  generateBundle(_options, bundle) {
    const renames = new Map();
    for (const [fileName, entry] of Object.entries(bundle)) {
      if (entry.type === "asset" && fileName.endsWith(".mjs")) {
        const js = fileName.slice(0, -".mjs".length) + ".js";
        entry.fileName = js;
        bundle[js] = entry;
        delete bundle[fileName];
        renames.set(fileName, js);
      }
    }
    if (renames.size === 0) return;
    for (const entry of Object.values(bundle)) {
      if (entry.type !== "chunk") continue;
      for (const [from, to] of renames) {
        entry.code = entry.code.replaceAll(from, to);
      }
    }
  },
};

// Shiki bundles no grammar for DNS zone files (RFC 1035), so ```dns fences
// would silently fall back to plaintext. This minimal TextMate grammar covers
// what zone files actually contain: comments, $directives, record types
// (incl. the non-standard ANAME), the IN class, quoted TXT values, IPs/TTLs.
const dnsZoneLang = {
  name: "dns",
  scopeName: "source.dns-zone",
  aliases: ["zone", "dns-zone"],
  fileTypes: ["zone"],
  patterns: [
    { name: "comment.line.semicolon.dns-zone", match: ";.*$" },
    { name: "keyword.control.directive.dns-zone", match: "^\\$(ORIGIN|TTL|INCLUDE|GENERATE)\\b" },
    {
      name: "string.quoted.double.dns-zone",
      begin: "\"",
      end: "\"",
      patterns: [{ name: "constant.character.escape.dns-zone", match: "\\\\." }],
    },
    {
      name: "storage.type.record.dns-zone",
      match: "(?<=\\s)(SOA|AAAA|ANAME|ALIAS|CAA|CNAME|DNSKEY|DS|HTTPS|LOC|MX|NAPTR|NS|PTR|SPF|SRV|SSHFP|SVCB|TLSA|TXT|A)(?=\\s)",
    },
    { name: "keyword.other.class.dns-zone", match: "(?<=\\s)(IN|CH|HS)(?=\\s)" },
    { name: "constant.numeric.ip.dns-zone", match: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
    { name: "constant.numeric.ttl.dns-zone", match: "(?<=\\s)\\d+(?=\\s|$)" },
    { name: "variable.language.origin.dns-zone", match: "^@|(?<=\\s)@(?=\\s)" },
    { name: "entity.name.tag.owner.dns-zone", match: "^[A-Za-z0-9_*][A-Za-z0-9._*-]*" },
  ],
};

// https://astro.build/config
export default defineConfig({
  site: "https://kig.re",
  trailingSlash: "ignore",
  build: {
    // posts use legacy /YYYY/MM/DD/slug.html — emit exactly that file, not slug/index.html
    format: "file",
  },
  markdown: {
    // remarkMermaid swaps ```mermaid fences for an HTML shell before Shiki
    // can highlight them; the SVG is drawn client-side (MermaidRenderer.astro)
    remarkPlugins: [remarkAlert, remarkMermaid],
    shikiConfig: {
      // Gruvbox Dark for code blocks, always (per design decision)
      theme: "ayu-mirage",
      wrap: false,
      // custom grammar so ```dns / ```zone fences highlight zone files
      langs: [dnsZoneLang],
    },
  },
  // pagefind indexes the built HTML in dist/ after each build (static, client-side search)
  integrations: [
    mdx(),
    // React powers exactly one island: the react-pdf slide viewer on /speaking
    react(),
    sitemap({
      // [...permalink].astro registers its Astro route WITHOUT ".html" (see the
      // getStaticPaths comment there) so build.format:"file" can append it to
      // the physical file. Astro's route manifest — which this plugin reads —
      // never sees that suffix, so left alone it emits extension-less post
      // URLs that disagree with the real served file and with each post's own
      // self-referencing <link rel="canonical"> (built from post.data.permalink,
      // which does include ".html"). Re-append it here so sitemap and canonical
      // always agree on one URL per post.
      //
      // (The homepage entry needs no such fix: this plugin already special-cases
      // build.format:"file" by stripping the bare origin's trailing slash — see
      // write-sitemap.js — and "https://kig.re" / "https://kig.re/" are the same
      // URL by spec, so that's not a real mismatch.)
      serialize(item) {
        const u = new URL(item.url);
        if (/^\/\d{4}\/\d{2}\/\d{2}\/[^/]+$/.test(u.pathname) && !u.pathname.endsWith(".html")) {
          u.pathname += ".html";
        }
        item.url = u.href;
        return item;
      },
    }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss(), mjsAssetsAsJs],
  },
});
