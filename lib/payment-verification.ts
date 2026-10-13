export interface VerifiablePayment {
  id: string;
  provider: string;
  status: string;
}

export interface PendingUpiPaymentStore<TOrder> {
  findLatestPayment(orderId: string): Promise<VerifiablePayment | null>;
  completePendingUpiPayment(orderId: string, paymentId: string): Promise<number>;
  getOrder(orderId: string): Promise<TOrder>;
}

export async function verifyPendingUpiPayment<TOrder>(
  orderId: string,
  store: PendingUpiPaymentStore<TOrder>
): Promise<TOrder> {
  const payment = await store.findLatestPayment(orderId);
  if (!payment) throw new Error('Payment not found.');
  if (payment.provider !== 'UPI_QR') {
    throw new Error('Conflict: Cash on Delivery payments cannot be verified as UPI.');
  }
  if (payment.status !== 'PENDING') {
    throw new Error('Conflict: only pending UPI payments can be verified.');
  }

  const updatedCount = await store.completePendingUpiPayment(orderId, payment.id);
  if (updatedCount !== 1) {
    throw new Error('Conflict: this UPI payment was already verified or is no longer pending.');
  }
  return store.getOrder(orderId);
}
