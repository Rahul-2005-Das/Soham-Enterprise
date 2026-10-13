import { Request } from 'express';
import { mapApiError } from '../_errors.ts';
import {
  getAdminDashboardStats,
  getAdminBookings,
  getAdminBookingReport,
  getAdminBookingById,
  updateAdminBookingStatus,
  updateAdminBookingNotes,
  deleteAdminBooking,
  getAdminStaff,
  getAdminCustomers,
} from '../../../actions/admin.ts';
import {
  updateBookingStatusSchema,
  updateBookingNotesSchema,
} from '../../../schemas/admin.ts';
import { requireRole } from '../../../actions/auth-helper.ts';
import { ORDER_REPORT_PERIODS } from '../../../lib/order-report.ts';

// Helper to enforce admin role
function checkAdmin(req: Request) {
  return requireRole(req, ['ADMIN']);
}

export async function handleAdminDashboard(req: Request) {
  try {
    checkAdmin(req);
    const data = await getAdminDashboardStats();
    return { status: 200, body: { success: true, ...data } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Failed to load admin dashboard');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleAdminGetBookings(req: Request) {
  try {
    checkAdmin(req);
    const filters = {
      status: req.query.status as string | undefined,
      serviceId: req.query.serviceId as string | undefined,
      date: req.query.date as string | undefined,
      search: req.query.search as string | undefined,
    };
    const bookings = await getAdminBookings(filters);
    return { status: 200, body: { success: true, bookings } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Failed to fetch bookings');
    return { status: mapped.status, body: { success: false, error: mapped.error, bookings: [] } };
  }
}

export async function handleAdminBookingReport(req: Request) {
  try {
    checkAdmin(req);
    const period = String(req.query.period || '');
    if (!ORDER_REPORT_PERIODS.includes(period as typeof ORDER_REPORT_PERIODS[number])) {
      return { status: 400, body: { success: false, error: 'Choose a valid booking report period.' } };
    }
    const bookings = await getAdminBookingReport(period as typeof ORDER_REPORT_PERIODS[number]);
    return { status: 200, body: { success: true, period, bookings } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Could not generate booking report.');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleAdminGetBookingById(id: string, req: Request) {
  try {
    checkAdmin(req);
    const booking = await getAdminBookingById(id);
    return { status: 200, body: { success: true, booking } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Failed to fetch booking details');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleAdminUpdateBookingStatus(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = updateBookingStatusSchema.parse(body);
    const updated = await updateAdminBookingStatus(id, validated.status);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Invalid status value');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}



export async function handleAdminUpdateBookingNotes(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = updateBookingNotesSchema.parse(body);
    const updated = await updateAdminBookingNotes(id, validated);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Invalid notes input');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleAdminDeleteBooking(id: string, req: Request) {
  try {
    checkAdmin(req);
    const result = await deleteAdminBooking(id);
    return { status: 200, body: result };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Could not delete booking');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}



export async function handleAdminGetStaff(req: Request) {
  try {
    checkAdmin(req);
    const filters = {
      role: req.query.role as string | undefined,
      search: req.query.search as string | undefined,
    };
    const staff = await getAdminStaff(filters);
    return { status: 200, body: { success: true, staff } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Failed to fetch staff');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleAdminGetCustomers(req: Request) {
  try {
    checkAdmin(req);
    const filters = {
      search: req.query.search as string | undefined,
    };
    const customers = await getAdminCustomers(filters);
    return { status: 200, body: { success: true, customers } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Failed to fetch customers');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}
