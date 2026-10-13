import { getOptionalEnv } from './env.ts';

/**
 * Business contact & payment details. Every value falls back to a clearly
 * marked placeholder so the app never silently displays invented business
 * data. Replace these by setting the corresponding environment variables
 * (see .env.example) — no code changes needed.
 */
export const BUSINESS_CONFIG = {
  name: 'Soham Enterprises',
  phone: getOptionalEnv('BUSINESS_PHONE', '9088748747'),
  email: getOptionalEnv('BUSINESS_EMAIL', '[BUSINESS EMAIL]'),
  address: getOptionalEnv('BUSINESS_ADDRESS', '[BUSINESS ADDRESS]'),
  // Payment recipient details must be explicitly configured, never guessed.
  upiVpa: getOptionalEnv('UPI_VPA', '[BUSINESS UPI ID]'),
  upiPayeeName: getOptionalEnv('UPI_PAYEE_NAME', '[UPI PAYEE NAME]'),
} as const;

export function isUpiConfigured(upiVpa = BUSINESS_CONFIG.upiVpa): boolean {
  return !upiVpa.startsWith('[') && /^[\w.-]+@[\w.-]+$/.test(upiVpa);
}
