/**
 * Utility Types
 * 
 * This file contains utility type definitions that are used throughout the application.
 * These types provide reusable patterns for common type transformations.
 */

/**
 * Makes all properties in T optional, including nested objects
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Makes specified keys K of type T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys K of type T required
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Makes specified keys K of type T readonly
 */
export type ReadonlyFields<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;

/**
 * Branded type for type-safe IDs
 * This prevents mixing different ID types even though they share the same base type
 */
export type Branded<T, Brand extends string> = T & { __brand: Brand };

// ID branded types
export type ProductId = Branded<string, 'ProductId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type UserId = Branded<string, 'UserId'>;
export type BlogPostId = Branded<string, 'BlogPostId'>;
export type CommentId = Branded<string, 'CommentId'>;
export type CategoryId = Branded<string, 'CategoryId'>;
export type TrackId = Branded<string, 'TrackId'>;
export type AlbumId = Branded<string, 'AlbumId'>;
export type TourDateId = Branded<string, 'TourDateId'>;
export type InvoiceId = Branded<string, 'InvoiceId'>;
export type SubscriptionId = Branded<string, 'SubscriptionId'>;
export type FileId = Branded<string, 'FileId'>;

/**
 * Represents a record with dynamic keys and specified value type
 */
export type DynamicRecord<T> = Record<string, T>;

/**
 * Represents an entity that has an ID
 */
export interface Identifiable {
  id: string;
}

/**
 * Represents an entity with timestamps
 */
export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

/**
 * Handles nullable values for form fields
 * This is useful for form inputs that may have empty values
 */
export type FormValue<T> = T | null | undefined;

/**
 * Helper type for handling async operations
 */
export type AsyncResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Options for pagination
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalItems?: number;
}

/**
 * Represents a response with paginated results
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Type for callback functions handling errors
 */
export type ErrorHandler = (error: Error) => void;

/**
 * Type for async function returning a value or error
 */
export type AsyncFunction<T> = () => Promise<T>;

/**
 * Type for async request with loading state
 */
export interface AsyncRequest<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T>;
  reset: () => void;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Filter operator type
 */
export type FilterOperator = 
  | 'eq' // equals
  | 'neq' // not equals
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'contains' // contains substring
  | 'startsWith' // starts with
  | 'endsWith' // ends with
  | 'in' // in array
  | 'notIn' // not in array
  | 'between'; // between two values

/**
 * Creates a union type from an object's values
 */
export type ValueOf<T> = T[keyof T];

/**
 * Makes all properties in T non-nullable
 */
export type NonNullable<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Create a type that allows only one property to be defined at a time
 */
export type OneOf<T> = {
  [K in keyof T]: Record<K, T[K]> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];