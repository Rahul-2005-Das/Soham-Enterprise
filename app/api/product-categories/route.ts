import { getProductCategories } from '../../../actions/products.ts';

export async function handleGetProductCategories() {
  try {
    const categories = await getProductCategories();
    return { status: 200, body: categories };
  } catch (error: any) {
    return { status: 500, body: { error: error.message || 'Failed to fetch product categories' } };
  }
}
