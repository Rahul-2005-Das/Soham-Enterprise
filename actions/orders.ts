import { prisma } from '../lib/db.ts';
import { requireAuthUser } from './auth-helper.ts';

/**
 * Get current authenticated user's orders
 * Protected operation: rejects unauthorized access
 */
export async function getCurrentUserOrders(authenticatedSessionToken?: string) {
  const auth = requireAuthUser(authenticatedSessionToken);

  try {
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
  } catch (error) {
    console.warn(`[actions/orders] Failed to fetch orders for user ${auth.userId}:`, error);
    return [];
  }
}
