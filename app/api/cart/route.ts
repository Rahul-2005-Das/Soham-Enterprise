import { getCart, addCartItem, updateCartItem, removeCartItem } from '../../../actions/cart.ts';

function statusForError(error: any): number {
  const message = String(error?.message || '');
  if (message.startsWith('Unauthorized')) return 401;
  if (error?.name === 'ZodError') return 400;
  // Business-rule errors we throw ourselves (stock, product availability, cart not found)
  if (
    message.includes('not available') ||
    message.includes('out of stock') ||
    message.includes('available.') ||
    message.includes('Cart not found')
  ) {
    return 400;
  }
  return 500;
}

export async function handleGetCart(reqOrAuth?: any) {
  try {
    const cart = await getCart(reqOrAuth);
    return { status: 200, body: cart };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to load cart' } };
  }
}

export async function handleAddToCart(body: any, reqOrAuth?: any) {
  try {
    const result = await addCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to add item to cart' } };
  }
}

export async function handleUpdateCart(body: any, reqOrAuth?: any) {
  try {
    const result = await updateCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to update cart item' } };
  }
}

export async function handleDeleteCartItem(body: any, reqOrAuth?: any) {
  try {
    const result = await removeCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: statusForError(error), body: { error: error.message || 'Failed to remove cart item' } };
  }
}
