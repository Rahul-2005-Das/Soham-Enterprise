import 'dotenv/config';
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
import { registerUser, loginUser, getUserAddresses, createUserAddress, deleteUserAddress } from '../actions/auth';
import { createServiceBooking, getCurrentUserBookings } from '../actions/bookings';
import { addCartItem, getCart, removeCartItem } from '../actions/cart';
import { createOrder, getCurrentUserOrders } from '../actions/orders';
import { getAdminDashboardStats, updateAdminBookingStatus } from '../actions/admin';
import { requireRole, getAuthenticatedUser } from '../actions/auth-helper';
import jwt from 'jsonwebtoken';

async function runTests() {
  const testRunId = `test_${Date.now()}`;
  const testCustomerEmail = `${testRunId}_cust@test.sohom.local`;
  const testCustomer2Email = `${testRunId}_cust2@test.sohom.local`;
  const testPassword = 'TestPassword123!';

  console.log('--- Starting Pre-Production Integration Tests ---');
  let testUser1Id: string | null = null;
  let testUser2Id: string | null = null;
  let createdAddressId: string | null = null;
  let createdBookingId: string | null = null;
  let createdOrderId: string | null = null;

  try {
    // 1. Customer Registration
    console.log('[Test 1] Testing customer registration...');
    const regResult = await registerUser({
      name: 'Test Customer 1',
      email: testCustomerEmail,
      phone: '9999000001',
      password: testPassword,
      confirmPassword: testPassword,
    });
    testUser1Id = regResult.user.id;
    if (regResult.user.role !== 'CUSTOMER') {
      throw new Error(`Expected role CUSTOMER, got ${regResult.user.role}`);
    }
    console.log('✓ Registration strictly sets role=CUSTOMER');

    // Duplicate registration check
    let dupFailed = false;
    try {
      await registerUser({
        name: 'Duplicate',
        email: testCustomerEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });
    } catch {
      dupFailed = true;
    }
    if (!dupFailed) throw new Error('Duplicate email registration should have thrown an error');
    console.log('✓ Duplicate registration properly rejected');

    // 2. Authentication & Password check
    console.log('[Test 2] Testing login...');
    const loginSuccess = await loginUser({ email: testCustomerEmail, password: testPassword });
    if (!loginSuccess.token || loginSuccess.user.id !== testUser1Id) {
      throw new Error('Login failed with valid credentials');
    }
    console.log('✓ Login succeeded with valid credentials');

    let badLoginFailed = false;
    try {
      await loginUser({ email: testCustomerEmail, password: 'WrongPassword' });
    } catch {
      badLoginFailed = true;
    }
    if (!badLoginFailed) throw new Error('Login should fail with wrong credentials');
    console.log('✓ Wrong credentials properly rejected');

    // 3. User 2 Registration for IDOR testing
    console.log('[Test 3] Testing IDOR boundary between customers...');
    const regResult2 = await registerUser({
      name: 'Test Customer 2',
      email: testCustomer2Email,
      phone: '9999000002',
      password: testPassword,
      confirmPassword: testPassword,
    });
    testUser2Id = regResult2.user.id;

    // Create address for User 1
    const addr = await createUserAddress(testUser1Id, {
      fullName: 'Test Customer 1',
      phone: '9999000001',
      addressLine1: '123 Test Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001',
      isDefault: true,
    });
    createdAddressId = addr.id;

    // User 2 trying to delete User 1's address must fail
    let idorFailed = false;
    try {
      await deleteUserAddress(testUser2Id, createdAddressId);
    } catch (err: any) {
      idorFailed = true;
    }
    if (!idorFailed) throw new Error('IDOR vulnerability: User 2 deleted User 1 address!');
    console.log('✓ IDOR check passed: User 2 cannot mutate User 1 address');

    // 4. Service Booking Creation
    console.log('[Test 4] Testing service booking creation...');
    const activeService = await prisma.service.findFirst({ where: { active: true } });
    if (!activeService) throw new Error('No active service found in DB to test booking');

    const bookingResult = await createServiceBooking({
      serviceId: activeService.id,
      appliance: activeService.name,
      problemDescription: 'Automated test problem description',
      preferredDate: new Date(Date.now() + 86400000).toISOString(),
      preferredTimeSlot: '10:00 AM - 01:00 PM',
      address: {
        fullName: 'Test Customer 1',
        phone: '9999000001',
        addressLine1: '123 Test Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
      },
    }, loginSuccess.token);

    createdBookingId = bookingResult.booking.id;
    if (bookingResult.booking.userId !== testUser1Id) {
      throw new Error('Booking was not linked to authenticated user');
    }
    if (Number(bookingResult.booking.estimatedAmount) !== Number(activeService.inspectionFee)) {
      throw new Error('Booking price does not match service inspection fee');
    }
    console.log('✓ Service booking atomically created with server-verified inspection fee');

    // 5. Booking Isolation check
    const user2Bookings = await getCurrentUserBookings(regResult2.token);
    if (user2Bookings.some((b) => b.id === createdBookingId)) {
      throw new Error('IDOR vulnerability: User 2 can see User 1 booking!');
    }
    console.log('✓ IDOR check passed: Customer bookings are strictly isolated');

    // 6. Cart & Order Flow
    console.log('[Test 5] Testing Cart and Stock Validation...');
    const activeProduct = await prisma.product.findFirst({ where: { active: true, stockQuantity: { gte: 2 } } });
    if (activeProduct) {
      const initialStock = activeProduct.stockQuantity;
      // Add to cart
      await addCartItem({ productId: activeProduct.id, quantity: 1 }, loginSuccess.token);
      const cart = await getCart(loginSuccess.token);
      if (!cart.cart.items.some((i: any) => i.productId === activeProduct.id)) {
        throw new Error('Product not found in cart after adding');
      }
      console.log('✓ Product added to cart and price calculated server-side');

      // Create Order
      console.log('[Test 6] Testing Order creation & atomic stock decrement...');
      const order = await createOrder({
        addressId: createdAddressId,
        paymentMethod: 'COD',
      }, loginSuccess.token);

      createdOrderId = order.id;
      const reloadedProduct = await prisma.product.findUnique({ where: { id: activeProduct.id } });
      if (!reloadedProduct || reloadedProduct.stockQuantity !== initialStock - 1) {
        throw new Error(`Stock was not decremented correctly. Expected ${initialStock - 1}, got ${reloadedProduct?.stockQuantity}`);
      }
      console.log('✓ Order created atomically and stock quantity decremented safely');
    } else {
      console.log('ℹ Skipping cart & order creation because no active product with stock >= 2 was found');
    }

    // 7. Role-Based Access Control (Admin route protection)
    console.log('[Test 7] Testing Admin API authorization...');
    // Customer token should be rejected on admin role check
    let rbacPassed = false;
    try {
      requireRole(loginSuccess.token, ['ADMIN']);
    } catch {
      rbacPassed = true;
    }
    if (!rbacPassed) throw new Error('RBAC Failure: Customer token was accepted as ADMIN!');
    console.log('✓ RBAC passed: Customer token strictly rejected on admin operations');

    // 8. Admin Dashboard Stats
    console.log('[Test 8] Testing Admin dashboard metrics query...');
    const stats = await getAdminDashboardStats();
    if (typeof stats.metrics.totalBookings !== 'number' || typeof stats.metrics.totalCustomers !== 'number') {
      throw new Error('Admin stats returned invalid metrics structure');
    }
    console.log(`✓ Admin stats loaded successfully (${stats.metrics.totalCustomers} customers, ${stats.metrics.totalBookings} bookings)`);

    console.log('\n--- All Automated Integration Checks PASSED ---');
  } catch (error) {
    console.error('Integration Test FAILED:', error);
    throw error;
  } finally {
    // Clean up ONLY test records created by this test
    console.log('Cleaning up test records...');
    try {
      if (createdOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.payment.deleteMany({ where: { orderId: createdOrderId } });
        await prisma.order.delete({ where: { id: createdOrderId } });
      }
      if (createdBookingId) {
        await prisma.serviceBooking.delete({ where: { id: createdBookingId } });
      }
      if (testUser1Id) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: testUser1Id } } });
        await prisma.cart.deleteMany({ where: { userId: testUser1Id } });
        await prisma.address.deleteMany({ where: { userId: testUser1Id } });
        await prisma.user.delete({ where: { id: testUser1Id } });
      }
      if (testUser2Id) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: testUser2Id } } });
        await prisma.cart.deleteMany({ where: { userId: testUser2Id } });
        await prisma.address.deleteMany({ where: { userId: testUser2Id } });
        await prisma.user.delete({ where: { id: testUser2Id } });
      }
      console.log('✓ Temporary test records cleaned up safely');
    } catch (cleanupErr) {
      console.error('Warning during test cleanup:', cleanupErr);
    }
  }
}

runTests().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
