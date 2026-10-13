import { prisma } from '../lib/db';
import { BUSINESS_CONFIG } from '../lib/business';

export const SITE_SETTING_KEYS = [
  'phone',
  'emergencyPhone',
  'whatsappNumber',
  'supportEmail',
  'shopAddress',
  'businessHours',
  'heroTitle',
  'heroSubtitle',
  'announcementText',
  'offerBannerText',
  'emergencyBannerText',
  'aboutUs',
  'serviceTerms',
  'logoUrl',
  'homeBannerUrl',
  'brandColor',
  'shippingFee',
  'freeShippingThreshold',
  'upiVpa',
  'upiPayeeName',
  'upiQrImageUrl',
  'facebookUrl',
  'instagramUrl',
  'youtubeUrl',
  'faqContent',
  'storeName',
] as const;

export type SiteSettingKey = typeof SITE_SETTING_KEYS[number];
export type SiteSettingsRecord = Partial<Record<SiteSettingKey, string>>;

export const DEFAULT_SITE_SETTINGS: Record<SiteSettingKey, string> = {
  phone: '',
  emergencyPhone: '',
  whatsappNumber: '',
  supportEmail: '',
  shopAddress: '',
  businessHours: 'Monday – Sunday: 8:00 AM – 9:00 PM',
  heroTitle: 'Fast, Reliable Appliance Repairs & Genuine Spare Parts',
  heroSubtitle: 'Book a trusted doorstep visit with clear pricing and friendly support.',
  announcementText: '',
  offerBannerText: '',
  emergencyBannerText: 'Emergency appliance support is available. Contact our team for assistance.',
  aboutUs: '',
  serviceTerms: 'Repairs include a 30-day service warranty. Warranty coverage is subject to the service terms confirmed at booking.',
  logoUrl: '',
  homeBannerUrl: '',
  brandColor: 'blue',
  shippingFee: '79',
  freeShippingThreshold: '999',
  upiVpa: BUSINESS_CONFIG.upiVpa,
  upiPayeeName: BUSINESS_CONFIG.upiPayeeName,
  upiQrImageUrl: '/images/business-upi-qr.png',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  faqContent: '',
  storeName: 'Soham Enterprises',
};

export async function getShippingSettings() {
  const settings = await getSiteSettings();
  const flatShippingFee = Number(settings.shippingFee);
  const freeShippingThreshold = Number(settings.freeShippingThreshold);
  if (
    !Number.isFinite(flatShippingFee) || flatShippingFee < 0 ||
    !Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0
  ) {
    throw new Error('Shipping settings contain invalid values. Update them in Admin Settings.');
  }
  return { flatShippingFee, freeShippingThreshold };
}

export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: [...SITE_SETTING_KEYS] } },
    select: { key: true, value: true },
  });
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...Object.fromEntries(rows.map(({ key, value }) => [key, value])),
  };
}

export async function updateSiteSettings(settings: SiteSettingsRecord): Promise<SiteSettingsRecord> {
  await prisma.$transaction(async (tx) => {
    await persistSiteSettingEntries(settings, (key, value) =>
      tx.siteSettings.upsert({
        where: { key },
        create: { key, value: value ?? '' },
        update: { value: value ?? '' },
      })
    );
  });
  return getSiteSettings();
}

export async function persistSiteSettingEntries(
  settings: SiteSettingsRecord,
  upsert: (key: string, value: string) => Promise<unknown>
): Promise<void> {
  await Promise.all(Object.entries(settings).map(([key, value]) => upsert(key, value ?? '')));
}
