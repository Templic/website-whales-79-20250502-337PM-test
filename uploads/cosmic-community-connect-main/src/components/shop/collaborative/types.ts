
import { Product } from "@/pages/Shop";

export type RoomMessage = {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  productRef?: string;
};

export type RoomParticipant = {
  id: string;
  username: string;
  avatar: string;
  isActive: boolean;
  lastActive: Date;
};

export interface CollaborativeShoppingProps {
  onProductView: (productId: string) => void;
  products: Product[];
}

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  couponCode?: string;
  discountAmount?: number;
  taxAmount?: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  customization?: string;
};

export type ShippingAddress = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
  addedAt: Date;
  customization?: string;
};

export type WishlistItem = {
  product: Product;
  addedAt: Date;
  notes?: string;
};

export type Coupon = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: Date;
  minimumPurchase?: number;
  productCategories?: string[];
  usageLimit?: number;
  used: number;
};
