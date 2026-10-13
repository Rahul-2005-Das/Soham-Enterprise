import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/db';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyResetCodeInput,
  RequestLoginCodeInput,
  VerifyLoginCodeInput,
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
const RESET_OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESET_OTP_MAX_ATTEMPTS = 5;
const RESET_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function hashValue(value: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(value).digest('hex');
}

function constantTimeEqual(input: string, expectedHash: string): boolean {
  const candidateHash = hashValue(input);
  const expected = Buffer.from(expectedHash, 'hex');
  const candidate = Buffer.from(candidateHash, 'hex');

  if (expected.length !== candidate.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, candidate);
}

function getSmtpTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const portValue = process.env.SMTP_PORT?.trim();
  const port = Number(portValue);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !portValue || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !from) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendOtpEmail(
  email: string,
  otp: string,
  name: string,
  purpose: 'PASSWORD_RESET' | 'AUTHENTICATION'
) {
  const transport = getSmtpTransport();
  if (!transport) {
    throw new Error('SMTP configuration is missing. Password reset email delivery cannot continue.');
  }

  const customerName = escapeHtml(name?.trim() || 'Customer');
  const from = process.env.SMTP_FROM!.trim();
  const isAuthentication = purpose === 'AUTHENTICATION';
  const subject = isAuthentication
    ? 'Soham Enterprises - Sign-in Verification Code'
    : 'Soham Enterprises - Password Reset Verification Code';
  const heading = isAuthentication ? 'Your sign-in code' : 'Password reset request';
  const instruction = isAuthentication
    ? 'Use this one-time code to sign in or create your customer account.'
    : 'Use the verification code below to complete your password reset.';

  await transport.sendMail({
    from,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
        <h2 style="margin-bottom: 16px; color: #111827;">${heading}</h2>
        <p>Hello ${customerName},</p>
        <p>${instruction}</p>
        <div style="padding: 20px 24px; margin: 24px 0; background: #f3f4f6; border-radius: 12px; text-align: center;">
          <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">Verification code</div>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #111827;">${otp}</div>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this reset, you can safely ignore this email.</p>
      </div>
    `,
  });

  console.info('[OTP Email] Message accepted by SMTP.');
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
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
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
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
      email: normalizedEmail,
      phone: input.phone || null,
      passwordHash,
      role: 'CUSTOMER',
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
  return { user: await getCurrentUser(newUser.id), token };
}

/**
 * Login user with email & password.
 * Returns generic error message to prevent user enumeration attacks.
 */
export async function loginUser(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
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
  return { user: await getCurrentUser(user.id), token };
}

const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000;
const LOGIN_OTP_MAX_ATTEMPTS = 5;

function genericLoginCodeMessage() {
  return 'If this email can receive messages, a sign-in code has been sent.';
}

function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
    .replace(/[._+-]+/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .slice(0, 100);

  return localPart || 'Customer';
}

export async function requestLoginCode(input: RequestLoginCodeInput) {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (user && user.role !== 'CUSTOMER') {
    return { success: true, message: genericLoginCodeMessage() };
  }

  const latestActiveRequest = await prisma.passwordResetToken.findFirst({
    where: { email, purpose: 'AUTHENTICATION', used: false },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (
    latestActiveRequest &&
    Date.now() - latestActiveRequest.createdAt.getTime() < RESET_OTP_RESEND_COOLDOWN_MS
  ) {
    return { success: true, message: genericLoginCodeMessage() };
  }

  const otp = crypto.randomInt(100000, 1_000_000).toString();
  const otpHash = hashValue(otp);
  const expiresAt = new Date(Date.now() + LOGIN_OTP_EXPIRY_MS);
  const record = await prisma.$transaction(async (transaction) => {
    await transaction.passwordResetToken.updateMany({
      where: { email, purpose: 'AUTHENTICATION', used: false },
      data: { used: true, verified: false },
    });

    return transaction.passwordResetToken.create({
      data: {
        userId: user?.id,
        email,
        purpose: 'AUTHENTICATION',
        otpHash,
        expiresAt,
        maxAttempts: LOGIN_OTP_MAX_ATTEMPTS,
      },
    });
  });

  try {
    await sendOtpEmail(email, otp, user?.name || nameFromEmail(email), 'AUTHENTICATION');
  } catch {
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });
    console.error('[OTP Email] Delivery failed. Check SMTP configuration and provider status.');
  }

  return { success: true, message: genericLoginCodeMessage() };
}

export async function verifyLoginCode(input: VerifyLoginCodeInput) {
  const email = normalizeEmail(input.email);
  const otp = input.code.trim();
  const record = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      purpose: 'AUTHENTICATION',
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new Error('Invalid or expired verification code.');
  }

  if (!constantTimeEqual(otp, record.otpHash)) {
    const attempt = await prisma.passwordResetToken.updateMany({
      where: { id: record.id, used: false, attemptsUsed: { lt: record.maxAttempts } },
      data: { attemptsUsed: { increment: 1 } },
    });

    if (attempt.count === 1) {
      const updated = await prisma.passwordResetToken.findUnique({
        where: { id: record.id },
        select: { attemptsUsed: true, maxAttempts: true },
      });
      if (updated && updated.attemptsUsed >= updated.maxAttempts) {
        await prisma.passwordResetToken.updateMany({
          where: { id: record.id, used: false },
          data: { used: true },
        });
      }
    }

    throw new Error('Invalid or expired verification code.');
  }

  const customer = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: {
        id: record.id,
        purpose: 'AUTHENTICATION',
        used: false,
        expiresAt: { gt: new Date() },
        attemptsUsed: { lt: record.maxAttempts },
      },
      data: { used: true, verified: true, verifiedAt: new Date() },
    });

    if (consumed.count !== 1) {
      throw new Error('Invalid or expired verification code.');
    }

    let verifiedCustomer = await transaction.user.findUnique({ where: { email } });
    if (verifiedCustomer && verifiedCustomer.role !== 'CUSTOMER') {
      throw new Error('Invalid or expired verification code.');
    }

    if (!verifiedCustomer) {
      verifiedCustomer = await transaction.user.create({
        data: {
          name: nameFromEmail(email),
          email,
          role: 'CUSTOMER',
          emailVerified: true,
        },
      });
    } else if (!verifiedCustomer.emailVerified) {
      verifiedCustomer = await transaction.user.update({
        where: { id: verifiedCustomer.id },
        data: { emailVerified: true },
      });
    }

    await transaction.passwordResetToken.update({
      where: { id: record.id },
      data: { userId: verifiedCustomer.id },
    });

    return verifiedCustomer;
  });

  try {
    await prisma.cart.upsert({
      where: { userId: customer.id },
      create: { userId: customer.id },
      update: {},
    });
  } catch {
    console.warn('[OTP Auth] Customer cart initialization failed.');
  }

  const session: AuthSession = {
    userId: customer.id,
    email: customer.email,
    role: customer.role,
  };
  return { user: await getCurrentUser(customer.id), token: generateToken(session) };
}

/**
 * Get the current authenticated user by ID with addresses.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      currentLocation: {
        select: {
          label: true,
          road: true,
          neighbourhood: true,
          city: true,
          state: true,
          pincode: true,
          lat: true,
          lng: true,
          capturedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User account not found.');
  }

  return {
    ...sanitizeUser(user),
    addresses: user.addresses,
    currentLocation: user.currentLocation,
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
 * Request password reset OTP.
 * Respond with a generic success message so the app does not expose whether an account exists.
 */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || user.role !== 'CUSTOMER') {
    return {
      success: true,
      message: 'If an account matches this email, a verification code has been sent.',
    };
  }

  const latestActiveRequest = await prisma.passwordResetToken.findFirst({
    where: { email: user.email, purpose: 'PASSWORD_RESET', used: false },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (
    latestActiveRequest &&
    Date.now() - latestActiveRequest.createdAt.getTime() < RESET_OTP_RESEND_COOLDOWN_MS
  ) {
    return {
      success: true,
      message: 'If an account matches this email, a verification code has been sent.',
    };
  }

  const otp = crypto.randomInt(100000, 1_000_000).toString();
  const otpHash = hashValue(otp);
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashValue(resetToken);
  const expiresAt = new Date(Date.now() + RESET_OTP_EXPIRY_MS);

  const resetRecord = await prisma.$transaction(async (transaction) => {
    await transaction.passwordResetToken.updateMany({
      where: { email: user.email, purpose: 'PASSWORD_RESET', used: false },
      data: { used: true, verified: false },
    });

    return transaction.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        purpose: 'PASSWORD_RESET',
        otpHash,
        tokenHash,
        expiresAt,
        verified: false,
        attemptsUsed: 0,
        maxAttempts: RESET_OTP_MAX_ATTEMPTS,
      },
    });
  });

  try {
    await sendOtpEmail(user.email, otp, user.name, 'PASSWORD_RESET');
    return {
      success: true,
      message: 'If an account matches this email, a verification code has been sent.',
    };
  } catch (error) {
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    console.error('[Reset Email] Delivery failed. Check SMTP configuration and provider status.');
    return {
      success: true,
      message: 'If an account matches this email, a verification code has been sent.',
    };
  }
}

export async function verifyResetCode(input: VerifyResetCodeInput) {
  const email = normalizeEmail(input.email);
  const otp = input.code.trim();

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      purpose: 'PASSWORD_RESET',
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRecord) {
    throw new Error('Invalid or expired verification code.');
  }

  const codeMatches = constantTimeEqual(otp, resetRecord.otpHash);

  if (!codeMatches) {
    const nextAttempts = resetRecord.attemptsUsed + 1;

    if (nextAttempts >= resetRecord.maxAttempts) {
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
    } else {
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { attemptsUsed: nextAttempts },
      });
    }

    throw new Error('Invalid or expired verification code.');
  }

  await prisma.passwordResetToken.update({
    where: { id: resetRecord.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
      attemptsUsed: 0,
    },
  });

  return {
    success: true,
    message: 'Verification code accepted. You can now set a new password.',
  };
}

/**
 * Reset password using a valid, verified OTP code.
 */
export async function resetPasswordWithToken(input: ResetPasswordInput) {
  const email = normalizeEmail(input.email);
  const otp = input.code.trim();

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      purpose: 'PASSWORD_RESET',
      verified: true,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRecord) {
    throw new Error('This password reset request is invalid or has expired.');
  }

  const codeMatches = constantTimeEqual(otp, resetRecord.otpHash);
  if (!codeMatches) {
    throw new Error('This password reset request is invalid or has expired.');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('No user account is linked to this password reset request.');
  }

  if (user.passwordHash) {
    const sameAsCurrent = await bcrypt.compare(input.password, user.passwordHash);
    if (sameAsCurrent) {
      throw new Error('Please choose a password different from your current one.');
    }
  }

  const newHash = await bcrypt.hash(input.password, 10);

  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        purpose: 'PASSWORD_RESET',
        verified: true,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true, verified: false },
    });

    if (consumed.count !== 1) {
      throw new Error('This password reset request is invalid or has expired.');
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await transaction.passwordResetToken.updateMany({
      where: { email, purpose: 'PASSWORD_RESET', used: false },
      data: { used: true, verified: false },
    });
  });

  return { success: true, message: 'Password reset successful. You can now log in with your new password.' };
}

/**
 * Admin-only: Create or provision an ADMIN account.
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
