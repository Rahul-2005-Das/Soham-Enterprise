import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit mobile number')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
});

export const requestLoginCodeSchema = forgotPasswordSchema;
export const verifyLoginCodeSchema = verifyResetCodeSchema;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
    code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
    confirmNewPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export const userProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  // Strictly forbid role updates from customer requests
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().regex(/^[0-9+ -]{10,15}$/, 'Valid 10-digit phone number is required'),
  addressLine1: z.string().trim().min(5, 'Address must be at least 5 characters').max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required').max(50),
  state: z.string().trim().min(2, 'State is required').max(50),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit PIN code'),
  landmark: z.string().trim().max(100).optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['ADMIN']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
export type RequestLoginCodeInput = z.infer<typeof requestLoginCodeSchema>;
export type VerifyLoginCodeInput = z.infer<typeof verifyLoginCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

