import { prisma } from '../lib/db.ts';
import { productSlugSchema, productQuerySchema } from '../schemas/product.ts';
import { SPARE_PARTS_LIST } from '../src/data/mockData.ts';

/**
 * Get products with filtering, search, pagination, and sorting
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

  try {
    const whereClause: any = { active: true };

    if (validatedQuery.categoryId) {
      whereClause.categoryId = validatedQuery.categoryId;
    }
    if (validatedQuery.categorySlug) {
      whereClause.category = { slug: validatedQuery.categorySlug };
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

    if (products && products.length > 0) {
      return {
        products,
        pagination: {
          total: totalCount,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(totalCount / validatedQuery.limit),
        },
      };
    }
  } catch (error) {
    console.warn('[actions/products] Database query failed or unseeded, falling back to static products catalog:', error);
  }

  // Graceful fallback for UI stability
  let filtered = [...SPARE_PARTS_LIST];
  if (validatedQuery.search) {
    const s = validatedQuery.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s)
    );
  }
  if (validatedQuery.brand) {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === validatedQuery.brand?.toLowerCase());
  }
  if (validatedQuery.inStock) {
    filtered = filtered.filter((p) => p.stockStatus !== 'OUT_OF_STOCK');
  }
  if (validatedQuery.maxPrice) {
    filtered = filtered.filter((p) => p.price <= (validatedQuery.maxPrice || Infinity));
  }

  return {
    products: filtered.map((p) => {
      const allImages = [p.imageUrl, ...(p.additionalImages || [])];
      const catSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return {
        id: p.id,
        categoryId: 'pcat-' + catSlug,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        description: p.description,
        specifications: p.specifications,
        compatibility: p.compatibility,
        price: p.price,
        salePrice: p.originalPrice && p.originalPrice > p.price ? p.price : null,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: 5,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: allImages.map((img: string, idx: number) => ({
          id: `img-${p.id}-${idx}`,
          productId: p.id,
          url: img,
          altText: p.name,
          sortOrder: idx,
          createdAt: new Date(),
        })),
        category: {
          id: 'pcat-' + catSlug,
          name: p.category,
          slug: catSlug,
          description: null,
          image: p.imageUrl || null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }),
    pagination: {
      total: filtered.length,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages: 1,
    },
  };
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string) {
  const { slug: validatedSlug } = productSlugSchema.parse({ slug });

  try {
    const product = await prisma.product.findUnique({
      where: { slug: validatedSlug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (product) return product;
  } catch (error) {
    console.warn(`[actions/products] Database query failed for slug ${validatedSlug}:`, error);
  }

  // Fallback
  const fallback = SPARE_PARTS_LIST.find((p) => p.slug === validatedSlug);
  if (!fallback) return null;

  const allImages = [fallback.imageUrl, ...(fallback.additionalImages || [])];
  const catSlug = fallback.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: fallback.id,
    categoryId: 'pcat-' + catSlug,
    name: fallback.name,
    slug: fallback.slug,
    sku: fallback.sku,
    brand: fallback.brand,
    description: fallback.description,
    specifications: fallback.specifications,
    compatibility: fallback.compatibility,
    price: fallback.price,
    salePrice: fallback.originalPrice && fallback.originalPrice > fallback.price ? fallback.price : null,
    stockQuantity: fallback.stockQuantity,
    lowStockThreshold: 5,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: allImages.map((img: string, idx: number) => ({
      id: `img-${fallback.id}-${idx}`,
      productId: fallback.id,
      url: img,
      altText: fallback.name,
      sortOrder: idx,
      createdAt: new Date(),
    })),
    category: {
      id: 'pcat-' + catSlug,
      name: fallback.category,
      slug: catSlug,
      description: null,
      image: fallback.imageUrl || null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    reviews: [],
  };
}

/**
 * Get all product categories
 */
export async function getProductCategories() {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (categories && categories.length > 0) return categories;
  } catch (error) {
    console.warn('[actions/products] Failed to fetch product categories from DB:', error);
  }

  // Fallback
  const uniqueCategories = Array.from(new Set(SPARE_PARTS_LIST.map((p) => p.category)));
  return uniqueCategories.map((name, idx) => ({
    id: `pcat-${idx + 1}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `Original certified replacement parts for ${name}`,
    image: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      products: SPARE_PARTS_LIST.filter((p) => p.category === name).length,
    },
  }));
}
