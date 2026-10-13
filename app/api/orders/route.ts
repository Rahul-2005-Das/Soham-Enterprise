import { broadcastAdminEvent } from '../admin/sse.ts';
import { getCurrentUserOrders, createOrder, getCheckoutQuote } from '../../../actions/orders.ts';

function statusForError(error: any): number {
  const message = String(error?.message || '');
  if (message.startsWith('Unauthorized')) return 401;
  if (error?.name === 'ZodError') return 400;
  // Business-rule errors thrown deliberately by actions/orders.ts (empty cart,
  // stock/availability problems, invalid coupon, address ownership).
  const knownBusinessErrors = [
    'Address not found',
    'cart is empty',
    'no longer available',
    'out of stock',
    'left in stock',
    'went out of stock',
    'reached its usage limit',
    'coupon',
  ];
  if (knownBusinessErrors.some((s) => message.toLowerCase().includes(s.toLowerCase()))) {
    return 400;
  }
  return 500;
}

export async function handleGetUserOrders(reqOrAuth?: any) {
  try {
    const orders = await getCurrentUserOrders(reqOrAuth);
    return { status: 200, body: orders };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to load orders' } };
  }
}

export async function handleCreateOrder(body: any, reqOrAuth?: any) {
  try {
    const order = await createOrder(body, reqOrAuth);
    try {
      broadcastAdminEvent('NEW_ORDER', order);
    } catch (notificationError) {
      console.error('[Orders API] Order committed but Admin notification failed:', notificationError);
    }
    return { status: 201, body: { success: true, orderId: order.id, order } };
  } catch (error: any) {
    const status = statusForError(error);
    if (status === 500) {
      console.error('[Orders API] Could not place order:', error);
    }
    const validationMessage = error?.name === 'ZodError' ? error.issues?.[0]?.message : null;
    const message = status === 500
      ? 'We could not place your order right now. Please try again.'
      : validationMessage || error?.message || 'Could not place your order.';
    return { status, body: { success: false, error: message } };
  }
}

export async function handleCheckoutQuote(body: unknown, reqOrAuth?: any) {
  try {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { status: 400, body: { success: false, error: 'Checkout quote input must be an object.' } };
    }
    const input = body as Record<string, unknown>;
    if (input.couponCode !== undefined && (typeof input.couponCode !== 'string' || input.couponCode.length > 32)) {
      return { status: 400, body: { success: false, error: 'Invalid coupon code.' } };
    }
    const quote = await getCheckoutQuote(input, reqOrAuth);
    return { status: 200, body: { success: true, quote } };
  } catch (error: any) {
    const status = statusForError(error);
    return {
      status,
      body: { success: false, error: status === 500 ? 'Could not calculate checkout total.' : error.message },
    };
  }
}
