import { Request } from 'express';
import { requireRole } from '../../../../actions/auth-helper.ts';
import { SITE_SETTING_KEYS, updateSiteSettings } from '../../../../actions/site-settings.ts';
import { mapApiError } from '../../_errors.ts';

export async function handleUpdateSiteSettings(body: unknown, req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { status: 400, body: { success: false, error: 'Settings must be sent as a JSON object.' } };
    }
    const input = body as Record<string, unknown>;
    const paymentSettingKeys = ['upiVpa', 'upiPayeeName', 'upiQrImageUrl'];
    const updatingPaymentSettings = paymentSettingKeys.some((key) => input[key] !== undefined);
    if (updatingPaymentSettings && paymentSettingKeys.some((key) => typeof input[key] !== 'string')) {
      return { status: 400, body: { success: false, error: 'Submit the UPI ID, payee name, and QR image together so the recipient details stay consistent.' } };
    }
    if (updatingPaymentSettings && input.confirmPaymentDetails !== true) {
      return { status: 400, body: { success: false, error: 'Confirm that the UPI ID and official QR show the same recipient before saving payment settings.' } };
    }
    const values: Record<string, string> = {};
    for (const key of SITE_SETTING_KEYS) {
      if (input[key] === undefined) continue;
      if (typeof input[key] !== 'string' || input[key].length > 5000) {
        return { status: 400, body: { success: false, error: `Invalid value for ${key}.` } };
      }
      values[key] = input[key].trim();
    }
    for (const key of ['shippingFee', 'freeShippingThreshold'] as const) {
      if (values[key] === undefined) continue;
      const parsed = Number(values[key]);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000 || !/^\d+(\.\d{1,2})?$/.test(values[key])) {
        return { status: 400, body: { success: false, error: `${key} must be a non-negative amount with at most two decimal places.` } };
      }
    }
    if (values.upiVpa && !/^[\w.-]+@[\w.-]+$/.test(values.upiVpa)) {
      return { status: 400, body: { success: false, error: 'Enter a valid UPI ID.' } };
    }
    if (Boolean(values.upiVpa) !== Boolean(values.upiPayeeName)) {
      return { status: 400, body: { success: false, error: 'UPI ID and payee name must both be set or both be blank.' } };
    }
    if (values.storeName !== undefined && !values.storeName) {
      return { status: 400, body: { success: false, error: 'Store name cannot be blank.' } };
    }
    if (values.upiQrImageUrl && !values.upiQrImageUrl.startsWith('/') && !/^https:\/\/\S+$/i.test(values.upiQrImageUrl)) {
      return { status: 400, body: { success: false, error: 'QR image must use a site path or HTTPS URL.' } };
    }
    if (
      values.faqContent &&
      values.faqContent.split(/\r?\n/).some((line) => {
        const separator = line.indexOf('|');
        return separator < 1 || !line.slice(0, separator).trim() || !line.slice(separator + 1).trim();
      })
    ) {
      return { status: 400, body: { success: false, error: 'Each FAQ line must contain a question and answer separated by |.' } };
    }
    for (const key of ['facebookUrl', 'instagramUrl', 'youtubeUrl'] as const) {
      if (values[key] && !/^https:\/\/\S+$/i.test(values[key])) {
        return { status: 400, body: { success: false, error: `${key} must be an HTTPS URL.` } };
      }
    }
    if (Object.keys(values).length === 0) {
      return { status: 400, body: { success: false, error: 'No recognized settings were provided.' } };
    }
    if (values.brandColor && !['blue', 'teal', 'indigo', 'orange'].includes(values.brandColor)) {
      return { status: 400, body: { success: false, error: 'Choose a supported brand color preset.' } };
    }
    return { status: 200, body: { success: true, settings: await updateSiteSettings(values) } };
  } catch (error) {
    const mapped = mapApiError(error);
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}
