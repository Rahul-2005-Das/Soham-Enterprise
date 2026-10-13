import crypto from 'node:crypto';
import { prisma } from '../lib/db';
import { verifyPendingUpiPayment } from '../lib/payment-verification';
import { getOrderReportRange, type OrderReportPeriod } from '../lib/order-report';
import {
  AdminProductInput,
  AdminCategoryInput,
  AdminBrandInput,
  AdminCouponInput,
  AdminBannerInput,
  AdminServiceInput,
  AdminServiceCategoryInput,
} from '../schemas/admin-commerce';

function slugBase(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

async function uniqueSlug(model: 'product' | 'service' | 'productCategory' | 'serviceCategory' | 'brand', value: string, exceptId?: string) {
  const base = slugBase(value);
  let slug = base;
  let index = 1;
  while (true) {
    const existing = model === 'product'
      ? await prisma.product.findUnique({ where: { slug }, select: { id: true } })
      : model === 'service'
        ? await prisma.service.findUnique({ where: { slug }, select: { id: true } })
        : model === 'productCategory'
          ? await prisma.productCategory.findUnique({ where: { slug }, select: { id: true } })
          : model === 'serviceCategory'
            ? await prisma.serviceCategory.findUnique({ where: { slug }, select: { id: true } })
            : await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === exceptId) return slug;
    index += 1;
    slug = `${base}-${index}`;
  }
}

async function getOrCreateBrand(name: string) {
  const normalized = name.trim();
  const existing = await prisma.brand.findUnique({ where: { name: normalized } });
  if (existing) return existing;
  return prisma.brand.create({
    data: { name: normalized, slug: await uniqueSlug('brand', normalized) },
  });
}

