import { PrismaClient } from '@prisma/client';

/**
 * Normalizes DATABASE_URL so a password containing special characters
 * (like '@', '#', '%') doesn't break URL parsing, without hardcoding any
 * specific credential in source code. Percent-encodes the password segment
 * of postgresql://user:password@host:port/db generically.
 */
function getNormalizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  const match = url.match(/^(postgres(?:ql)?:\/\/)([^:@/]+):([^@]+)@(.+)$/);
  if (!match) return url;

  const [, scheme, user, rawPassword, rest] = match;
  // Only re-encode if the password contains characters that are unsafe in a URL
  // but isn't already percent-encoded (avoids double-encoding a correct URL).
  const alreadyEncoded = /%[0-9A-Fa-f]{2}/.test(rawPassword);
  const needsEncoding = /[@#/?[\]]/.test(rawPassword);
  if (!needsEncoding || alreadyEncoded) return url;

  const encodedPassword = encodeURIComponent(rawPassword);
  return `${scheme}${user}:${encodedPassword}@${rest}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getNormalizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

