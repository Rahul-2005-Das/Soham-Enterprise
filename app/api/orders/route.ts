import { getCurrentUserOrders, createOrder } from '../../../actions/orders.ts';

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
    return { status: 201, body: { success: true, order } };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to place order' } };
  }
}
