import { Request } from 'express';
import { z } from 'zod';
import { getAuthenticatedUser } from '../../../actions/auth-helper.ts';
import { uploadAdminImage } from '../../../actions/admin-commerce.ts';
import { prisma } from '../../../lib/db.ts';
import { mapApiError } from '../_errors.ts';

const reviewSubmissionSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name.').max(100),
  rating: z.coerce.number().int().min(1).max(5),
  serviceName: z.string().trim().min(1, 'Choose a service or product category.').max(120),
  comment: z.string().trim().min(10, 'Your feedback must be at least 10 characters.').max(3000),
  productId: z.string().trim().min(1).optional(),
  serviceId: z.string().trim().min(1).optional(),
  imageData: z.string().max(2_500_000).optional(),
}).refine((review) => !(review.productId && review.serviceId), {
  message: 'A review can refer to a product or a service, not both.',
});

export async function handleGetPublicReviews(req?: Request) {
  try {
    const productId = typeof req?.query.productId === 'string' ? req.query.productId : undefined;
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, active: true, ...(productId ? { productId } : {}) },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: productId ? 100 : 12,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        imageUrl: true,
        serviceName: true,
        createdAt: true,
        isFeatured: true,
        userName: true,
        user: { select: { name: true } },
        product: { select: { name: true } },
        service: { select: { name: true } },
      },
    });
    const where = { isApproved: true, active: true, ...(productId ? { productId } : {}) };
    const [aggregate, count] = await Promise.all([
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.count({ where }),
    ]);
    return {
      status: 200,
      body: { success: true, reviews, aggregate: { averageRating: aggregate._avg.rating ?? 0, count } },
    };
  } catch (error) {
    console.error('[Reviews] Could not load approved reviews:', error);
    return { status: 500, body: { success: false, error: 'Could not load reviews.', reviews: [], aggregate: { averageRating: 0, count: 0 } } };
  }
}

export async function handleGetReviewEligibility(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || session.role !== 'CUSTOMER') {
      return {
        status: 200,
        body: {
          success: true,
          canSubmitFeedback: false,
          totalReviews: 0,
          reason: !session ? 'UNAUTHENTICATED' : 'NOT_CUSTOMER',
          selectableOptions: [],
        },
      };
    }

    const [latestReview, totalReviews, userBookings, userOrders] = await Promise.all([
      prisma.review.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, rating: true, serviceName: true },
      }),
      prisma.review.count({
        where: { userId: session.userId },
      }),
      prisma.serviceBooking.findMany({
        where: { userId: session.userId, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          appliance: true,
          createdAt: true,
          service: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: { userId: session.userId, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          items: {
            take: 2,
            select: { productNameSnapshot: true },
          },
        },
      }),
    ]);

    const reviewTime = latestReview ? latestReview.createdAt.getTime() : null;
    const latestBookingTime = userBookings.length > 0 ? userBookings[0].createdAt.getTime() : 0;
    const latestOrderTime = userOrders.length > 0 ? userOrders[0].createdAt.getTime() : 0;
    const latestActivityTime = Math.max(latestBookingTime, latestOrderTime);
    const totalActivities = userBookings.length + userOrders.length;

    let canSubmitFeedback = false;
    let reason = '';

    if (totalReviews === 0) {
      canSubmitFeedback = true;
      reason = 'FIRST_FEEDBACK_ELIGIBLE';
    } else if (latestActivityTime > (reviewTime || 0)) {
      canSubmitFeedback = true;
      reason = 'NEW_ACTIVITY_ELIGIBLE';
    } else {
      canSubmitFeedback = false;
      reason = 'ALREADY_SUBMITTED';
    }

    // Build selectable options for the dropdown
    const selectableOptions: Array<{
      id: string;
      label: string;
      serviceName: string;
      serviceId?: string;
      type: 'booking' | 'order';
    }> = [];

    userBookings.forEach((b) => {
      const name = b.service?.name || b.appliance;
      selectableOptions.push({
        id: b.id,
        label: `${name} (Booking #${b.bookingNumber})`,
        serviceName: name,
        serviceId: b.service?.id,
        type: 'booking',
      });
    });

    userOrders.forEach((o) => {
      const itemNames = o.items.map((i) => i.productNameSnapshot).filter(Boolean).join(', ');
      const label = itemNames ? `Spare Parts: ${itemNames} (Order #${o.orderNumber})` : `Spare Parts (Order #${o.orderNumber})`;
      selectableOptions.push({
        id: o.id,
        label,
        serviceName: 'Spare Parts',
        type: 'order',
      });
    });

    return {
      status: 200,
      body: {
        success: true,
        canSubmitFeedback,
        totalReviews,
        totalActivities,
        reason,
        latestReview: latestReview
          ? {
              id: latestReview.id,
              rating: latestReview.rating,
              serviceName: latestReview.serviceName,
              createdAt: latestReview.createdAt,
            }
          : null,
        selectableOptions,
      },
    };
  } catch (error) {
    console.error('[Reviews] Error checking eligibility:', error);
    return {
      status: 500,
      body: { success: false, canSubmitFeedback: false, error: 'Could not check feedback eligibility.' },
    };
  }
}

