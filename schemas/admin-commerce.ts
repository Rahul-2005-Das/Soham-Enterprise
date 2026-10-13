import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const httpUrl = z.string().trim().url().refine((value) => value.startsWith('https://') || value.startsWith('http://'));
const productImageUrl = z.string().trim().max(7_000_000).refine((value) => {
  if (/^\/(?:images|uploads)\/[A-Za-z0-9._/-]+$/.test(value) && !value.includes('..')) return true;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}, 'Use a valid HTTPS image URL, a local /images or /uploads path, or a valid base64 image.');
const safeLink = z.string().trim().refine((value) => {
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  return value.startsWith('https://') || value.startsWith('http://');
}).optional().or(z.literal(''));

export const adminProductSchema = z.object({
  name: nonEmpty.max(160),
  sku: z.string().trim().max(80).optional(),
  description: nonEmpty.max(10000),
  brand: nonEmpty.max(100),
  categoryId: nonEmpty,
  price: z.number().finite().nonnegative(),
  salePrice: z.number().finite().nonnegative().nullable().optional(),
  shippingCharge: z.number().finite().nonnegative().max(1_000_000)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, 'Shipping charge can have at most 2 decimal places.')
    .nullable().optional(),
  stockQuantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  compatibility: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  imageUrls: z.array(productImageUrl).max(12).default([]),
});

export const adminProductUpdateSchema = adminProductSchema.partial();

export const adminServiceSchema = z.object({
  name: nonEmpty.max(160),
  categoryId: nonEmpty,
  brandApplicability: z.string().trim().max(100).optional().default('All Brands'),
  description: nonEmpty.max(10000),
  shortDescription: z.string().trim().max(2000).nullable().optional(),
  inspectionFee: z.number().finite().nonnegative(),
  estimatedDuration: nonEmpty.max(50),
  warrantyDays: z.number().int().nonnegative().default(30),
  active: z.boolean().default(true),
});

export const adminServiceUpdateSchema = adminServiceSchema.partial();

export const adminServiceCategorySchema = z.object({
  name: nonEmpty.max(100),
  description: nonEmpty.max(2000),
  image: httpUrl.nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const adminServiceCategoryUpdateSchema = adminServiceCategorySchema.partial();


export const adminCategorySchema = z.object({
  name: nonEmpty.max(100),
  description: z.string().trim().max(2000).optional().default(''),
  image: httpUrl.optional().or(z.literal('')),
  parentId: z.string().trim().nullable().optional(),
  active: z.boolean().default(true),
});

export const adminCategoryUpdateSchema = adminCategorySchema.partial();

export const adminBrandSchema = z.object({
  name: nonEmpty.max(100),
  active: z.boolean().default(true),
});

export const adminBrandUpdateSchema = adminBrandSchema.partial();

const adminCouponFields = {
  code: nonEmpty.max(32).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  description: nonEmpty.max(500),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().finite().positive(),
  minimumOrderAmount: z.number().finite().nonnegative().default(0),
  maximumDiscount: z.number().finite().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  active: z.boolean().default(true),
};

export const adminCouponSchema = z.object(adminCouponFields).refine((value) => value.expiresAt > value.startsAt, {
  message: 'Expiry must be later than the start date.',
  path: ['expiresAt'],
}).refine((value) => value.discountType !== 'PERCENTAGE' || value.discountValue <= 100, {
  message: 'Percentage discounts cannot exceed 100%.',
  path: ['discountValue'],
});

export const adminCouponUpdateSchema = z.object({
  code: adminCouponFields.code.optional(),
  description: adminCouponFields.description.optional(),
  discountType: adminCouponFields.discountType.optional(),
  discountValue: adminCouponFields.discountValue.optional(),
  minimumOrderAmount: adminCouponFields.minimumOrderAmount.optional(),
  maximumDiscount: adminCouponFields.maximumDiscount,
  usageLimit: adminCouponFields.usageLimit,
  startsAt: adminCouponFields.startsAt.optional(),
  expiresAt: adminCouponFields.expiresAt.optional(),
  active: adminCouponFields.active.optional(),
}).refine((value) => !value.startsAt || !value.expiresAt || value.expiresAt > value.startsAt, {
  message: 'Expiry must be later than the start date.',
  path: ['expiresAt'],
}).refine((value) => value.discountType !== 'PERCENTAGE' || value.discountValue === undefined || value.discountValue <= 100, {
  message: 'Percentage discounts cannot exceed 100%.',
  path: ['discountValue'],
});

export const adminBannerSchema = z.object({
  title: nonEmpty.max(160),
  subtitle: z.string().trim().max(500).nullable().optional(),
  imageUrl: httpUrl,
  linkUrl: safeLink,
  buttonText: z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const adminBannerUpdateSchema = adminBannerSchema.partial();

export const adminOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingCode: z.string().trim().max(120).nullable().optional(),
});

export const adminVerifyUpiPaymentSchema = z.object({
  confirmReceived: z.literal(true),
});

export const adminImageUploadSchema = z.object({
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/).max(7_000_000).optional(),
  imageUrl: productImageUrl.optional(),
  fileName: z.string().trim().max(120).optional(),
}).refine((value) => Boolean(value.dataUrl || value.imageUrl), 'Provide an image file or image URL.');

export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type AdminServiceInput = z.infer<typeof adminServiceSchema>;
export type AdminServiceCategoryInput = z.infer<typeof adminServiceCategorySchema>;
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
export type AdminBrandInput = z.infer<typeof adminBrandSchema>;
export type AdminCouponInput = z.infer<typeof adminCouponSchema>;
export type AdminBannerInput = z.infer<typeof adminBannerSchema>;
