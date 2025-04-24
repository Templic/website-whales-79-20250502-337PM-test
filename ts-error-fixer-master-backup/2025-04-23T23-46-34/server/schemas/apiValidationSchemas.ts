/**
 * API Validation Schemas
 * 
 * This module provides comprehensive validation schemas for all API endpoints
 * using Zod. These schemas ensure input validation is consistent and thorough
 * across the entire application.
 */

import { z } from 'zod';
import { validationPatterns } from '../security/advanced/apiValidation';

/**
 * Authentication schemas
 */
export const authSchemas = {
  login: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(1).max(100)
  }),
  
  register: z.object({
    username: validationPatterns.username,
    email: validationPatterns.email,
    password: validationPatterns.password,
    confirmPassword: z.string().min(1)
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  resetPassword: z.object({
    token: z.string().min(20).max(500),
    password: validationPatterns.password,
    confirmPassword: z.string().min(1)
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  requestPasswordReset: z.object({
    email: validationPatterns.email
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: validationPatterns.password,
    confirmPassword: z.string().min(1)
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  twoFactorSetup: z.object({
    enable: z.boolean()
  }),
  
  twoFactorVerify: z.object({
    code: z.string().min(6).max(8).regex(/^\d+$/)
  })
};

/**
 * User schemas
 */
export const userSchemas = {
  updateProfile: z.object({
    displayName: z.string().min(1).max(100).optional(),
    email: validationPatterns.email.optional(),
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    avatar: z.string().max(200).optional()
  }),
  
  updateSettings: z.object({
    emailNotifications: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.string().max(10).optional(),
    timezone: z.string().max(50).optional()
  }),
  
  userSearchQuery: z.object({
    query: z.string().min(1).max(100),
    page: validationPatterns.page,
    limit: validationPatterns.limit,
    sortBy: z.enum(['username', 'createdAt', 'lastLogin']).optional()
  })
};

/**
 * Payment schemas
 */
export const paymentSchemas = {
  createPaymentIntent: z.object({
    amount: z.number().int().positive(),
    currency: z.string().min(3).max(3).default('usd'),
    metadata: z.record(z.string()).optional()
  }),
  
  confirmPayment: z.object({
    paymentMethodId: z.string().min(5).max(100),
    orderId: z.string().min(5).max(100),
    userId: z.number().int().positive().optional(),
    email: validationPatterns.email.optional(),
    last4: z.string().length(4).regex(/^\d+$/).optional(),
    amount: z.number().int().positive().optional(),
    currency: z.string().min(3).max(3).optional()
  })
};

/**
 * Content schemas
 */
export const contentSchemas = {
  createPost: z.object({
    title: validationPatterns.title,
    content: z.string().min(1).max(50000),
    summary: z.string().max(500).optional(),
    tags: z.array(z.string().min(1).max(30)).max(10).optional(),
    published: z.boolean().optional().default(false),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    categoryId: z.number().int().positive().optional()
  }),
  
  updatePost: z.object({
    id: validationPatterns.id,
    title: validationPatterns.title.optional(),
    content: z.string().min(1).max(50000).optional(),
    summary: z.string().max(500).optional(),
    tags: z.array(z.string().min(1).max(30)).max(10).optional(),
    published: z.boolean().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    categoryId: z.number().int().positive().optional()
  }),
  
  createComment: z.object({
    postId: validationPatterns.id,
    content: z.string().min(1).max(2000),
    authorName: z.string().min(2).max(100).optional(),
    authorEmail: validationPatterns.email.optional()
  }),
  
  moderateComment: z.object({
    id: validationPatterns.id,
    approved: z.boolean()
  })
};

/**
 * Search schemas
 */
export const searchSchemas = {
  globalSearch: z.object({
    query: z.string().min(1).max(100),
    type: z.enum(['all', 'posts', 'products', 'users', 'comments']).optional().default('all'),
    page: validationPatterns.page,
    limit: validationPatterns.limit
  }),
  
  advancedSearch: z.object({
    query: z.string().min(1).max(100),
    filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional(),
    page: validationPatterns.page,
    limit: validationPatterns.limit,
    sortBy: z.string().max(50).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional()
  })
};

/**
 * Product schemas
 */
export const productSchemas = {
  createProduct: z.object({
    title: validationPatterns.title,
    description: z.string().min(1).max(5000),
    price: z.number().positive(),
    salePrice: z.number().positive().optional(),
    sku: z.string().max(100).optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string()).max(10).optional(),
    categoryId: z.number().int().positive().optional(),
    tags: z.array(z.string()).max(10).optional(),
    featured: z.boolean().optional(),
    specifications: z.record(z.string()).optional()
  }),
  
  updateProduct: z.object({
    id: validationPatterns.id,
    title: validationPatterns.title.optional(),
    description: z.string().min(1).max(5000).optional(),
    price: z.number().positive().optional(),
    salePrice: z.number().positive().optional(),
    sku: z.string().max(100).optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string()).max(10).optional(),
    categoryId: z.number().int().positive().optional(),
    tags: z.array(z.string()).max(10).optional(),
    featured: z.boolean().optional(),
    specifications: z.record(z.string()).optional()
  })
};

/**
 * Media schemas
 */
export const mediaSchemas = {
  uploadFile: z.object({
    type: z.enum(['image', 'document', 'audio', 'video']),
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string()).max(10).optional(),
    alt: z.string().max(200).optional() // For accessibility
  }),
  
  updateMedia: z.object({
    id: validationPatterns.id,
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string()).max(10).optional(),
    alt: z.string().max(200).optional()
  })
};

/**
 * Stats and analytics schemas
 */
export const analyticsSchemas = {
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  
  metricRequest: z.object({
    metrics: z.array(z.enum([
      'page_views', 'unique_visitors', 'conversion_rate',
      'bounce_rate', 'avg_session_duration', 'revenue'
    ])),
    timeRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
    filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
  })
};

/**
 * Security and admin schemas
 */
export const adminSchemas = {
  updateUserStatus: z.object({
    userId: validationPatterns.id,
    isBanned: z.boolean().optional(),
    role: z.enum(['user', 'admin', 'super_admin']).optional(),
    isVerified: z.boolean().optional()
  }),
  
  securityScanRequest: z.object({
    scanType: z.enum(['full', 'api', 'auth', 'database', 'custom']),
    deep: z.boolean().optional(),
    includeFiles: z.array(z.string()).optional(),
    customChecks: z.array(z.string()).optional()
  }),
  
  updateSecuritySetting: z.object({
    setting: z.string().min(3).max(100),
    value: z.union([z.string(), z.number(), z.boolean()]),
    scope: z.enum(['global', 'api', 'auth', 'database']).optional()
  })
};

// Export all schemas
export const apiSchemas = {
  auth: authSchemas,
  user: userSchemas,
  payment: paymentSchemas,
  content: contentSchemas,
  search: searchSchemas,
  product: productSchemas,
  media: mediaSchemas,
  analytics: analyticsSchemas,
  admin: adminSchemas
};