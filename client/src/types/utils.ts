/**
 * Utility Types
 * 
 * This file contains reusable utility types that can be used across the application.
 * These types help improve type safety and reduce code duplication.
 */

/**
 * Makes all properties in T nullable (null or undefined)
 * 
 * @example
 * type NullableUser = Nullable<User>;
 * // All user properties can now be null or undefined
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null | undefined;
};

/**
 * Creates a deeply partial type, allowing nested objects to have optional properties
 * 
 * @example
 * type PartialUserWithSettings = DeepPartial<UserWithSettings>;
 * // Allows { name: 'John', settings: { theme: 'dark' } } with all properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Creates a deeply required type, ensuring all nested properties are defined
 * 
 * @example
 * type RequiredUserProfile = DeepRequired<UserProfile>;
 * // All nested properties must be defined
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Similar to DeepPartial but for arrays and objects recursively
 * 
 * @example
 * type RecursivePartialConfig = RecursivePartial<Config>;
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: 
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> : 
    T[P];
};

/**
 * Creates a branded type for improved type safety
 * Prevents accidental assignment between different ID types
 * 
 * @example
 * type UserId = Branded<string, 'UserId'>;
 * type ProductId = Branded<string, 'ProductId'>;
 * 
 * const userId: UserId = 'user-123' as UserId;
 * const productId: ProductId = 'prod-456' as ProductId;
 * 
 * // This would generate a type error:
 * // const invalid: UserId = productId;
 */
export type Branded<K, T> = K & { __brand: T };

/**
 * User ID branded type for type safety
 */
export type UserId = Branded<string, 'UserId'>;

/**
 * Product ID branded type for type safety
 */
export type ProductId = Branded<string, 'ProductId'>;

/**
 * Email address branded type for validation
 */
export type EmailAddress = Branded<string, 'EmailAddress'>;

/**
 * API key branded type
 */
export type ApiKey = Branded<string, 'ApiKey'>;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems: number;
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
 * Filter parameters type
 */
export type FilterParams = Record<string, any>;

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[];
  includeArchived?: boolean;
}

/**
 * SpeechRecognition constructor interface for browser compatibility
 */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

/**
 * Browser-specific speech recognition interface
 */
export interface SpeechRecognition extends EventTarget {
  grammars: any;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onstart: (event: any) => void;
  onend: (event: any) => void;
}