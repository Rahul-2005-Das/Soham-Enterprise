import type {
  User,
  Address,
  ServiceCategory,
  Service,
  ServiceBooking,
  ProductCategory,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Review,
  Coupon,
  Notification,
  Role,
  BookingStatus,
  OrderStatus,
  PaymentStatus,
  DiscountType,
  NotificationType,
} from '@prisma/client';

export type {
  User,
  Address,
  ServiceCategory,
  Service,
  ServiceBooking,
  ProductCategory,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Review,
  Coupon,
  Notification,
  Role,
  BookingStatus,
  OrderStatus,
  PaymentStatus,
  DiscountType,
  NotificationType,
};

export interface ServiceWithCategory extends Service {
  category: ServiceCategory;
}

export interface ProductWithDetails extends Product {
  category: ProductCategory;
  images: ProductImage[];
  reviews?: Review[];
}

export interface BookingWithDetails extends ServiceBooking {
  service: Service;
  address: Address;
}

export interface CartWithItems extends Cart {
  items: (CartItem & {
    product: Product & { images: ProductImage[] };
  })[];
}

export interface OrderWithDetails extends Order {
  items: (OrderItem & {
    product?: Pick<Product, 'id' | 'name' | 'slug'> | null;
  })[];
  address: Address;
  payments: Payment[];
}
