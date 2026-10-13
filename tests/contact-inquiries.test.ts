import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { handleGetAdminContactInquiries, handleUpdateAdminContactInquiry } from '../app/api/admin/contact-inquiries/route.ts';
import { createContactInquirySchema, updateContactInquirySchema } from '../schemas/contact-inquiry.ts';

function request(role?: 'ADMIN' | 'CUSTOMER'): Request {
  const jwtSecret = process.env.JWT_SECRET;
  assert.ok(jwtSecret, 'JWT_SECRET must be configured for authorization tests.');
  const token = role && jwt.sign(
    { userId: 'inquiry-test-user', email: 'inquiry-test@example.test', role },
    jwtSecret,
    { expiresIn: '1h' }
  );
  return {
    originalUrl: '/api/admin/contact-inquiries',
    url: '/api/admin/contact-inquiries',
    cookies: token ? { admin_auth_token: token } : {},
    headers: {},
    query: {},
  } as unknown as Request;
}

test('contact inquiry input accepts a valid customer message and rejects invalid submissions', () => {
  const valid = createContactInquirySchema.safeParse({
    name: 'Customer Name',
    phone: '+91 98765 43210',
    email: 'customer@example.test',
    subject: 'Spare Part Availability',
    message: 'Please confirm availability of the replacement filter.',
  });
  assert.equal(valid.success, true);
  assert.equal(createContactInquirySchema.safeParse({
    name: 'A',
    phone: '12',
    subject: 'Unexpected Topic',
    message: 'short',
  }).success, false);
});

test('inquiry status updates accept only known workflow states', () => {
  assert.equal(updateContactInquirySchema.safeParse({ status: 'CONTACTED' }).success, true);
  assert.equal(updateContactInquirySchema.safeParse({ status: 'DELETED' }).success, false);
});

test('only admins can list or update contact inquiries', async () => {
  const anonymousList = await handleGetAdminContactInquiries(request());
  const customerList = await handleGetAdminContactInquiries(request('CUSTOMER'));
  const anonymousUpdate = await handleUpdateAdminContactInquiry('inquiry-id', { status: 'CONTACTED' }, request());
  const customerUpdate = await handleUpdateAdminContactInquiry('inquiry-id', { status: 'CONTACTED' }, request('CUSTOMER'));

  assert.equal(anonymousList.status, 401);
  assert.equal(customerList.status, 401);
  assert.equal(anonymousUpdate.status, 401);
  assert.equal(customerUpdate.status, 401);
});
