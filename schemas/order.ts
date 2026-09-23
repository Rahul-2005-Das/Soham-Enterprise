import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address ID is required'),
  couponCode: z.string().optional(),
});

export const orderQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  limit: z.number().int().positive().max(50).default(10),
  page: z.number().int().positive().default(1),
});
