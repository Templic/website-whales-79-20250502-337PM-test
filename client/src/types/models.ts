/**
 * Core Data Models
 * 
 * This file contains the central definitions for all data models used throughout the application.
 * These models represent the core data structures and business entities.
 */

import { UserId, ProductId } from './utils';

/**
 * User model representing application users
 */
export interface User {
  id: UserId;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
  avatar?: string;
  isActive: boolean;
}

/**
 * User role enum for access control
 */
export type UserRole = 'user' | 'admin' | 'super_admin';

/**
 * User preferences model for customization
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
}

/**
 * Notification settings for user preferences
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
  newReleases: boolean;
}

/**
 * Accessibility settings for user preferences
 */
export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  soundEffects: boolean;
}

/**
 * Product model for shop items
 */
export interface Product {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  image: string;
  categories: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
  features?: string[];
}

/**
 * Cart item model for shopping cart
 */
export interface CartItem {
  id: string;
  productId: ProductId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * Order model for completed purchases
 */
export interface Order {
  id: string;
  userId: UserId;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

/**
 * Order status enum
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Payment status enum
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

/**
 * Address model for shipping and billing
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
 * Blog post model
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  authorId: UserId;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  categories: string[];
  isPublished: boolean;
}

/**
 * Music album model
 */
export interface Album {
  id: number;
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  description: string;
  tracks: Track[];
  price?: number;
  genres: string[];
  isArchived: boolean;
}

/**
 * Music track model
 */
export interface Track {
  id: number;
  title: string;
  artist: string;
  albumId: number;
  duration: string;
  audioUrl: string;
  trackNumber: number;
  isPreview: boolean;
  price?: number;
}

/**
 * Tour date model for events
 */
export interface TourDate {
  id: number;
  venue: string;
  city: string;
  state: string;
  country: string;
  date: string;
  time: string;
  ticketUrl?: string;
  isSoldOut: boolean;
  isPastEvent: boolean;
}

/**
 * Newsletter subscription model
 */
export interface NewsletterSubscription {
  id: number;
  email: string;
  name?: string;
  subscriptionDate: string;
  isActive: boolean;
  interests: string[];
}

/**
 * Collaboration proposal model
 */
export interface CollaborationProposal {
  id: number;
  name: string;
  email: string;
  projectType: string;
  description: string;
  budget?: string;
  timeline?: string;
  submittedAt: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'declined';
}

/**
 * Contact message model
 */
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  isRead: boolean;
  isArchived: boolean;
}