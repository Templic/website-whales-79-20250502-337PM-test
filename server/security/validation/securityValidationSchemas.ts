/**
 * Security Validation Schemas
 * 
 * This module provides Zod validation schemas for security-related endpoints.
 */

import { z } from 'zod';

/**
 * Validation schema for security logs query parameters
 */
export const securityLogsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
  page: z.coerce.number().int().positive().optional().default(1),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  type: z.string().trim().min(1).max(100).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  format: z.enum(['json', 'csv']).optional().default('json')
});

/**
 * Validation schema for security scan query parameters
 */
export const securityScanQuerySchema = z.object({
  deep: z.coerce.boolean().optional().default(false),
  scope: z.enum(['full', 'quick', 'critical']).optional().default('full'),
  target: z.enum(['all', 'code', 'dependencies', 'configuration']).optional().default('all'),
  format: z.enum(['json', 'html']).optional().default('json')
});

/**
 * Validation schema for security scan body parameters
 */
export const securityScanBodySchema = z.object({
  options: z.object({
    includeVulnerabilityDetails: z.boolean().optional().default(true),
    customRules: z.array(z.string()).optional(),
    excludePaths: z.array(z.string()).optional(),
    timeout: z.number().int().positive().max(300000).optional().default(60000)
  }).optional()
});

/**
 * Validation schema for security auth scan query parameters
 */
export const securityAuthScanQuerySchema = z.object({
  authType: z.enum(['login', 'signup', 'password-reset', 'all']).optional().default('all'),
  includePayloads: z.coerce.boolean().optional().default(false),
  detail: z.enum(['minimal', 'standard', 'detailed']).optional().default('standard')
});

/**
 * Validation schema for security settings
 */
export const securitySettingsSchema = z.object({
  csrfProtection: z.boolean().optional(),
  xssProtection: z.boolean().optional(),
  rateLimiting: z.boolean().optional(),
  sqlInjectionProtection: z.boolean().optional(),
  bruteForceProtection: z.boolean().optional(),
  securityHeaders: z.boolean().optional(),
  securityLogging: z.boolean().optional(),
  securityScanning: z.boolean().optional(),
  securityMonitoring: z.boolean().optional()
});

/**
 * Validation schema for pagination parameters (used in multiple endpoints)
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

/**
 * Validation schema for date range parameters (used in multiple endpoints)
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional()
});