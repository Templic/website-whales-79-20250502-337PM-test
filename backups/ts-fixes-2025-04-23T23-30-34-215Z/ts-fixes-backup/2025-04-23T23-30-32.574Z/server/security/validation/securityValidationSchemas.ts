/**
 * Security API Validation Schemas
 * 
 * This module provides Zod validation schemas for security-related endpoints.
 */

import { z } from 'zod';

/**
 * Validation schema for GET /api/security/scan query parameters
 */
export const securityScanQuerySchema = z.object({
  type: z.enum(['full', 'quick', 'focused']).optional().default('quick'),
  target: z.enum(['api', 'database', 'authentication', 'all']).optional().default('all'),
  detail: z.enum(['minimal', 'standard', 'verbose']).optional().default('standard'),
  async: z.boolean().optional().default(false)
});

/**
 * Validation schema for GET /api/security/auth-scan query parameters
 */
export const authScanQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
  detail: z.enum(['minimal', 'standard', 'verbose']).optional().default('standard')
});

/**
 * Validation schema for GET /api/test/security/logs query parameters
 */
export const securityLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
  level: z.enum(['debug', 'info', 'warn', 'error', 'critical']).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  category: z.enum(['authentication', 'authorization', 'api', 'database', 'system']).optional(),
  userId: z.string().uuid().optional(),
  ipAddress: z.string().ip().optional(),
  sort: z.enum(['timestamp', 'level']).optional().default('timestamp'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Validation schema for GET /api/test/security/scan query parameters
 */
export const testSecurityScanQuerySchema = z.object({
  target: z.enum(['api', 'database', 'authentication', 'all']).optional().default('all'),
  async: z.boolean().optional().default(false),
  mock: z.boolean().optional().default(false),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
});