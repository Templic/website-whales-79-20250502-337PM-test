/**
 * API Validation Rules Registration
 * 
 * This module registers specific validation rules for API endpoints
 * using the ValidationEngine.
 */

import { z } from 'zod';
import { ValidationEngine, ValidationRule } from '../security/advanced/apiValidation/ValidationEngine';
import { BusinessRuleValidation, ContextualValidation, SecurityValidation } from '../../shared/validation/advancedValidationPatterns';

// Import common validation rules - but handle them individually
import commonRules from './commonValidationRules';

/**
 * Register all API validation rules
 */
export function registerApiValidationRules() {
  // Register specialized rules first
  registerUserApiRules();
  registerSecurityApiRules();
  registerContentApiRules();
  registerAnalyticsApiRules();
  
  console.log('[API Validation] All API validation rules registered successfully');
}

/**
 * Register user API validation rules
 */
function registerUserApiRules() {
  // User profile
  ValidationEngine.registerRule('api:user:profile', {
    name: 'User Profile API Validation',
    description: 'Validates user profile API requests',
    schema: z.object({
      id: z.string().uuid().optional(),
      username: z.string().min(3).max(30),
      email: z.string().email(),
      displayName: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      links: z.array(
        z.object({
          platform: z.string(),
          url: z.string().url()
        })
      ).max(5).optional()
    }),
    target: 'body',
    tags: ['api', 'user', 'profile']
  });
  
  // User settings
  ValidationEngine.registerRule('api:user:settings', {
    name: 'User Settings API Validation',
    description: 'Validates user settings API requests',
    schema: z.object({
      id: z.string().uuid().optional(),
      preferences: z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notifications: z.object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
          sms: z.boolean().optional()
        }).optional(),
        language: z.string().min(2).max(5).optional(),
        timezone: z.string().optional()
      }).optional(),
      security: z.object({
        mfaEnabled: z.boolean().optional(),
        sessionTimeout: z.number().min(5).max(1440).optional(),
        allowMultipleSessions: z.boolean().optional()
      }).optional()
    }),
    target: 'body',
    tags: ['api', 'user', 'settings']
  });
  
  // Apply the rules to endpoints
  ValidationEngine.applyRulesToEndpoint('/api/users/profile', ['api:user:profile']);
  ValidationEngine.applyRulesToEndpoint('/api/users/settings', ['api:user:settings']);
}

/**
 * Register security API validation rules
 */
function registerSecurityApiRules() {
  // API key request validation
  ValidationEngine.registerRule('api:security:api-key-request', {
    name: 'API Key Request Validation',
    description: 'Validates API key generation requests',
    schema: z.object({
      name: z.string().min(1).max(100),
      scopes: z.array(z.string()).min(1),
      expiresAt: z.coerce.date().optional(),
      description: z.string().max(500).optional()
    }),
    target: 'body',
    tags: ['api', 'security', 'api-key']
  });
  
  // Security log search validation
  ValidationEngine.registerRule('api:security:logs', {
    name: 'Security Log Search Validation',
    description: 'Validates security log search parameters',
    schema: z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      level: z.enum(['info', 'warn', 'error', 'critical']).optional(),
      eventType: z.string().optional(),
      userId: z.string().uuid().optional(),
      ip: z.string().optional(),
      limit: z.number().min(1).max(1000).optional().default(100),
      offset: z.number().min(0).optional().default(0),
      sort: z.enum(['asc', 'desc']).optional().default('desc')
    }),
    target: 'query',
    tags: ['api', 'security', 'logs']
  });
  
  // Apply the rules to endpoints
  ValidationEngine.applyRulesToEndpoint('/api/security/keys', ['api:security:api-key-request']);
  ValidationEngine.applyRulesToEndpoint('/api/security/logs', ['api:security:logs']);
}

/**
 * Register content API validation rules
 */
function registerContentApiRules() {
  // Content creation validation
  ValidationEngine.registerRule('api:content:create', {
    name: 'Content Creation API Validation',
    description: 'Validates content creation API requests',
    schema: z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(1000).optional(),
      body: z.string().min(1),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      visibility: z.enum(['public', 'private', 'restricted']).default('public'),
      tags: z.array(z.string().min(1).max(50)).max(10).optional(),
      categoryId: z.string().uuid().optional(),
      metadata: z.record(z.string(), z.any()).optional()
    }),
    target: 'body',
    tags: ['api', 'content', 'create']
  });
  
  // Content update validation
  ValidationEngine.registerRule('api:content:update', {
    name: 'Content Update API Validation',
    description: 'Validates content update API requests',
    schema: z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(1000).optional(),
      body: z.string().min(1).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      visibility: z.enum(['public', 'private', 'restricted']).optional(),
      tags: z.array(z.string().min(1).max(50)).max(10).optional(),
      categoryId: z.string().uuid().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      updatedAt: z.coerce.date().optional()
    }),
    target: 'body',
    tags: ['api', 'content', 'update']
  });
  
  // Apply the rules to endpoints
  ValidationEngine.applyRulesToEndpoint('/api/content', ['api:content:create']);
  ValidationEngine.applyRulesToEndpoint('/api/content/:id', ['api:content:update']);
}

/**
 * Register analytics API validation rules
 */
function registerAnalyticsApiRules() {
  // Analytics report request validation
  ValidationEngine.registerRule('api:analytics:report', {
    name: 'Analytics Report API Validation',
    description: 'Validates analytics report API requests',
    schema: z.object({
      reportType: z.enum(['user-activity', 'content-performance', 'security-events', 'system-health']),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
      metrics: z.array(z.string()).min(1),
      dimensions: z.array(z.string()).optional(),
      filters: z.array(
        z.object({
          field: z.string(),
          operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']),
          value: z.any()
        })
      ).optional(),
      format: z.enum(['json', 'csv', 'pdf']).default('json')
    }).refine(data => {
      return data.startDate <= data.endDate;
    }, {
      message: 'Start date must be before or equal to end date',
      path: ['startDate']
    }),
    target: 'body',
    tags: ['api', 'analytics', 'report']
  });
  
  // Apply the rules to endpoints
  ValidationEngine.applyRulesToEndpoint('/api/analytics/reports', ['api:analytics:report']);
}

// We don't need to register common rules here since they're handled by initializeCommonValidationRules in the apiValidationMiddleware

// Don't automatically register rules - let routes.ts call this explicitly
// registerApiValidationRules();