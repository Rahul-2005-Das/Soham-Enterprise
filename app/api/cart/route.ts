import { getCart, addCartItem, updateCartItem, removeCartItem } from '../../../actions/cart.ts';

export async function handleGetCart(reqOrAuth?: any) {
  try {
    const cart = await getCart(reqOrAuth);
    return { status: 200, body: cart };
  } catch (error: any) {
    return { status: 401, body: { error: error.message || 'Unauthorized: Session required to access cart' } };
  }
}

export async function handleAddToCart(body: any, reqOrAuth?: any) {
  try {
    const result = await addCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to add item to cart' } };
  }
}

export async function handleUpdateCart(body: any, reqOrAuth?: any) {
  try {
    const result = await updateCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to update cart item' } };
  }
}

export async function handleDeleteCartItem(body: any, reqOrAuth?: any) {
  try {
    const result = await removeCartItem(body, reqOrAuth);
    return { status: 200, body: result };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to remove cart item' } };
  }
}

