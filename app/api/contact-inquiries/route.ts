import { createContactInquiry } from '../../../actions/contact-inquiries.ts';
import { createContactInquirySchema } from '../../../schemas/contact-inquiry.ts';
import { isZodError, zodMessage } from '../_errors.ts';

export async function handleCreateContactInquiry(body: unknown) {
  try {
    const input = createContactInquirySchema.parse(body);
    const inquiry = await createContactInquiry(input);
    return {
      status: 201,
      body: { success: true, inquiry: { id: inquiry.id, name: inquiry.name, subject: inquiry.subject } },
    };
  } catch (error: any) {
    return {
      status: isZodError(error) ? 400 : 500,
      body: {
        success: false,
        error: isZodError(error)
          ? zodMessage(error, 'Please check your inquiry details.')
          : 'We could not save your inquiry right now. Please try again or contact support directly.',
      },
    };
  }
}
