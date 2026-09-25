import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from '../types';
import { api, ApiError } from '../lib/api';
import { ApiProduct, mapApiProductToSparePart } from '../lib/productMapper';
import { useAuth } from './AuthContext';

interface ApiCartResponse {
  cart: {
    items: { productId: string; quantity: number; product: ApiProduct }[];
  };
  totalItems: number;
  subtotal: number;
}

interface CartMutationResult {
  success: boolean;
  error?: string;
  requiresAuth?: boolean;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<CartMutationResult>;
  /** Sets the ABSOLUTE quantity for a product (0 removes it). */
  setItemQuantity: (productId: string, quantity: number) => Promise<CartMutationResult>;
  removeItem: (productId: string) => Promise<CartMutationResult>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<ApiCartResponse>('/api/cart');
      setItems(
        data.cart.items.map((item) => ({
          product: mapApiProductToSparePart(item.product),
          quantity: item.quantity,
        }))
      );
      setTotalItems(data.totalItems);
      setSubtotal(data.subtotal);
    } catch (err) {
      console.warn('[CartContext] Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load the cart when the user logs in; clear it when they log out.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: string, quantity = 1): Promise<CartMutationResult> => {
    if (!user) return { success: false, requiresAuth: true, error: 'Please log in to add items to your cart.' };
    try {
      await api.post('/api/cart', { productId, quantity });
      await refresh();
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not add item to cart.';
      return { success: false, error: message };
    }
  };

  const setItemQuantity = async (productId: string, quantity: number): Promise<CartMutationResult> => {
    if (!user) return { success: false, requiresAuth: true, error: 'Please log in to manage your cart.' };
    try {
      await api.put('/api/cart', { productId, quantity });
      await refresh();
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update cart.';
      return { success: false, error: message };
    }
  };

  const removeItem = async (productId: string): Promise<CartMutationResult> => {
    if (!user) return { success: false, requiresAuth: true };
    try {
      await api.delete('/api/cart', { productId });
      await refresh();
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not remove item.';
      return { success: false, error: message };
    }
  };

  return (
    <CartContext.Provider
      value={{ items, totalItems, subtotal, loading, addItem, setItemQuantity, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
