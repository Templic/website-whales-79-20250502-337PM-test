/**
 * Utility Types
 * 
 * This file contains utility type definitions that are used throughout the application.
 * These types provide common type patterns and branded types for type safety.
 */

/**
 * Branded type utility
 * Creates a type that is branded with a specific tag for type safety
 */
export type Branded<K, T> = K & { __brand: T };

/**
 * Branded ID types
 */
export type ProductId = Branded<string, 'ProductId'>;
export type UserId = Branded<string, 'UserId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type BlogPostId = Branded<string, 'BlogPostId'>;
export type CommentId = Branded<string, 'CommentId'>;
export type TrackId = Branded<string, 'TrackId'>;
export type AlbumId = Branded<string, 'AlbumId'>;
export type TourDateId = Branded<string, 'TourDateId'>;

/**
 * Make all properties in T optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties in T required
 */
export type RequiredFields<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * Make specific properties in T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

/**
 * Make all properties in T readonly
 */
export type ReadonlyFields<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Pick properties from T that are of type U
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Omit properties from T that are of type U
 */
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Make certain properties in T nullable
 */
export type Nullable<T> = T | null;

/**
 * Create a union type of all values in T
 */
export type ValueOf<T> = T[keyof T];

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filtering parameters
 */
export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean;
}

/**
 * A function with no parameters and no return value
 */
export type Nullary = () => void;

/**
 * A function with one parameter and no return value
 */
export type Unary<T> = (arg: T) => void;

/**
 * A function with two parameters and no return value
 */
export type Binary<T, U> = (arg1: T, arg2: U) => void;

/**
 * A function that creates a value of type T
 */
export type Factory<T> = () => T;

/**
 * A function that maps a value of type T to a value of type U
 */
export type Mapper<T, U> = (value: T) => U;

/**
 * A function that predicate for a value of type T
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Creates an ID creator function for a specific branded ID type
 */
export const createIdFactory = <T extends string>(brand: T) => {
  return (id: string): Branded<string, T> => id as Branded<string, T>;
};

// ID creator functions
export const createProductId = createIdFactory('ProductId');
export const createUserId = createIdFactory('UserId');
export const createOrderId = createIdFactory('OrderId');
export const createBlogPostId = createIdFactory('BlogPostId');
export const createCommentId = createIdFactory('CommentId');
export const createTrackId = createIdFactory('TrackId');
export const createAlbumId = createIdFactory('AlbumId');
export const createTourDateId = createIdFactory('TourDateId');