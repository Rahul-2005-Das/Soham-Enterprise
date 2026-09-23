import { PrismaClient } from '@prisma/client';

function getNormalizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Correct typo in password (sohom -> soham) and percent-encode '@' in password
  if (url.includes('sohom@2011halder')) {
    url = url.replace('sohom@2011halder', 'soham%402011halder');
  } else if (url.includes('soham@2011halder')) {
    url = url.replace('soham@2011halder', 'soham%402011halder');
  }

  // Use port 5432 for standard direct pooler connection if port 6543 has pgbouncer transaction latency
  return url;
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

