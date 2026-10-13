import { Request } from 'express';
import { prisma } from './db.ts';
import { getSiteSettings } from '../actions/site-settings.ts';

const DEFAULT_TITLE = 'Soham Enterprises | Best AC Repair & RO Water Purifier Service in Kolkata';
const DEFAULT_DESCRIPTION = 'Professional AC repair, installation, gas charging & RO Aquaguard purifier service in Kolkata. Fast 2-hour doorstep service. Call now!';
const SERVICES = [
  'AC Repair & Maintenance',
  'RO Water Purifier Service',
  'Appliance Repair',
];

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function jsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function getSiteOrigin(req: Request) {
  const configuredOrigin = process.env.SITE_URL?.trim();
  const protocol = req.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.protocol;
  const host = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('host');
  const origin = configuredOrigin || (host ? `${protocol}://${host}` : '');
  if (!origin) throw new Error('Set SITE_URL or provide a valid request host to generate SEO URLs.');

  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('SITE_URL must be a valid HTTP or HTTPS origin.');
  }
  return parsed.origin;
}

function canonicalUrl(origin: string, pathname: string) {
  return new URL(pathname, `${origin}/`).toString();
}

function absoluteImageUrl(value: string, origin: string) {
  try {
    const url = new URL(value, `${origin}/`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function toTwentyFourHourTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

function getOpeningHours(settings: Record<string, string>) {
  const text = settings.businessHours?.trim();
  if (text && /^24(?:\s*\/\s*7|\s*hours?)?$/i.test(text)) return ['Mo-Su 00:00-23:59'];
  const times = text?.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:-|–|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (!times) return text || undefined;
  const dayRange = text.match(/(Monday|Mon)\s*(?:-|–|to)\s*(Sunday|Sun)/i);
  const start = toTwentyFourHourTime(times[1]);
  const end = toTwentyFourHourTime(times[2]);
  if (dayRange && start && end) return [`Mo-Su ${start}-${end}`];
  return text;
}

export async function renderSeoHtml(template: string, req: Request) {
  const origin = getSiteOrigin(req);
  const pathname = req.path;
  const settings = await getSiteSettings();
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let image = settings.homeBannerUrl || settings.logoUrl || '/images/placeholder.png';
  let type = 'website';

  if (pathname === '/services' || pathname.startsWith('/services/')) {
    title = 'AC, RO & Appliance Repair Services in Kolkata | Soham Enterprises';
    description = 'Book trusted AC repair, RO purifier service, and appliance maintenance in Kolkata. Convenient doorstep visits with clear pricing.';
  } else if (pathname === '/spare-parts') {
    title = 'Genuine Appliance Spare Parts in Kolkata | Soham Enterprises';
    description = 'Shop genuine AC, RO purifier, and home appliance spare parts in Kolkata with doorstep delivery and expert support.';
  } else if (pathname === '/contact') {
    title = 'Contact Soham Enterprises | Appliance Service in Kolkata';
    description = 'Contact Soham Enterprises for AC repair, RO purifier service, and appliance support in Kolkata, West Bengal.';
  } else if (pathname === '/about') {
    title = 'About Soham Enterprises | Kolkata Appliance Experts';
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
  const serviceMatch = pathname.match(/^\/services\/([^/]+)\/?$/);
  if (productMatch) {
    const product = await prisma.product.findFirst({
      where: { slug: decodeURIComponent(productMatch[1]), active: true },
      select: { name: true, description: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } },
    });
    if (product) {
      title = `${product.name} | Genuine Spare Parts in Kolkata | Soham Enterprises`;
      description = product.description.slice(0, 300) || `Buy ${product.name} from Soham Enterprises in Kolkata.`;
      image = product.images[0]?.url || image;
      type = 'product';
    }
  } else if (serviceMatch) {
    const service = await prisma.service.findFirst({
      where: { slug: decodeURIComponent(serviceMatch[1]), active: true, category: { active: true } },
      select: { name: true, description: true },
    });
    if (service) {
      title = `${service.name} in Kolkata | Soham Enterprises`;
      description = service.description.slice(0, 300);
      type = 'article';
    }
  }

  const pageUrl = canonicalUrl(origin, pathname);
  const imageUrl = absoluteImageUrl(image, origin) || canonicalUrl(origin, '/images/placeholder.png');
  const business = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: 'Soham Enterprises',
    url: origin,
    ...(imageUrl ? { image: imageUrl, logo: imageUrl } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(settings.shopAddress ? { streetAddress: settings.shopAddress } : {}),
      addressLocality: 'Kolkata',
      addressRegion: 'West Bengal',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 22.5726,
      longitude: 88.3639,
    },
    areaServed: {
      '@type': 'City',
      name: 'Kolkata',
    },
    ...(getOpeningHours(settings) ? { openingHours: getOpeningHours(settings) } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Appliance Services',
      itemListElement: SERVICES.map((serviceName) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: serviceName, areaServed: 'Kolkata, West Bengal' },
      })),
    },
  };

  const titleTag = `<title>${htmlEscape(title)}</title>`;
  const tags = [
    `<meta name="description" content="${htmlEscape(description)}">`,
    `<link rel="canonical" href="${htmlEscape(pageUrl)}">`,
    `<meta property="og:title" content="${htmlEscape(title)}">`,
    `<meta property="og:description" content="${htmlEscape(description)}">`,
    `<meta property="og:type" content="${htmlEscape(type)}">`,
    `<meta property="og:url" content="${htmlEscape(pageUrl)}">`,
    ...(imageUrl ? [`<meta property="og:image" content="${htmlEscape(imageUrl)}">`, `<meta name="twitter:image" content="${htmlEscape(imageUrl)}">`] : []),
    `<meta name="twitter:title" content="${htmlEscape(title)}">`,
    `<meta name="twitter:description" content="${htmlEscape(description)}">`,
    `<script type="application/ld+json">${jsonLd(business)}</script>`,
  ].join('\n    ');

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, titleTag)
    .replace(/<meta\s+name="description"[^>]*>/i, '')
    .replace(/<meta\s+property="og:title"[^>]*>/i, '')
    .replace(/<meta\s+property="og:description"[^>]*>/i, '')
    .replace(/<meta\s+property="og:type"[^>]*>/i, '')
    .replace(/<meta\s+property="og:url"[^>]*>/i, '')
    .replace(/<meta\s+name="twitter:title"[^>]*>/i, '')
    .replace(/<meta\s+name="twitter:description"[^>]*>/i, '')
    .replace(/<meta\s+property="og:image"[^>]*>/i, '')
    .replace(/<meta\s+name="twitter:image"[^>]*>/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}

export async function renderSitemap(req: Request) {
  const origin = getSiteOrigin(req);
  const [products, services] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { active: true, category: { active: true } }, select: { slug: true, updatedAt: true } }),
  ]);
  const urls = [
    '/', '/about', '/services', '/spare-parts', '/contact',
    ...services.map(({ slug }) => `/services/${encodeURIComponent(slug)}`),
    ...products.map(({ slug }) => `/products/${encodeURIComponent(slug)}`),
  ];
  const lastModified = new Map<string, Date>([
    ...services.map(({ slug, updatedAt }) => [`/services/${encodeURIComponent(slug)}`, updatedAt] as const),
    ...products.map(({ slug, updatedAt }) => [`/products/${encodeURIComponent(slug)}`, updatedAt] as const),
  ]);
  const entries = urls.map((url) => {
    const lastmod = lastModified.get(url);
    return `<url><loc>${htmlEscape(canonicalUrl(origin, url))}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
