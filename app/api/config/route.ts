import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from '../../../lib/pricing.ts';
import { BUSINESS_CONFIG, isUpiConfigured } from '../../../lib/business.ts';

/**
 * Public, non-sensitive checkout configuration. No auth required — this is
 * the same information already shown in the cart UI, just centralized so
 * the frontend fetches it instead of hardcoding a second copy of it.
 */
export async function handleGetCheckoutConfig() {
  return {
    status: 200,
    body: {
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      flatShippingFee: FLAT_SHIPPING_FEE,
      upiVpa: BUSINESS_CONFIG.upiVpa,
      upiPayeeName: BUSINESS_CONFIG.upiPayeeName,
      upiConfigured: isUpiConfigured(),
      businessName: BUSINESS_CONFIG.name,
      businessPhone: BUSINESS_CONFIG.phone,
    },
  };
}
