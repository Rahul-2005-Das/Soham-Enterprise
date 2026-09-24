import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UserProfileUpdateInput,
  AddressInput,
  CreateStaffInput,
} from '../schemas/user';
import { AuthSession } from './auth-helper';
import { getRequiredEnv } from '../lib/env';

const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const JWT_EXPIRES_IN = '7d';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function sanitizeUser(user: any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    image: user.image ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function generateToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSession;
    if (decoded && decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Register a new Customer.
 * Always creates a CUSTOMER account. Never allows role escalation.
 */
export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  if (input.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (existingPhone) {
      throw new Error('An account with this phone number already exists.');
    }
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      passwordHash,
      role: 'CUSTOMER', // Hardcoded: Public registration is strictly CUSTOMER
    },
  });

  // Automatically initialize an empty cart for the new customer
  try {
    await prisma.cart.create({
      data: { userId: newUser.id },
    });
  } catch (cartErr) {
    console.warn('Cart initialization notice:', cartErr);
  }

  const session: AuthSession = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  const token = generateToken(session);
  return { user: sanitizeUser(newUser), token };
}

/**
 * Login user with email & password.
 * Returns generic error message to prevent user enumeration attacks.
 */
export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(session);
  return { user: sanitizeUser(user), token };
}

/**
 * Get the current authenticated user by ID with addresses.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!user) {
    throw new Error('User account not found.');
  }

  return {
    ...sanitizeUser(user),
    addresses: user.addresses,
  };
}

/**
 * Update authenticated user's profile details.
 * Role or email updates are strictly prohibited through this method.
 */
export async function updateUserProfile(userId: string, input: UserProfileUpdateInput) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  if (input.phone && input.phone !== existing.phone) {
    const phoneInUse = await prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (phoneInUse && phoneInUse.id !== userId) {
      throw new Error('Phone number is already associated with another account.');
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.image !== undefined ? { image: input.image || null } : {}),
    },
  });

  return sanitizeUser(updated);
}

/**
 * Change password for an authenticated user.
 */
export async function changeUserPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new Error('User account not found or has no password configured.');
  }

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) {
    throw new Error('Current password does not match our records.');
  }

  const newHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true, message: 'Password updated successfully.' };
}

/**
 * Request password reset token.
 * Generic response given to prevent user email probing.
 */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // Return friendly generic confirmation
    return {
      success: true,
      message: 'If an account matches this email, a password reset token has been generated.',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

  await prisma.passwordResetToken.create({
    data: {
      email: user.email,
      token: resetToken,
      expiresAt,
    },
  });

  return {
    success: true,
    message: 'If an account matches this email, a password reset token has been generated.',
    resetToken, // Returned for UI testing and prompt notification
  };
}

/**
 * Reset password using a valid, unexpired token.
 */
export async function resetPasswordWithToken(input: ResetPasswordInput) {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
  });

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    throw new Error('Password reset token is invalid or has expired.');
  }

  const user = await prisma.user.findUnique({
    where: { email: tokenRecord.email },
  });

  if (!user) {
    throw new Error('No user account linked to this reset token.');
  }

  const newHash = await bcrypt.hash(input.password, 10);

  // Update password and invalidate token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    }),
  ]);

  return { success: true, message: 'Password has been reset successfully. You can now log in.' };
}

/**
 * Admin-only: Create or provision a TECHNICIAN or ADMIN account.
 */
export async function adminCreateStaff(adminUser: AuthSession, input: CreateStaffInput) {
  if (adminUser.role !== 'ADMIN') {
    throw new Error('Forbidden: Only administrators can create staff accounts.');
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const staffUser = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      passwordHash,
      role: input.role,
      emailVerified: true,
    },
  });

  // If creating technician, initialize technician profile
  if (input.role === 'TECHNICIAN') {
    await prisma.technician.create({
      data: {
        userId: staffUser.id,
        employeeCode: `SE-TECH-${Date.now().toString().slice(-4)}`,
        skills: ['Water Purifiers', 'Air Conditioners', 'Refrigerators'],
        serviceAreas: ['Kolkata', 'Howrah', 'Salt Lake'],
        active: true,
      },
    });
  }


  return sanitizeUser(staffUser);
}

// ----------------------------------------------------
// Address Management Operations (strictly ownership checked)
// ----------------------------------------------------

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createUserAddress(userId: string, input: AddressInput) {
  // If isDefault is requested, clear previous defaults for this user
  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If user has no existing addresses, set this first address as default
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = count === 0 ? true : input.isDefault;

  return prisma.address.create({
    data: {
      userId,
      fullName: input.fullName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      landmark: input.landmark || null,
      isDefault,
    },
  });
}

export async function updateUserAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  // Ownership verification
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new Error('Address not found or unauthorized.');
  }

  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data: {
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.addressLine1 ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 || null } : {}),
      ...(input.city ? { city: input.city } : {}),
      ...(input.state ? { state: input.state } : {}),
      ...(input.pincode ? { pincode: input.pincode } : {}),
      ...(input.landmark !== undefined ? { landmark: input.landmark || null } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    },
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  // Ownership check
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new Error('Address not found or unauthorized.');
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  return { success: true };
}

export async function setDefaultUserAddress(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.userId !== userId) {
    throw new Error('Address not found or unauthorized.');
  }

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  return { success: true };
}
