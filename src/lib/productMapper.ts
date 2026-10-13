import { SparePartProduct } from '../types';
import { PRODUCT_IMAGE_FALLBACK } from '../components/ProductImage';

/**
 * Shape returned by GET /api/products, /api/products?slug=, /api/products?id=
 * (a Prisma Product with its category, images and reviews included).
 * Declared loosely here since the frontend doesn't generate Prisma types.
 */
export interface ApiProduct {
  id: string;
  name?: string;
  title?: string;
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
  category: { id: string; name: string; slug: string; active?: boolean };
  images?: { url: string; altText: string | null; sortOrder: number }[] | null;
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

function numericValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeApiProduct(input: unknown, expectedId?: string): ApiProduct {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Product details were missing from the cart response.');
  }
  const raw = input as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const nameValue = typeof raw.name === 'string' ? raw.name : raw.title;
  const name = typeof nameValue === 'string' ? nameValue.trim() : '';
  const price = numericValue(raw.salePrice ?? raw.price, Number.NaN);
  if (!id || (expectedId && id !== expectedId)) {
    throw new Error('The cart response did not contain the selected product.');
  }
  if (!name || !Number.isFinite(price) || price < 0) {
    throw new Error('The selected product has incomplete name or price details.');
  }

  const basePrice = numericValue(raw.price, price);
  const rawCategory = raw.category;
  const categoryObject = rawCategory && typeof rawCategory === 'object'
    ? rawCategory as Record<string, unknown>
    : null;
  const categoryName =
    (typeof categoryObject?.name === 'string' && categoryObject.name.trim()) ||
    (typeof rawCategory === 'string' && rawCategory.trim()) ||
    (typeof raw.categoryName === 'string' && raw.categoryName.trim()) ||
    'Other';
  const categoryId =
    (typeof categoryObject?.id === 'string' && categoryObject.id) ||
    (typeof raw.categoryId === 'string' && raw.categoryId) ||
    'other';
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const images = rawImages.flatMap((entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      return [{ url: entry.trim(), altText: name, sortOrder: 0 }];
    }
    if (!entry || typeof entry !== 'object') return [];
    const image = entry as Record<string, unknown>;
    const url = typeof image.url === 'string' ? image.url.trim() : '';
    return url ? [{
      url,
      altText: typeof image.altText === 'string' ? image.altText : name,
      sortOrder: numericValue(image.sortOrder),
    }] : [];
  });
  if (images.length === 0) {
    const imageUrl = [raw.imageUrl, raw.image]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (imageUrl) images.push({ url: imageUrl.trim(), altText: name, sortOrder: 0 });
  }

  return {
    id,
    name,
    slug: typeof raw.slug === 'string' && raw.slug ? raw.slug : id,
    sku: typeof raw.sku === 'string' && raw.sku ? raw.sku : id,
    brand: typeof raw.brand === 'string' && raw.brand ? raw.brand : 'General',
    description: typeof raw.description === 'string' ? raw.description : '',
    specifications: raw.specifications && typeof raw.specifications === 'object'
      ? raw.specifications as Record<string, unknown>
      : {},
    compatibility: Array.isArray(raw.compatibility)
      ? raw.compatibility.filter((entry): entry is string => typeof entry === 'string')
      : [],
    price: basePrice,
    salePrice: Number.isFinite(numericValue(raw.salePrice, Number.NaN)) ? numericValue(raw.salePrice) : null,
    stockQuantity: Math.max(0, Math.floor(numericValue(raw.stockQuantity ?? raw.stock ?? raw.inventory))),
    lowStockThreshold: Math.max(0, Math.floor(numericValue(raw.lowStockThreshold))),
    active: raw.active !== false,
    category: {
      id: categoryId,
      name: categoryName,
      slug: typeof categoryObject?.slug === 'string' ? categoryObject.slug : categoryId,
    },
    images,
    reviews: Array.isArray(raw.reviews)
      ? raw.reviews.filter((review): review is { rating: number } => Boolean(
        review && typeof review === 'object' &&
        Number.isFinite((review as { rating?: unknown }).rating)
      )).map((review) => ({ rating: Number(review.rating) }))
      : [],
  };
}

/**
 * Real products don't (yet) have a stored per-product warranty period, so we
 * use a single, clearly-documented uniform default for the spare-parts
 * category rather than fabricating a per-product number. Adjust here if the
 * business wants to track this per product later (would need a schema field).
 */
const DEFAULT_WARRANTY_MONTHS = 6;

export function mapApiProductToSparePart(p: ApiProduct): SparePartProduct {
  const safeProduct = normalizeApiProduct(p);
  const price = Number(safeProduct.salePrice ?? safeProduct.price);
  const originalPrice = Number(safeProduct.price);
  const images = [...(safeProduct.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const reviews = safeProduct.reviews ?? [];
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : 0;

  let stockStatus: SparePartProduct['stockStatus'] = 'IN_STOCK';
  if (safeProduct.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK';
  else if (safeProduct.stockQuantity <= safeProduct.lowStockThreshold) stockStatus = 'LOW_STOCK';

  return {
    id: safeProduct.id,
    slug: safeProduct.slug,
    sku: safeProduct.sku,
    name: safeProduct.name || safeProduct.title || safeProduct.id,
    categoryId: safeProduct.category.id,
    category: safeProduct.category.name,
    brand: safeProduct.brand,
    price,
    originalPrice,
    stockQuantity: safeProduct.stockQuantity,
    stockStatus,
    rating,
    reviewCount,
    isOemVerified: true,
    imageUrl: images[0]?.url || PRODUCT_IMAGE_FALLBACK,
    additionalImages: images.slice(1).map((i) => i.url),
    description: safeProduct.description,
    specifications: (safeProduct.specifications ?? {}) as Record<string, string>,
    compatibility: safeProduct.compatibility ?? [],
    warrantyMonths: DEFAULT_WARRANTY_MONTHS,
  };
}