async function createProductSku() {
  for (;;) {
    const sku = `SE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
    if (!existing) return sku;
  }
}

function productImageCreate(imageUrls: string[]) {
  return imageUrls.map((url, sortOrder) => ({ url, sortOrder, altText: null }));
}

export async function getAdminOverview() {
  const now = new Date();
  const salesStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const activeSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [totalOrders, totalCustomers, activeCustomers, pendingBookings, lowStockProducts, revenue, recentOrders, statusGroups, monthlyPayments, recentBookings] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        OR: [
          { orders: { some: { createdAt: { gte: activeSince } } } },
          { bookings: { some: { createdAt: { gte: activeSince } } } },
        ],
      },
    }),
    prisma.serviceBooking.count({ where: { status: 'PENDING' } }),
    prisma.product.findMany({ where: { active: true }, select: { stockQuantity: true, lowStockThreshold: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { select: { id: true, productNameSnapshot: true, quantity: true, total: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: salesStart } },
      select: { createdAt: true, amount: true },
    }),
    prisma.serviceBooking.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true } },
        address: { select: { fullName: true, phone: true } },
      },
    }),
  ]);

  const orderStatusBreakdown = Object.fromEntries(
    ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => [
      status,
      statusGroups.find((group) => group.status === status)?._count._all || 0,
    ]),
  );
  const monthKeys = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return { key: `${month.getFullYear()}-${month.getMonth()}`, label: month.toLocaleString('en', { month: 'short' }) };
  });
  const monthlySales = monthKeys.map(({ key, label }) => ({
    month: label,
    revenue: monthlyPayments
      .filter((payment) => `${payment.createdAt.getFullYear()}-${payment.createdAt.getMonth()}` === key)
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
  }));

  return {
    metrics: {
      totalRevenue: Number(revenue._sum.amount || 0),
      totalOrders,
      totalCustomers,
      activeCustomers,
      pendingBookings,
      lowStockAlerts: lowStockProducts.filter((product) => product.stockQuantity <= product.lowStockThreshold).length,
    },
    monthlySales,
    recentOrders,
    recentBookings,
    orderStatusBreakdown,
  };
}

export async function getAdminProducts(search = '') {
  return prisma.product.findMany({
    where: search.trim() ? {
      OR: [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { sku: { contains: search.trim(), mode: 'insensitive' } },
        { brand: { contains: search.trim(), mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      category: { select: { id: true, name: true } },
      brandRecord: { select: { id: true, name: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createAdminProduct(input: AdminProductInput) {
  const [slug, brand, sku] = await Promise.all([
    uniqueSlug('product', input.name),
    getOrCreateBrand(input.brand),
    input.sku ? Promise.resolve(input.sku) : createProductSku(),
  ]);
  const { imageUrls, ...data } = input;
  return prisma.product.create({
    data: {
      ...data,
      slug,
      sku,
      brandId: brand.id,
      images: imageUrls.length ? { create: productImageCreate(imageUrls) } : undefined,
    },
    include: { category: true, brandRecord: true, images: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function updateAdminProduct(id: string, input: Partial<AdminProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) throw new Error('Product not found.');

  const { imageUrls, brand, ...fields } = input;
  const data: Record<string, unknown> = { ...fields };
  if (input.name && input.name !== existing.name) {
    data.slug = await uniqueSlug('product', input.name, id);
  }
  if (brand !== undefined) {
    const brandRecord = await getOrCreateBrand(brand);
    data.brand = brand;
    data.brandId = brandRecord.id;
  }

  return prisma.$transaction(async (transaction) => {
    if (imageUrls !== undefined) {
      await transaction.productImage.deleteMany({ where: { productId: id } });
      if (imageUrls.length) {
        await transaction.productImage.createMany({ data: productImageCreate(imageUrls).map((image) => ({ ...image, productId: id })) });
      }
    }
    return transaction.product.update({
      where: { id },
      data,
      include: { category: true, brandRecord: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
  });
}

export async function archiveAdminProduct(id: string) {
  const result = await prisma.product.updateMany({ where: { id }, data: { active: false } });
  if (!result.count) throw new Error('Product not found.');
  return { success: true };
}

export async function deleteAdminProduct(id: string, permanent = true) {
  if (!permanent) return archiveAdminProduct(id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error('Product not found.');
  return prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { productId: id } });
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.review.deleteMany({ where: { productId: id } });
    await tx.orderItem.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
    return { success: true };
  });
}

export async function getAdminServices(search = '') {
  return prisma.service.findMany({
    where: search.trim() ? {
      OR: [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { brandApplicability: { contains: search.trim(), mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createAdminService(input: AdminServiceInput) {
  return prisma.service.create({
    data: {
      ...input,
      slug: await uniqueSlug('service', input.name),
    },
    include: { category: true },
  });
}

export async function updateAdminService(id: string, input: Partial<AdminServiceInput>) {
  const existing = await prisma.service.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) throw new Error('Service not found.');

  const data: Record<string, unknown> = { ...input };
  if (input.name && input.name !== existing.name) {
    data.slug = await uniqueSlug('service', input.name, id);
  }

  return prisma.service.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function archiveAdminService(id: string) {
  const result = await prisma.service.updateMany({ where: { id }, data: { active: false } });
  if (!result.count) throw new Error('Service not found.');
  return { success: true };
}

export async function deleteAdminService(id: string, permanent = true) {
  if (!permanent) return archiveAdminService(id);
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new Error('Service not found.');
  return prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { serviceId: id } });
    await tx.serviceBooking.deleteMany({ where: { serviceId: id } });
    await tx.service.delete({ where: { id } });
    return { success: true };
  });
}

export async function getAdminCategories() {
  return prisma.productCategory.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  });
}

export async function createAdminCategory(input: AdminCategoryInput) {
  if (input.parentId && !(await prisma.productCategory.findUnique({ where: { id: input.parentId }, select: { id: true } }))) {
    throw new Error('Parent category not found.');
  }
  return prisma.productCategory.create({
    data: { ...input, slug: await uniqueSlug('productCategory', input.name), image: input.image || null },
  });
}

export async function updateAdminCategory(id: string, input: Partial<AdminCategoryInput>) {
  if (input.parentId === id) throw new Error('A category cannot be its own parent.');
  if (input.parentId && !(await prisma.productCategory.findUnique({ where: { id: input.parentId }, select: { id: true } }))) {
    throw new Error('Parent category not found.');
  }
  const data: Record<string, unknown> = { ...input, image: input.image || null };
  if (input.name) data.slug = await uniqueSlug('productCategory', input.name, id);
  return prisma.productCategory.update({ where: { id }, data });
}

export async function archiveAdminCategory(id: string) {
  const result = await prisma.productCategory.updateMany({ where: { id }, data: { active: false } });
  if (!result.count) throw new Error('Category not found.');
  return { success: true };
}

export async function deleteAdminCategory(id: string, permanent = true) {
  if (!permanent) return archiveAdminCategory(id);
  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) throw new Error('Category not found.');
  return prisma.$transaction(async (tx) => {
    await tx.productCategory.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await tx.product.updateMany({ where: { categoryId: id }, data: { active: false } });
    await tx.productCategory.delete({ where: { id } });
    return { success: true };
  });
}

export async function getAdminServiceCategories() {
  return prisma.serviceCategory.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createAdminServiceCategory(input: AdminServiceCategoryInput) {
  return prisma.serviceCategory.create({
    data: { ...input, slug: await uniqueSlug('serviceCategory', input.name) },
  });
}

export async function updateAdminServiceCategory(id: string, input: Partial<AdminServiceCategoryInput>) {
  const current = await prisma.serviceCategory.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!current) throw new Error('Service category not found.');
  return prisma.serviceCategory.update({
    where: { id },
    data: {
      ...input,
      ...(input.name && input.name !== current.name
        ? { slug: await uniqueSlug('serviceCategory', input.name, id) }
        : {}),
    },
  });
}

export async function archiveAdminServiceCategory(id: string) {
  const result = await prisma.serviceCategory.updateMany({ where: { id }, data: { active: false } });
  if (!result.count) throw new Error('Service category not found.');
  return { success: true };
}

export async function deleteAdminServiceCategory(id: string, permanent = true) {
  if (!permanent) return archiveAdminServiceCategory(id);
  const existing = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new Error('Service category not found.');
  return prisma.$transaction(async (tx) => {
    await tx.service.updateMany({ where: { categoryId: id }, data: { active: false } });
    await tx.serviceCategory.delete({ where: { id } });
    return { success: true };
  });
}

export async function getAdminBrands() {
  return prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createAdminBrand(input: AdminBrandInput) {
  return prisma.brand.create({ data: { ...input, slug: await uniqueSlug('brand', input.name) } });
}

export async function updateAdminBrand(id: string, input: Partial<AdminBrandInput>) {
  const current = await prisma.brand.findUnique({ where: { id } });
  if (!current) throw new Error('Brand not found.');
  const slug = input.name ? await uniqueSlug('brand', input.name, id) : current.slug;
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.brand.update({ where: { id }, data: { ...input, slug } });
    if (input.name) {
      await transaction.product.updateMany({ where: { brandId: id }, data: { brand: input.name } });
    }
    return updated;
  });
}

export async function archiveAdminBrand(id: string) {
  const result = await prisma.brand.updateMany({ where: { id }, data: { active: false } });
  if (!result.count) throw new Error('Brand not found.');
  return { success: true };
}

export async function deleteAdminBrand(id: string, permanent = true) {
  if (!permanent) return archiveAdminBrand(id);
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new Error('Brand not found.');
  return prisma.$transaction(async (tx) => {
    await tx.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
    await tx.brand.delete({ where: { id } });
    return { success: true };
  });
}

export async function getAdminCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createAdminCoupon(input: AdminCouponInput) {
  return prisma.coupon.create({ data: input });
}

export async function updateAdminCoupon(id: string, input: Partial<AdminCouponInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new Error('Coupon not found.');
  const discountType = input.discountType ?? existing.discountType;
  const discountValue = input.discountValue ?? Number(existing.discountValue);
  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new Error('Percentage discounts cannot exceed 100%.');
  }
  return prisma.coupon.update({ where: { id }, data: input });
}

export async function deleteAdminCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  return { success: true };
}

export async function getAdminBanners() {
  return prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
}

export async function createAdminBanner(input: AdminBannerInput) {
  return prisma.banner.create({ data: input });
}

export async function updateAdminBanner(id: string, input: Partial<AdminBannerInput>) {
  return prisma.banner.update({ where: { id }, data: input });
}

export async function deleteAdminBanner(id: string) {
  await prisma.banner.delete({ where: { id } });
  return { success: true };
}

export async function getPublicBanners() {
  return prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
}

export async function getPublicCoupons() {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      expiresAt: { gte: now },
    },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minimumOrderAmount: true,
      maximumDiscount: true,
      expiresAt: true,
      usageLimit: true,
      usedCount: true,
    },
    orderBy: { expiresAt: 'asc' },
  });
  return coupons
    .filter((coupon) =>
      (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
      (coupon.discountType !== 'PERCENTAGE' || Number(coupon.discountValue) <= 100)
    )
    .map(({ usageLimit: _usageLimit, usedCount: _usedCount, ...coupon }) => coupon);
}

export async function getAdminOrders(status = 'ALL', search = '') {
  return prisma.order.findMany({
    where: {
      ...(status !== 'ALL' ? { status: status as any } : {}),
      ...(search.trim() ? {
        OR: [
          { orderNumber: { contains: search.trim(), mode: 'insensitive' as const } },
          { user: { name: { contains: search.trim(), mode: 'insensitive' as const } } },
          { user: { email: { contains: search.trim(), mode: 'insensitive' as const } } },
        ],
      } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, currentLocation: true } },
      address: true,
      items: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdminOrderReport(period: OrderReportPeriod) {
  const { start, end } = getOrderReportRange(period);
  return prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateAdminOrder(id: string, input: { status: string; trackingCode?: string | null }) {
  return prisma.order.update({
    where: { id },
    data: { status: input.status as any, ...(input.trackingCode !== undefined ? { trackingCode: input.trackingCode } : {}) },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      address: true,
      items: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
}

export async function verifyAdminUpiPayment(orderId: string) {
  return prisma.$transaction(async (tx) => verifyPendingUpiPayment(orderId, {
    findLatestPayment: (id) => tx.payment.findFirst({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, provider: true, status: true },
    }),
    completePendingUpiPayment: async (id, paymentId) => {
      const result = await tx.payment.updateMany({
        where: { id: paymentId, orderId: id, provider: 'UPI_QR', status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });
      return result.count;
    },
    getOrder: (id) => tx.order.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  }));
}

export async function getAdminCustomersDetailed(search = '') {
  return prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      ...(search.trim() ? {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
          { phone: { contains: search.trim(), mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      currentLocation: true,
      _count: { select: { orders: true, bookings: true } },
      orders: {
        select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function uploadAdminImage(image: string) {
  if (image.startsWith('https://') || image.startsWith('/images/') || image.startsWith('/uploads/')) {
    return { url: image };
  }

  if (!/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
    throw new Error('Provide a valid HTTPS/local image URL or base64 image.');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    if (cloudName || apiKey || apiSecret) {
      throw new Error('Image uploads require all Cloudinary environment settings.');
    }
    return { url: image };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');
  const form = new FormData();
  form.set('file', image);
  form.set('api_key', apiKey);
  form.set('timestamp', timestamp);
  form.set('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Image provider rejected the upload.');
  const result = await response.json() as { secure_url?: string };
  if (!result.secure_url) throw new Error('Image provider returned no secure URL.');
  return { url: result.secure_url };
}

export async function deleteAdminOrder(id: string) {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new Error('Order not found.');
  return prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { orderId: id } });
    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.order.delete({ where: { id } });
    return { success: true };
  });
}

export async function deleteAdminCustomer(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Customer not found.');
  if (user.role === 'ADMIN') throw new Error('Cannot delete an administrator account.');
  return prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: id } });
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.customerLocation.deleteMany({ where: { userId: id } });

    const cart = await tx.cart.findUnique({ where: { userId: id } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    }

    await tx.review.deleteMany({ where: { userId: id } });
    await tx.serviceBooking.deleteMany({ where: { userId: id } });

    const orders = await tx.order.findMany({ where: { userId: id }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length > 0) {
      await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await tx.address.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
    return { success: true };
  });
}

export async function purgeAdminStorage(scope: string) {
  return prisma.$transaction(async (tx) => {
    let message = 'Storage cleared.';
    if (scope === 'bookings' || scope === 'all') {
      await tx.serviceBooking.deleteMany({});
      message = 'All service bookings deleted.';
    }
    if (scope === 'orders' || scope === 'all') {
      await tx.payment.deleteMany({});
      await tx.orderItem.deleteMany({});
      await tx.order.deleteMany({});
      message = 'All orders and payments deleted.';
    }
    if (scope === 'customers' || scope === 'all') {
      const customers = await tx.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true } });
      const customerIds = customers.map((c) => c.id);
      if (customerIds.length > 0) {
        await tx.passwordResetToken.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.notification.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.customerLocation.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.cartItem.deleteMany({ where: { cart: { userId: { in: customerIds } } } });
        await tx.cart.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.review.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.serviceBooking.deleteMany({ where: { userId: { in: customerIds } } });
        const orders = await tx.order.findMany({ where: { userId: { in: customerIds } }, select: { id: true } });
        const orderIds = orders.map((o) => o.id);
        if (orderIds.length > 0) {
          await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        await tx.address.deleteMany({ where: { userId: { in: customerIds } } });
        await tx.user.deleteMany({ where: { id: { in: customerIds } } });
      }
      message = 'All customer records deleted.';
    }
    if (scope === 'reviews' || scope === 'all') {
      await tx.review.deleteMany({});
    }
    if (scope === 'carts' || scope === 'all') {
      await tx.cartItem.deleteMany({});
      await tx.cart.deleteMany({});
    }
    if (scope === 'all') {
      message = 'Full storage reset completed. All demo bookings, orders, and customer data removed.';
    }
    return { success: true, message };
  });
}
