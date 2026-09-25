import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SparePartProduct } from '../types';
import { api, ApiError } from '../lib/api';
import { ApiProduct, ApiProductCategory, mapApiProductToSparePart } from '../lib/productMapper';

interface CatalogContextType {
  products: SparePartProduct[];
  categories: ApiProductCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<SparePartProduct[]>([]);
  const [categories, setCategories] = useState<ApiProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get<{ products: ApiProduct[] }>('/api/products?limit=50'),
        api.get<ApiProductCategory[]>('/api/product-categories'),
      ]);
      setProducts(productsRes.products.map(mapApiProductToSparePart));
      setCategories(categoriesRes);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load the product catalog.';
      setError(message);
      console.warn('[CatalogContext] Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CatalogContext.Provider value={{ products, categories, loading, error, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
