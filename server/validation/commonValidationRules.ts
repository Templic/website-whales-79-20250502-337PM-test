/**
 * Common Validation Rules
 * 
 * This module defines common validation rules that can be reused across different endpoints.
 * These rules are automatically registered with the ValidationEngine during initialization.
 */

import { z } from 'zod';
import { SecurityValidation } from '../../shared/validation/advancedValidationPatterns';

/**
 * Common validation rules for authentication
 */
export const authRules = {
  // Email and password validation for login
  'auth:login': {
    name: 'Login Validation',
    description: 'Validates email and password format for login requests',
    schema: z.object({
      email: z.string().email({ message: 'Invalid email address format' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
      rememberMe: z.boolean().optional()
    }),
    target: 'body',
    tags: ['auth', 'security']
  },
  
  // Registration validation
  'auth:register': {
    name: 'Registration Validation',
    description: 'Validates user registration data',
    schema: z.object({
      email: z.string().email({ message: 'Invalid email address format' }),
      password: z.string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
        .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
      confirmPassword: z.string(),
      username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      terms: z.boolean().refine(val => val === true, { message: 'You must accept the terms and conditions' })
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }),
    target: 'body',
    tags: ['auth', 'security', 'registration']
  },
  
  // Token validation
  'auth:token': {
    name: 'Token Validation',
    description: 'Validates authentication tokens',
    schema: SecurityValidation.securityToken({
      type: 'jwt'
    }),
    target: 'headers',
    tags: ['auth', 'security', 'jwt']
  }
};

/**
 * Common validation rules for user data
 */
export const userRules = {
  // User profile update validation
  'user:profile-update': {
    name: 'Profile Update Validation',
    description: 'Validates user profile update data',
    schema: z.object({
      username: z.string().min(3).optional(),
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional(),
      avatar: z.string().url().optional(),
      social: z.object({
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        website: z.string().url().optional()
      }).optional()
    }),
    target: 'body',
    tags: ['user', 'profile']
  },
  
  // User ID path parameter validation
  'user:id-param': {
    name: 'User ID Parameter Validation',
    description: 'Validates user ID in URL parameters',
    schema: z.object({
      userId: z.string().uuid({ message: 'Invalid user ID format' })
    }),
    target: 'params',
    tags: ['user', 'params']
  }
};

/**
 * Common validation rules for API security
 */
export const securityRules = {
  // API key validation
  'security:api-key': {
    name: 'API Key Validation',
    description: 'Validates API key in request headers',
    schema: z.object({
      'x-api-key': SecurityValidation.securityToken({
        type: 'api-key'
      })
    }),
    target: 'headers',
    tags: ['security', 'api-key']
  },
  
  // CSRF token validation
  'security:csrf': {
    name: 'CSRF Token Validation',
    description: 'Validates CSRF token in request headers',
    schema: z.object({
      'x-csrf-token': z.string().min(1, { message: 'CSRF token is required' })
    }),
    target: 'headers',
    tags: ['security', 'csrf']
  }
};

/**
 * Common validation for content and uploads
 */
export const contentRules = {
  // Content creation validation
  'content:create': {
    name: 'Content Creation Validation',
    description: 'Validates content creation data',
    schema: z.object({
      title: z.string().min(1, { message: 'Title is required' }).max(200, { message: 'Title cannot exceed 200 characters' }),
      body: z.string().min(1, { message: 'Content body is required' }).max(50000, { message: 'Content is too long' }),
      tags: z.array(z.string()).max(10, { message: 'Maximum of 10 tags allowed' }).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      category: z.string().optional()
    }),
    target: 'body',
    tags: ['content', 'creation']
  },
  
  // File upload validation
  'content:upload': {
    name: 'File Upload Validation',
    description: 'Validates file uploads',
    schema: z.object({
      file: SecurityValidation.fileUpload({
        maxSizeBytes: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: [
          'image/jpeg', 
          'image/png', 
          'image/gif', 
          'application/pdf', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      })
    }),
    target: 'body',
    tags: ['content', 'upload', 'file']
  }
};

/**
 * Common validation for pagination and filtering
 */
export const queryRules = {
  // Standard pagination validation
  'query:pagination': {
    name: 'Pagination Query Validation',
    description: 'Validates pagination parameters in query string',
    schema: z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional().default('asc')
    }),
    target: 'query',
    tags: ['query', 'pagination']
  },
  
  // Date range validation
  'query:date-range': {
    name: 'Date Range Query Validation',
    description: 'Validates date range parameters in query string',
    schema: z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional()
    }).refine(data => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    }, {
      message: 'Start date must be before end date',
      path: ['startDate']
    }),
    target: 'query',
    tags: ['query', 'date', 'range']
  }
};

// Export all rules combined
export default {
  ...authRules,
  ...userRules,
  ...securityRules,
  ...contentRules,
  ...queryRules
};