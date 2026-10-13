import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PublishedService, SparePartProduct } from '../types';
import { api, ApiError } from '../lib/api';
import { ApiProduct, ApiProductCategory, mapApiProductToSparePart } from '../lib/productMapper';

interface CatalogContextType {
  products: SparePartProduct[];
  services: PublishedService[];
  categories: ApiProductCategory[];
  loading: boolean;
  servicesLoading: boolean;
  error: string | null;
  servicesError: string | null;
  refresh: () => Promise<void>;
  refreshServices: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<SparePartProduct[]>([]);
  const [services, setServices] = useState<PublishedService[]>([]);
  const [categories, setCategories] = useState<ApiProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const hasLoadedServices = useRef(false);

  const refreshServices = useCallback(async () => {
    setServicesError(null);
    try {
      const response = await api.get<PublishedService[]>('/api/services', { cache: 'no-store' });
      setServices(response.filter((service) => service.active && service.category?.active));
      hasLoadedServices.current = true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load services.';
      if (!hasLoadedServices.current) setServicesError(message);
      console.warn('[CatalogContext] Failed to load services:', err);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [firstPage, categoriesRes] = await Promise.all([
        api.get<{ products: ApiProduct[]; pagination: { totalPages: number } }>('/api/products?page=1&limit=50', { cache: 'no-store' }),
        api.get<ApiProductCategory[]>('/api/product-categories'),
      ]);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
          api.get<{ products: ApiProduct[] }>(`/api/products?page=${index + 2}&limit=50`, { cache: 'no-store' }),
        ),
      );
      setProducts([firstPage, ...remainingPages].flatMap((page) => page.products).map(mapApiProductToSparePart));
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
    refreshServices();
  }, [refresh, refreshServices]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        void refreshServices();
      }
    };
    const intervalId = window.setInterval(refreshWhenVisible, 10_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh, refreshServices]);

  return (
    <CatalogContext.Provider value={{ products, services, categories, loading, servicesLoading, error, servicesError, refresh, refreshServices }}>
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
