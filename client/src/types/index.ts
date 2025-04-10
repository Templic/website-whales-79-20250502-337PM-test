/**
 * Types Index File
 * 
 * This file serves as a central export point for all type definitions.
 * Import from this file to access any type in the application.
 * 
 * @example
 * // Import specific types
 * import { Product, CartItem } from '@/types';
 * 
 * // Import from a specific category
 * import { loginSchema, registerSchema } from '@/types/schemas';
 */

// Import and re-export model types
import * as Models from './models';
export { Models };

// Import and re-export API types
import * as API from './api';
export { API };

// Re-export other type modules
export * from './admin';
export * from './shop';
export * from './utils';

// For schemas, use a namespace to avoid name collisions
import * as Schemas from './schemas';
export { Schemas };

// Export some commonly used utility types directly
export { 
  Nullable, 
  DeepPartial, 
  Branded,
  UserId,
  ProductId,
  OrderId,
  BlogPostId,
  MusicId
} from './utils';