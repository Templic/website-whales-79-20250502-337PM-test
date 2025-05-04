/**
 * Validation Types Module
 * 
 * This module defines common types used throughout the validation system,
 * ensuring consistent typing across all validation-related components.
 */

import { z } from 'zod';

/**
 * Validation mode - determines how strict the validation is
 */
export type ValidationMode = 'strict' | 'flexible' | 'permissive';

/**
 * Validation target - specifies which part of the request to validate
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers' | 'cookies' | 'all';

/**
 * Validation log severity - used for security logging
 */
export type ValidationLogSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Validation error - represents a single validation failure
 */
export interface ValidationError {
  code: string;
  message: string;
  path: string[];
  field?: string;
  value?: any;
  suggestion?: string;
}

/**
 * Validation context - provides information about the request being validated
 */
export interface ValidationContext {
  path: string;
  method: string;
  userId?: string | number;
  ip?: string;
  isAuthenticated: boolean;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  timestamp: number;
  additionalContext?: Record<string, any>;
}

/**
 * Validation result - returned by validation operations
 */
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  timeMs: number;
  context: ValidationContext;
}

/**
 * Validation schema definition - defines a validation rule
 */
export interface ValidationSchema {
  id: string;
  name: string;
  description?: string;
  schema: z.ZodTypeAny;
  target?: ValidationTarget;
  isActive?: boolean;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

/**
 * Validation options - configures validation behavior
 */
export interface ValidationOptions {
  mode?: ValidationMode;
  target?: ValidationTarget;
  includeDetails?: boolean;
  statusCode?: number;
  logSeverity?: ValidationLogSeverity;
  useCasing?: 'preserve' | 'camel' | 'snake' | 'pascal';
  useAI?: boolean;
  aiOptions?: {
    detailedAnalysis?: boolean;
    contentType?: 'code' | 'logs' | 'network' | 'config' | 'api' | 'database';
    threshold?: number;
    maxTokens?: number;
  };
}

/**
 * Unified validation options - combines validation, CSRF, and rate limiting options
 */
export interface UnifiedValidationOptions extends ValidationOptions {
  skipCSRF?: boolean;
  csrfOptions?: {
    cookieName?: string;
    headerName?: string;
    secure?: boolean;
    ignoreMethods?: string[];
  };
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
    message?: string;
    statusCode?: number;
    headers?: boolean;
    skipSuccessfulRequests?: boolean;
    tierName?: string;
  };
}

/**
 * Validation pattern - a common regex pattern used for validation
 */
export interface ValidationPattern {
  id: string;
  name: string;
  description: string;
  regex: RegExp;
  examples?: {
    valid: string[];
    invalid: string[];
  };
  tags?: string[];
}

/**
 * Validation documentation options - configures documentation generation
 */
export interface ValidationDocOptions {
  outputDir?: string;
  format?: 'markdown' | 'json' | 'html';
  includePatterns?: boolean;
  includeExamples?: boolean;
  includeSchema?: boolean;
  title?: string;
}