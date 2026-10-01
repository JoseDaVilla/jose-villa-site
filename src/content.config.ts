import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        year: z.number().optional(),
        /** Shown instead of the year when the date isn't the point (e.g. "3-month engagement"). */
        when: z.string().optional(),
        summary: z.string(),
        tags: z.array(z.string()).max(6),
        /** featured = layered colour bands; more = typographic index. */
        group: z.enum(['featured', 'more']),
        order: z.number(),
        color: z.enum(['orange', 'sky', 'sun', 'leaf', 'blue']),
        role: z.string(),
        cover: image().optional(),
        gallery: z.array(image()).optional(),
        embedUrl: z.string().url().optional(),
        liveUrl: z.string().url().optional(),
        repoUrl: z.string().url().optional(),
      })
      .refine((p) => p.year !== undefined || p.when !== undefined, {
        message: 'Each project needs a year or a "when" label.',
      }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    period: z.string(),
    url: z.string().url().optional(),
    order: z.number(),
    group: z.enum(['current', 'earlier']),
  }),
});

export const collections = { projects, experience };
