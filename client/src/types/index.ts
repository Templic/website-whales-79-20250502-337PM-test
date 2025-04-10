/**
 * Types Index
 * 
 * This file serves as the central export point for all type definitions.
 * It provides a convenient way to import types from anywhere in the application.
 */

// Import specific namespaces and types to avoid naming conflicts
import { AdminTypes, AdminButtonVariant, AdminButtonSize, FormatAction, FormatValue } from './admin';
import * as ApiTypes from './api';
import * as ModelTypes from './models';
import { schemas } from './schemas';
import * as ShopTypes from './shop';
import * as UtilTypes from './utils';

// Re-export everything in organized namespaces
export {
  // Admin types
  AdminTypes,
  AdminButtonVariant,
  AdminButtonSize,
  FormatAction,
  FormatValue,
  
  // API types
  ApiTypes,
  
  // Model types
  ModelTypes,
  
  // Schema types
  schemas,
  
  // Shop types
  ShopTypes,
  
  // Utility types
  UtilTypes
};

// Re-export specific models for direct use
export { 
  Product, 
  CartItem, 
  User, 
  Order, 
  Track, 
  Album, 
  BlogPost,
  TourDate
} from './models';

// Re-export specific utility types for direct use
export {
  Identifiable,
  Timestamped,
  AsyncResult,
  PaginatedResponse,
  DeepPartial,
  Branded
} from './utils';

// Re-export API response types
export {
  ApiResponse,
  ApiErrorResponse
} from './api';

// Type utility constants and helpers
export const PaginationType = {
  OFFSET: 'offset',
  CURSOR: 'cursor',
  LOAD_MORE: 'load_more',
  INFINITE_SCROLL: 'infinite_scroll'
} as const;

export type PaginationType = typeof PaginationType[keyof typeof PaginationType];

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean;
}

export type Nullable<T> = T | null;

// Declare the global window interface to support speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// SpeechRecognition types
export type { 
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionConstructor
} from './shop';