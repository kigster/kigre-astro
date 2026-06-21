import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // RULE 1: exact legacy permalink, /YYYY/MM/DD/slug.html
    permalink: z.string().regex(/^\/\d{4}\/\d{2}\/\d{2}\/.+\.html$/, {
      message: 'permalink must match /YYYY/MM/DD/slug.html',
    }),
    // RULE 2: exactly ONE category (a single string, never an array)
    category: z.string(),
    // RULE 3: any number of tags
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    heroImage: z.string().optional(),
    comments: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
