import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/db.ts';

const bootstrapSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(16),
  name: z.string().trim().min(2).max(100).optional(),
});

async function main() {
  const parsed = bootstrapSchema.safeParse({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    name: process.env.ADMIN_BOOTSTRAP_NAME,
  });

  if (!parsed.success) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (minimum 16 characters).');
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== 'ADMIN') {
      throw new Error('That email already belongs to a non-admin account; choose a separate admin email.');
    }
    console.info('An admin account already exists for the configured email. No changes were made.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: name || 'System Administrator',
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.info('Administrator account created. Sign in at /admin/login.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Admin bootstrap failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });