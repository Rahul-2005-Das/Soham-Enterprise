import { Request } from 'express';
import { requireRole } from '../../../../actions/auth-helper.ts';
import { prisma } from '../../../../lib/db.ts';
import { mapApiError } from '../../_errors.ts';

export async function handleGetAdminReviews(req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    return { status: 200, body: { success: true, reviews } };
  } catch (error) {
    const mapped = mapApiError(error);
    return { status: mapped.status, body: { success: false, error: mapped.error, reviews: [] } };
  }
}

export async function handleUpdateAdminReview(id: string, body: unknown, req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { status: 400, body: { success: false, error: 'Review settings must be a JSON object.' } };
    }
    const input = body as Record<string, unknown>;
    const data: { isApproved?: boolean; isFeatured?: boolean; active?: boolean } = {};
    if (typeof input.isApproved === 'boolean') data.isApproved = input.isApproved;
    if (typeof input.isFeatured === 'boolean') data.isFeatured = input.isFeatured;
    if (typeof input.active === 'boolean') data.active = input.active;
    if (!Object.keys(data).length) {
      return { status: 400, body: { success: false, error: 'Provide an approval or featured value.' } };
    }
    const existing = await prisma.review.findUnique({ where: { id }, select: { id: true, isApproved: true } });
    if (!existing) return { status: 404, body: { success: false, error: 'Review not found.' } };
    const isApproved = data.isApproved ?? existing.isApproved;
    if (data.isFeatured === true && !isApproved) {
      return { status: 400, body: { success: false, error: 'Approve a review before featuring it.' } };
    }
    if (data.isApproved === true) data.active = true;
    if (data.active === false || data.isApproved === false) {
      data.isApproved = false;
      data.isFeatured = false;
    }
    const review = await prisma.review.update({ where: { id }, data });
    return { status: 200, body: { success: true, review } };
  } catch (error) {
    const mapped = mapApiError(error);
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleDeleteAdminReview(id: string, req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return { status: 404, body: { success: false, error: 'Review not found.' } };
    await prisma.review.delete({ where: { id } });
    return { status: 200, body: { success: true, id } };
  } catch (error) {
    const mapped = mapApiError(error);
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}
