import { Request } from 'express';
import { loginUser } from '../../../actions/auth.ts';
import {
  archiveAdminBrand,
  archiveAdminCategory,
  archiveAdminProduct,
  deleteAdminBrand,
  deleteAdminCategory,
  deleteAdminProduct,
  deleteAdminService,
  deleteAdminServiceCategory,
  deleteAdminOrder,
  deleteAdminCustomer,
  purgeAdminStorage,
  createAdminBanner,
  createAdminBrand,
  createAdminCategory,
  createAdminCoupon,
  createAdminProduct,
  createAdminService,
  createAdminServiceCategory,
  deleteAdminBanner,
  deleteAdminCoupon,
  getAdminBanners,
  getAdminBrands,
  getAdminCategories,
  getAdminCoupons,
  getAdminCustomersDetailed,
  getAdminOrders,
  getAdminOrderReport,
  getAdminOverview,
  getPublicCoupons,
  getAdminProducts,
  getAdminServices,
  getAdminServiceCategories,
  getPublicBanners,
  updateAdminBanner,
  updateAdminBrand,
  updateAdminCategory,
  updateAdminCoupon,
  updateAdminOrder,
  verifyAdminUpiPayment,
  updateAdminProduct,
  updateAdminService,
  updateAdminServiceCategory,
  archiveAdminService,
  archiveAdminServiceCategory,
  uploadAdminImage,
} from '../../../actions/admin-commerce.ts';
import { requireRole } from '../../../actions/auth-helper.ts';
import { mapApiError } from '../_errors.ts';
import { ORDER_REPORT_PERIODS } from '../../../lib/order-report.ts';
import { loginSchema } from '../../../schemas/user.ts';
import {
  adminBannerSchema,
  adminBannerUpdateSchema,
  adminBrandSchema,
  adminBrandUpdateSchema,
  adminCategorySchema,
  adminCategoryUpdateSchema,
  adminCouponSchema,
  adminCouponUpdateSchema,
  adminImageUploadSchema,
  adminOrderStatusSchema,
  adminVerifyUpiPaymentSchema,
  adminProductSchema,
  adminProductUpdateSchema,
  adminServiceSchema,
  adminServiceUpdateSchema,
  adminServiceCategorySchema,
  adminServiceCategoryUpdateSchema,
} from '../../../schemas/admin-commerce.ts';

function admin(req: Request) {
  return requireRole(req, ['ADMIN']);
}

function failure(error: any, fallback: string, fallbackPayload: Record<string, unknown> = {}) {
  const mapped = mapApiError(error, fallback);
  return { status: mapped.status, body: { success: false, error: mapped.error, ...fallbackPayload } };
}

export async function handleAdminLogin(body: any) {
  try {
    const input = loginSchema.parse(body);
    const result = await loginUser(input);
    if (result.user.role !== 'ADMIN') {
      return { status: 401, body: { success: false, error: 'Invalid email or password.' } };
    }
    return { status: 200, body: { success: true, user: result.user }, token: result.token };
  } catch (error: any) {
    if (error.name === 'ZodError') return failure(error, 'Invalid login input.');
    return { status: 401, body: { success: false, error: 'Invalid email or password.' } };
  }
}

export async function handleAdminOverview(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, ...(await getAdminOverview()) } }; }
  catch (error) { return failure(error, 'Could not load dashboard overview.'); }
}

export async function handleAdminProducts(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, products: await getAdminProducts(String(req.query.search || '')) } }; }
  catch (error) { return failure(error, 'Could not load products.'); }
}

export async function handleAdminCreateProduct(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, product: await createAdminProduct(adminProductSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create product.'); }
}

export async function handleAdminUpdateProduct(id: string, body: any, req: Request) {
  try {
    admin(req);
    const input = normalizeProductUpdate(body);
    return { status: 200, body: { success: true, product: await updateAdminProduct(id, adminProductUpdateSchema.parse(input)) } };
  }
  catch (error) { return failure(error, 'Could not update product.'); }
}

function normalizeProductUpdate(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const normalized = { ...body };
  if (typeof normalized.isPublished === 'boolean') {
    normalized.active = normalized.isPublished;
    delete normalized.isPublished;
  }
  if (normalized.status === 'PUBLISHED' || normalized.status === 'DRAFT') {
    normalized.active = normalized.status === 'PUBLISHED';
    delete normalized.status;
  }
  return normalized;
}

export async function handleAdminUpdateProductVisibility(id: string, body: any, req: Request) {
  try {
    admin(req);
    const input = normalizeProductUpdate(body);
    if (typeof input?.active !== 'boolean') {
      return { status: 400, body: { success: false, error: 'Provide isPublished or a valid PUBLISHED/DRAFT status.' } };
    }
    const product = await updateAdminProduct(id, { active: input.active });
    return { status: 200, body: { success: true, isPublished: product.active, product } };
  }
  catch (error) { return failure(error, 'Could not update product.'); }
}

export async function handleAdminDeleteProduct(id: string, req: Request) {
  try {
    admin(req);
    const permanent = req.query.archive !== 'true';
    return { status: 200, body: await deleteAdminProduct(id, permanent) };
  } catch (error) { return failure(error, 'Could not delete product.'); }
}

export async function handleAdminServices(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, services: await getAdminServices(String(req.query.search || '')) } }; }
  catch (error) { return failure(error, 'Could not load services.', { services: [] }); }
}

