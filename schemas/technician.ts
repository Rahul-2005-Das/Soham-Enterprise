import { z } from 'zod';

export const technicianAllowedStatusEnum = z.enum([
  'ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const updateTechnicianJobStatusSchema = z.object({
  status: technicianAllowedStatusEnum,
});

export const updateTechnicianJobNotesSchema = z.object({
  technicianNotes: z.string().min(1, 'Please enter a note').max(1500),
  finalAmount: z.number().nonnegative().optional().nullable(),
});
