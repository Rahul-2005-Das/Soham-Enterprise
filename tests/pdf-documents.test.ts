import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdminBookingReportPdf,
  buildAdminOrderReportPdf,
  buildCustomerOrderPdf,
} from '../lib/pdf-documents.ts';

function assertPdfDocument(pdf: { output(type: 'arraybuffer'): ArrayBuffer }) {
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
  assert.ok(bytes.byteLength > 500);
}

const order = {
  orderNumber: 'SE-ORD-12345',
  createdAt: '2026-10-13T08:45:00.000Z',
  status: 'DELIVERED',
  subtotal: '1200.00',
  discountAmount: '100.00',
  shippingAmount: '79.00',
  totalAmount: '1179.00',
  address: {
    fullName: 'Test Customer',
    phone: '9876543210',
    addressLine1: '1 Example Road',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
  },
  items: [{ quantity: 2, price: '600.00', productNameSnapshot: 'Part One' }],
  payments: [{ provider: 'UPI_QR', status: 'COMPLETED', amount: '1179.00', providerPaymentId: 'UPI123' }],
};

test('customer invoice and completed-payment receipt generate PDFs', () => {
  const invoice = buildCustomerOrderPdf(order, { name: 'Customer', email: 'customer@example.test' }, 'invoice');
  const receipt = buildCustomerOrderPdf(order, { name: 'Customer' }, 'payment-receipt');

  assertPdfDocument(invoice);
  assertPdfDocument(receipt);
});

test('pending or failed payments cannot generate a payment receipt PDF', () => {
  for (const status of ['PENDING', 'FAILED', 'REFUNDED']) {
    assert.throws(
      () => buildCustomerOrderPdf({ ...order, payments: [{ status }] }, {}, 'payment-receipt'),
      /only after payment is confirmed/
    );
  }
});

test('admin order and technician reports generate PDFs, including an empty report', () => {
  const bookingReport = buildAdminBookingReportPdf([{
    bookingNumber: 'SE-BKG-123',
    preferredDate: '2026-10-13T08:45:00.000Z',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    status: 'CONFIRMED',
    appliance: 'Air conditioner',
    problemDescription: 'Not cooling',
    customerNotes: 'Call before arriving',
    estimatedAmount: '500',
    user: { name: 'Test Customer', phone: '9876543210' },
    service: { name: 'AC repair' },
    address: { addressLine1: '1 Example Road', city: 'Kolkata', pincode: '700001' },
  }], 'today');
  const orderReport = buildAdminOrderReportPdf([order], 'today');
  const emptyBookingReport = buildAdminBookingReportPdf([], 'today');

  assertPdfDocument(bookingReport);
  assertPdfDocument(orderReport);
  assertPdfDocument(emptyBookingReport);
});
