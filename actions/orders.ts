import { prisma } from '../lib/db.ts';
import { requireAuthUser } from './auth-helper.ts';
import { createOrderSchema } from '../schemas/order.ts';
import { calculateShipping, round2 } from '../lib/pricing.ts';

/**
 * Get current authenticated user's orders.
 * Protected operation: rejects unauthorized access. Real errors propagate.
 */
export async function getCurrentUserOrders(authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);

  const orders = await prisma.order.findMany({
    where: { userId: auth.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
      address: true,
      payments: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
}

function generateOrderNumber(): string {
  return `SE-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Create an order from the authenticated user's current cart.
 *
 * Every amount (item price, shipping, discount, total) is (re)computed here
 * from live database values — the client cannot influence pricing. Stock is
 * re-checked at the moment of order creation and decremented atomically in
 * the same transaction that creates the order, so two customers can't both
 * "succeed" in buying the last unit of something.
 *
 * Payment is never marked as paid based on anything the client claims.
 * Both UPI and Cash-on-Delivery orders are created with Payment.status
 * PENDING; an admin marks it verified/paid after checking the UPI
 * reference number (or collecting cash) — see actions/admin.ts.
 */
export async function createOrder(input: unknown, authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const validated = createOrderSchema.parse(input);

  // Ownership check: the address must belong to the requesting user.
  const address = await prisma.address.findFirst({
    where: { id: validated.addressId, userId: auth.userId },
  });
  if (!address) {
    throw new Error('Address not found for this account.');
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: auth.userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  // Re-validate every line item against live product data.
  const unavailable: string[] = [];
  const lineItems = cart.items.map((item: any) => {
    const product = item.product;
    if (!product || !product.active) {
      unavailable.push(`"${item.product?.name ?? 'A product'}" is no longer available.`);
      return null;
    }
    if (item.quantity > product.stockQuantity) {
      unavailable.push(
        product.stockQuantity > 0
          ? `Only ${product.stockQuantity} unit(s) of "${product.name}" left in stock (you have ${item.quantity} in cart).`
          : `"${product.name}" is out of stock.`
      );
      return null;
    }
    const unitPrice = Number(product.salePrice ?? product.price);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      price: unitPrice,
      quantity: item.quantity,
      total: round2(unitPrice * item.quantity),
    };
  });

  if (unavailable.length > 0) {
    throw new Error(unavailable.join(' '));
  }

  const items = lineItems.filter((i: typeof lineItems[number]): i is NonNullable<typeof i> => i !== null);
  const subtotal = round2(items.reduce((sum: number, i: any) => sum + i.total, 0));
  const shippingAmount = calculateShipping(subtotal);

  // Optional coupon
  let discountAmount = 0;
  let appliedCoupon: { id: string; code: string } | null = null;
  if (validated.couponCode) {
    const now = new Date();
    const coupon = await prisma.coupon.findUnique({ where: { code: validated.couponCode.toUpperCase() } });
    if (
      !coupon ||
      !coupon.active ||
      coupon.startsAt > now ||
      coupon.expiresAt < now ||
      (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    ) {
      throw new Error('This coupon code is invalid or has expired.');
    }
    if (subtotal < Number(coupon.minimumOrderAmount)) {
      throw new Error(`This coupon requires a minimum order of ₹${coupon.minimumOrderAmount}.`);
    }
    const rawDiscount =
      coupon.discountType === 'PERCENTAGE'
        ? (subtotal * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);
    discountAmount = round2(
      coupon.maximumDiscount ? Math.min(rawDiscount, Number(coupon.maximumDiscount)) : rawDiscount
    );
    appliedCoupon = { id: coupon.id, code: coupon.code };
  }

  const totalAmount = round2(Math.max(0, subtotal + shippingAmount - discountAmount));
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx: any) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: auth.userId,
        addressId: address.id,
        subtotal,
        shippingAmount,
        discountAmount,
        totalAmount,
        status: 'PENDING',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            productNameSnapshot: i.productNameSnapshot,
            skuSnapshot: i.skuSnapshot,
            price: i.price,
            quantity: i.quantity,
            total: i.total,
          })),
        },
      },
      include: {
        items: true,
        address: true,
      },
    });

    // Decrement stock for each purchased product. If two requests race past
    // the earlier check, this guard (stockQuantity >= quantity) still
    // prevents going negative — updateMany returns 0 rows if stock is now
    // insufficient, which we treat as a failure and roll back the whole order.
    for (const item of items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new Error(`"${item.productNameSnapshot}" just went out of stock. Please update your cart.`);
      }
    }

    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        provider: validated.paymentMethod === 'UPI' ? 'UPI_QR' : 'CASH_ON_DELIVERY',
        providerOrderId: createdOrder.orderNumber,
        providerPaymentId: validated.paymentReference || null,
        amount: totalAmount,
        currency: 'INR',
        // Never trust the client for payment success. An admin verifies the
        // UPI reference number (or collects cash) and updates this manually.
        status: 'PENDING',
      },
    });

    // Clear the cart now that the order has been created from it.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdOrder;
  });

  return order;
}
