import { prisma } from '../lib/db.ts';
import { serviceSlugSchema, serviceQuerySchema } from '../schemas/service.ts';
import { SERVICES_LIST } from '../src/data/mockData.ts';

/**
 * Get all active services with optional category filtering and search
 */
export async function getServices(query?: {
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  const validatedQuery = serviceQuerySchema.parse(query || {});

  try {
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

    if (services && services.length > 0) {
      return services;
    }
  } catch (error) {
    // If DB is offline / unseeded, log warning and gracefully fallback to static catalog
    console.warn('[actions/services] Database query failed or unseeded, falling back to static services catalog:', error);
  }

  // Graceful fallback for UI stability before database connection
  return SERVICES_LIST.map((srv) => ({
    id: srv.id,
    categoryId: 'cat-' + srv.id.replace('srv-', ''),
    name: srv.name,
    slug: srv.slug,
    description: srv.description,
    shortDescription: srv.tagline,
    inspectionFee: srv.startingPrice,
    estimatedDuration: `${srv.durationMinutes} mins`,
    warrantyDays: srv.warrantyDays,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-' + srv.id.replace('srv-', ''),
      name: srv.shortName,
      slug: srv.slug,
      description: srv.tagline,
      image: srv.imageUrl,
      active: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }));
}

/**
 * Get single service by slug
 */
export async function getServiceBySlug(slug: string) {
  const { slug: validatedSlug } = serviceSlugSchema.parse({ slug });

  try {
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

    if (service) return service;
  } catch (error) {
    console.warn(`[actions/services] Database query failed for slug ${validatedSlug}:`, error);
  }

  // Fallback to static catalog item
  const fallback = SERVICES_LIST.find((s) => s.slug === validatedSlug);
  if (!fallback) return null;

  return {
    id: fallback.id,
    categoryId: 'cat-' + fallback.id.replace('srv-', ''),
    name: fallback.name,
    slug: fallback.slug,
    description: fallback.description,
    shortDescription: fallback.tagline,
    inspectionFee: fallback.startingPrice,
    estimatedDuration: `${fallback.durationMinutes} mins`,
    warrantyDays: fallback.warrantyDays,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-' + fallback.id.replace('srv-', ''),
      name: fallback.shortName,
      slug: fallback.slug,
      description: fallback.tagline,
      image: fallback.imageUrl,
      active: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    reviews: [],
  };
}

/**
 * Get all active service categories
 */
export async function getServiceCategories() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
    if (categories && categories.length > 0) return categories;
  } catch (error) {
    console.warn('[actions/services] Failed to fetch service categories from DB:', error);
  }

  // Fallback
  return SERVICES_LIST.map((srv, idx) => ({
    id: 'cat-' + srv.id.replace('srv-', ''),
    name: srv.shortName,
    slug: srv.slug,
    description: srv.tagline,
    image: srv.imageUrl,
    active: true,
    sortOrder: idx + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { services: 1 },
  }));
}
