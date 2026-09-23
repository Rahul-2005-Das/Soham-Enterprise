import { prisma } from '../lib/db';
import { BookingStatus, Role } from '@prisma/client';

export interface AdminBookingFilters {
  status?: string;
  serviceId?: string;
  date?: string;
  search?: string;
  technicianId?: string;
}

/**
 * Fetch overview metrics and real data for the Admin Dashboard
 */
export async function getAdminDashboardStats() {
  const [
    totalCustomers,
    totalTechnicians,
    totalServices,
    totalProducts,
    pendingBookings,
    confirmedBookings,
    assignedBookings,
    onTheWayBookings,
    inProgressBookings,
    completedBookings,
    cancelledBookings,
    totalBookings,
    totalOrders,
    recentBookings,
    recentCustomers,
    recentOrders,
    completedRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.technician.count(),
    prisma.service.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.serviceBooking.count({ where: { status: 'PENDING' } }),
    prisma.serviceBooking.count({ where: { status: 'CONFIRMED' } }),
    prisma.serviceBooking.count({ where: { status: 'TECHNICIAN_ASSIGNED' } }),
    prisma.serviceBooking.count({ where: { status: 'ON_THE_WAY' } }),
    prisma.serviceBooking.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.serviceBooking.count({ where: { status: 'COMPLETED' } }),
    prisma.serviceBooking.count({ where: { status: 'CANCELLED' } }),
    prisma.serviceBooking.count(),
    prisma.order.count(),
    prisma.serviceBooking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true, slug: true } },
        address: true,
        technician: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { bookings: true, orders: true } },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.serviceBooking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: {
        finalAmount: true,
        estimatedAmount: true,
      },
    }),
  ]);

  const inProgressTotal = onTheWayBookings + inProgressBookings;
  const estimatedRevenue = Number(completedRevenue._sum.finalAmount || completedRevenue._sum.estimatedAmount || 0);

  return {
    metrics: {
      totalCustomers,
      totalTechnicians,
      totalServices,
      totalProducts,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      assignedBookings,
      inProgressBookings: inProgressTotal,
      completedBookings,
      cancelledBookings,
      totalOrders,
      estimatedRevenue,
    },
    recentBookings,
    recentCustomers,
    recentOrders,
  };
}

/**
 * Fetch all bookings with search, status, service, and technician filters
 */
export async function getAdminBookings(filters: AdminBookingFilters = {}) {
  const where: any = {};

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as BookingStatus;
  }

  if (filters.serviceId && filters.serviceId !== 'ALL') {
    where.serviceId = filters.serviceId;
  }

  if (filters.technicianId && filters.technicianId !== 'ALL') {
    where.technicianId = filters.technicianId;
  }

  if (filters.date) {
    const targetDate = new Date(filters.date);
    if (!isNaN(targetDate.getTime())) {
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.preferredDate = {
        gte: targetDate,
        lt: nextDay,
      };
    }
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { bookingNumber: { contains: term, mode: 'insensitive' } },
      { appliance: { contains: term, mode: 'insensitive' } },
      { user: { name: { contains: term, mode: 'insensitive' } } },
      { user: { phone: { contains: term, mode: 'insensitive' } } },
      { user: { email: { contains: term, mode: 'insensitive' } } },
      { address: { city: { contains: term, mode: 'insensitive' } } },
      { address: { addressLine1: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const bookings = await prisma.serviceBooking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: { select: { id: true, name: true, slug: true, inspectionFee: true } },
      address: true,
      technician: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  return bookings;
}

/**
 * Fetch a single booking by ID with full details
 */
export async function getAdminBookingById(id: string) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
      address: true,
      technician: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  return booking;
}

/**
 * Update booking status
 */
export async function updateAdminBookingStatus(id: string, status: BookingStatus) {
  const existing = await prisma.serviceBooking.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Booking not found.');
  }

  const data: any = { status };
  if (status === 'COMPLETED' && !existing.completedAt) {
    data.completedAt = new Date();
  }

  const updated = await prisma.serviceBooking.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
      address: true,
      technician: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  return updated;
}

/**
 * Assign or reassign a technician to a booking
 */
export async function assignTechnicianToBooking(id: string, technicianId: string | null) {
  const booking = await prisma.serviceBooking.findUnique({ where: { id } });
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (technicianId) {
    const tech = await prisma.technician.findUnique({
      where: { id: technicianId },
      include: { user: true },
    });
    if (!tech) {
      throw new Error('Selected technician does not exist.');
    }
    if (!tech.active) {
      throw new Error('Selected technician is currently inactive.');
    }

    const newStatus: BookingStatus =
      booking.status === 'PENDING' || booking.status === 'CONFIRMED'
        ? 'TECHNICIAN_ASSIGNED'
        : booking.status;

    return prisma.serviceBooking.update({
      where: { id },
      data: {
        technicianId,
        status: newStatus,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
        address: true,
        technician: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
  } else {
    // Unassign technician
    return prisma.serviceBooking.update({
      where: { id },
      data: {
        technicianId: null,
        status: booking.status === 'TECHNICIAN_ASSIGNED' ? 'CONFIRMED' : booking.status,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
        address: true,
        technician: true,
      },
    });
  }
}

/**
 * Update administrative notes or final amount on booking
 */
export async function updateAdminBookingNotes(
  id: string,
  input: { technicianNotes?: string; customerNotes?: string; finalAmount?: number | null }
) {
  const booking = await prisma.serviceBooking.findUnique({ where: { id } });
  if (!booking) {
    throw new Error('Booking not found.');
  }

  const data: any = {};
  if (input.technicianNotes !== undefined) data.technicianNotes = input.technicianNotes;
  if (input.customerNotes !== undefined) data.customerNotes = input.customerNotes;
  if (input.finalAmount !== undefined) data.finalAmount = input.finalAmount;

  return prisma.serviceBooking.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: true,
      address: true,
      technician: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
}

/**
 * Get all technicians with details and job workload
 */
export async function getAdminTechnicians() {
  const technicians = await prisma.technician.findMany({
    orderBy: { createdAt: 'desc' },
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
      _count: {
        select: {
          assignedBookings: {
            where: {
              status: {
                in: ['TECHNICIAN_ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'],
              },
            },
          },
        },
      },
    },
  });

  return technicians;
}

/**
 * Update technician active status, skills, or service areas
 */
export async function updateAdminTechnician(
  id: string,
  input: { active?: boolean; skills?: string[]; serviceAreas?: string[] }
) {
  const tech = await prisma.technician.findUnique({ where: { id } });
  if (!tech) {
    throw new Error('Technician not found.');
  }

  const data: any = {};
  if (input.active !== undefined) data.active = input.active;
  if (input.skills !== undefined) data.skills = input.skills;
  if (input.serviceAreas !== undefined) data.serviceAreas = input.serviceAreas;

  return prisma.technician.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * Fetch staff users (TECHNICIAN and ADMIN)
 */
export async function getAdminStaff(filters: { role?: string; search?: string } = {}) {
  const where: any = {
    role: { in: ['TECHNICIAN', 'ADMIN'] as Role[] },
  };

  if (filters.role && filters.role !== 'ALL') {
    where.role = filters.role as Role;
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { technicianProfile: { employeeCode: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const staff = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      technicianProfile: true,
    },
  });

  return staff;
}

/**
 * Fetch customers list
 */
export async function getAdminCustomers(filters: { search?: string } = {}) {
  const where: any = { role: 'CUSTOMER' as Role };

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          orders: true,
          addresses: true,
        },
      },
    },
  });
}
