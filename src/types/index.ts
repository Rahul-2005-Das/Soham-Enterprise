export type PageRoute = 
  | 'home' 
  | 'about' 
  | 'services' 
  | 'service-detail' 
  | 'spare-parts' 
  | 'product-detail' 
  | 'checkout'
  | 'contact' 
  | 'faq' 
  | 'login' 
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'profile'
  | 'admin-users'
  | 'admin-login'
  | 'admin-dashboard';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLocation {
  label: string;
  road: string | null;
  neighbourhood: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  capturedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  image?: string | null;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: UserAddress[];
  currentLocation?: CustomerLocation | null;
}


export interface PublishedService {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  brandApplicability: string | null;
  inspectionFee: number | string;
  estimatedDuration: string;
  warrantyDays: number;
  active: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    image: string | null;
  };
}

export interface SparePartProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categoryId?: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  stockQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  rating: number;
  reviewCount: number;
  isOemVerified: boolean;
  imageUrl: string;
  additionalImages: string[];
  description: string;
  specifications: Record<string, string>;
  compatibility: string[];
  warrantyMonths: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  applianceServiced: string;
  reviewText: string;
  verified: boolean;
}

export interface FaqItem {
  id: string;
  category: 'general' | 'booking' | 'parts' | 'pricing';
  question: string;
  answer: string;
}

export interface CartItem {
  product: SparePartProduct;
  quantity: number;
}
