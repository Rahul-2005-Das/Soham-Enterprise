import { Request, Response } from 'express';
import { isZodError, zodMessage } from '../_errors.ts';
import {
  registerUser,
  loginUser,
  requestLoginCode,
  verifyLoginCode,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  requestPasswordReset,
  verifyResetCode,
  resetPasswordWithToken,
  adminCreateStaff,
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from '../../../actions/auth.ts';
import {
  registerSchema,
  loginSchema,
  requestLoginCodeSchema,
  verifyLoginCodeSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  changePasswordSchema,
  userProfileUpdateSchema,
  addressSchema,
  createStaffSchema,
} from '../../../schemas/user.ts';
import { requireAuthUser, requireRole } from '../../../actions/auth-helper.ts';

// Helper to set HTTP-only cookie
export function setAuthCookie(res: Response, token: string, cookieName: string = 'auth_token') {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 604800 * 1000, // Express expects milliseconds (7 days).
    path: '/',
  });
}

// Helper to clear HTTP-only cookie
export function clearAuthCookie(res: Response, cookieName: string = 'auth_token') {
  res.cookie(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

/**
 * POST /api/auth/register
 */
export async function handleRegister(body: any) {
  try {
    const validated = registerSchema.parse(body);
    const result = await registerUser(validated);
    return { status: 201, body: { success: true, user: result.user }, token: result.token };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Registration failed' } };
  }
}

/**
 * POST /api/auth/login
 */
export async function handleLogin(body: any) {
  try {
    const validated = loginSchema.parse(body);
    const result = await loginUser(validated);
    if (result.user.role !== 'CUSTOMER') {
      return { status: 401, body: { success: false, error: 'Invalid email or password.' } };
    }
    return { status: 200, body: { success: true, user: result.user }, token: result.token };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 401, body: { error: error.message || 'Invalid email or password' } };
  }
}

export async function handleRequestLoginCode(body: any) {
  try {
    const validated = requestLoginCodeSchema.parse(body);
    const result = await requestLoginCode(validated);
    return { status: 200, body: result };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: 'Request could not be processed.' } };
  }
}

export async function handleVerifyLoginCode(body: any) {
  try {
    const validated = verifyLoginCodeSchema.parse(body);
    const result = await verifyLoginCode(validated);
    return {
      status: 200,
      body: { success: true, user: result.user },
      token: result.token,
    };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: 'Invalid or expired verification code.' } };
  }
}

/**
 * GET /api/auth/me
 */
export async function handleMe(req: Request) {
  try {
    const auth = requireAuthUser(req);
    const user = await getCurrentUser(auth.userId);
    return { status: 200, body: { success: true, user } };
  } catch (error: any) {
    return { status: 401, body: { error: 'Unauthorized: Session invalid or expired' } };
  }
}

/**
 * PUT /api/auth/profile
 */
export async function handleUpdateProfile(body: any, req: Request) {
  try {
    const auth = requireAuthUser(req);
    const validated = userProfileUpdateSchema.parse(body);
    const updated = await updateUserProfile(auth.userId, validated);
    return { status: 200, body: { success: true, user: updated } };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Profile update failed' } };
  }
}

/**
 * POST /api/auth/change-password
 */
export async function handleChangePassword(body: any, req: Request) {
  try {
    const auth = requireAuthUser(req);
    const validated = changePasswordSchema.parse(body);
    const result = await changeUserPassword(auth.userId, validated);
    return { status: 200, body: result };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Password change failed' } };
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function handleForgotPassword(body: any) {
  try {
    const validated = forgotPasswordSchema.parse(body);
    const result = await requestPasswordReset(validated);
    return { status: 200, body: result };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Request failed' } };
  }
}

/**
 * POST /api/auth/verify-reset-code
 */
export async function handleVerifyResetCode(body: any) {
  try {
    const validated = verifyResetCodeSchema.parse(body);
    const result = await verifyResetCode(validated);
    return { status: 200, body: result };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Verification failed' } };
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function handleResetPassword(body: any) {
  try {
    const validated = resetPasswordSchema.parse(body);
    const result = await resetPasswordWithToken(validated);
    return { status: 200, body: result };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Password reset failed' } };
  }
}

/**
 * POST /api/auth/admin/users
 * Restricted to ADMIN role only.
 */
export async function handleAdminCreateStaff(body: any, req: Request) {
  try {
    const adminSession = requireRole(req, ['ADMIN']);
    const validated = createStaffSchema.parse(body);
    const staff = await adminCreateStaff(adminSession, validated);
    return { status: 201, body: { success: true, user: staff } };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    const status = error.message.includes('Forbidden') ? 403 : 400;
    return { status, body: { error: error.message || 'Staff provisioning failed' } };
  }
}

// ----------------------------------------------------
// Address API Route Handlers
// ----------------------------------------------------

export async function handleGetAddresses(req: Request) {
  try {
    const auth = requireAuthUser(req);
    const addresses = await getUserAddresses(auth.userId);
    return { status: 200, body: { success: true, addresses } };
  } catch (error: any) {
    return { status: 401, body: { error: 'Unauthorized: Authentication required' } };
  }
}

export async function handleCreateAddress(body: any, req: Request) {
  try {
    const auth = requireAuthUser(req);
    const validated = addressSchema.parse(body);
    const address = await createUserAddress(auth.userId, validated);
    return { status: 201, body: { success: true, address } };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Failed to save address' } };
  }
}

export async function handleUpdateAddress(addressId: string, body: any, req: Request) {
  try {
    const auth = requireAuthUser(req);
    const validated = addressSchema.partial().parse(body);
    const address = await updateUserAddress(auth.userId, addressId, validated);
    return { status: 200, body: { success: true, address } };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { status: 400, body: { error: isZodError(error) ? zodMessage(error, 'Validation error') : (error.message || 'Validation error') } };
    }
    return { status: 400, body: { error: error.message || 'Failed to update address' } };
  }
}

export async function handleDeleteAddress(addressId: string, req: Request) {
  try {
    const auth = requireAuthUser(req);
    await deleteUserAddress(auth.userId, addressId);
    return { status: 200, body: { success: true, message: 'Address deleted' } };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to delete address' } };
  }
}

export async function handleSetDefaultAddress(addressId: string, req: Request) {
  try {
    const auth = requireAuthUser(req);
    await setDefaultUserAddress(auth.userId, addressId);
    return { status: 200, body: { success: true, message: 'Default address updated' } };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to update default address' } };
  }
}
