import { broadcastAdminEvent } from '../admin/sse.ts';
import { createServiceBooking, getCurrentUserBookings, BookingError } from '../../../actions/bookings.ts';
import { isZodError, zodMessage } from '../_errors.ts';

export async function handleCreateBooking(body: any, reqOrAuth?: any) {
  try {
    const result = await createServiceBooking(body, reqOrAuth);
    broadcastAdminEvent('NEW_BOOKING', result.booking);
    return {
      status: 201,
      body: { success: true, bookingId: result.booking.id, bookingNumber: result.bookingNumber },
    };
  } catch (error: any) {
    if (isZodError(error)) {
      return { status: 400, body: { success: false, error: zodMessage(error, 'Invalid booking data') } };
    }
    if (error instanceof BookingError) {
      return { status: error.status, body: { success: false, error: error.message } };
    }
    console.error('[api/service-bookings] Booking creation failed:', error);
    return {
      status: 500,
      body: { success: false, error: 'We could not save your booking right now. Please try again in a moment.' },
    };
  }
}

export async function handleGetUserBookings(reqOrAuth?: any) {
  try {
    const bookings = await getCurrentUserBookings(reqOrAuth);
    return { status: 200, body: { success: true, bookings } };
  } catch (error: any) {
    if (String(error?.message).startsWith('Unauthorized')) {
      return { status: 401, body: { success: false, error: error.message, bookings: [] } };
    }
    console.error('[api/bookings] Failed to load bookings:', error);
    return { status: 500, body: { success: false, error: 'Could not load your bookings right now.', bookings: [] } };
  }
}
