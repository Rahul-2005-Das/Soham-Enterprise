import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Max quantity per item is 20').default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(50),
});

export const removeCartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});
