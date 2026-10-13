// Must be first: loads .env into process.env BEFORE any module reads JWT_SECRET / DATABASE_URL.
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { handleGetServices } from './app/api/services/route.ts';
import { handleGetProducts } from './app/api/products/route.ts';
import { handleGetProductCategories } from './app/api/product-categories/route.ts';
import { handleCreateBooking, handleGetUserBookings } from './app/api/bookings/route.ts';
import { handleGetCart, handleAddToCart, handleUpdateCart, handleDeleteCartItem } from './app/api/cart/route.ts';
import { handleGetUserOrders, handleCreateOrder, handleCheckoutQuote } from './app/api/orders/route.ts';
import { handleGetCheckoutConfig } from './app/api/config/route.ts';
import { handleSaveCustomerLocation } from './app/api/customer/location/route.ts';
import { handleGetSiteSettings } from './app/api/site-settings/route.ts';
import { handleCreateContactInquiry } from './app/api/contact-inquiries/route.ts';
import { handleGetAdminContactInquiries, handleUpdateAdminContactInquiry } from './app/api/admin/contact-inquiries/route.ts';
import { handleDeleteAdminReview, handleGetAdminReviews, handleUpdateAdminReview } from './app/api/admin/reviews/route.ts';
import { handleGetPublicReviews, handleSubmitReview, handleGetReviewEligibility } from './app/api/reviews/route.ts';
import { handleUpdateSiteSettings } from './app/api/admin/settings/route.ts';
import {
  handleAdminLogin,
  handleAdminOverview,
  handleAdminProducts,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminUpdateProductVisibility,
  handleAdminDeleteProduct,
  handleAdminServices,
  handleAdminServiceCategories,
  handleAdminCreateServiceCategory,
  handleAdminUpdateServiceCategory,
  handleAdminDeleteServiceCategory,
  handleAdminCreateService,
  handleAdminUpdateService,
  handleAdminDeleteService,
  handleAdminCategories,
  handleAdminCreateCategory,
  handleAdminUpdateCategory,
  handleAdminDeleteCategory,
  handleAdminBrands,
  handleAdminCreateBrand,
  handleAdminUpdateBrand,
  handleAdminDeleteBrand,
  handleAdminCoupons,
  handleAdminCreateCoupon,
  handleAdminUpdateCoupon,
  handleAdminDeleteCoupon,
  handleAdminBanners,
  handleAdminCreateBanner,
  handleAdminUpdateBanner,
  handleAdminDeleteBanner,
  handleAdminOrders,
  handleAdminOrderReport,
  handleAdminUpdateOrder,
  handleAdminVerifyUpiPayment,
  handleAdminDeleteOrder,
  handleAdminCustomers,
  handleAdminDeleteCustomer,
  handleAdminPurgeStorage,
  handleAdminImageUpload,
  handlePublicBanners,
  handlePublicCoupons,
} from './app/api/admin/commerce.ts';
import {
  handleRegister,
  handleLogin,
  handleRequestLoginCode,
  handleVerifyLoginCode,
  handleMe,
  handleUpdateProfile,
  handleChangePassword,
  handleForgotPassword,
  handleVerifyResetCode,
  handleResetPassword,
  handleGetAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
  setAuthCookie,
  clearAuthCookie,
} from './app/api/auth/route.ts';
import {
  handleAdminDashboard,
  handleAdminGetBookings,
  handleAdminBookingReport,
  handleAdminGetBookingById,
  handleAdminUpdateBookingStatus,
  handleAdminUpdateBookingNotes,
  handleAdminDeleteBooking,
  handleAdminGetCustomers,
} from './app/api/admin/route.ts';
import { sseAdminMiddleware } from './app/api/admin/sse.ts';
import { renderSeoHtml, renderSitemap, getSiteOrigin } from './lib/seo.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Express 4 does not catch rejected promises from async handlers - an unexpected throw would become an
// unhandled rejection and terminate the whole Node process. Wrap every route handler so errors are
// forwarded to the error middleware (registered after the routes) instead.
for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
  const original = (app as any)[method].bind(app);
  (app as any)[method] = (path: any, ...handlers: any[]) => {
    if (handlers.length === 0) return original(path);
    return original(
      path,
      ...handlers.map((h) =>
        typeof h === 'function' && h.length < 4
          ? (req: Request, res: Response, next: (err?: any) => void) => Promise.resolve(h(req, res, next)).catch(next)
          : h
      )
    );
  };
}

