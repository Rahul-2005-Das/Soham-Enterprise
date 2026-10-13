import type { Request } from 'express';
import { getAdminContactInquiries, updateAdminContactInquiry } from '../../../../actions/contact-inquiries.ts';
import { requireRole } from '../../../../actions/auth-helper.ts';
import { mapApiError } from '../../_errors.ts';
import { updateContactInquirySchema } from '../../../../schemas/contact-inquiry.ts';

export async function handleGetAdminContactInquiries(req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    return { status: 200, body: { success: true, inquiries: await getAdminContactInquiries() } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Could not load customer inquiries.');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}

export async function handleUpdateAdminContactInquiry(id: string, body: unknown, req: Request) {
  try {
    requireRole(req, ['ADMIN']);
    const input = updateContactInquirySchema.parse(body);
    const inquiry = await updateAdminContactInquiry(id, input.status);
    return { status: 200, body: { success: true, inquiry } };
  } catch (error: any) {
    const mapped = mapApiError(error, 'Could not update customer inquiry.');
    return { status: mapped.status, body: { success: false, error: mapped.error } };
  }
}
