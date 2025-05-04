/**
 * API Validation Types Module
 * 
 * Common type definitions for the API validation system
 */

// Export the validation options from ValidationEngine
export type { ValidationOptions } from './ValidationEngine';

// Validation mode definitions
export type ValidationMode = 'strict' | 'flexible' | 'permissive';

// Validation target definitions
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers' | 'cookies' | 'all';

// Validation severity levels
export type ValidationSeverity = 'low' | 'medium' | 'high' | 'critical';

// Validation request context interface
export interface ValidationContext {
  path: string;
  method: string;
  userId?: string | number;
  ip?: string;
  isAuthenticated?: boolean;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  timestamp: number;
  additionalContext?: Record<string, any>;
}

// Validation error details
export interface ValidationErrorDetail {
  code: string;
  message: string;
  path: string[];
  field?: string;
  value?: any;
  suggestion?: string;
}

// Validation result interface
export interface ValidationResult {
  success: boolean;
  errors?: ValidationErrorDetail[];
  timeMs?: number;
  context?: ValidationContext;
}