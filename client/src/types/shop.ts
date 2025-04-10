/**
 * Shop Component Types
 * 
 * This file centralizes type definitions for shop-related components.
 * It provides consistent typing for shop UI components, modals, and pages.
 */

import { Product, CartItem } from './models';
import { ProductId } from './utils';

/**
 * Shop page props
 */
export interface ShopPageProps {
  initialCategory?: string;
  featuredProductId?: ProductId;
}

/**
 * Product grid props
 */
export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string;
  onProductClick?: (productId: ProductId) => void;
}

/**
 * Product card props
 */
export interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

/**
 * Product gallery props
 */
export interface ProductGalleryProps {
  images: string[];
  initialImage?: string;
}

/**
 * Product filter props
 */
export interface ProductFilterProps {
  categories: string[];
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  inStockOnly?: boolean;
  onInStockChange?: (inStock: boolean) => void;
}

/**
 * Product sort props
 */
export interface ProductSortProps {
  sortOrder: ProductSortOrder;
  onSortChange: (sortOrder: ProductSortOrder) => void;
}

/**
 * Product sort order
 */
export type ProductSortOrder = 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'rating';

/**
 * Product search props
 */
export interface ProductSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  placeholder?: string;
  voiceSearchEnabled?: boolean;
}

/**
 * Cart display props
 */
export interface CartDisplayProps {
  items: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onClearCart?: () => void;
  loading?: boolean;
}

/**
 * Cart summary props
 */
export interface CartSummaryProps {
  subtotal: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  total: number;
  currency?: string;
  onCheckout?: () => void;
  checkoutDisabled?: boolean;
}

/**
 * Checkout form props
 */
export interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

/**
 * Checkout form data
 */
export interface CheckoutFormData {
  email: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddressSameAsShipping: boolean;
  billingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: 'card' | 'paypal';
  savePaymentInfo?: boolean;
}

/**
 * Payment form props
 */
export interface PaymentFormProps {
  amount: number;
  currency?: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

/**
 * Order confirmation props
 */
export interface OrderConfirmationProps {
  orderNumber: string;
  orderDate: string;
  estimatedDelivery?: string;
  items: CartItem[];
  total: number;
  onContinueShopping: () => void;
  onViewOrderDetails: () => void;
}

/**
 * Order tracking props
 */
export interface OrderTrackingProps {
  orderNumber: string;
  onTrackOrder: (orderNumber: string) => void;
}

/**
 * Collaborative shopping props
 */
export interface CollaborativeShoppingProps {
  roomId?: string;
  onCreateRoom?: () => void;
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: () => void;
}

/**
 * Speech recognition interface for voice search
 */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

/**
 * Voice search props
 */
export interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}