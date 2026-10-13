import { BUSINESS_CONFIG, isUpiConfigured } from '../../../lib/business.ts';
import { getShippingSettings } from '../../../actions/site-settings.ts';
import { getSiteSettings } from '../../../actions/site-settings.ts';

/**
 * Public, non-sensitive checkout configuration. No auth required — this is
 * the same information already shown in the cart UI, just centralized so
 * the frontend fetches it instead of hardcoding a second copy of it.
 */
export async function handleGetCheckoutConfig() {
  const [shipping, settings] = await Promise.all([getShippingSettings(), getSiteSettings()]);
  return {
    status: 200,
    body: {
      ...shipping,
      upiVpa: settings.upiVpa ?? BUSINESS_CONFIG.upiVpa,
      upiPayeeName: settings.upiPayeeName ?? BUSINESS_CONFIG.upiPayeeName,
      upiQrImageUrl: settings.upiQrImageUrl ?? '/images/business-upi-qr.png',
      upiConfigured: isUpiConfigured(settings.upiVpa ?? BUSINESS_CONFIG.upiVpa),
      businessName: settings.storeName || BUSINESS_CONFIG.name,
      businessPhone: BUSINESS_CONFIG.phone,
    },
  };
}
