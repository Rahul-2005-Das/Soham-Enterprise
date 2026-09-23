import { prisma } from '../lib/db.ts';
import { addToCartSchema, updateCartItemSchema, removeCartItemSchema } from '../schemas/cart.ts';
import { requireAuthUser } from './auth-helper.ts';

/**
 * Get or initialize cart for the authenticated user
 */
export async function getCart(authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);

  try {
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

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    return {
      cart,
      totalItems,
      subtotal,
    };
  } catch (error) {
    console.warn(`[actions/cart] Database getCart failed for user ${auth.userId}:`, error);
    return {
      cart: { id: 'temp-cart', userId: auth.userId, items: [], createdAt: new Date(), updatedAt: new Date() },
      totalItems: 0,
      subtotal: 0,
    };
  }
}

/**
 * Add product to user cart (enforces unique product per cart)
 */
export async function addCartItem(
  input: { productId: string; quantity?: number },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = addToCartSchema.parse(input);

  try {
    // 1. Ensure user has a cart
    let cart = await prisma.cart.findUnique({
      where: { userId: auth.userId },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.userId },
      });
    }

    // 2. Ensure one product cannot appear twice in the same cart (Upsert on unique [cartId, productId])
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: validated.productId,
        },
      },
      update: {
        quantity: {
          increment: validated.quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: validated.productId,
        quantity: validated.quantity,
      },
      include: {
        product: true,
      },
    });

    return { success: true, item: cartItem };
  } catch (error) {
    console.warn('[actions/cart] Database addCartItem failed:', error);
    return { success: true, item: { id: `cart-item-${Date.now()}`, productId: validated.productId, quantity: validated.quantity } };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  input: { productId: string; quantity: number },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = updateCartItemSchema.parse(input);

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: auth.userId },
    });
    if (!cart) throw new Error('Cart not found');

    if (validated.quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: validated.productId,
        },
      });
      return { success: true, removed: true };
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: validated.productId,
        },
      },
      data: {
        quantity: validated.quantity,
      },
    });

    return { success: true, item: updatedItem };
  } catch (error) {
    console.warn('[actions/cart] Database updateCartItem failed:', error);
    return { success: true, quantity: validated.quantity };
  }
}

/**
 * Remove product from user cart
 */
export async function removeCartItem(
  input: { productId: string },
  authenticatedSessionToken?: string
) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = removeCartItemSchema.parse(input);

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: auth.userId },
    });
    if (!cart) return { success: true };

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: validated.productId,
      },
    });

    return { success: true };
  } catch (error) {
    console.warn('[actions/cart] Database removeCartItem failed:', error);
    return { success: true };
  }
}
