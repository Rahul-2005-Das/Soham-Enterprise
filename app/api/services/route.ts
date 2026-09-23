import { getServices, getServiceBySlug } from '../../../actions/services.ts';

export async function handleGetServices(reqQuery: Record<string, any>) {
  try {
    if (reqQuery.slug) {
      const service = await getServiceBySlug(String(reqQuery.slug));
      if (!service) {
        return { status: 404, body: { error: 'Service not found' } };
      }
      return { status: 200, body: service };
    }

    const services = await getServices({
      categoryId: reqQuery.categoryId ? String(reqQuery.categoryId) : undefined,
      categorySlug: reqQuery.categorySlug ? String(reqQuery.categorySlug) : undefined,
      search: reqQuery.search ? String(reqQuery.search) : undefined,
    });

    return { status: 200, body: services };
  } catch (error: any) {
    return { status: 400, body: { error: error.message || 'Failed to fetch services' } };
  }
}
