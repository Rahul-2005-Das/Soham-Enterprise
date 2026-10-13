import { prisma } from '../lib/db.ts';
import type { CreateContactInquiryInput } from '../schemas/contact-inquiry.ts';

export async function createContactInquiry(input: CreateContactInquiryInput) {
  return prisma.contactInquiry.create({
    data: {
      ...input,
      email: input.email || null,
    },
    select: {
      id: true,
      name: true,
      subject: true,
      createdAt: true,
    },
  });
}

export async function getAdminContactInquiries() {
  return prisma.contactInquiry.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function updateAdminContactInquiry(id: string, status: 'NEW' | 'CONTACTED' | 'RESOLVED') {
  return prisma.contactInquiry.update({
    where: { id },
    data: { status },
  });
}
