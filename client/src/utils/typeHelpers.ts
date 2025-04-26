/**
 * Type Utility Helpers
 * 
 * This file demonstrates practical uses of the utility types defined in the
 * types system. These functions leverage the type utilities to provide
 * type-safe operation on data structures.
 */

import { 
  Nullable, 
  DeepPartial,
  Branded,
  UserId, 
  ProductId,
  PaginationParams,
  SortParams,
  FilterParams
} from '@/types/utils';
import { Models } from '@/types';

/**
 * Type guard to check if a value is not null or undefined
 * 
 * @example
 * const items = [1, null, 2, undefined, 3].filter(isNotNullOrUndefined);
 * // items = [1, 2, 3]
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Creates a branded user ID from a string
 * Using branded types for improved type safety
 * 
 * @example
 * const userId = createUserId('user-123');
 * // userId is now a UserId type and not just a string
 */
export function createUserId(id: string): UserId {
  return id as UserId;
}

/**
 * Creates a branded product ID from a string
 * 
 * @example
 * const productId = createProductId('prod-456');
 */
export function createProductId(id: string): ProductId {
  return id as ProductId;
}

/**
 * Safely access deeply nested properties with type safety
 * 
 * @example
 * const userEmail = getNestedValue(user, 'preferences.notifications.email');
 */
export function getNestedValue<T, K extends string>(
  obj: T, 
  path: K
): unknown {
  return path.split('.').reduce((acc, part) => {
    return acc && typeof acc === 'object' ? (acc as unknown)[part] : undefined;
  }, obj as unknown);
}

/**
 * Creates a partial user object with nullable fields
 * Useful for update operations where only some fields may be provided
 * 
 * @example
 * const userUpdate = createPartialUser({ name: 'New Name', email: null });
 */
export function createPartialUser(userData: DeepPartial<Models.User>): Nullable<Models.User> {
  return userData as Nullable<Models.User>;
}

/**
 * Creates pagination parameters with defaults
 * 
 * @example
 * const pagination = createPagination({ page: 2 });
 * // Returns { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 }
 */
export function createPagination(params: Partial<PaginationParams> = {}): PaginationParams {
  return {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    totalItems: params.totalItems || 0,
    totalPages: params.totalPages || 0
  };
}

/**
 * Creates sort parameters
 * 
 * @example
 * const sorting = createSortParams('price', 'desc');
 */
export function createSortParams(field: string, direction: 'asc' | 'desc'): SortParams {
  return { field, direction };
}

/**
 * Creates filter parameters
 * 
 * @example
 * const filters = createFilters({ category: 'electronics', inStock: true });
 */
export function createFilters(filters: Record<string, unknown>): FilterParams {
  return filters;
}

/**
 * Type-safe event handler for DOM events
 * 
 * @example
 * const handleClick = createEventHandler<'click', HTMLButtonElement>((event) => {
 *   console.log('Button clicked:', event.currentTarget.textContent);
 * });
 */
export function createEventHandler<E extends keyof React.SyntheticEvent, T = Element>(
  handler: (event: React.SyntheticEvent<T, Event> & { type: E }) => void
) {
  return handler;
}

/**
 * Creates a type-safe record with specific keys
 * 
 * @example
 * const categoryCounts = createRecordWithKeys(['electronics', 'clothing'], 0);
 * // { electronics: 0, clothing: 0 }
 */
export function createRecordWithKeys<K extends string, V>(
  keys: readonly K[],
  defaultValue: V
): Record<K, V> {
  return keys.reduce((acc, key) => {
    acc[key] = defaultValue;
    return acc;
  }, {} as Record<K, V>);
}