export const DEFAULT_FREE_SHIPPING_THRESHOLD = 999;
export const DEFAULT_FLAT_SHIPPING_FEE = 79;

export interface ShippingSettings {
  freeShippingThreshold: number;
  flatShippingFee: number;
}

export interface CouponForCalculation {
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
}

export interface ProductShippingItem {
  quantity: number;
  shippingCharge: number | null;
}

export interface CouponAvailability {
  active: boolean;
  startsAt: Date;
  expiresAt: Date;
  usageLimit: number | null;
  usedCount: number;
}

export function validateCouponAvailability(coupon: CouponAvailability, now = new Date()): void {
  if (
    !coupon.active ||
    coupon.startsAt > now ||
    coupon.expiresAt < now ||
    (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
  ) {
    throw new Error('This coupon code is invalid or has expired.');
  }
}

export function calculateShipping(
  subtotal: number,
  settings: ShippingSettings = {
    freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    flatShippingFee: DEFAULT_FLAT_SHIPPING_FEE,
  }
): number {
  if (subtotal <= 0) return 0;
  return subtotal > settings.freeShippingThreshold ? 0 : settings.flatShippingFee;
}

export function calculateProductShipping(
  subtotal: number,
  items: ProductShippingItem[],
  settings: ShippingSettings
): number {
  const invalidItem = items.find((item) =>
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    (item.shippingCharge !== null &&
      (!Number.isFinite(item.shippingCharge) ||
        item.shippingCharge < 0 ||
        Math.abs(item.shippingCharge * 100 - Math.round(item.shippingCharge * 100)) >= 1e-8))
  );
  if (invalidItem) throw new Error('A product has an invalid shipping charge.');

  const productCharges = round2(items.reduce(
    (total, item) => total + (item.shippingCharge ?? 0) * item.quantity,
    0
  ));
  const needsLegacyCharge = items.some((item) => item.shippingCharge === null);
  return round2(productCharges + (needsLegacyCharge ? calculateShipping(subtotal, settings) : 0));
}

export function calculateCouponDiscount(subtotal: number, coupon?: CouponForCalculation | null): number {
  if (!coupon) return 0;
  if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error('Invalid order subtotal.');
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) {
    throw new Error('This coupon has an invalid discount value. Contact support.');
  }
  if (
    !Number.isFinite(coupon.minimumOrderAmount) || coupon.minimumOrderAmount < 0 ||
    (coupon.maximumDiscount !== null && (!Number.isFinite(coupon.maximumDiscount) || coupon.maximumDiscount < 0))
  ) {
    throw new Error('This coupon has invalid limits. Contact support.');
  }
  if (coupon.discountType === 'PERCENTAGE' && coupon.discountValue > 100) {
    throw new Error('Percentage discounts cannot exceed 100%; this coupon needs admin review.');
  }
  if (subtotal < coupon.minimumOrderAmount) {
    throw new Error(`This coupon requires a minimum order of ₹${coupon.minimumOrderAmount}.`);
  }
  const rawDiscount = coupon.discountType === 'PERCENTAGE'
    ? (subtotal * coupon.discountValue) / 100
    : coupon.discountValue;
  const cappedDiscount = coupon.maximumDiscount === null
    ? rawDiscount
    : Math.min(rawDiscount, coupon.maximumDiscount);
  return round2(Math.min(subtotal, Math.max(0, cappedDiscount)));
}

/**
 * Round to 2 decimal places to avoid floating point artifacts (e.g. 499.9999999999)
 * before persisting amounts as Decimal(10,2).
 */
export function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateCheckoutTotals(
  subtotal: number,
  shippingSettings: ShippingSettings,
  coupon?: CouponForCalculation | null,
  productShippingItems?: ProductShippingItem[]
) {
  const shippingAmount = productShippingItems === undefined
    ? calculateShipping(subtotal, shippingSettings)
    : calculateProductShipping(subtotal, productShippingItems, shippingSettings);
  const discountAmount = calculateCouponDiscount(subtotal, coupon);
  return {
    subtotal: round2(subtotal),
    shippingAmount,
    discountAmount,
    totalAmount: round2(Math.max(0, subtotal + shippingAmount - discountAmount)),
  };
}
