import { prisma } from '../lib/db';
import { BookingStatus } from '@prisma/client';

/**
 * Resolves the authenticated technician profile.
 * Throws 403 if the user is not a registered, active technician.
 */
export async function getTechnicianProfile(userId: string) {
  const tech = await prisma.technician.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (!tech) {
    throw new Error('Forbidden: No technician profile found for this user.');
  }

  if (!tech.active) {
    throw new Error('Forbidden: Technician account is currently inactive. Contact Admin.');
  }

  return tech;
}

/**
 * Technician Dashboard Stats:
 * Scoped strictly to the authenticated technician's workload
 */
export async function getTechnicianDashboardStats(userId: string) {
  const tech = await getTechnicianProfile(userId);

  // Define date window for "today"
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalAssigned,
    todayAssigned,
    pendingJobs,
    onTheWayJobs,
    inProgressJobs,
    completedJobs,
    cancelledJobs,
    todayBookings,
    upcomingBookings,
    recentCompleted,
  ] = await Promise.all([
    prisma.serviceBooking.count({ where: { technicianId: tech.id } }),
    prisma.serviceBooking.count({
      where: {
        technicianId: tech.id,
        preferredDate: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.serviceBooking.count({
      where: { technicianId: tech.id, status: 'TECHNICIAN_ASSIGNED' },
    }),
    prisma.serviceBooking.count({
      where: { technicianId: tech.id, status: 'ON_THE_WAY' },
    }),
    prisma.serviceBooking.count({
      where: { technicianId: tech.id, status: 'IN_PROGRESS' },
    }),
    prisma.serviceBooking.count({
      where: { technicianId: tech.id, status: 'COMPLETED' },
    }),
    prisma.serviceBooking.count({
      where: { technicianId: tech.id, status: 'CANCELLED' },
    }),
    // Today's jobs
    prisma.serviceBooking.findMany({
      where: {
        technicianId: tech.id,
        preferredDate: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { preferredTimeSlot: 'asc' },
      include: {
        service: true,
        address: true,
        user: { select: { name: true, phone: true } },
      },
    }),
    // Upcoming future jobs
    prisma.serviceBooking.findMany({
      where: {
        technicianId: tech.id,
        preferredDate: { gt: endOfToday },
        status: { in: ['TECHNICIAN_ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'] },
      },
      take: 6,
      orderBy: { preferredDate: 'asc' },
      include: {
        service: true,
        address: true,
        user: { select: { name: true, phone: true } },
      },
    }),
    // Recently completed
    prisma.serviceBooking.findMany({
      where: { technicianId: tech.id, status: 'COMPLETED' },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        service: true,
        address: true,
        user: { select: { name: true, phone: true } },
      },
    }),
  ]);

  return {
    technician: {
      id: tech.id,
      employeeCode: tech.employeeCode,
      name: tech.user.name,
      phone: tech.user.phone,
      skills: tech.skills,
      serviceAreas: tech.serviceAreas,
    },
    metrics: {
      totalAssigned,
      todayAssigned,
      pendingJobs,
      inProgressJobs: onTheWayJobs + inProgressJobs,
      completedJobs,
      cancelledJobs,
    },
    todayJobs: todayBookings,
    upcomingJobs: upcomingBookings,
    recentCompleted,
  };
}

/**
 * Fetch bookings assigned strictly to this technician
 */
export async function getTechnicianBookings(
  userId: string,
  filters: { status?: string; search?: string } = {}
) {
  const tech = await getTechnicianProfile(userId);

  const where: any = {
    technicianId: tech.id, // Strictly enforce technician scope
  };

  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'ACTIVE') {
      where.status = { in: ['TECHNICIAN_ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'] };
    } else {
      where.status = filters.status as BookingStatus;
    }
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { bookingNumber: { contains: term, mode: 'insensitive' } },
      { appliance: { contains: term, mode: 'insensitive' } },
      { user: { name: { contains: term, mode: 'insensitive' } } },
      { address: { city: { contains: term, mode: 'insensitive' } } },
      { address: { pincode: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const bookings = await prisma.serviceBooking.findMany({
    where,
    orderBy: { preferredDate: 'asc' },
    include: {
      service: true,
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return bookings;
}

/**
 * Fetch a single booking by ID with technician authorization check
 * Prevents IDOR: technician cannot view another technician's private job
 */
export async function getTechnicianBookingById(userId: string, bookingId: string) {
  const tech = await getTechnicianProfile(userId);

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Authorization enforcement: must be assigned to THIS technician
  if (booking.technicianId !== tech.id) {
    throw new Error('Forbidden: You are not authorized to access this job booking.');
  }

  return booking;
}

/**
 * Update job status (ON_THE_WAY, IN_PROGRESS, COMPLETED, CANCELLED)
 * Scoped strictly to authenticated technician
 */
export async function updateTechnicianJobStatus(
  userId: string,
  bookingId: string,
  status: 'ON_THE_WAY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) {
  const tech = await getTechnicianProfile(userId);

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.technicianId !== tech.id) {
    throw new Error('Forbidden: You are not authorized to update this job booking.');
  }

  const data: any = { status };
  if (status === 'COMPLETED' && !booking.completedAt) {
    data.completedAt = new Date();
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data,
    include: {
      service: true,
      address: true,
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  return updated;
}

/**
 * Add technician field notes or final bill amount
 * Scoped strictly to authenticated technician
 */
export async function updateTechnicianJobNotes(
  userId: string,
  bookingId: string,
  input: { technicianNotes: string; finalAmount?: number | null }
) {
  const tech = await getTechnicianProfile(userId);

  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.technicianId !== tech.id) {
    throw new Error('Forbidden: You are not authorized to update this job booking.');
  }

  const data: any = {
    technicianNotes: input.technicianNotes,
  };

  if (input.finalAmount !== undefined) {
    data.finalAmount = input.finalAmount;
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data,
    include: {
      service: true,
      address: true,
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  return updated;
}
