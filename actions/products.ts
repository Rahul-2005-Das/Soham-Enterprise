import { prisma } from '../lib/db.ts';
import { productSlugSchema, productQuerySchema } from '../schemas/product.ts';

/**
 * Get products with filtering, search, pagination, and sorting.
 *
 * NOTE: this used to silently fall back to fabricated mock catalog data
 * (fake ids, fake timestamps) whenever the database query failed or was
 * unseeded. That made the API return data that looked real but referenced
 * products that don't exist in the database, which silently broke
 * cart/checkout. Real errors now propagate; an empty catalog returns a
 * genuinely empty list.
 */
export async function getProducts(query?: {
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'popular';
  page?: number;
  limit?: number;
}) {
  const validatedQuery = productQuerySchema.parse(query || {});

  const whereClause: any = {
    active: true,
    category: { is: { active: true } },
  };

  if (validatedQuery.categoryId) {
    whereClause.categoryId = validatedQuery.categoryId;
  }
  if (validatedQuery.categorySlug) {
    whereClause.category.is.slug = validatedQuery.categorySlug;
  }
  if (validatedQuery.brand) {
    whereClause.brand = { equals: validatedQuery.brand, mode: 'insensitive' };
  }
  if (validatedQuery.inStock) {
    whereClause.stockQuantity = { gt: 0 };
  }
  if (validatedQuery.minPrice !== undefined || validatedQuery.maxPrice !== undefined) {
    whereClause.price = {};
    if (validatedQuery.minPrice !== undefined) whereClause.price.gte = validatedQuery.minPrice;
    if (validatedQuery.maxPrice !== undefined) whereClause.price.lte = validatedQuery.maxPrice;
  }
  if (validatedQuery.search) {
    whereClause.OR = [
      { name: { contains: validatedQuery.search, mode: 'insensitive' } },
      { description: { contains: validatedQuery.search, mode: 'insensitive' } },
      { brand: { contains: validatedQuery.search, mode: 'insensitive' } },
      { sku: { contains: validatedQuery.search, mode: 'insensitive' } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (validatedQuery.sortBy === 'price_asc') orderBy = { price: 'asc' };
  if (validatedQuery.sortBy === 'price_desc') orderBy = { price: 'desc' };
  if (validatedQuery.sortBy === 'name') orderBy = { name: 'asc' };

  const skip = (validatedQuery.page - 1) * validatedQuery.limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy,
      skip,
      take: validatedQuery.limit,
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  return {
    products,
    pagination: {
      total: totalCount,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages: Math.max(1, Math.ceil(totalCount / validatedQuery.limit)),
    },
  };
}

/**
 * Get a single product by slug, including active reviews.
 * Returns null if not found (caller maps this to a 404).
 */
export async function getProductBySlug(slug: string) {
  const { slug: validatedSlug } = productSlugSchema.parse({ slug });

  const product = await prisma.product.findFirst({
    where: {
      slug: validatedSlug,
      active: true,
      category: { is: { active: true } },
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return product;
}

/**
 * Get a single active product by id, including active reviews.
 * Returns null if not found or inactive.
 */
export async function getProductById(id: string) {
  if (!id || typeof id !== 'string') return null;

  const product = await prisma.product.findFirst({
    where: { id, active: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return product;
}

/**
 * Get all active product categories with product counts.
 */
export async function getProductCategories() {
  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: { where: { active: true } } },
      },
    },
  });

  return categories;
}
