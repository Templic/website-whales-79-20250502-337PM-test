/**
 * Type System Index
 * 
 * This file serves as the central export point for all types.
 * Import from this file to access the entire type system.
 */

// Re-export all types from their individual domain files
export * from './admin';
export * from './api';
export * from './models';
export * from './shop';
export * from './schemas';
export * from './utils';

// Export any additional types or interfaces that don't fit elsewhere
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean;
}

// Export composite types built from the base types
export interface ShoppingCartProps {
  items: import('./shop').CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onClearCart?: () => void;
  loading?: boolean;
}

export interface ShopHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  voiceSearchEnabled?: boolean;
  cartItemCount: number;
  onCartClick: () => void;
  onLogoClick: () => void;
}