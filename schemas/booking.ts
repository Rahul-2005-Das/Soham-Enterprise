import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  appliance: z.string().min(2, 'Appliance name is required').max(100),
  problemDescription: z.string().min(5, 'Please describe the problem in at least 5 characters').max(1000),
  preferredDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date string is required (YYYY-MM-DD)',
  }),
  preferredTimeSlot: z.string().min(2, 'Preferred time slot is required'),
  customerNotes: z.string().max(500).optional(),
  // Address details for booking
  address: z.object({
    fullName: z.string().min(2, 'Full name is required').max(100),
    phone: z.string().min(10, 'Valid 10-digit phone number is required').max(15),
    addressLine1: z.string().min(5, 'Street address is required').max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2, 'City is required').max(50),
    state: z.string().min(2, 'State is required').max(50),
    pincode: z.string().min(6, '6-digit pincode is required').max(10),
    landmark: z.string().max(100).optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'ON_THE_WAY',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]),
  customerNotes: z.string().optional(),
  finalAmount: z.number().nonnegative().optional(),
});
