// Authentication & Security helper for Full-Stack Operations
// Ensures server-authoritative user derivation, prevents client userId spoofing,
// and enforces role boundaries.

import jwt from 'jsonwebtoken';
import { getRequiredEnv } from '../lib/env.ts';

const JWT_SECRET = getRequiredEnv('JWT_SECRET');

export interface AuthSession {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
}

/**
 * Extracts and verifies the authenticated user session from:
 * 1. An Express request object (checking cookies.auth_token, then authorization header)
 * 2. A raw token or authorization header string
 */
export function getAuthenticatedUser(reqOrToken?: any): AuthSession | null {
  if (!reqOrToken) return null;

  let token: string | null = null;

  if (typeof reqOrToken === 'string') {
    token = reqOrToken.startsWith('Bearer ')
      ? reqOrToken.substring(7).trim()
      : reqOrToken.trim();
  } else if (typeof reqOrToken === 'object') {
    // Check cookies first
    if (reqOrToken.cookies && reqOrToken.cookies.auth_token) {
      token = reqOrToken.cookies.auth_token;
    } else if (reqOrToken.headers && reqOrToken.headers.authorization) {
      const authHeader = reqOrToken.headers.authorization;
      token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : authHeader.trim();
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        email: decoded.email || `${decoded.userId}@customer.sohomenterprises.local`,
        role: decoded.role,
      };
    }
  } catch (err) {
    // Fallback for tests/local mock IDs if passed directly
    if (process.env.NODE_ENV !== 'production' && token.startsWith('test-user-')) {
      return {
        userId: token,
        email: `${token}@customer.sohomenterprises.local`,
        role: 'CUSTOMER',
      };
    }
    return null;
  }

  return null;
}

/**
 * Enforces that an operation requires an authenticated user.
 * Throws an Unauthorized error if no valid session is found.
 */
export function requireAuthUser(reqOrToken?: any): AuthSession {
  const user = getAuthenticatedUser(reqOrToken);
  if (!user || !user.userId) {
    throw new Error('Unauthorized: Authentication required for this operation.');
  }
  return user;
}

/**
 * Enforces that an operation requires a specific role.
 * Throws an error if user is unauthenticated or has insufficient role.
 */
export function requireRole(reqOrToken: any, allowedRoles: ('CUSTOMER' | 'TECHNICIAN' | 'ADMIN')[]) {
  const user = requireAuthUser(reqOrToken);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Access requires one of [${allowedRoles.join(', ')}] role.`);
  }
  return user;
}
