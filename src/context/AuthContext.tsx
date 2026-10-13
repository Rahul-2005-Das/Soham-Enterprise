import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthUser, CustomerLocation, UserAddress } from '../types';

type LocationStatus = 'idle' | 'requesting' | 'available' | 'denied' | 'unavailable' | 'error';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  location: CustomerLocation | null;
  locationStatus: LocationStatus;
  requestCurrentLocation: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  requestLoginCode: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyLoginCode: (email: string, code: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  addAddress: (addressData: Partial<UserAddress>) => Promise<{ success: boolean; error?: string; address?: UserAddress }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const isAuthenticated = user !== null;
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const sessionCheckId = useRef(0);

  const setAuthenticatedUser = (authenticatedUser: AuthUser) => {
    sessionCheckId.current += 1;
    setUser(authenticatedUser);
    setLocation(authenticatedUser.currentLocation || null);
    setLocationStatus(authenticatedUser.currentLocation ? 'available' : 'idle');
    setLoading(false);
  };

  // Check current session on mount (HTTP-only cookie sent automatically)
  const refreshUser = async () => {
    const checkId = ++sessionCheckId.current;
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    setLoading(true);

    try {
      const url = isAdminPage ? '/api/auth/me?admin=true' : '/api/auth/me';
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (checkId !== sessionCheckId.current) return;
      if (res.ok) {
        const data = await res.json();
        if (checkId !== sessionCheckId.current) return;
        const hasExpectedRole = isAdminPage
          ? data.user?.role === 'ADMIN'
          : data.user?.role === 'CUSTOMER';
        if (data.success && data.user && hasExpectedRole) {
          setUser(data.user);
          setLocation(data.user.currentLocation || null);
          setLocationStatus(data.user.currentLocation ? 'available' : 'idle');
        }
      } else if (res.status === 401 || res.status === 403) {
        setUser(null);
        setLocation(null);
        setLocationStatus('idle');
      } else {
        console.warn(`[AuthContext] Session check returned HTTP ${res.status}; preserving the current session.`);
      }
    } catch (err) {
      if (checkId !== sessionCheckId.current) return;
      console.warn('[AuthContext] Could not fetch session:', err);
    } finally {
      if (checkId === sessionCheckId.current) setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/customer/location', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
          const data = await res.json();
          if (!res.ok || !data.success || !data.location) {
            setLocationStatus('error');
            return;
          }

          setLocation(data.location);
          setUser((current) => current ? { ...current, currentLocation: data.location } : current);
          setLocationStatus('available');
        } catch {
          setLocationStatus('error');
        }
      },
      (error) => {
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || data.user?.role !== 'CUSTOMER') {
        return { success: false, error: data.error || 'Login failed' };
      }
      setAuthenticatedUser(data.user);
      if (data.user.role === 'CUSTOMER') requestCurrentLocation();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || data.user?.role !== 'ADMIN') {
        return { success: false, error: data.error || 'Invalid email or password.' };
      }
      setAuthenticatedUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during admin login' };
    }
  };

  const requestLoginCode = async (email: string) => {
    try {
      const res = await fetch('/api/auth/request-login-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Could not request a sign-in code.' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error requesting a sign-in code.' };
    }
  };

  const verifyLoginCode = async (email: string, code: string) => {
    try {
      const res = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid or expired verification code.' };
      }
      if (data.user?.role !== 'CUSTOMER') {
        return { success: false, error: 'This account cannot sign in as a customer.' };
      }
      setAuthenticatedUser(data.user);
      if (data.user.role === 'CUSTOMER') requestCurrentLocation();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying the sign-in code.' };
    }
  };

  const register = async (inputData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setAuthenticatedUser(data.user);
      requestCurrentLocation();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: isAdminPage }),
      });
    } catch (err) {
      console.warn('[AuthContext] Logout failed:', err);
    } finally {
      sessionCheckId.current += 1;
      setUser(null);
      setLocation(null);
      setLocationStatus('idle');
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to update profile' };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating profile' };
    }
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Password change failed' };
      }
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error changing password' };
    }
  };

  const addAddress = async (addressData: Partial<UserAddress>) => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to save address' };
      }
      await refreshUser();
      return { success: true, address: data.address };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error saving address' };
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to delete address' };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error deleting address' };
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to set default address' };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error setting default address' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        location,
        locationStatus,
        requestCurrentLocation,
        login,
        loginAdmin,
        requestLoginCode,
        verifyLoginCode,
        register,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        addAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
