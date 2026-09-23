import { createServiceBooking, getCurrentUserBookings } from '../../../actions/bookings.ts';

export async function handleCreateBooking(body: any, reqOrAuth?: any) {
  try {
    const result = await createServiceBooking(body, reqOrAuth);
    return { status: 201, body: result };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Invalid booking data' } };
  }
}

export async function handleGetUserBookings(reqOrAuth?: any) {
  try {
    const bookings = await getCurrentUserBookings(reqOrAuth);
    return { status: 200, body: bookings };
  } catch (error: any) {
    return { status: 401, body: { error: error.message || 'Unauthorized: Session required to access bookings' } };
  }
}

