/**
 * Shop Types
 * 
 * This file contains type definitions for shop-related components and features.
 * These types provide a consistent interface for shop functionality.
 */

import { ReactNode } from 'react';
import { CartItem as CartItemType, Product as ProductType } from './models';

// Re-export these types to maintain compatibility
export type Product = ProductType;
export type CartItem = CartItemType;

/**
 * Speech Recognition interfaces for voice searching
 */
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: unknown;
}

export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

export interface SpeechRecognition extends EventTarget {
  grammars: unknown;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onnomatch: (event: Event) => void;
  onaudiostart: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onsoundstart: (event: Event) => void;
  onsoundend: (event: Event) => void;
  onspeechstart: (event: Event) => void;
  onspeechend: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

/**
 * Shopping cart context
 */
export interface ShoppingCartContext {
  items: CartItemType[];
  addItem: (product: ProductType, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * Shopping cart props
 */
export interface ShoppingCartProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  cartItems?: CartItemType[]; 
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
  total?: number;
}

/**
 * Product card props
 */
export interface ProductCardProps {
  product: ProductType;
  onAddToCart?: (product: ProductType) => void;
  onQuickView?: (product: ProductType) => void;
  layout?: 'grid' | 'list';
  className?: string;
  hoverEffect?: boolean;
  showRating?: boolean;
  showCategory?: boolean;
  showPrice?: boolean;
  showActions?: boolean;
}

/**
 * Product list props
 */
export interface ProductListProps {
  products: ProductType[];
  onAddToCart?: (product: ProductType) => void;
  onQuickView?: (product: ProductType) => void;
  layout?: 'grid' | 'list';
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  columns?: 1 | 2 | 3 | 4;
  showFilter?: boolean;
  onFilterChange?: (filter: ShopFilter) => void;
  filter?: ShopFilter;
}

/**
 * Shop filter
 */
export interface ShopFilter {
  categories?: string[];
  priceRange?: [number, number];
  rating?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating';
  search?: string;
  inStock?: boolean;
  tags?: string[];
}

/**
 * Product detail props
 */
export interface ProductDetailProps {
  product: ProductType;
  onAddToCart?: (product: ProductType, quantity: number) => void;
  relatedProducts?: ProductType[];
  loading?: boolean;
  className?: string;
}

/**
 * Shop page props
 */
export interface ShopPageProps {
  products?: ProductType[];
  loading?: boolean;
  filter?: ShopFilter;
  onFilterChange?: (filter: ShopFilter) => void;
  title?: string;
  description?: string;
  heading?: string;
  subheading?: string;
  className?: string;
  sidebarPosition?: 'left' | 'right';
  showSidebar?: boolean;
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
}

/**
 * Shop sidebar props
 */
export interface ShopSidebarProps {
  filter?: ShopFilter;
  onFilterChange?: (filter: ShopFilter) => void;
  categories?: { id: string; name: string }[];
  className?: string;
  position?: 'left' | 'right';
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Shop header props
 */
export interface ShopHeaderProps {
  title?: string;
  description?: string;
  heading?: string;
  subheading?: string;
  className?: string;
  backgroundImage?: string;
  showSearch?: boolean;
  onSearch?: (search: string) => void;
  showFilter?: boolean;
  filter?: ShopFilter;
  onFilterChange?: (filter: ShopFilter) => void;
  children?: ReactNode;
  onVoiceSearch?: (transcript: string) => void;
  cartItemCount?: number;
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  allCategories?: Array<{ id: string; name: string }>;
  categoryFilter?: string;
  setCategoryFilter?: React.Dispatch<React.SetStateAction<string>>;
  priceRange?: [number, number];
  setPriceRange?: React.Dispatch<React.SetStateAction<[number, number]>>;
  sortOrder?: string;
  setSortOrder?: React.Dispatch<React.SetStateAction<string>>;
  viewType?: 'grid' | 'list';
  setViewType?: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
}

/**
 * Gallery image
 */
export interface GalleryImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Product gallery props
 */
export interface ProductGalleryProps {
  images: GalleryImage[];
  className?: string;
  thumbnailPosition?: 'left' | 'right' | 'bottom';
  zoomEnabled?: boolean;
  fullscreenEnabled?: boolean;
  initialIndex?: number;
  onImageChange?: (index: number) => void;
}

/**
 * Quick view props
 */
export interface QuickViewProps {
  product: ProductType;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: ProductType, quantity: number) => void;
}

/**
 * Voice search props
 */
export interface VoiceSearchProps {
  onSearch?: (query: string) => void;
  onTextChange?: (text: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  buttonPosition?: 'left' | 'right';
  searchOnSubmit?: boolean;
  searchOnInputChange?: boolean;
  initialQuery?: string;
  buttonOnly?: boolean;
  disabled?: boolean;
  language?: string;
}