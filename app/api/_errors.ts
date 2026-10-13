// Shared helpers for turning thrown errors into HTTP responses.
// zod v4 exposes validation problems as `error.issues` (the v3-style `error.errors` no longer exists),
// so reading `error.errors[0]` throws a TypeError inside the route handler and crashes the request.

export function isZodError(error: any): boolean {
  return !!error && (error.name === 'ZodError' || Array.isArray(error.issues));
}

export function zodMessage(error: any, fallback = 'Validation error'): string {
  const first = error?.issues?.[0];
  return first?.message || fallback;
}

/**
 * Map a thrown error to an HTTP status + client-safe message.
 * Business errors thrown by the actions use well-known phrases ("Unauthorized", "Forbidden", "not found").
 * Anything unrecognised is logged and reported as a generic 500 so internals never leak to the client.
 */
export function mapApiError(error: any, zodFallback = 'Validation error'): { status: number; error: string } {
  if (isZodError(error)) return { status: 400, error: zodMessage(error, zodFallback) };
  const message: string = typeof error?.message === 'string' ? error.message : '';
  if (message.includes('Forbidden')) return { status: 403, error: message };
  if (message.includes('Unauthorized')) return { status: 401, error: message };
  if (message.includes('Conflict')) return { status: 409, error: message.replace(/^Conflict:\s*/, '') };
  if (/not found|does not exist/i.test(message)) return { status: 404, error: message };
  if (/inactive/i.test(message)) return { status: 409, error: message };
  console.error('[api] Unexpected error:', error);
  return { status: 500, error: 'Internal server error.' };
}