app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

// Standard Security Headers
app.use((req: Request, res: Response, next: () => void) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use('/api', (_req: Request, res: Response, next: () => void) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Rate Limiter for Authentication Endpoints (In-Memory IP Limiting)
const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();
function authRateLimiter(req: Request, res: Response, next: () => void) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'ip-client';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window
  const maxAttempts = 20;

  const record = authRateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    authRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    res.status(429).json({ error: 'Too many authentication attempts. Please try again in 5 minutes.' });
    return;
  }

  record.count += 1;
  next();
}

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of authRateLimitMap.entries()) {
    if (now > val.resetTime) {
      authRateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// --- BACKEND API ROUTES ---

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Soham Enterprises Full-Stack API', timestamp: new Date().toISOString() });
});

const getPublicSiteSettings = async (_req: Request, res: Response) => {
  const result = await handleGetSiteSettings();
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/json').status(result.status).json(result.body);
};
app.get('/api/site-settings', getPublicSiteSettings);
app.get('/api/settings', getPublicSiteSettings);
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const sitemap = await renderSitemap(req);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').status(200).send(sitemap);
  } catch (error) {
    console.error('[SEO] Could not generate sitemap:', error);
    res.type('text/plain').status(500).send('Sitemap temporarily unavailable.');
  }
});
app.get('/robots.txt', (req: Request, res: Response) => {
  try {
    const origin = getSiteOrigin(req);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('text/plain').status(200).send([
      'User-agent: Googlebot',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api',
      '',
      'User-agent: Bingbot',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api',
      '',
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n'));
  } catch (error) {
    console.error('[SEO] Could not generate robots.txt:', error);
    res.type('text/plain').status(500).send('Robots file temporarily unavailable.');
  }
});
app.get('/api/reviews/eligibility', async (req: Request, res: Response) => {
  const result = await handleGetReviewEligibility(req);
  res.type('application/json').status(result.status).json(result.body);
});
app.get('/api/reviews', async (req: Request, res: Response) => {
  const result = await handleGetPublicReviews(req);
  res.type('application/json').status(result.status).json(result.body);
});
app.post('/api/reviews', async (req: Request, res: Response) => {
  const result = await handleSubmitReview(req.body, req);
  res.type('application/json').status(result.status).json(result.body);
});
app.get('/api/admin/reviews', async (req: Request, res: Response) => {
  const result = await handleGetAdminReviews(req);
  res.type('application/json').status(result.status).json(result.body);
});
app.patch('/api/admin/reviews/:id', async (req: Request, res: Response) => {
  const result = await handleUpdateAdminReview(req.params.id, req.body, req);
  res.type('application/json').status(result.status).json(result.body);
});
app.delete('/api/admin/reviews/:id', async (req: Request, res: Response) => {
  const result = await handleDeleteAdminReview(req.params.id, req);
  res.type('application/json').status(result.status).json(result.body);
});
const updateAdminSiteSettings = async (req: Request, res: Response) => {
  const result = await handleUpdateSiteSettings(req.body, req);
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/json').status(result.status).json(result.body);
};
app.put('/api/admin/settings', updateAdminSiteSettings);
app.post('/api/admin/settings', updateAdminSiteSettings);

// --- AUTHENTICATION & USER MANAGEMENT ROUTES (Phase 3) ---

// Register customer (strictly CUSTOMER role)
app.post('/api/auth/register', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleRegister(req.body);
  if (result.token) {
    setAuthCookie(res, result.token, 'customer_auth_token');
  }
  res.status(result.status).json(result.body);
});

// Login
app.post('/api/auth/login', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleLogin(req.body);
  if (result.token) {
    setAuthCookie(res, result.token, 'customer_auth_token');
  }
  res.status(result.status).json(result.body);
});

app.post('/api/auth/request-login-code', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleRequestLoginCode(req.body);
  res.status(result.status).json(result.body);
});

app.post('/api/auth/verify-login-code', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleVerifyLoginCode(req.body);
  if (result.token) {
    setAuthCookie(res, result.token, 'customer_auth_token');
  }
  res.status(result.status).json(result.body);
});

