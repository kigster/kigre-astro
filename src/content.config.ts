import { defineCollection, reference, z } from 'astro:content'
import { glob, file } from 'astro/loaders'

// Authors collection — sourced from a single JSON file. Each entry needs an `id`
// so posts can reference it via `author: <id>`. Loaded with the `file()` loader,
// which keys entries by their `id` property.
const authors = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    // local asset path (e.g. /assets/images/authors/...), not a URL
    avatar: z.string()
  })
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // RULE 1: exact legacy permalink, /YYYY/MM/DD/slug.html
    permalink: z.string().regex(/^\/\d{4}\/\d{2}\/\d{2}\/.+\.html$/, {
      message: 'permalink must match /YYYY/MM/DD/slug.html'
    }),
    // RULE 2: exactly ONE category, from the canonical set (see AGENT.md).
    // The build fails on anything else — same enforcement as permalinks.
    category: z.enum([
      'Production',
      'Software',
      'AI',
      'Open Source',
      'Hardware',
      'Essays',
      'Music & Elsewhere'
    ]),
    // RULE 3: any number of tags
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    heroImage: z.string().optional(),
    comments: z.boolean().default(true),
    draft: z.boolean().default(false),
    // Article kind. `post` = human-written; `digest` = AI-generated news digest,
    // rendered with a distinct stamp + disclaimer. Defaults to `post`.
    type: z.enum(['post', 'digest']).default('post'),
    // For AI digests: the common theme tying the surveyed papers to the related
    // human post, plus a link + title for that related post. All optional (only
    // meaningful for `type: digest`).
    common_theme: z.string().optional(),
    theme_article_link: z.string().optional(),
    theme_article_title: z.string().optional(),
    // Optional author — must match an `id` in the authors collection.
    author: reference('authors').optional(),
    // Per-post <head> scripts, rendered by BaseLayout just before </head>.
    // Each entry is either a plain src string, or an object with `src` plus
    // any extra attributes (data-trigger, data-element, …) rendered verbatim
    // — e.g. the qualified.at embed. Scripts execute in list order. ONLY a
    // post that lists a script here gets it; every other page stays untouched.
    headScripts: z
      .array(
        z.union([z.string(), z.object({ src: z.string() }).catchall(z.string())])
      )
      .default([])
  })
})

export const collections = { blog, authors }
