/**
 * Domain Models
 * 
 * This file contains type definitions for the core data models used throughout the application.
 * These types represent the primary domain entities and their relationships.
 */

import { 
  ProductId, 
  OrderId, 
  UserId, 
  BlogPostId, 
  CommentId,
  TrackId,
  AlbumId,
  TourDateId
} from './utils';

/**
 * Product model representing items for sale
 */
export interface Product {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  categories?: string[];
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  stock?: number;
  sku?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: 'cm' | 'in';
  };
  weight?: {
    value: number;
    unit: 'kg' | 'lb';
  };
  featured?: boolean;
  new?: boolean;
  discountPercent?: number;
  releaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ProductCategory model
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  productCount?: number;
}

/**
 * CartItem model representing an item in the shopping cart
 */
export interface CartItem {
  id: string;
  productId: ProductId;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
  addedAt: string;
}

/**
 * Order model representing a customer order
 */
export interface Order {
  id: OrderId;
  userId: UserId;
  items: CartItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: {
    type: 'credit_card' | 'paypal' | 'bank_transfer';
    details: Record<string, string>;
  };
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Address model for shipping and billing
 */
export interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

/**
 * User model
 */
export interface User {
  id: UserId;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'artist';
  avatar?: string;
  addresses?: Address[];
  orders?: OrderId[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

/**
 * Blog post model
 */
export interface BlogPost {
  id: BlogPostId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: UserId;
    name: string;
    avatar?: string;
  };
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  publishedAt: string;
  updatedAt?: string;
  status: 'draft' | 'published' | 'archived';
  commentCount: number;
  viewCount: number;
  likeCount: number;
  readTime: number;
}

/**
 * Comment model
 */
export interface Comment {
  id: CommentId;
  postId: BlogPostId;
  parentId?: CommentId;
  author: {
    id?: UserId;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  replies?: Comment[];
  approved: boolean;
}

/**
 * Music track model
 */
export interface Track {
  id: TrackId;
  title: string;
  artist: string;
  albumId?: AlbumId;
  duration: string;
  audioUrl: string;
  coverArt?: string;
  releaseDate?: string;
  genre?: string[];
  lyrics?: string;
  playCount: number;
  downloadCount: number;
  price?: number;
  isFeatured?: boolean;
  isExclusive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Music album model
 */
export interface Album {
  id: AlbumId;
  title: string;
  artist: string;
  coverArt: string;
  releaseDate: string;
  genre?: string[];
  description?: string;
  tracks: Track[];
  trackCount: number;
  totalDuration: string;
  price?: number;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Tour date model
 */
export interface TourDate {
  id: TourDateId;
  venue: string;
  city: string;
  state?: string;
  country: string;
  date: string;
  doorTime?: string;
  startTime: string;
  endTime?: string;
  ticketUrl?: string;
  ticketPrice?: {
    min: number;
    max: number;
    currency: string;
  };
  isSoldOut: boolean;
  description?: string;
  venueDetails?: {
    address: string;
    capacity: number;
    mapUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
}