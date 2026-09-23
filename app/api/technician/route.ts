import { Request } from 'express';
import {
  getTechnicianDashboardStats,
  getTechnicianBookings,
  getTechnicianBookingById,
  updateTechnicianJobStatus,
  updateTechnicianJobNotes,
} from '../../../actions/technician.ts';
import {
  updateTechnicianJobStatusSchema,
  updateTechnicianJobNotesSchema,
} from '../../../schemas/technician.ts';
import { requireRole } from '../../../actions/auth-helper.ts';

// Helper to enforce technician role
function checkTechnician(req: Request) {
  return requireRole(req, ['TECHNICIAN']);
}

export async function handleTechnicianDashboard(req: Request) {
  try {
    const auth = checkTechnician(req);
    const data = await getTechnicianDashboardStats(auth.userId);
    return { status: 200, body: { success: true, ...data } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to load technician dashboard' },
    };
  }
}

export async function handleTechnicianGetBookings(req: Request) {
  try {
    const auth = checkTechnician(req);
    const filters = {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const bookings = await getTechnicianBookings(auth.userId, filters);
    return { status: 200, body: { success: true, bookings } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: { success: false, error: error.message || 'Failed to fetch assigned jobs' },
    };
  }
}

export async function handleTechnicianGetBookingById(id: string, req: Request) {
  try {
    const auth = checkTechnician(req);
    const booking = await getTechnicianBookingById(auth.userId, id);
    return { status: 200, body: { success: true, booking } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isNotFound = error.message?.includes('not found');
    return {
      status: error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : isNotFound ? 404 : 500,
      body: { success: false, error: error.message || 'Failed to fetch job details' },
    };
  }
}

export async function handleTechnicianUpdateJobStatus(id: string, body: any, req: Request) {
  try {
    const auth = checkTechnician(req);
    const validated = updateTechnicianJobStatusSchema.parse(body);
    const updated = await updateTechnicianJobStatus(auth.userId, id, validated.status);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isZod = error.errors && Array.isArray(error.errors);
    return {
      status: isZod ? 400 : error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: {
        success: false,
        error: isZod ? error.errors[0]?.message || 'Invalid status transition' : error.message,
      },
    };
  }
}

export async function handleTechnicianUpdateJobNotes(id: string, body: any, req: Request) {
  try {
    const auth = checkTechnician(req);
    const validated = updateTechnicianJobNotesSchema.parse(body);
    const updated = await updateTechnicianJobNotes(auth.userId, id, validated);
    return { status: 200, body: { success: true, booking: updated } };
  } catch (error: any) {
    const isAuth = error.message?.includes('Unauthorized') || error.message?.includes('Forbidden');
    const isZod = error.errors && Array.isArray(error.errors);
    return {
      status: isZod ? 400 : error.message?.includes('Forbidden') ? 403 : isAuth ? 401 : 500,
      body: {
        success: false,
        error: isZod ? error.errors[0]?.message || 'Invalid job notes' : error.message,
      },
    };
  }
}
