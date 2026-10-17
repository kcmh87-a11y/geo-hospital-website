import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(), description: z.string(), category: z.enum(['GEO · AIO', '콘텐츠 전략', '병원 마케팅']),
    date: z.coerce.date(), readTime: z.number(), featured: z.boolean().default(false),
  }),
});
export const collections = { insights };
