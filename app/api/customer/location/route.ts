import { broadcastAdminEvent } from '../../admin/sse.ts';
import { Request } from 'express';
import { saveCustomerLocation } from '../../../../actions/customer-location.ts';
import { requireRole } from '../../../../actions/auth-helper.ts';
import { isZodError, zodMessage } from '../../_errors.ts';
import { customerLocationCoordinatesSchema } from '../../../../schemas/customer-location.ts';

export async function handleSaveCustomerLocation(body: any, req: Request) {
  try {
    const customer = requireRole(req, ['CUSTOMER']);
    const coordinates = customerLocationCoordinatesSchema.parse(body);
    const location = await saveCustomerLocation(customer.userId, coordinates);
    broadcastAdminEvent('LOCATION_UPDATE', location);
    return { status: 200, body: { success: true, location } };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        status: 400,
        body: { error: isZodError(error) ? zodMessage(error, 'Invalid coordinates') : 'Invalid coordinates' },
      };
    }

    if (error.message?.startsWith('Unauthorized')) {
      return { status: 401, body: { error: 'Authentication required.' } };
    }

    if (error.message?.startsWith('Forbidden')) {
      return { status: 403, body: { error: 'Customer access required.' } };
    }

    console.error('[Customer Location] Could not resolve or save location.');
    return { status: 502, body: { error: 'Location could not be determined right now.' } };
  }
}
