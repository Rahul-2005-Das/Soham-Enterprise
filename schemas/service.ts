import { z } from 'zod';

export const serviceSlugSchema = z.object({
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100),
});

export const serviceQuerySchema = z.object({
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  search: z.string().optional(),
  activeOnly: z.boolean().default(true),
});

export const createServiceCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().min(10),
  image: z.string().url().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const createServiceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().min(10),
  shortDescription: z.string().max(255).optional(),
  inspectionFee: z.number().positive(),
  estimatedDuration: z.string().min(2),
  warrantyDays: z.number().int().nonnegative().default(30),
  active: z.boolean().default(true),
});
