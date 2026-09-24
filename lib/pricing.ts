/**
 * Single source of truth for shipping charges.
 *
 * These match the numbers already shown in src/components/cart/CartDrawer.tsx
 * (flat ₹79 doorstep shipping, free above ₹999) so the price a customer sees
 * in the cart preview never drifts from what the server actually charges at
 * checkout. If this business rule changes, update it here only.
 */
export const FREE_SHIPPING_THRESHOLD = 999;
export const FLAT_SHIPPING_FEE = 79;

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}

/**
 * Round to 2 decimal places to avoid floating point artifacts (e.g. 499.9999999999)
 * before persisting amounts as Decimal(10,2).
 */
export function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
