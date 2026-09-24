import { prisma } from '../lib/db.ts';
import { addToCartSchema, updateCartItemSchema, removeCartItemSchema } from '../schemas/cart.ts';
import { requireAuthUser } from './auth-helper.ts';

/**
 * Get or initialize cart for the authenticated user.
 *
 * NOTE: this used to swallow all database errors and return a fake empty
 * "temp-cart" with success:true. That masked real failures (e.g. DB down)
 * as an empty cart, which is misleading. Real errors now propagate.
 */
export async function getCart(authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);

  let cart = await prisma.cart.findUnique({
    where: { userId: auth.userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: auth.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  // Drop any line items whose product was deactivated/deleted after being
  // added to the cart, rather than crashing the whole cart view.
  const validItems = cart.items.filter((item) => item.product && item.product.active);

  const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce(
    (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );

  return {
    cart: { ...cart, items: validItems },
    totalItems,
    subtotal,
  };
}

/**
 * Add a product to the user's cart. Enforces:
 * - product exists and is active
 * - requested quantity (existing + new) does not exceed live stock
 * Throws a real error on failure instead of returning a fake success.
 */
export async function addCartItem(
  input: { productId: string; quantity?: number },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = addToCartSchema.parse(input);

  const product = await prisma.product.findUnique({ where: { id: validated.productId } });
  if (!product || !product.active) {
    throw new Error('This product is not available.');
  }

  let cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: auth.userId } });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
  });
  const desiredQuantity = (existing?.quantity ?? 0) + validated.quantity;

  if (desiredQuantity > product.stockQuantity) {
    const remaining = Math.max(0, product.stockQuantity - (existing?.quantity ?? 0));
    throw new Error(
      remaining > 0
        ? `Only ${remaining} more unit(s) of "${product.name}" available.`
        : `"${product.name}" is out of stock.`
    );
  }

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
    update: { quantity: { increment: validated.quantity } },
    create: { cartId: cart.id, productId: validated.productId, quantity: validated.quantity },
    include: { product: true },
  });

  return { success: true, item: cartItem };
}

/**
 * Update a cart item's quantity (0 removes it). Validates live stock.
 */
export async function updateCartItem(
  input: { productId: string; quantity: number },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = updateCartItemSchema.parse(input);

  const cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
  if (!cart) {
    throw new Error('Cart not found.');
  }

  if (validated.quantity === 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: validated.productId },
    });
    return { success: true, removed: true };
  }

  const product = await prisma.product.findUnique({ where: { id: validated.productId } });
  if (!product || !product.active) {
    throw new Error('This product is not available.');
  }
  if (validated.quantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} unit(s) of "${product.name}" available.`);
  }

  const updatedItem = await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
    data: { quantity: validated.quantity },
  });

  return { success: true, item: updatedItem };
}

/**
 * Remove a product from the user's cart.
 */
export async function removeCartItem(
  input: { productId: string },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = removeCartItemSchema.parse(input);

  const cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
  if (!cart) return { success: true };

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId: validated.productId },
  });

  return { success: true };
}
