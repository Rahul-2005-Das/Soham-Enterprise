import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { handleUpdateSiteSettings } from '../app/api/admin/settings/route.ts';
import { persistSiteSettingEntries } from '../actions/site-settings.ts';
import { calculateCheckoutTotals, calculateCouponDiscount, calculateProductShipping, calculateShipping, validateCouponAvailability } from '../lib/pricing.ts';
import { adminCouponSchema, adminProductSchema } from '../schemas/admin-commerce.ts';

function settingsRequest(role?: 'ADMIN' | 'CUSTOMER'): Request {
  const jwtSecret = process.env.JWT_SECRET;
  assert.ok(jwtSecret, 'JWT_SECRET must be configured for authorization tests.');
  const token = role && jwt.sign(
    { userId: 'settings-user', email: 'settings@example.test', role },
    jwtSecret,
    { expiresIn: '1h' }
  );
  return {
    originalUrl: '/api/admin/settings',
    url: '/api/admin/settings',
    cookies: token ? { admin_auth_token: token } : {},
    headers: {},
    query: {},
  } as unknown as Request;
}

test('shipping keeps the current default charge and threshold behavior', () => {
  assert.equal(calculateShipping(0), 0);
  assert.equal(calculateShipping(999), 79);
  assert.equal(calculateShipping(999.01), 0);
  assert.equal(calculateShipping(500, { flatShippingFee: 25, freeShippingThreshold: 400 }), 0);
  assert.equal(calculateShipping(400, { flatShippingFee: 25, freeShippingThreshold: 400 }), 25);
});

test('checkout totals apply shipping and coupon discount without exceeding eligible subtotal', () => {
  assert.deepEqual(
    calculateCheckoutTotals(500, { flatShippingFee: 79, freeShippingThreshold: 999 }, {
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minimumOrderAmount: 100,
      maximumDiscount: 50,
    }),
    { subtotal: 500, shippingAmount: 79, discountAmount: 50, totalAmount: 529 }
  );
  assert.equal(calculateCouponDiscount(100, {
    discountType: 'FLAT',
    discountValue: 200,
    minimumOrderAmount: 0,
    maximumDiscount: null,
  }), 100);
  assert.throws(() => calculateCouponDiscount(100, {
    discountType: 'PERCENTAGE',
    discountValue: 150,
    minimumOrderAmount: 0,
    maximumDiscount: null,
  }), /cannot exceed 100%/);
  assert.throws(() => calculateCouponDiscount(99, {
    discountType: 'FLAT',
    discountValue: 10,
    minimumOrderAmount: 100,
    maximumDiscount: null,
  }), /minimum order/);
});

test('product fixed shipping charges are multiplied by quantity and retain the legacy fallback for unset fees', () => {
  const settings = { flatShippingFee: 79, freeShippingThreshold: 999 };
  const productShipping = [
    { quantity: 2, shippingCharge: 20 },
    { quantity: 1, shippingCharge: 35.5 },
  ];
  assert.equal(calculateProductShipping(500, productShipping, settings), 75.5);
  assert.deepEqual(
    calculateCheckoutTotals(500, settings, null, productShipping),
    { subtotal: 500, shippingAmount: 75.5, discountAmount: 0, totalAmount: 575.5 }
  );
  assert.equal(calculateProductShipping(500, [
    { quantity: 1, shippingCharge: 20 },
    { quantity: 2, shippingCharge: null },
  ], settings), 99);
  assert.equal(calculateProductShipping(1000, [
    { quantity: 2, shippingCharge: null },
  ], settings), 0);
  assert.throws(() => calculateProductShipping(500, [
    { quantity: 1, shippingCharge: -1 },
  ], settings), /invalid shipping charge/);
});

test('product shipping charge accepts nonnegative INR amounts with at most two decimals', () => {
  const validProduct = {
    name: 'Example part',
    description: 'Example part',
    brand: 'Example',
    categoryId: 'category',
    price: 100,
    stockQuantity: 1,
    imageUrls: [],
  };
  assert.equal(adminProductSchema.safeParse({ ...validProduct, shippingCharge: 0 }).success, true);
  assert.equal(adminProductSchema.safeParse({ ...validProduct, shippingCharge: 15.5 }).success, true);
  assert.equal(adminProductSchema.safeParse({ ...validProduct, shippingCharge: -1 }).success, false);
  assert.equal(adminProductSchema.safeParse({ ...validProduct, shippingCharge: 1.999 }).success, false);
});

test('new percentage coupons above 100 are rejected instead of changing stored offers', () => {
  const now = new Date();
  const result = adminCouponSchema.safeParse({
    code: 'TOO_MUCH',
    description: 'Test only',
    discountType: 'PERCENTAGE',
    discountValue: 101,
    startsAt: now,
    expiresAt: new Date(now.getTime() + 60_000),
  });
  assert.equal(result.success, false);
});

test('inactive, not-yet-started, expired, and exhausted coupons are rejected', () => {
  const now = new Date('2026-10-13T00:00:00.000Z');
  const available = {
    active: true,
    startsAt: new Date('2026-10-12T00:00:00.000Z'),
    expiresAt: new Date('2026-10-14T00:00:00.000Z'),
    usageLimit: 5,
    usedCount: 4,
  };
  assert.doesNotThrow(() => validateCouponAvailability(available, now));
  assert.throws(() => validateCouponAvailability({ ...available, active: false }, now), /invalid or has expired/);
  assert.throws(() => validateCouponAvailability({ ...available, startsAt: new Date('2026-10-14T00:00:00Z') }, now), /invalid or has expired/);
  assert.throws(() => validateCouponAvailability({ ...available, expiresAt: new Date('2026-10-12T00:00:00Z') }, now), /invalid or has expired/);
  assert.throws(() => validateCouponAvailability({ ...available, usedCount: 5 }, now), /invalid or has expired/);
});

test('admin settings endpoint enforces admin role and rejects invalid shipping amounts', async () => {
  const anonymous = await handleUpdateSiteSettings({ shippingFee: '50' }, settingsRequest());
  const customer = await handleUpdateSiteSettings({ shippingFee: '50' }, settingsRequest('CUSTOMER'));
  const negative = await handleUpdateSiteSettings({ shippingFee: '-1' }, settingsRequest('ADMIN'));
  const tooPrecise = await handleUpdateSiteSettings({ freeShippingThreshold: '200.001' }, settingsRequest('ADMIN'));

  assert.equal(anonymous.status, 401);
  assert.equal(customer.status, 401);
  assert.equal(negative.status, 400);
  assert.equal(tooPrecise.status, 400);
});

test('payment settings require an explicit recipient-match confirmation', async () => {
  const result = await handleUpdateSiteSettings({
    upiVpa: 'example@upi',
    upiPayeeName: 'Example',
    upiQrImageUrl: '/images/qr.png',
  }, settingsRequest('ADMIN'));

  assert.equal(result.status, 400);
  assert.ok('error' in result.body && typeof result.body.error === 'string');
  if ('error' in result.body && typeof result.body.error === 'string') {
    assert.match(result.body.error, /Confirm that the UPI ID and official QR/);
  }
});

test('site setting persistence upserts values through its storage adapter', async () => {
  const saved = new Map<string, string>();
  await persistSiteSettingEntries(
    { shippingFee: '49.50', freeShippingThreshold: '1200' },
    async (key, value) => { saved.set(key, value); }
  );
  assert.deepEqual([...saved.entries()].sort(), [
    ['freeShippingThreshold', '1200'],
    ['shippingFee', '49.50'],
  ]);
});