// Logout (clear HTTP-only cookie)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const isAdminLogout = req.body?.isAdmin === true || req.originalUrl?.includes('admin');
  clearAuthCookie(res, isAdminLogout ? 'admin_auth_token' : 'customer_auth_token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Current User Session (strictly server-derived)
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const result = await handleMe(req);
  res.status(result.status).json(result.body);
});

// Profile Update
app.put('/api/auth/profile', async (req: Request, res: Response) => {
  const result = await handleUpdateProfile(req.body, req);
  res.status(result.status).json(result.body);
});

// Change Password for Authenticated User
app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  const result = await handleChangePassword(req.body, req);
  res.status(result.status).json(result.body);
});

// Forgot Password (generates secure token)
app.post('/api/auth/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleForgotPassword(req.body);
  res.status(result.status).json(result.body);
});

// Verify password reset code sent by email
app.post('/api/auth/verify-reset-code', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleVerifyResetCode(req.body);
  res.status(result.status).json(result.body);
});

// Reset Password using verified email + OTP
app.post('/api/auth/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleResetPassword(req.body);
  res.status(result.status).json(result.body);
});

app.post('/api/customer/location', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleSaveCustomerLocation(req.body, req);
  res.status(result.status).json(result.body);
});



app.post('/api/admin/login', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleAdminLogin(req.body);
  if ('token' in result && result.token) setAuthCookie(res, result.token, 'admin_auth_token');
  res.status(result.status).json(result.body);
});

