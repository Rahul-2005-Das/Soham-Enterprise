import crypto from 'crypto';
import { prisma } from '../lib/db.ts';
import { createBookingSchema } from '../schemas/booking.ts';
import { requireAuthUser, getAuthenticatedUser } from './auth-helper.ts';

export interface CreateBookingPayload {
  serviceId: string;
  appliance: string;
  problemDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  customerNotes?: string;
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
}

/** Error carrying the HTTP status the API layer should answer with. */
export class BookingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'BookingError';
    this.status = status;
  }
}

function generateBookingNumber(): string {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `SE-BK-${new Date().getFullYear()}-${suffix}`;
}

/**
 * Create a service booking.
 *
 * The booking is ONLY reported as successful when it has actually been written to PostgreSQL.
 * There is deliberately no "simulated confirmation" fallback: a fabricated success would tell the
 * customer a technician is coming when no record exists (which is exactly what admin/customer
 * end-to-end testing caught - the customer saw "Booking Confirmed" for bookings that never reached
 * the database, so Admin Bookings never showed them).
 *
 * Identity is always derived server-side from the session cookie/header; a userId in the body is
 * never trusted.
 */
export async function createServiceBooking(input: CreateBookingPayload, reqOrToken?: any) {
  // 1. Validate input (ZodError -> 400 in the route layer)
  const validated = createBookingSchema.parse(input);

  // 2. Resolve the service (locks in the real inspection fee; unknown/inactive service is a hard error)
  const service = await prisma.service.findUnique({ where: { id: validated.serviceId } });
  if (!service || !service.active) {
    throw new BookingError('The selected service is not available. Please choose another service.', 404);
  }

  // 3. Identify the customer
  const session = getAuthenticatedUser(reqOrToken);

  let userId: string;
  if (session) {
    if (session.role !== 'CUSTOMER') {
      throw new BookingError('Only customer accounts can create service bookings.', 403);
    }
    const account = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
    if (!account) {
      throw new BookingError('Your session is no longer valid. Please sign in again.', 401);
    }
    userId = account.id;
  } else {
    // Guest booking: match/create a guest record by phone number.
    // A phone number that already belongs to a registered account (customer or staff) must NOT be
    // claimable by an anonymous visitor - that would attach the booking (and its address) to
    // somebody else's account.
    const existingUser = await prisma.user.findUnique({ where: { phone: validated.address.phone } });
    if (existingUser) {
      if (existingUser.passwordHash || existingUser.role !== 'CUSTOMER') {
        throw new BookingError(
          'An account already exists for this phone number. Please sign in to book a service.',
          409
        );
      }
      userId = existingUser.id;
    } else {
      const guest = await prisma.user.create({
        data: {
          name: validated.address.fullName,
          email: `guest_${crypto.randomBytes(8).toString('hex')}@sohamenterprises.local`,
          phone: validated.address.phone,
          role: 'CUSTOMER', // Hardcoded CUSTOMER role; prevents role elevation
        },
      });
      userId = guest.id;
    }
  }

  // 4. Address + booking are written atomically (retrying if the generated booking number collides)
  for (let attempt = 0; attempt < 3; attempt++) {
    const bookingNumber = generateBookingNumber();
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const addr = validated.address;
        const existingAddress = await tx.address.findFirst({
          where: {
            userId,
            fullName: addr.fullName,
            phone: addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || null,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            landmark: addr.landmark || null,
          },
        });
        const address =
          existingAddress ??
          (await tx.address.create({
            data: {
              userId,
              fullName: addr.fullName,
              phone: addr.phone,
              addressLine1: addr.addressLine1,
              addressLine2: addr.addressLine2 || null,
              city: addr.city,
              state: addr.state,
              pincode: addr.pincode,
              landmark: addr.landmark || null,
              isDefault: (await tx.address.count({ where: { userId } })) === 0,
            },
          }));

        return tx.serviceBooking.create({
          data: {
            bookingNumber,
            userId,
            serviceId: service.id,
            addressId: address.id,
            appliance: validated.appliance,
            problemDescription: validated.problemDescription,
            preferredDate: new Date(validated.preferredDate),
            preferredTimeSlot: validated.preferredTimeSlot,
            status: 'PENDING', // Server-enforced status
            estimatedAmount: service.inspectionFee,
            customerNotes: validated.customerNotes || null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                currentLocation: true,
              },
            },
            service: true,
            address: true,
          },
        });
      });

      return { success: true, bookingNumber: booking.bookingNumber, booking };
    } catch (error: any) {
      const isBookingNumberCollision =
        error?.code === 'P2002' && JSON.stringify(error?.meta ?? {}).includes('bookingNumber');
      if (isBookingNumberCollision && attempt < 2) continue;
      throw error;
    }
  }
  throw new BookingError('Could not allocate a booking number. Please try again.', 500);
}

/**
 * Get current user's bookings (Strictly Protected).
 * A database failure is a real 500 to the caller, never a silently-empty list -
 * an empty list must always mean "you genuinely have no bookings".
 */
export async function getCurrentUserBookings(reqOrToken?: any) {
  const auth = requireAuthUser(reqOrToken);

  const bookings = await prisma.serviceBooking.findMany({
    where: { userId: auth.userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      service: true,
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return bookings;
}
