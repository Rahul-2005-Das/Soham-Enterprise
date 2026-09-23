import { getCurrentUserOrders } from '../../../actions/orders.ts';

export async function handleGetUserOrders(reqOrAuth?: any) {
  try {
    const orders = await getCurrentUserOrders(reqOrAuth);
    return { status: 200, body: orders };
  } catch (error: any) {
    return { status: 401, body: { error: error.message || 'Unauthorized: Session required to view personal orders' } };
  }
}

