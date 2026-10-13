import { prisma } from '../lib/db.ts';
import { addToCartSchema, updateCartItemSchema, removeCartItemSchema } from '../schemas/cart.ts';
import { requireAuthUser } from './auth-helper.ts';

/**
 * Get or initialize cart for the authenticated user.
 * Errors are allowed to propagate to the route handler as real errors -
 * never masked with a fake empty-cart "success" response.
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
              category: true,
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
                category: true,
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  // Drop any line items whose product was deactivated/deleted after being added,
  // so the customer never sees or is charged for something they can no longer buy.
  const activeItems = cart.items.filter((item: any) => item.product && item.product.active);

  const totalItems = activeItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const subtotal = activeItems.reduce(
    (sum: number, item: any) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
    0
  );

  return {
    cart: { ...cart, items: activeItems },
    totalItems,
    subtotal,
  };
}

/**
 * Add product to user cart (enforces unique product per cart).
 * Validates the product exists, is active, and that the resulting quantity
 * does not exceed available stock - all server-side, never trusting the client.
 */
export async function addCartItem(
  input: { productId: string; quantity?: number },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = addToCartSchema.parse(input);

  const product = await prisma.product.findUnique({ where: { id: validated.productId } });
  if (!product || !product.active) {
    throw new Error('This product is no longer available.');
  }

  let cart = await prisma.cart.findUnique({ where: { userId: auth.userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: auth.userId } });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
  });
  const resultingQuantity = (existing?.quantity ?? 0) + validated.quantity;

  if (resultingQuantity > product.stockQuantity) {
    const remaining = Math.max(product.stockQuantity - (existing?.quantity ?? 0), 0);
    throw new Error(
      remaining > 0
        ? `Only ${remaining} more unit(s) of "${product.name}" can be added (limited stock).`
        : `"${product.name}" is currently out of stock.`
    );
  }

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
    update: { quantity: { increment: validated.quantity } },
    create: { cartId: cart.id, productId: validated.productId, quantity: validated.quantity },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
  });

  return { success: true, item: cartItem };
}

/**
 * Update cart item quantity. Validates stock server-side; quantity 0 removes the item.
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
    throw new Error('This product is no longer available.');
  }
  if (validated.quantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} unit(s) of "${product.name}" are in stock.`);
  }

  const updatedItem = await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId: validated.productId } },
    data: { quantity: validated.quantity },
  });

  return { success: true, item: updatedItem };
}

/**
 * Remove product from user cart.
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
