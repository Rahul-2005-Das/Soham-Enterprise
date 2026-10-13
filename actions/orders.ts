import { prisma } from '../lib/db.ts';
import { requireAuthUser } from './auth-helper.ts';
import { createOrderSchema } from '../schemas/order.ts';
import { calculateCheckoutTotals, round2, validateCouponAvailability } from '../lib/pricing.ts';
import { getShippingSettings } from './site-settings.ts';

async function getApplicableCoupon(tx: any, couponCode: string) {
  const now = new Date();
  const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
  if (!coupon) throw new Error('This coupon code is invalid or has expired.');
  validateCouponAvailability(coupon, now);
  return coupon;
}

function toCouponCalculation(coupon: any) {
  return {
    discountType: coupon.discountType as 'PERCENTAGE' | 'FLAT',
    discountValue: Number(coupon.discountValue),
    minimumOrderAmount: Number(coupon.minimumOrderAmount),
    maximumDiscount: coupon.maximumDiscount === null ? null : Number(coupon.maximumDiscount),
  };
}

export async function getCheckoutQuote(input: unknown, authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);
  const couponCode = typeof input === 'object' && input !== null && 'couponCode' in input &&
    typeof input.couponCode === 'string' ? input.couponCode.trim() : '';
  const [cart, shippingSettings] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: auth.userId },
      include: { items: { include: { product: true } } },
    }),
    getShippingSettings(),
  ]);
  if (!cart || cart.items.length === 0) throw new Error('Your cart is empty.');
  const subtotal = round2(cart.items.reduce((sum, item) => {
    if (!item.product || !item.product.active) throw new Error(`"${item.product?.name ?? 'A product'}" is no longer available.`);
    if (item.quantity > item.product.stockQuantity) {
      throw new Error(
        item.product.stockQuantity > 0
          ? `Only ${item.product.stockQuantity} unit(s) of "${item.product.name}" left in stock.`
          : `"${item.product.name}" is out of stock.`
      );
    }
    return sum + Number(item.product.salePrice ?? item.product.price) * item.quantity;
  }, 0));
  const coupon = couponCode ? await getApplicableCoupon(prisma, couponCode) : null;
  return calculateCheckoutTotals(
    subtotal,
    shippingSettings,
    coupon ? toCouponCalculation(coupon) : null,
    cart.items.map((item) => ({
      quantity: item.quantity,
      shippingCharge: item.product.shippingCharge === null ? null : Number(item.product.shippingCharge),
    }))
  );
}

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
  try {
    const auth = requireAuthUser(authenticatedSessionToken);
    const validated = createOrderSchema.parse(input);
    const shippingSettings = await getShippingSettings();

    return await prisma.$transaction(async (tx: any) => {
      // Read checkout inputs in the same transaction as order/stock/cart writes.
      const address = await tx.address.findFirst({
        where: { id: validated.addressId, userId: auth.userId, deletedAt: null },
      });
      if (!address) {
        throw new Error('Address not found for this account.');
      }

      const cart = await tx.cart.findUnique({
        where: { userId: auth.userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty.');
      }

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
      if (unavailable.length > 0) throw new Error(unavailable.join(' '));

      const items = lineItems.filter((item: typeof lineItems[number]): item is NonNullable<typeof item> => item !== null);
      const subtotal = round2(items.reduce((sum: number, item: any) => sum + item.total, 0));
      let couponForCalculation: ReturnType<typeof toCouponCalculation> | null = null;
      let appliedCoupon: { id: string; code: string; usageLimit: number | null } | null = null;

      if (validated.couponCode) {
        const coupon = await getApplicableCoupon(tx, validated.couponCode);
        couponForCalculation = toCouponCalculation(coupon);
        appliedCoupon = { id: coupon.id, code: coupon.code, usageLimit: coupon.usageLimit };
      }

      const totals = calculateCheckoutTotals(
        subtotal,
        shippingSettings,
        couponForCalculation,
        cart.items.map((item: any) => ({
          quantity: item.quantity,
          shippingCharge: item.product.shippingCharge === null ? null : Number(item.product.shippingCharge),
        }))
      );
      const { shippingAmount, discountAmount, totalAmount } = totals;
      const orderNumber = generateOrderNumber();
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
            create: items.map((item: any) => ({
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // The conditional decrement prevents concurrent orders from overselling.
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, active: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`"${item.productNameSnapshot}" just went out of stock. Please update your cart.`);
        }
      }

      if (appliedCoupon) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: appliedCoupon.id,
            active: true,
            ...(appliedCoupon.usageLimit === null ? {} : { usedCount: { lt: appliedCoupon.usageLimit } }),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponUpdate.count === 0) throw new Error('This coupon has reached its usage limit.');
      }

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          provider: validated.paymentMethod === 'UPI' ? 'UPI_QR' : 'CASH_ON_DELIVERY',
          providerOrderId: createdOrder.orderNumber,
          providerPaymentId: validated.paymentReference || null,
          amount: totalAmount,
          currency: 'INR',
          // Payment is only marked completed after Admin verification.
          status: 'PENDING',
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });
  } catch (error) {
    console.error('[Orders] Order creation failed:', error);
    throw error;
  }
}
