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
    // RULE 2: exactly ONE category (a single string, never an array)
    category: z.string(),
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
    author: reference('authors').optional()
  })
})

export const collections = { blog, authors }
