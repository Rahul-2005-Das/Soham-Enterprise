import { getProducts, getProductBySlug, getProductById } from '../../../actions/products.ts';

export async function handleGetProducts(reqQuery: Record<string, any>) {
  try {
    if (reqQuery.slug) {
      const product = await getProductBySlug(String(reqQuery.slug));
      if (!product) {
        return { status: 404, body: { error: 'Product not found' } };
      }
      return { status: 200, body: product };
    }

    if (reqQuery.id) {
      const product = await getProductById(String(reqQuery.id));
      if (!product) {
        return { status: 404, body: { error: 'Product not found' } };
      }
      return { status: 200, body: product };
    }

    const data = await getProducts({
      categoryId: reqQuery.categoryId ? String(reqQuery.categoryId) : undefined,
      categorySlug: reqQuery.categorySlug ? String(reqQuery.categorySlug) : undefined,
      brand: reqQuery.brand ? String(reqQuery.brand) : undefined,
      search: reqQuery.search ? String(reqQuery.search) : undefined,
      minPrice: reqQuery.minPrice ? Number(reqQuery.minPrice) : undefined,
      maxPrice: reqQuery.maxPrice ? Number(reqQuery.maxPrice) : undefined,
      inStock: reqQuery.inStock === 'true' ? true : undefined,
      sortBy: reqQuery.sortBy,
      page: reqQuery.page ? Number(reqQuery.page) : 1,
      limit: reqQuery.limit ? Number(reqQuery.limit) : 12,
    });

    return { status: 200, body: data };
  } catch (error: any) {
    // Zod validation errors are the caller's fault (400); anything else is a
    // real server/database problem (500) and should not be disguised as a
    // successful empty response.
    const isValidationError = error?.name === 'ZodError';
    return {
      status: isValidationError ? 400 : 500,
      body: { error: isValidationError ? error.message : 'Failed to fetch products. Please try again shortly.' },
    };
  }
}