export async function handleAdminCreateService(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, service: await createAdminService(adminServiceSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create service.'); }
}

export async function handleAdminUpdateService(id: string, body: any, req: Request) {
  try { admin(req); return { status: 200, body: { success: true, service: await updateAdminService(id, adminServiceUpdateSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not update service.'); }
}

export async function handleAdminDeleteService(id: string, req: Request) {
  try {
    admin(req);
    const permanent = req.query.archive !== 'true';
    return { status: 200, body: await deleteAdminService(id, permanent) };
  } catch (error) { return failure(error, 'Could not delete service.'); }
}

export async function handleAdminServiceCategories(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, categories: await getAdminServiceCategories() } }; }
  catch (error) { return failure(error, 'Could not load service categories.'); }
}

export async function handleAdminCreateServiceCategory(body: any, req: Request) {
  try {
    admin(req);
    return { status: 201, body: { success: true, category: await createAdminServiceCategory(adminServiceCategorySchema.parse(body)) } };
  } catch (error) { return failure(error, 'Could not create service category.'); }
}

export async function handleAdminUpdateServiceCategory(id: string, body: any, req: Request) {
  try {
    admin(req);
    return { status: 200, body: { success: true, category: await updateAdminServiceCategory(id, adminServiceCategoryUpdateSchema.parse(body)) } };
  } catch (error) { return failure(error, 'Could not update service category.'); }
}

export async function handleAdminDeleteServiceCategory(id: string, req: Request) {
  try {
    admin(req);
    const permanent = req.query.archive !== 'true';
    return { status: 200, body: await deleteAdminServiceCategory(id, permanent) };
  } catch (error) { return failure(error, 'Could not delete service category.'); }
}

export async function handleAdminCategories(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, categories: await getAdminCategories() } }; }
  catch (error) { return failure(error, 'Could not load categories.', { categories: [] }); }
}

