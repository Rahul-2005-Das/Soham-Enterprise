// Authentication & Security helper for Full-Stack Operations
// Ensures server-authoritative user derivation, prevents client userId spoofing,
// and enforces role boundaries.

import jwt from 'jsonwebtoken';
import { getRequiredEnv } from '../lib/env.ts';

const JWT_SECRET = getRequiredEnv('JWT_SECRET');

export interface AuthSession {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Extracts and verifies the authenticated user session from:
 * 1. An Express request object (checking the route-specific cookie, then authorization header)
 * 2. A raw token or authorization header string
 */
export function getAuthenticatedUser(reqOrToken?: any): AuthSession | null {
  if (!reqOrToken) return null;

  let token: string | null = null;
  const isAdminRoute = typeof reqOrToken === 'object' && (
    reqOrToken.originalUrl?.startsWith('/api/admin') ||
    reqOrToken.url?.startsWith('/api/admin') ||
    reqOrToken.query?.admin === 'true'
  );

  if (typeof reqOrToken === 'string') {
    token = reqOrToken.startsWith('Bearer ')
      ? reqOrToken.substring(7).trim()
      : reqOrToken.trim();
  } else if (typeof reqOrToken === 'object') {
    // Check cookies first
    if (reqOrToken.cookies) {
      if (isAdminRoute) {
        token = reqOrToken.cookies.admin_auth_token;
      } else {
        token = reqOrToken.cookies.customer_auth_token;
      }
    }

    if (!token && reqOrToken.headers && reqOrToken.headers.authorization) {
      const authHeader = reqOrToken.headers.authorization;
      token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : authHeader.trim();
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.userId && decoded.role && decoded.email) {
      if (isAdminRoute ? decoded.role !== 'ADMIN' : decoded.role === 'ADMIN') return null;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch (err) {
    // Invalid / expired / tampered token: fail closed (no test-token bypass, in any environment).
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
export function requireRole(reqOrToken: any, allowedRoles: ('CUSTOMER' | 'ADMIN')[]) {
  const user = requireAuthUser(reqOrToken);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Access requires one of [${allowedRoles.join(', ')}] role.`);
  }
  return user;
}
