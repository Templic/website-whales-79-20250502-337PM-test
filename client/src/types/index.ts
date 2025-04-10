/**
 * Types Index
 * 
 * This file serves as the central export point for all type definitions.
 * It provides a convenient way to import types from anywhere in the application.
 */

// Re-export all types from individual files
export * from './admin';
export * from './api';
export * from './models';
export * from './schemas';
export * from './shop';
export * from './utils';

// Import and re-export specific types that might have naming conflicts
import { schemas } from './schemas';
export { schemas };

// Type utility constants and helpers
export const PaginationType = {
  OFFSET: 'offset',
  CURSOR: 'cursor'
} as const;

export type PaginationType = typeof PaginationType[keyof typeof PaginationType];

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount: number;
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
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}