import { Request } from 'express';
import {
  getAdminDashboardStats,
  getAdminBookings,
  getAdminBookingById,
  updateAdminBookingStatus,
  assignTechnicianToBooking,
  updateAdminBookingNotes,
  getAdminTechnicians,
  updateAdminTechnician,
  getAdminStaff,
  getAdminCustomers,
} from '../../../actions/admin.ts';
import {
  assignTechnicianSchema,
  updateBookingStatusSchema,
  updateBookingNotesSchema,
  updateTechnicianSchema,
} from '../../../schemas/admin.ts';
import { requireRole } from '../../../actions/auth-helper.ts';

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
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to load admin dashboard' },
    };
  }
}

export async function handleAdminGetBookings(req: Request) {
  try {
    checkAdmin(req);
    const filters = {
      status: req.query.status as string | undefined,
      serviceId: req.query.serviceId as string | undefined,
      technicianId: req.query.technicianId as string | undefined,
      date: req.query.date as string | undefined,
      search: req.query.search as string | undefined,
    };
    const bookings = await getAdminBookings(filters);
    return { status: 200, body: { success: true, bookings } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to fetch bookings' },
    };
  }
}

export async function handleAdminGetBookingById(id: string, req: Request) {
  try {
    checkAdmin(req);
    const booking = await getAdminBookingById(id);
    return { status: 200, body: { success: true, booking } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isNotFound = error.message?.includes('not found');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : isNotFound ? 404 : 500,
      body: { success: false, error: error.message || 'Failed to fetch booking details' },
    };
  }
}

export async function handleAdminUpdateBookingStatus(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = updateBookingStatusSchema.parse(body);
    const updated = await updateAdminBookingStatus(id, validated.status);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isZod = error.errors && Array.isArray(error.errors);
    return {
      status: isZod ? 400 : error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: {
        success: false,
        error: isZod ? error.errors[0]?.message || 'Invalid status value' : error.message,
      },
    };
  }
}

export async function handleAdminAssignTechnician(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = assignTechnicianSchema.parse(body);
    const updated = await assignTechnicianToBooking(id, validated.technicianId ?? null);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isZod = error.errors && Array.isArray(error.errors);
    return {
      status: isZod ? 400 : error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: {
        success: false,
        error: isZod ? error.errors[0]?.message || 'Invalid assignment input' : error.message,
      },
    };
  }
}

export async function handleAdminUpdateBookingNotes(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = updateBookingNotesSchema.parse(body);
    const updated = await updateAdminBookingNotes(id, validated);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isZod = error.errors && Array.isArray(error.errors);
    return {
      status: isZod ? 400 : error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: {
        success: false,
        error: isZod ? error.errors[0]?.message || 'Invalid notes input' : error.message,
      },
    };
  }
}

export async function handleAdminGetTechnicians(req: Request) {
  try {
    checkAdmin(req);
    const technicians = await getAdminTechnicians();
    return { status: 200, body: { success: true, technicians } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to fetch technicians' },
    };
  }
}

export async function handleAdminUpdateTechnician(id: string, body: any, req: Request) {
  try {
    checkAdmin(req);
    const validated = updateTechnicianSchema.parse(body);
    const updated = await updateAdminTechnician(id, validated);
    return { status: 200, body: { success: true, technician: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to update technician' },
    };
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
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to fetch staff' },
    };
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
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to fetch customers' },
    };
  }
}
