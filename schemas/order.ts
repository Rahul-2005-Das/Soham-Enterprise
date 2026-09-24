import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address ID is required'),
  couponCode: z.string().trim().min(1).max(50).optional(),
  paymentMethod: z.enum(['UPI', 'COD']),
  // UPI reference/transaction number the customer enters after paying via the QR code.
  // Optional at submit time (customer may pay after placing the order) but validated
  // for length/shape when provided.
  paymentReference: z.string().trim().max(100).optional(),
});

export const orderQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  limit: z.number().int().positive().max(50).default(10),
  page: z.number().int().positive().default(1),
});
