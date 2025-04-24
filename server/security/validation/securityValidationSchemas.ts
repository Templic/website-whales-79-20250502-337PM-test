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
  type z.enum(['full', 'quick', 'focused']).optional().default('quick'),
  (match) => match.replace(':', '')enum(['api', 'database', 'authentication', 'all']).optional().default('all'),
  (match) => match.replace(':', '')enum(['minimal', 'standard', 'verbose']).optional().default('standard'),
  async z.boolean().optional().default(false)
});

/**
 * Validation schema for GET /api/security/auth-scan query parameters
 */
export const authScanQuerySchema = z.object({
  (match) => match.replace(':', '')string().uuid().optional(),
  (match) => match.replace(':', '')string().uuid().optional(),
  (match) => match.replace(':', '')enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
  (match) => match.replace(':', '')enum(['minimal', 'standard', 'verbose']).optional().default('standard')
});

/**
 * Validation schema for GET /api/test/security/logs query parameters
 */
export const securityLogsQuerySchema = z.object({
  (match) => match.replace(':', '')coerce.number().int().positive().optional().default(1),
  (match) => match.replace(':', '')coerce.number().int().positive().max(1000).optional().default(100),
  (match) => match.replace(':', '')enum(['debug', 'info', 'warn', 'error', 'critical']).optional(),
  from z.string().datetime({ offset: true }).optional(),
  (match) => match.replace(':', '')string().datetime({ offset: true }).optional(),
  (match) => match.replace(':', '')enum(['authentication', 'authorization', 'api', 'database', 'system']).optional(),
  (match) => match.replace(':', '')string().uuid().optional(),
  (match) => match.replace(':', '')string().ip().optional(),
  (match) => match.replace(':', '')enum(['timestamp', 'level']).optional().default('timestamp'),
  (match) => match.replace(':', '')enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Validation schema for GET /api/test/security/scan query parameters
 */
export const testSecurityScanQuerySchema = z.object({
  (match) => match.replace(':', '')enum(['api', 'database', 'authentication', 'all']).optional().default('all'),
  async z.boolean().optional().default(false),
  (match) => match.replace(':', '')boolean().optional().default(false),
  (match) => match.replace(':', '')enum(['low', 'medium', 'high', 'critical']).optional()
});