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
  | 'admin-users';

export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

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
}


export type ApplianceType = 
  | 'aquaguard' 
  | 'ac' 
  | 'refrigerator' 
  | 'washing-machine' 
  | 'microwave' 
  | 'tv' 
  | 'geyser' 
  | 'other';

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  iconName: string;
  imageUrl: string;
  startingPrice: number;
  durationMinutes: number;
  warrantyDays: number;
  popular: boolean;
  commonProblems: string[];
  description: string;
  serviceProcess: { step: number; title: string; desc: string }[];
  benefits: string[];
  faqList: { question: string; answer: string }[];
}

export interface SparePartProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
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
