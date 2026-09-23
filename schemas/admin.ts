import { z } from 'zod';

export const bookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'TECHNICIAN_ASSIGNED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const assignTechnicianSchema = z.object({
  technicianId: z.string().nullable().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusEnum,
});

export const updateBookingNotesSchema = z.object({
  technicianNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional(),
  finalAmount: z.number().nonnegative().optional().nullable(),
});

export const updateTechnicianSchema = z.object({
  active: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
});

export const updateStaffUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  role: z.enum(['TECHNICIAN', 'ADMIN']).optional(),
});
