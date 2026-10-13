import { prisma } from '../lib/db';
import { CustomerLocationCoordinates } from '../schemas/customer-location';

interface ResolvedLocation {
  label: string;
  road: string | null;
  neighbourhood: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimRequestAt = 0;

function firstValue(...values: Array<string | undefined>): string | null {
  return values.find((value) => Boolean(value?.trim()))?.trim() || null;
}

async function reverseGeocode(lat: number, lng: number): Promise<ResolvedLocation> {
  const request = nominatimQueue.then(async () => {
    const delay = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    lastNominatimRequestAt = Date.now();

    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    const headers: Record<string, string> = {
      'User-Agent': 'SohamEnterprises/1.0',
      'Accept-Language': 'en',
    };
    const contact = process.env.BUSINESS_EMAIL?.trim();
    if (contact) {
      headers['User-Agent'] = `SohamEnterprises/1.0 (${contact})`;
    }

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error('Reverse geocoding provider returned an error.');
    }

    const result = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const address = result.address || {};
    const road = firstValue(address.road, address.pedestrian, address.residential, address.path);
    const neighbourhood = firstValue(address.neighbourhood, address.suburb, address.quarter);
    const city = firstValue(address.city, address.town, address.village, address.municipality, address.county);
    const state = firstValue(address.state, address.region);
    const pincode = firstValue(address.postcode);
    const label = [road, neighbourhood, city, state, pincode]
      .filter((part): part is string => Boolean(part))
      .join(', ') || firstValue(result.display_name) || 'Current location';

    return { label, road, neighbourhood, city, state, pincode };
  });

  nominatimQueue = request.then(() => undefined, () => undefined);
  return request;
}

export async function saveCustomerLocation(userId: string, coordinates: CustomerLocationCoordinates) {
  const resolved = await reverseGeocode(coordinates.lat, coordinates.lng);
  const saved = await prisma.customerLocation.upsert({
    where: { userId },
    create: { userId, lat: coordinates.lat, lng: coordinates.lng, ...resolved },
    update: { lat: coordinates.lat, lng: coordinates.lng, ...resolved, capturedAt: new Date() },
    select: {
      lat: true,
      lng: true,
      label: true,
      road: true,
      neighbourhood: true,
      city: true,
      state: true,
      pincode: true,
      capturedAt: true,
    },
  });

  return saved;
}
