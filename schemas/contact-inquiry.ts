import { z } from 'zod';

export const createContactInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  subject: z.enum([
    'Service Inquiry',
    'Spare Part Availability',
    'Warranty Claim',
    'Commercial AMC',
    'Other Feedback',
  ]),
  message: z.string().trim().min(10).max(5000),
});

export const updateContactInquirySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'RESOLVED']),
});

export type CreateContactInquiryInput = z.infer<typeof createContactInquirySchema>;
