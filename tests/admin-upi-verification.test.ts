import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { handleAdminVerifyUpiPayment } from '../app/api/admin/commerce.ts';
import { verifyPendingUpiPayment, type PendingUpiPaymentStore } from '../lib/payment-verification.ts';

function paymentStore(provider = 'UPI_QR', status = 'PENDING') {
  let payment = { id: 'payment-1', provider, status };
  let updateAttempts = 0;
  const store: PendingUpiPaymentStore<{ id: string; paymentStatus: string }> = {
    async findLatestPayment() {
      return { ...payment };
    },
    async completePendingUpiPayment(_orderId, paymentId) {
      updateAttempts += 1;
      if (payment.id !== paymentId || payment.provider !== 'UPI_QR' || payment.status !== 'PENDING') return 0;
      payment = { ...payment, status: 'COMPLETED' };
      return 1;
    },
    async getOrder(orderId) {
      return { id: orderId, paymentStatus: payment.status };
    },
  };
  return { store, getUpdateAttempts: () => updateAttempts };
}

function adminApiRequest(role?: 'ADMIN' | 'CUSTOMER'): Request {
  const jwtSecret = process.env.JWT_SECRET;
  assert.ok(jwtSecret, 'JWT_SECRET must be configured for authorization tests.');
  const token = role && jwt.sign(
    { userId: 'user-1', email: 'admin@example.test', role },
    jwtSecret,
    { expiresIn: '1h' }
  );
  return {
    originalUrl: '/api/admin/orders/order-1/verify-payment',
    url: '/api/admin/orders/order-1/verify-payment',
    cookies: token ? { admin_auth_token: token } : {},
    headers: {},
    query: {},
  } as unknown as Request;
}

test('only an admin session can reach UPI payment verification', async () => {
  const anonymous = await handleAdminVerifyUpiPayment('order-1', { confirmReceived: true }, adminApiRequest());
  const customer = await handleAdminVerifyUpiPayment('order-1', { confirmReceived: true }, adminApiRequest('CUSTOMER'));

  assert.equal(anonymous.status, 401);
  assert.equal(customer.status, 401);
});

test('the server requires explicit confirmation that funds were received', async () => {
  const result = await handleAdminVerifyUpiPayment('order-1', {}, adminApiRequest('ADMIN'));

  assert.equal(result.status, 400);
});

test('an admin verification marks a pending UPI payment complete', async () => {
  const { store, getUpdateAttempts } = paymentStore();

  const order = await verifyPendingUpiPayment('order-1', store);

  assert.deepEqual(order, { id: 'order-1', paymentStatus: 'COMPLETED' });
  assert.equal(getUpdateAttempts(), 1);
});

test('Cash on Delivery payments cannot be verified as UPI', async () => {
  const { store, getUpdateAttempts } = paymentStore('CASH_ON_DELIVERY');

  await assert.rejects(verifyPendingUpiPayment('order-1', store), /Cash on Delivery/);
  assert.equal(getUpdateAttempts(), 0);
});

test('orders without a payment cannot be verified', async () => {
  const { store, getUpdateAttempts } = paymentStore();
  store.findLatestPayment = async () => null;

  await assert.rejects(verifyPendingUpiPayment('order-1', store), /Payment not found/);
  assert.equal(getUpdateAttempts(), 0);
});

test('completed and duplicate UPI payments cannot be verified again', async () => {
  const completed = paymentStore('UPI_QR', 'COMPLETED');
  await assert.rejects(verifyPendingUpiPayment('order-1', completed.store), /only pending/);
  assert.equal(completed.getUpdateAttempts(), 0);

  const pending = paymentStore();
  await verifyPendingUpiPayment('order-1', pending.store);
  await assert.rejects(verifyPendingUpiPayment('order-1', pending.store), /only pending/);
  assert.equal(pending.getUpdateAttempts(), 1);
});

test('concurrent verification attempts can complete a payment only once', async () => {
  const { store } = paymentStore();
  const results = await Promise.allSettled([
    verifyPendingUpiPayment('order-1', store),
    verifyPendingUpiPayment('order-1', store),
  ]);

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
});
