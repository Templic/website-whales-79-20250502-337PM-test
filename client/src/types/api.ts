/**
 * API Types
 * 
 * This file contains type definitions for API requests and responses.
 * It ensures consistent typing for data sent to and received from the server.
 */

import { Product, User, BlogPost, Track, Album, TourDate } from './models';
import { ProductId } from './utils';

/**
 * Common API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Product list response
 */
export interface ProductListResponse extends PaginatedResponse<Product> {}

/**
 * Product detail response
 */
export interface ProductDetailResponse extends ApiResponse<Product> {
  relatedProducts?: Product[];
}

/**
 * Create product request
 */
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  categories?: string[];
  inStock: boolean;
  tags?: string[];
  featured?: boolean;
}

/**
 * Update product request
 */
export interface UpdateProductRequest {
  id: ProductId;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  categories?: string[];
  inStock?: boolean;
  tags?: string[];
  featured?: boolean;
}

/**
 * Authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Authentication response
 */
export interface AuthResponse extends ApiResponse<{
  user: User;
  token: string;
  expiresAt: string;
}> {}

/**
 * Register request
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Contact form request
 */
export interface ContactFormRequest {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

/**
 * Newsletter subscription request
 */
export interface NewsletterSubscriptionRequest {
  email: string;
  name?: string;
  subscribeToUpdates?: boolean;
}

/**
 * Blog posts response
 */
export interface BlogPostsResponse extends PaginatedResponse<BlogPost> {
  categories?: string[];
  featuredPost?: BlogPost;
}

/**
 * Music tracks response
 */
export interface MusicTracksResponse extends PaginatedResponse<Track> {
  featuredTrack?: Track;
}

/**
 * Albums response
 */
export interface AlbumsResponse extends PaginatedResponse<Album> {
  featuredAlbum?: Album;
}

/**
 * Tour dates response
 */
export interface TourDatesResponse extends PaginatedResponse<TourDate> {
  upcomingDates?: TourDate[];
}