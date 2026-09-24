import { getOptionalEnv } from './env.ts';

/**
 * Business contact & payment details. Every value falls back to a clearly
 * marked placeholder so the app never silently displays invented business
 * data. Replace these by setting the corresponding environment variables
 * (see .env.example) — no code changes needed.
 */
export const BUSINESS_CONFIG = {
  name: 'Sohom Enterprises',
  phone: getOptionalEnv('BUSINESS_PHONE', '[BUSINESS PHONE]'),
  email: getOptionalEnv('BUSINESS_EMAIL', '[BUSINESS EMAIL]'),
  address: getOptionalEnv('BUSINESS_ADDRESS', '[BUSINESS ADDRESS]'),
  // UPI VPA (Virtual Payment Address), e.g. "sohomenterprises@okhdfcbank"
  upiVpa: getOptionalEnv('UPI_VPA', '[BUSINESS-UPI-ID]@upi'),
  upiPayeeName: getOptionalEnv('UPI_PAYEE_NAME', 'Sohom Enterprises'),
} as const;

export function isUpiConfigured(): boolean {
  return !BUSINESS_CONFIG.upiVpa.startsWith('[');
}
