/**
 * Type Transformers
 * 
 * This file contains utility functions for transforming between related types.
 * These transformers help with data conversion and mapping.
 */

import { 
  Product, 
  User,
  Order, 
  OrderItem,
  BlogPost,
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  DeepPartial
} from '@/types';

/**
 * Creates a partial version of a type with only the specified keys
 * @param obj Source object
 * @param keys Keys to include in the result
 * @returns New object with only the specified keys
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Creates a partial version of a type without the specified keys
 * @param obj Source object
 * @param keys Keys to exclude from the result
 * @returns New object without the specified keys
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete result[key as unknown as keyof Omit<T, K>];
  });
  return result;
}

/**
 * Transforms a Product into a simplified version for lists
 * @param product Full product object
 * @returns Simplified product for lists
 */
export function productToListItem(product: Product): Pick<Product, 'id' | 'name' | 'price' | 'thumbnail' | 'category'> {
  return pick(product, ['id', 'name', 'price', 'thumbnail', 'category']);
}

/**
 * Transforms an Order into a simplified summary
 * @param order Full order object
 * @returns Order summary
 */
export function orderToSummary(order: Order): Pick<Order, 'id' | 'status' | 'total' | 'createdAt'> & { itemCount: number } {
  return {
    ...pick(order, ['id', 'status', 'total', 'createdAt']),
    itemCount: order.items.length
  };
}

/**
 * Transforms a User into a public profile (removing sensitive information)
 * @param user Full user object
 * @returns Public user profile
 */
export function userToPublicProfile(user: User): Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'bio'> {
  return pick(user, ['id', 'firstName', 'lastName', 'avatar', 'bio']);
}

/**
 * Transforms a BlogPost into a preview version
 * @param post Full blog post
 * @returns Blog post preview
 */
export function blogPostToPreview(post: BlogPost): Pick<BlogPost, 'id' | 'title' | 'slug' | 'excerpt' | 'coverImage' | 'authorName' | 'publishedAt' | 'readTime'> {
  return pick(post, ['id', 'title', 'slug', 'excerpt', 'coverImage', 'authorName', 'publishedAt', 'readTime']);
}

/**
 * Wraps a value in a successful API response
 * @param data Data to wrap
 * @param message Optional success message
 * @returns API response object
 */
export function createApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates an API error response
 * @param message Error message
 * @param errors Validation errors
 * @param code Error code
 * @returns API error response object
 */
export function createApiErrorResponse(
  message: string, 
  errors?: Record<string, string[]>,
  code?: string
): ApiErrorResponse {
  return {
    success: false,
    message,
    errors,
    code,
    timestamp: new Date().toISOString()
  };
}

/**
 * Wraps data in a paginated response
 * @param data Array of items
 * @param page Current page number
 * @param pageSize Items per page
 * @param totalItems Total items count
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalItems: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize)
    }
  };
}

/**
 * Safely merges a partial object with an existing object
 * @param target Target object to update
 * @param partialData Partial data to merge
 * @returns New merged object
 */
export function mergeWithPartial<T extends object>(target: T, partialData: DeepPartial<T>): T {
  const result = { ...target };
  
  Object.keys(partialData).forEach(key => {
    const typedKey = key as keyof T;
    const value = partialData[typedKey];
    
    if (value !== undefined) {
      if (
        typeof value === 'object' && 
        value !== null && 
        !Array.isArray(value) && 
        typeof result[typedKey] === 'object' && 
        result[typedKey] !== null && 
        !Array.isArray(result[typedKey])
      ) {
        // Recursively merge nested objects
        result[typedKey] = mergeWithPartial(
          result[typedKey] as object, 
          value as DeepPartial<object>
        ) as T[keyof T];
      } else {
        // Directly assign primitives, arrays, or null
        result[typedKey] = value as T[keyof T];
      }
    }
  });
  
  return result;
}