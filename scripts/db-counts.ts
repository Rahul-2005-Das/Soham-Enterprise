import 'dotenv/config';
import { prisma } from '../lib/db';

async function main() {
  const [
    userCount,
    adminCount,
    customerCount,
    serviceCount,
    productCount,
    bookingCount,
    orderCount,
    reviewCount,
    addressCount,
    couponCount,
    bannerCount,
    settingCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.service.count(),
    prisma.product.count(),
    prisma.serviceBooking.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.address.count(),
    prisma.coupon.count(),
    prisma.banner.count(),
    prisma.siteSettings.count(),
  ]);

  console.log(JSON.stringify({
    userCount,
    adminCount,
    customerCount,
    serviceCount,
    productCount,
    bookingCount,
    orderCount,
    reviewCount,
    addressCount,
    couponCount,
    bannerCount,
    settingCount,
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
