// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";
import { remarkAlert } from "remark-github-blockquote-alert";

// https://astro.build/config
export default defineConfig({
  site: "https://kig.re",
  trailingSlash: "ignore",
  build: {
    // posts use legacy /YYYY/MM/DD/slug.html — emit exactly that file, not slug/index.html
    format: "file",
  },
  markdown: {
    remarkPlugins: [remarkAlert],
    shikiConfig: {
      // Gruvbox Dark for code blocks, always (per design decision)
      theme: "ayu-mirage",
      wrap: false,
    },
  },
  // pagefind indexes the built HTML in dist/ after each build (static, client-side search)
  integrations: [mdx(), sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
});
