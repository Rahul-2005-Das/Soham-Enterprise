import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { handleAdminOrderReport } from '../app/api/admin/commerce.ts';
import { handleAdminBookingReport } from '../app/api/admin/route.ts';
import { getOrderReportRange } from '../lib/order-report.ts';

function adminRequest(period: string, role?: 'ADMIN' | 'CUSTOMER'): Request {
  const jwtSecret = process.env.JWT_SECRET;
  assert.ok(jwtSecret, 'JWT_SECRET must be configured for authorization tests.');
  const token = role && jwt.sign(
    { userId: 'order-report-test-user', email: 'order-report@example.test', role },
    jwtSecret,
    { expiresIn: '1h' }
  );
  return {
    originalUrl: `/api/admin/order-reports?period=${period}`,
    url: `/api/admin/order-reports?period=${period}`,
    cookies: token ? { admin_auth_token: token } : {},
    headers: {},
    query: { period },
  } as unknown as Request;
}

test('order report ranges use India calendar days and cover requested period boundaries', () => {
  const now = new Date('2026-10-13T08:45:00.000Z');
  assert.deepEqual(getOrderReportRange('today', now), {
    start: new Date('2026-10-12T18:30:00.000Z'),
    end: new Date('2026-10-13T18:30:00.000Z'),
  });
  assert.deepEqual(getOrderReportRange('yesterday', now), {
    start: new Date('2026-10-11T18:30:00.000Z'),
    end: new Date('2026-10-12T18:30:00.000Z'),
  });
  assert.deepEqual(getOrderReportRange('weekly', now), {
    start: new Date('2026-10-11T18:30:00.000Z'),
    end: new Date('2026-10-18T18:30:00.000Z'),
  });
  assert.deepEqual(getOrderReportRange('monthly', now), {
    start: new Date('2026-09-30T18:30:00.000Z'),
    end: new Date('2026-10-31T18:30:00.000Z'),
  });
  assert.deepEqual(getOrderReportRange('yearly', now), {
    start: new Date('2025-12-31T18:30:00.000Z'),
    end: new Date('2026-12-31T18:30:00.000Z'),
  });
});

test('only admins can request order reports and periods are validated', async () => {
  const anonymous = await handleAdminOrderReport(adminRequest('today'));
  const customer = await handleAdminOrderReport(adminRequest('today', 'CUSTOMER'));
  const invalid = await handleAdminOrderReport(adminRequest('last-century', 'ADMIN'));

  assert.equal(anonymous.status, 401);
  assert.equal(customer.status, 401);
  assert.equal(invalid.status, 400);
});

test('booking report endpoint is admin-only and validates the selected period', async () => {
  const anonymous = await handleAdminBookingReport(adminRequest('today'));
  const customer = await handleAdminBookingReport(adminRequest('today', 'CUSTOMER'));
  const invalid = await handleAdminBookingReport(adminRequest('last-century', 'ADMIN'));

  assert.equal(anonymous.status, 401);
  assert.equal(customer.status, 401);
  assert.equal(invalid.status, 400);
});