export async function handleSubmitReview(body: unknown, req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (session && session.role !== 'CUSTOMER') {
      return { status: 403, body: { success: false, error: 'Only customer accounts can submit reviews.' } };
    }
    const input = reviewSubmissionSchema.parse(body);

    // If an authenticated customer is submitting feedback (not directly reviewing a specific product catalog item):
    if (session && session.role === 'CUSTOMER' && !input.productId) {
      const [latestReview, latestBooking, latestOrder] = await Promise.all([
        prisma.review.findFirst({
          where: { userId: session.userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        }),
        prisma.serviceBooking.findFirst({
          where: { userId: session.userId, status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        }),
        prisma.order.findFirst({
          where: { userId: session.userId, status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        }),
      ]);

      if (latestReview) {
        const reviewTime = latestReview.createdAt.getTime();
        const latestBookingTime = latestBooking ? latestBooking.createdAt.getTime() : 0;
        const latestOrderTime = latestOrder ? latestOrder.createdAt.getTime() : 0;
        const latestActivityTime = Math.max(latestBookingTime, latestOrderTime);

        if (latestActivityTime <= reviewTime) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'You have already submitted feedback. You will be able to share feedback again after your next service booking or spare parts order.',
            },
          };
        }
      }
    }

    let imageUrl: string | null = null;
    if (input.imageData) {
      if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(input.imageData)) {
        return { status: 400, body: { success: false, error: 'Upload a valid PNG, JPEG, or WebP image.' } };
      }
      imageUrl = (await uploadAdminImage(input.imageData)).url;
    }

    let productId: string | null = null;
    let serviceId: string | null = null;
    let serviceName = input.serviceName;
    if (input.productId) {
      const product = await prisma.product.findFirst({
        where: { id: input.productId, active: true },
        select: { id: true, name: true },
      });
      if (!product) return { status: 404, body: { success: false, error: 'That product is no longer available for review.' } };
      productId = product.id;
      serviceName = product.name;
    } else if (input.serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: input.serviceId, active: true },
        select: { id: true, name: true },
      });
      if (!service) return { status: 404, body: { success: false, error: 'That service is no longer available for review.' } };
      serviceId = service.id;
      serviceName = service.name;
    }

    // Check if user has real bookings/orders to mark verified
    const isVerifiedCustomer = session?.userId
      ? (await prisma.serviceBooking.count({ where: { userId: session.userId } })) > 0 ||
        (await prisma.order.count({ where: { userId: session.userId } })) > 0
      : false;

    const review = await prisma.review.create({
      data: {
        userId: session?.userId ?? null,
        userName: input.fullName,
        userEmail: session?.email ?? null,
        rating: input.rating,
        serviceName,
        comment: input.comment,
        imageUrl,
        productId,
        serviceId,
        verified: isVerifiedCustomer,
        isApproved: false,
        isFeatured: false,
        active: true,
      },
      select: { id: true, rating: true, serviceName: true, createdAt: true },
    });
    return {
      status: 201,
      body: { success: true, message: 'Thank you! Your review has been submitted for approval.', review },
    };
  } catch (error) {
    const mapped = mapApiError(error, 'Please check the review details.');
    if (mapped.status === 500) console.error('[Reviews] Could not submit review:', error);
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}
