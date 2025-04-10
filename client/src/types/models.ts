/**
 * Model Types
 * 
 * This file contains the core data model types used throughout the application.
 * These types represent the domain entities and are used in components, 
 * API responses, and state management.
 */

/**
 * User model
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'customer' | 'guest';
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  marketingConsent: boolean;
}

/**
 * Product model
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  categories: string[];
  tags?: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  attributes?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
}

/**
 * Shopping Cart models
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

/**
 * Order models
 */
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

/**
 * Blog models
 */
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  author: Author;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  commentCount: number;
  status: 'draft' | 'published' | 'archived';
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  postId: number;
  approved: boolean;
}

/**
 * Music models
 */
export interface Music {
  id: number;
  title: string;
  artist: string;
  duration: string | null;
  albumId: number | null;
  audioUrl: string;
  coverArt?: string;
  lyrics?: string;
  createdAt: string;
  updatedAt: string | null;
  isArchived?: boolean;
  features?: MusicFeatures;
}

export interface MusicFeatures {
  bpm?: number;
  key?: string;
  moods?: string[];
  instruments?: string[];
  energy?: number;
  frequency?: FrequencyData;
}

export interface FrequencyData {
  low: number;
  mid: number;
  high: number;
  description: string;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  releaseDate: string;
  coverArt: string;
  tracks: Music[];
}

/**
 * Security and Analytics models
 */
export interface ScanResult {
  id: string;
  timestamp: string;
  type: 'security' | 'performance' | 'accessibility';
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  vulnerabilities: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  remediation?: string;
  detectedAt: string;
  status: 'open' | 'fixed' | 'ignored';
}

export interface AnalyticsData {
  visits: number;
  pageViews: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{ id: string; name: string; sales: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
}