/**
 * API Types
 * 
 * This file contains type definitions for API requests and responses.
 * These types ensure consistency between frontend requests and backend responses.
 */

import { Product, User, Album, Track, BlogPost, TourDate, CollaborationProposal, ContactMessage } from './models';

/**
 * Base API response structure with common fields
 */
export interface BaseResponse {
  success: boolean;
  timestamp: string;
}

/**
 * Error response including error details
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Generic successful response with data
 */
export interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
}

/**
 * API response with pagination information
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Union type for paginated API responses
 */
export type PaginatedApiResponse<T> = PaginatedResponse<T> | ErrorResponse;

/**
 * Product list response with pagination
 */
export type ProductListResponse = PaginatedResponse<Product>;

/**
 * Product details response
 */
export type ProductResponse = SuccessResponse<Product>;

/**
 * User profile response
 */
export type UserProfileResponse = SuccessResponse<User>;

/**
 * User list response with pagination
 */
export type UserListResponse = PaginatedResponse<User>;

/**
 * Album list response with pagination
 */
export type AlbumListResponse = PaginatedResponse<Album>;

/**
 * Album details response
 */
export type AlbumResponse = SuccessResponse<Album>;

/**
 * Track list response with pagination
 */
export type TrackListResponse = PaginatedResponse<Track>;

/**
 * Blog post list response with pagination
 */
export type BlogPostListResponse = PaginatedResponse<BlogPost>;

/**
 * Blog post details response
 */
export type BlogPostResponse = SuccessResponse<BlogPost>;

/**
 * Tour dates response with pagination
 */
export type TourDateListResponse = PaginatedResponse<TourDate>;

/**
 * Collaboration proposals response with pagination
 */
export type CollaborationProposalListResponse = PaginatedResponse<CollaborationProposal>;

/**
 * Contact message submission response
 */
export type ContactMessageResponse = SuccessResponse<ContactMessage>;

/**
 * Authentication login request 
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Authentication registration request
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Authentication response
 */
export interface AuthResponse extends BaseResponse {
  success: true;
  user: User;
  token: string;
  expiresAt: string;
}