export async function handleAdminCreateCategory(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, category: await createAdminCategory(adminCategorySchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create category.'); }
}

export async function handleAdminUpdateCategory(id: string, body: any, req: Request) {
  try { admin(req); return { status: 200, body: { success: true, category: await updateAdminCategory(id, adminCategoryUpdateSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not update category.'); }
}

export async function handleAdminDeleteCategory(id: string, req: Request) {
  try {
    admin(req);
    const permanent = req.query.archive !== 'true';
    return { status: 200, body: await deleteAdminCategory(id, permanent) };
  } catch (error) { return failure(error, 'Could not delete category.'); }
}

export async function handleAdminBrands(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, brands: await getAdminBrands() } }; }
  catch (error) { return failure(error, 'Could not load brands.'); }
}

export async function handleAdminCreateBrand(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, brand: await createAdminBrand(adminBrandSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create brand.'); }
}

export async function handleAdminUpdateBrand(id: string, body: any, req: Request) {
  try { admin(req); return { status: 200, body: { success: true, brand: await updateAdminBrand(id, adminBrandUpdateSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not update brand.'); }
}

export async function handleAdminDeleteBrand(id: string, req: Request) {
  try {
    admin(req);
    const permanent = req.query.archive !== 'true';
    return { status: 200, body: await deleteAdminBrand(id, permanent) };
  } catch (error) { return failure(error, 'Could not delete brand.'); }
}

export async function handleAdminCoupons(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, coupons: await getAdminCoupons() } }; }
  catch (error) { return failure(error, 'Could not load coupons.'); }
}

export async function handleAdminCreateCoupon(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, coupon: await createAdminCoupon(adminCouponSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create coupon.'); }
}

export async function handleAdminUpdateCoupon(id: string, body: any, req: Request) {
  try { admin(req); return { status: 200, body: { success: true, coupon: await updateAdminCoupon(id, adminCouponUpdateSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not update coupon.'); }
}

export async function handleAdminDeleteCoupon(id: string, req: Request) {
  try { admin(req); return { status: 200, body: await deleteAdminCoupon(id) }; }
  catch (error) { return failure(error, 'Could not delete coupon.'); }
}

export async function handleAdminBanners(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, banners: await getAdminBanners() } }; }
  catch (error) { return failure(error, 'Could not load banners.'); }
}

export async function handleAdminCreateBanner(body: any, req: Request) {
  try { admin(req); return { status: 201, body: { success: true, banner: await createAdminBanner(adminBannerSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not create banner.'); }
}

export async function handleAdminUpdateBanner(id: string, body: any, req: Request) {
  try { admin(req); return { status: 200, body: { success: true, banner: await updateAdminBanner(id, adminBannerUpdateSchema.parse(body)) } }; }
  catch (error) { return failure(error, 'Could not update banner.'); }
}

export async function handleAdminDeleteBanner(id: string, req: Request) {
  try { admin(req); return { status: 200, body: await deleteAdminBanner(id) }; }
  catch (error) { return failure(error, 'Could not delete banner.'); }
}

export async function handleAdminOrders(req: Request) {
  try {
    admin(req);
    const status = String(req.query.status || 'ALL');
    if (!['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return { status: 400, body: { success: false, error: 'Invalid order status filter.' } };
    }
    const orders = await getAdminOrders(status, String(req.query.search || ''));
    return { status: 200, body: { success: true, orders } };
  } catch (error) { return failure(error, 'Could not load orders.', { orders: [] }); }
}

export async function handleAdminOrderReport(req: Request) {
  try {
    admin(req);
    const period = String(req.query.period || '');
    if (!ORDER_REPORT_PERIODS.includes(period as typeof ORDER_REPORT_PERIODS[number])) {
      return { status: 400, body: { success: false, error: 'Choose a valid order report period.' } };
    }
    const orders = await getAdminOrderReport(period as typeof ORDER_REPORT_PERIODS[number]);
    return { status: 200, body: { success: true, period, orders } };
  } catch (error) { return failure(error, 'Could not generate order report.'); }
}

export async function handleAdminUpdateOrder(id: string, body: any, req: Request) {
  try {
    admin(req);
    const input = adminOrderStatusSchema.parse(body);
    return { status: 200, body: { success: true, order: await updateAdminOrder(id, input) } };
  } catch (error) { return failure(error, 'Could not update order.'); }
}

export async function handleAdminVerifyUpiPayment(id: string, body: any, req: Request) {
  try {
    admin(req);
    adminVerifyUpiPaymentSchema.parse(body);
    const order = await verifyAdminUpiPayment(id);
    return { status: 200, body: { success: true, order } };
  } catch (error) { return failure(error, 'Could not verify UPI payment.'); }
}

export async function handleAdminDeleteOrder(id: string, req: Request) {
  try {
    admin(req);
    return { status: 200, body: await deleteAdminOrder(id) };
  } catch (error) { return failure(error, 'Could not delete order.'); }
}

export async function handleAdminCustomers(req: Request) {
  try { admin(req); return { status: 200, body: { success: true, customers: await getAdminCustomersDetailed(String(req.query.search || '')) } }; }
  catch (error) { return failure(error, 'Could not load customers.'); }
}

export async function handleAdminDeleteCustomer(id: string, req: Request) {
  try {
    admin(req);
    return { status: 200, body: await deleteAdminCustomer(id) };
  } catch (error) { return failure(error, 'Could not delete customer.'); }
}

export async function handleAdminPurgeStorage(body: any, req: Request) {
  try {
    admin(req);
    const scope = String(body?.scope || 'all');
    return { status: 200, body: await purgeAdminStorage(scope) };
  } catch (error) { return failure(error, 'Could not clear storage.'); }
}

export async function handleAdminImageUpload(body: any, req: Request) {
  try {
    admin(req);
    const { dataUrl, imageUrl } = adminImageUploadSchema.parse(body);
    return { status: 201, body: { success: true, ...(await uploadAdminImage(dataUrl || imageUrl || '')) } };
  } catch (error) { return failure(error, 'Could not upload image.'); }
}

export async function handlePublicBanners() {
  try { return { status: 200, body: { success: true, banners: await getPublicBanners() } }; }
  catch (error) { return failure(error, 'Could not load banners.'); }
}

export async function handlePublicCoupons() {
  try { return { status: 200, body: { success: true, coupons: await getPublicCoupons() } }; }
  catch (error) { return failure(error, 'Could not load active coupons.'); }
}
