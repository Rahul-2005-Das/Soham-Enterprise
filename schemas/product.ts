import { z } from 'zod';

export const productSlugSchema = z.object({
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100),
});

export const productQuerySchema = z.object({
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name', 'popular']).optional().default('popular'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(12),
});

export const createProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150),
  sku: z.string().min(2).max(50),
  brand: z.string().min(2).max(100),
  description: z.string().min(10),
  specifications: z.record(z.string(), z.any()),
  compatibility: z.array(z.string()),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
});
