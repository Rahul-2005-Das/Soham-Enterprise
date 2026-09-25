import { SparePartProduct } from '../types';

/**
 * Shape returned by GET /api/products, /api/products?slug=, /api/products?id=
 * (a Prisma Product with its category, images and reviews included).
 * Declared loosely here since the frontend doesn't generate Prisma types.
 */
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  specifications: Record<string, unknown>;
  compatibility: string[];
  price: string | number;
  salePrice: string | number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  active: boolean;
  category: { id: string; name: string; slug: string };
  images: { url: string; altText: string | null; sortOrder: number }[];
  reviews?: { rating: number }[];
}

export interface ApiProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: { products: number };
}

/**
 * Real products don't (yet) have a stored per-product warranty period, so we
 * use a single, clearly-documented uniform default for the spare-parts
 * category rather than fabricating a per-product number. Adjust here if the
 * business wants to track this per product later (would need a schema field).
 */
const DEFAULT_WARRANTY_MONTHS = 6;

export function mapApiProductToSparePart(p: ApiProduct): SparePartProduct {
  const price = Number(p.salePrice ?? p.price);
  const originalPrice = Number(p.price);
  const images = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const reviews = p.reviews ?? [];
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : 0;

  let stockStatus: SparePartProduct['stockStatus'] = 'IN_STOCK';
  if (p.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK';
  else if (p.stockQuantity <= p.lowStockThreshold) stockStatus = 'LOW_STOCK';

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    category: p.category?.name ?? 'Other',
    brand: p.brand,
    price,
    originalPrice,
    stockQuantity: p.stockQuantity,
    stockStatus,
    rating,
    reviewCount,
    isOemVerified: true,
    imageUrl: images[0]?.url ?? '',
    additionalImages: images.slice(1).map((i) => i.url),
    description: p.description,
    specifications: (p.specifications ?? {}) as Record<string, string>,
    compatibility: p.compatibility ?? [],
    warrantyMonths: DEFAULT_WARRANTY_MONTHS,
  };
}
