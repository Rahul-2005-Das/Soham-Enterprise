import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from '../types';
import { api, ApiError } from '../lib/api';
import { mapApiProductToSparePart, normalizeApiProduct } from '../lib/productMapper';
import { useAuth } from './AuthContext';

interface ApiCartResponse {
  cart: {
    items: { productId?: string; quantity: number; product: unknown }[];
  };
  totalItems: number;
  subtotal: number;
}

interface ApiCartMutationResponse {
  success: boolean;
  item?: {
    productId?: unknown;
    quantity?: unknown;
    product?: unknown;
  };
  product?: unknown;
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

const cartStorageKey = (userId: string) => `customer-cart:${userId}`;

function readCachedCart(userId: string): CartItem[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(cartStorageKey(userId)) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((entry): entry is CartItem => {
      if (!entry || typeof entry !== 'object') return false;
      const item = entry as Partial<CartItem>;
      const product = item.product;
      return Boolean(
        product &&
        typeof product.id === 'string' &&
        product.id.trim() &&
        typeof product.name === 'string' &&
        product.name.trim() &&
        Number.isFinite(product.price) &&
        product.price >= 0 &&
        typeof product.imageUrl === 'string' &&
        Number.isInteger(item.quantity) &&
        Number(item.quantity) > 0
      );
    });
  } catch (error) {
    console.warn('[CartContext] Could not restore cached cart:', error);
    return [];
  }
}

function writeCachedCart(userId: string, nextItems: CartItem[]) {
  try {
    localStorage.setItem(cartStorageKey(userId), JSON.stringify(nextItems));
  } catch (error) {
    console.warn('[CartContext] Could not persist cart cache:', error);
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  const requestGeneration = useRef(0);

  const applyItems = useCallback((nextItems: CartItem[], userId?: string) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
    setTotalItems(nextItems.reduce((sum, item) => sum + item.quantity, 0));
    setSubtotal(nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
    if (userId) writeCachedCart(userId, nextItems);
  }, []);

  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (!user) {
      applyItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<ApiCartResponse>('/api/cart');
      if (generation !== requestGeneration.current) return;
      if (!Array.isArray(data.cart?.items)) throw new Error('The cart response did not contain an item list.');
      applyItems(
        data.cart.items.map((item) => ({
          product: mapApiProductToSparePart(normalizeApiProduct(item.product, item.productId)),
          quantity: item.quantity,
        })),
        user.id,
      );
    } catch (err) {
      if (generation !== requestGeneration.current) return;
      console.error('[CartContext] Failed to load server cart:', err);
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }, [applyItems, user]);

  // Restore this account's last visible cart immediately, then reconcile from
  // the server so prices, stock and product availability remain authoritative.
  useEffect(() => {
    if (user) {
      const cachedItems = readCachedCart(user.id);
      if (cachedItems.length > 0) applyItems(cachedItems, user.id);
      else applyItems([]);
    } else {
      applyItems([]);
    }
    refresh();
  }, [applyItems, refresh, user?.id]);

  const addItem = async (productId: string, quantity = 1): Promise<CartMutationResult> => {
    if (!productId || typeof productId !== 'string' || !Number.isInteger(quantity) || quantity < 1) {
      return { success: false, error: 'Choose a valid product and quantity.' };
    }
    if (!user) return { success: false, requiresAuth: true, error: 'Please log in to add items to your cart.' };
    try {
      const response = await api.post<ApiCartMutationResponse>('/api/cart', { productId, quantity });
      const cartItem = response?.item;
      const returnedId = typeof cartItem?.productId === 'string' ? cartItem.productId : productId;
      const returnedQuantity = Number(cartItem?.quantity);
      if (!response?.success || returnedId !== productId || !Number.isInteger(returnedQuantity) || returnedQuantity < 1) {
        throw new Error('The cart service returned invalid product details.');
      }
      const productPayload = cartItem?.product ?? response.product;
      const normalizedProduct = normalizeApiProduct(productPayload, productId);
      const product = mapApiProductToSparePart(normalizedProduct);
      const nextItems = itemsRef.current.filter((item) => item.product.id !== productId);
      nextItems.push({ product, quantity: returnedQuantity });
      requestGeneration.current += 1;
      applyItems(nextItems, user.id);
      void refresh();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add item to cart.';
      return { success: false, error: message };
    }
  };

  const setItemQuantity = async (productId: string, quantity: number): Promise<CartMutationResult> => {
    if (!user) return { success: false, requiresAuth: true, error: 'Please log in to manage your cart.' };
    if (!productId || !Number.isInteger(quantity) || quantity < 0) {
      return { success: false, error: 'Choose a valid product quantity.' };
    }
    try {
      await api.put('/api/cart', { productId, quantity });
      const nextItems = quantity === 0
        ? itemsRef.current.filter((item) => item.product.id !== productId)
        : itemsRef.current.map((item) => item.product.id === productId ? { ...item, quantity } : item);
      requestGeneration.current += 1;
      applyItems(nextItems, user.id);
      void refresh();
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
      requestGeneration.current += 1;
      applyItems(itemsRef.current.filter((item) => item.product.id !== productId), user.id);
      void refresh();
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