app.get('/api/admin/overview', async (req: Request, res: Response) => {
  const result = await handleAdminOverview(req);
  res.status(result.status).json(result.body);
});
app.get('/api/admin/products', async (req: Request, res: Response) => {
  const result = await handleAdminProducts(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/products', async (req: Request, res: Response) => {
  const result = await handleAdminCreateProduct(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/products/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateProduct(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.patch('/api/admin/products/:id/visibility', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateProductVisibility(req.params.id, req.body, req);
  res.type('application/json').status(result.status).json(result.body);
});
app.delete('/api/admin/products/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteProduct(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/services', async (req: Request, res: Response) => {
  const result = await handleAdminServices(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/services', async (req: Request, res: Response) => {
  const result = await handleAdminCreateService(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/services/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateService(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/services/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteService(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/service-categories', async (req: Request, res: Response) => {
  const result = await handleAdminServiceCategories(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/service-categories', async (req: Request, res: Response) => {
  const result = await handleAdminCreateServiceCategory(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/service-categories/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateServiceCategory(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/service-categories/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteServiceCategory(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/categories', async (req: Request, res: Response) => {
  const result = await handleAdminCategories(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/categories', async (req: Request, res: Response) => {
  const result = await handleAdminCreateCategory(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/categories/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateCategory(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/categories/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteCategory(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/brands', async (req: Request, res: Response) => {
  const result = await handleAdminBrands(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/brands', async (req: Request, res: Response) => {
  const result = await handleAdminCreateBrand(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/brands/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBrand(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/brands/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteBrand(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/coupons', async (req: Request, res: Response) => {
  const result = await handleAdminCoupons(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/coupons', async (req: Request, res: Response) => {
  const result = await handleAdminCreateCoupon(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateCoupon(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteCoupon(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/banners', async (req: Request, res: Response) => {
  const result = await handleAdminBanners(req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/banners', async (req: Request, res: Response) => {
  const result = await handleAdminCreateBanner(req.body, req);
  res.status(result.status).json(result.body);
});
app.put('/api/admin/banners/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBanner(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/banners/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteBanner(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/orders', async (req: Request, res: Response) => {
  const result = await handleAdminOrders(req);
  res.status(result.status).json(result.body);
});
app.get('/api/admin/order-reports', async (req: Request, res: Response) => {
  const result = await handleAdminOrderReport(req);
  res.status(result.status).json(result.body);
});
app.get('/api/admin/contact-inquiries', async (req: Request, res: Response) => {
  const result = await handleGetAdminContactInquiries(req);
  res.status(result.status).json(result.body);
});
app.patch('/api/admin/contact-inquiries/:id', async (req: Request, res: Response) => {
  const result = await handleUpdateAdminContactInquiry(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.patch('/api/admin/orders/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateOrder(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.post('/api/admin/orders/:id/verify-payment', async (req: Request, res: Response) => {
  const result = await handleAdminVerifyUpiPayment(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/orders/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteOrder(req.params.id, req);
  res.status(result.status).json(result.body);
});
app.get('/api/admin/customers', async (req: Request, res: Response) => {
  const result = await handleAdminCustomers(req);
  res.status(result.status).json(result.body);
});
app.delete('/api/admin/customers/:id', async (req: Request, res: Response) => {
  const result = await handleAdminDeleteCustomer(req.params.id, req);
  res.status(result.status).json(result.body);
});
const purgeStorageRoute = async (req: Request, res: Response) => {
  const result = await handleAdminPurgeStorage(req.body, req);
  res.status(result.status).json(result.body);
};
app.post('/api/admin/storage/purge', purgeStorageRoute);
app.post('/api/admin/storage/clear', purgeStorageRoute);
app.post('/api/admin/images', async (req: Request, res: Response) => {
  const result = await handleAdminImageUpload(req.body, req);
  res.status(result.status).json(result.body);
});

app.get('/api/banners', async (_req: Request, res: Response) => {
  const result = await handlePublicBanners();
  res.status(result.status).json(result.body);
});

app.get('/api/coupons', async (_req: Request, res: Response) => {
  const result = await handlePublicCoupons();
  res.status(result.status).json(result.body);
});

app.post('/api/contact-inquiries', async (req: Request, res: Response) => {
  const result = await handleCreateContactInquiry(req.body);
  res.status(result.status).json(result.body);
});

// Customer Saved Addresses API (Protected & Ownership Checked)
app.get('/api/addresses', async (req: Request, res: Response) => {
  const result = await handleGetAddresses(req);
  res.status(result.status).json(result.body);
});

app.post('/api/addresses', async (req: Request, res: Response) => {
  const result = await handleCreateAddress(req.body, req);
  res.status(result.status).json(result.body);
});

app.put('/api/addresses/:id', async (req: Request, res: Response) => {
  const result = await handleUpdateAddress(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.delete('/api/addresses/:id', async (req: Request, res: Response) => {
  const result = await handleDeleteAddress(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.put('/api/addresses/:id/default', async (req: Request, res: Response) => {
  const result = await handleSetDefaultAddress(req.params.id, req);
  res.status(result.status).json(result.body);
});

// --- CATALOG ROUTES (Phase 2) ---

// Services API
app.get('/api/services', async (req: Request, res: Response) => {
  const result = await handleGetServices(req.query);
  res.status(result.status).json(result.body);
});

app.get('/api/services/:slug', async (req: Request, res: Response) => {
  const result = await handleGetServices({ ...req.query, slug: req.params.slug });
  res.status(result.status).json(result.body);
});

// Products API
app.get('/api/products', async (req: Request, res: Response) => {
  const result = await handleGetProducts(req.query);
  res.status(result.status).json(result.body);
});

app.get('/api/products/:slug', async (req: Request, res: Response) => {
  const result = await handleGetProducts({ ...req.query, slug: req.params.slug });
  res.status(result.status).json(result.body);
});

// Product Categories API
app.get('/api/product-categories', async (req: Request, res: Response) => {
  const result = await handleGetProductCategories();
  res.status(result.status).json(result.body);
});

// Service Bookings API (Session or Guest)
const createBookingRoute = async (req: Request, res: Response) => {
  const result = await handleCreateBooking(req.body, req);
  res.type('application/json').status(result.status).json(result.body);
};

app.post('/api/bookings', createBookingRoute);
app.post('/api/service-bookings', createBookingRoute);

const getUserBookingsRoute = async (req: Request, res: Response) => {
  const result = await handleGetUserBookings(req);
  res.type('application/json').status(result.status).json(result.body);
};

app.get('/api/bookings', getUserBookingsRoute);
app.get('/api/service-bookings', getUserBookingsRoute);

// Cart API (Protected user-specific operations)
app.get('/api/cart', async (req: Request, res: Response) => {
  const result = await handleGetCart(req);
  res.status(result.status).json(result.body);
});

app.post('/api/cart', async (req: Request, res: Response) => {
  const result = await handleAddToCart(req.body, req);
  res.status(result.status).json(result.body);
});

app.put('/api/cart', async (req: Request, res: Response) => {
  const result = await handleUpdateCart(req.body, req);
  res.status(result.status).json(result.body);
});

app.delete('/api/cart', async (req: Request, res: Response) => {
  const result = await handleDeleteCartItem(req.body, req);
  res.status(result.status).json(result.body);
});

// Orders API (Protected)
app.get('/api/orders', async (req: Request, res: Response) => {
  const result = await handleGetUserOrders(req);
  res.status(result.status).json(result.body);
});

// Checkout (Protected) - creates a real order from the user's cart.
app.post('/api/checkout/quote', async (req: Request, res: Response) => {
  const result = await handleCheckoutQuote(req.body, req);
  res.type('application/json').status(result.status).json(result.body);
});
const createOrderRoute = async (req: Request, res: Response) => {
  const result = await handleCreateOrder(req.body, req);
  res.type('application/json').status(result.status).json(result.body);
};
app.post('/api/orders', createOrderRoute);
app.post('/api/checkout', createOrderRoute);

// Public checkout config (shipping rule + UPI details)
app.get('/api/config/checkout', async (req: Request, res: Response) => {
  const result = await handleGetCheckoutConfig();
  res.status(result.status).json(result.body);
});

// --- ADMIN DASHBOARD & BOOKING MANAGEMENT (Phase 4) ---
app.get('/api/admin/sse', sseAdminMiddleware);
app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
  const result = await handleAdminDashboard(req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/bookings', async (req: Request, res: Response) => {
  const result = await handleAdminGetBookings(req);
  res.type('application/json').status(result.status).json(result.body);
});

app.get('/api/admin/service-bookings', async (req: Request, res: Response) => {
  const result = await handleAdminGetBookings(req);
  res.type('application/json').status(result.status).json(result.body);
});

app.get('/api/admin/booking-reports', async (req: Request, res: Response) => {
  const result = await handleAdminBookingReport(req);
  res.type('application/json').status(result.status).json(result.body);
});

app.get('/api/admin/bookings/:id', async (req: Request, res: Response) => {
  const result = await handleAdminGetBookingById(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/bookings/:id/status', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBookingStatus(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/bookings/:id/notes', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBookingNotes(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

const deleteBookingRoute = async (req: Request, res: Response) => {
  const result = await handleAdminDeleteBooking(req.params.id, req);
  res.status(result.status).json(result.body);
};
app.delete('/api/admin/bookings/:id', deleteBookingRoute);
app.delete('/api/admin/service-bookings/:id', deleteBookingRoute);

const deleteCustomerRoute = async (req: Request, res: Response) => {
  const result = await handleAdminDeleteCustomer(req.params.id, req);
  res.status(result.status).json(result.body);
};
app.delete('/api/admin/customers/:id', deleteCustomerRoute);

app.use('/api', (req: Request, res: Response) => {
  res.type('application/json').status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Malformed JSON bodies and any error forwarded from a route handler end up here.
app.use('/api', (err: any, req: Request, res: Response, next: (e?: any) => void) => {
  if (res.headersSent) return next(err);
  res.type('application/json');
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, error: 'Malformed JSON request body.' });
    return;
  }
  console.error('[api] Unhandled error on', req.method, req.originalUrl, err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// --- VITE FRONTEND MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req: Request, res: Response, next: (error?: unknown) => void) => {
      if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) return next();
      try {
        const template = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const html = await renderSeoHtml(transformed, req);
        res.setHeader('Cache-Control', 'no-store');
        res.type('html').status(200).send(html);
      } catch (error) {
        console.error('[SEO] Could not render development page:', error);
        res.type('text/plain').status(500).send('Page temporarily unavailable.');
      }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(async (req: Request, res: Response, next: (error?: unknown) => void) => {
      if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) return next();
      try {
        const template = await readFile(path.join(distPath, 'index.html'), 'utf8');
        const html = await renderSeoHtml(template, req);
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.type('html').status(200).send(html);
      } catch (error) {
        console.error('[SEO] Could not render production page:', error);
        res.type('text/plain').status(500).send('Page temporarily unavailable.');
      }
    });
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Soham Enterprises] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
