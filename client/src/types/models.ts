/**
 * Domain Models
 * 
 * This file contains type definitions for the core domain models of the application.
 * These types represent the data structures used throughout the system.
 */

import { 
  ProductId, 
  UserId, 
  OrderId, 
  BlogPostId, 
  TrackId, 
  AlbumId, 
  CommentId, 
  TourDateId 
} from './utils';

/**
 * User
 */
export interface User {
  id: UserId;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'artist';
  createdAt: string;
  lastLogin?: string;
  isVerified: boolean;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  marketingEmails?: boolean;
  newReleaseNotifications?: boolean;
  tourNotifications?: boolean;
}

/**
 * Product
 */
export interface Product {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  categories?: string[];
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags?: string[];
  featured?: boolean;
  createdAt: string;
}

/**
 * Cart item
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
 * Order
 */
export interface Order {
  id: OrderId;
  userId: UserId;
  items: CartItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  createdAt: string;
  updatedAt?: string;
  trackingNumber?: string;
}

/**
 * Address
 */
export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Blog post
 */
export interface BlogPost {
  id: BlogPostId;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: UserId;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  featuredImage?: string;
  tags?: string[];
  category: string;
  status: 'draft' | 'published';
  comments?: Comment[];
}

/**
 * Comment
 */
export interface Comment {
  id: CommentId;
  postId: BlogPostId;
  authorId?: UserId;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  approved: boolean;
}

/**
 * Track
 */
export interface Track {
  id: TrackId;
  title: string;
  artist: string;
  albumId?: AlbumId;
  duration?: string;
  audioUrl: string;
  coverImage?: string;
  releaseDate?: string;
  lyrics?: string;
  isExplicit?: boolean;
  featuredArtists?: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Album
 */
export interface Album {
  id: AlbumId;
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  tracks: Track[];
  description?: string;
  genre?: string;
  type: 'album' | 'ep' | 'single' | 'compilation';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Tour date
 */
export interface TourDate {
  id: TourDateId;
  venue: string;
  city: string;
  state?: string;
  country: string;
  date: string;
  time: string;
  ticketUrl?: string;
  status: 'scheduled' | 'cancelled' | 'sold_out' | 'postponed';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Product category
 */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
}

/**
 * Analytics data
 */
export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: {
    path: string;
    title: string;
    views: number;
    uniqueVisitors: number;
  }[];
  traffic: {
    dates: string[];
    pageViews: number[];
    uniqueVisitors: number[];
  };
  referrers: {
    source: string;
    visits: number;
    percentage: number;
  }[];
  devices: {
    type: 'desktop' | 'mobile' | 'tablet';
    count: number;
    percentage: number;
  }[];
}