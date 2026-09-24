import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { handleGetServices } from './app/api/services/route.ts';
import { handleGetProducts } from './app/api/products/route.ts';
import { handleGetProductCategories } from './app/api/product-categories/route.ts';
import { handleCreateBooking, handleGetUserBookings } from './app/api/bookings/route.ts';
import { handleGetCart, handleAddToCart, handleUpdateCart, handleDeleteCartItem } from './app/api/cart/route.ts';
import { handleGetUserOrders, handleCreateOrder } from './app/api/orders/route.ts';
import { handleGetCheckoutConfig } from './app/api/config/route.ts';
import {
  handleRegister,
  handleLogin,
  handleMe,
  handleUpdateProfile,
  handleChangePassword,
  handleForgotPassword,
  handleResetPassword,
  handleAdminCreateStaff,
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
  handleAdminGetBookingById,
  handleAdminUpdateBookingStatus,
  handleAdminAssignTechnician,
  handleAdminUpdateBookingNotes,
  handleAdminGetTechnicians,
  handleAdminUpdateTechnician,
  handleAdminGetStaff,
  handleAdminGetCustomers,
} from './app/api/admin/route.ts';
import {
  handleTechnicianDashboard,
  handleTechnicianGetBookings,
  handleTechnicianGetBookingById,
  handleTechnicianUpdateJobStatus,
  handleTechnicianUpdateJobNotes,
} from './app/api/technician/route.ts';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

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
  res.json({ status: 'ok', service: 'Sohom Enterprises Full-Stack API', timestamp: new Date().toISOString() });
});

// --- AUTHENTICATION & USER MANAGEMENT ROUTES (Phase 3) ---

// Register customer (strictly CUSTOMER role)
app.post('/api/auth/register', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleRegister(req.body);
  if (result.token) {
    setAuthCookie(res, result.token);
  }
  res.status(result.status).json(result.body);
});

// Login
app.post('/api/auth/login', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleLogin(req.body);
  if (result.token) {
    setAuthCookie(res, result.token);
  }
  res.status(result.status).json(result.body);
});

// Logout (clear HTTP-only cookie)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  clearAuthCookie(res);
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

// Reset Password with Token
app.post('/api/auth/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  const result = await handleResetPassword(req.body);
  res.status(result.status).json(result.body);
});

// Admin-only Staff Account Creation (TECHNICIAN / ADMIN)
app.post('/api/auth/admin/users', async (req: Request, res: Response) => {
  const result = await handleAdminCreateStaff(req.body, req);
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
app.post('/api/bookings', async (req: Request, res: Response) => {
  const result = await handleCreateBooking(req.body, req);
  res.status(result.status).json(result.body);
});

app.get('/api/bookings', async (req: Request, res: Response) => {
  const result = await handleGetUserBookings(req);
  res.status(result.status).json(result.body);
});

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

// Checkout (Protected) - creates a real order from the user's cart
app.post('/api/orders', async (req: Request, res: Response) => {
  const result = await handleCreateOrder(req.body, req);
  res.status(result.status).json(result.body);
});

// Public checkout config (shipping rule + UPI details)
app.get('/api/config/checkout', async (req: Request, res: Response) => {
  const result = await handleGetCheckoutConfig();
  res.status(result.status).json(result.body);
});

// --- ADMIN DASHBOARD & BOOKING MANAGEMENT (Phase 4) ---
app.get('/api/admin/dashboard', async (req: Request, res: Response) => {
  const result = await handleAdminDashboard(req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/bookings', async (req: Request, res: Response) => {
  const result = await handleAdminGetBookings(req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/bookings/:id', async (req: Request, res: Response) => {
  const result = await handleAdminGetBookingById(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/bookings/:id/status', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBookingStatus(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/bookings/:id/assign-technician', async (req: Request, res: Response) => {
  const result = await handleAdminAssignTechnician(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/bookings/:id/notes', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateBookingNotes(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/technicians', async (req: Request, res: Response) => {
  const result = await handleAdminGetTechnicians(req);
  res.status(result.status).json(result.body);
});

app.patch('/api/admin/technicians/:id', async (req: Request, res: Response) => {
  const result = await handleAdminUpdateTechnician(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/staff', async (req: Request, res: Response) => {
  const result = await handleAdminGetStaff(req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/users', async (req: Request, res: Response) => {
  const result = await handleAdminGetStaff(req);
  res.status(result.status).json(result.body);
});

app.get('/api/admin/customers', async (req: Request, res: Response) => {
  const result = await handleAdminGetCustomers(req);
  res.status(result.status).json(result.body);
});

// --- TECHNICIAN DASHBOARD & JOB MANAGEMENT (Phase 4) ---
app.get('/api/technician/dashboard', async (req: Request, res: Response) => {
  const result = await handleTechnicianDashboard(req);
  res.status(result.status).json(result.body);
});

app.get('/api/technician/bookings', async (req: Request, res: Response) => {
  const result = await handleTechnicianGetBookings(req);
  res.status(result.status).json(result.body);
});

app.get('/api/technician/bookings/:id', async (req: Request, res: Response) => {
  const result = await handleTechnicianGetBookingById(req.params.id, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/technician/bookings/:id/status', async (req: Request, res: Response) => {
  const result = await handleTechnicianUpdateJobStatus(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

app.patch('/api/technician/bookings/:id/notes', async (req: Request, res: Response) => {
  const result = await handleTechnicianUpdateJobNotes(req.params.id, req.body, req);
  res.status(result.status).json(result.body);
});

// --- VITE FRONTEND MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sohom Enterprises] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
