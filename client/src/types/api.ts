/**
 * API Response Types
 * 
 * This file contains TypeScript interfaces for all API responses in the application.
 * Use these types with React Query hooks for better type safety.
 */

// Import model types
import type { 
  Product, 
  User, 
  CartItem, 
  Order, 
  Music, 
  BlogPost, 
  Comment 
} from './models';

/**
 * Standard API Response wrapper
 * Wraps all API responses with standard metadata
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Product API Responses
 */
export interface ProductListResponse extends ApiResponse<Product[]> {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters?: {
    category?: string[];
    priceRange?: [number, number];
    sortBy?: string;
    search?: string;
  };
}

export interface ProductDetailResponse extends ApiResponse<Product> {
  relatedProducts?: Product[];
}

/**
 * User API Responses
 */
export interface UserProfileResponse extends ApiResponse<User> {
  isAuthenticated: boolean;
  permissions: string[];
}

export interface AuthResponse extends ApiResponse<{
  user: User;
  token: string;
}> {
  expiresAt: string;
}

/**
 * Shopping Cart API Responses
 */
export interface CartResponse extends ApiResponse<{
  items: CartItem[];
  total: number;
  count: number;
}> {}

/**
 * Order API Responses
 */
export interface OrderResponse extends ApiResponse<Order> {}

export interface OrderListResponse extends ApiResponse<Order[]> {
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Music API Responses
 */
export interface MusicListResponse extends ApiResponse<Music[]> {
  totalCount: number;
  featuredTracks?: Music[];
}

export interface MusicDetailResponse extends ApiResponse<Music> {
  relatedTracks?: Music[];
}

/**
 * Blog API Responses
 */
export interface BlogListResponse extends ApiResponse<BlogPost[]> {
  totalCount: number;
  page: number;
  pageSize: number;
  categories?: string[];
}

export interface BlogPostResponse extends ApiResponse<BlogPost> {
  comments: Comment[];
  relatedPosts?: BlogPost[];
}

/**
 * Analytics API Responses
 */
export interface AnalyticsResponse extends ApiResponse<{
  visits: number;
  pageViews: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{ id: string; name: string; sales: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
}> {}

/**
 * Security Scan Response
 */
export interface SecurityScanResponse extends ApiResponse<{
  timestamp: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  vulnerabilities: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    remediation?: string;
  }>;
}> {}