import { prisma } from '../lib/db.ts';
import { serviceSlugSchema, serviceQuerySchema } from '../schemas/service.ts';

/**
 * Get all active services with optional category filtering and search.
 *
 * NOTE: this used to silently fall back to fabricated mock catalog data on
 * any database error. Real errors now propagate to the caller instead of
 * being disguised as a successful response.
 */
export async function getServices(query?: {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  const validatedQuery = serviceQuerySchema.parse(query || {});

  const whereClause: any = {};
  if (validatedQuery.activeOnly) {
    whereClause.active = true;
  }
  if (validatedQuery.categoryId) {
    whereClause.categoryId = validatedQuery.categoryId;
  }
  if (validatedQuery.categorySlug) {
    whereClause.category = { slug: validatedQuery.categorySlug };
  }
  if (validatedQuery.search) {
    whereClause.OR = [
      { name: { contains: validatedQuery.search, mode: 'insensitive' } },
      { description: { contains: validatedQuery.search, mode: 'insensitive' } },
    ];
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return services;
}

/**
 * Get single service by slug. Returns null if not found.
 */
export async function getServiceBySlug(slug: string) {
  const { slug: validatedSlug } = serviceSlugSchema.parse({ slug });

  const service = await prisma.service.findUnique({
    where: { slug: validatedSlug },
    include: {
      category: true,
      reviews: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  return service;
}

/**
 * Get all active service categories.
 */
export async function getServiceCategories() {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { services: true },
      },
    },
  });

  return categories;
}
