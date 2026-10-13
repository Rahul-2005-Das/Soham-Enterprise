import { z } from 'zod';

export const bookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);



export const updateBookingStatusSchema = z.object({
  status: bookingStatusEnum,
});

export const updateBookingNotesSchema = z.object({
  technicianNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional(),
  finalAmount: z.number().nonnegative().optional().nullable(),
});



export const updateStaffUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  role: z.enum(['ADMIN']).optional(),
});
