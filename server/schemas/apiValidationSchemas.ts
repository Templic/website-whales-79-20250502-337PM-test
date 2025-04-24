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
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(3).max(50),
    (match) => match.replace(':', '')string().min(1).max(100)
}),
  
  (match) => match.replace(':', '')object({
    username: validationPatterns.username,
    email: validationPatterns.email,
    password: validationPatterns.password,
    (match) => match.replace(':', '')string().min(1)
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(20).max(500),
    password: validationPatterns.password,
    (match) => match.replace(':', '')string().min(1)
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
}),
  
  (match) => match.replace(':', '')object({
    email: validationPatterns.email
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(1),
    newPassword: validationPatterns.password,
    (match) => match.replace(':', '')string().min(1)
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')boolean()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(6).max(8).regex(/^\d+$/)
})
};

/**
 * User schemas
 */
export const userSchemas = {
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(1).max(100).optional(),
    email: validationPatterns.email.optional(),
    (match) => match.replace(':', '')string().max(500).optional(),
    (match) => match.replace(':', '')string().max(100).optional(),
    (match) => match.replace(':', '')string().max(200).optional()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')string().max(10).optional(),
    (match) => match.replace(':', '')string().max(50).optional()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(1).max(100),
    page: validationPatterns.page,
    limit: validationPatterns.limit,
    (match) => match.replace(':', '')enum(['username', 'createdAt', 'lastLogin']).optional()
})
};

/**
 * Payment schemas
 */
export const paymentSchemas = {
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')number().int().positive(),
    (match) => match.replace(':', '')string().min(3).max(3).default('usd'),
    (match) => match.replace(':', '')record(z.string()).optional()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(5).max(100),
    (match) => match.replace(':', '')string().min(5).max(100),
    (match) => match.replace(':', '')number().int().positive().optional(),
    email: validationPatterns.email.optional(),
    last4: z.string().length(4).regex(/^\d+$/).optional(),
    (match) => match.replace(':', '')number().int().positive().optional(),
    (match) => match.replace(':', '')string().min(3).max(3).optional()
})
};

/**
 * Content schemas
 */
export const contentSchemas = {
  (match) => match.replace(':', '')object({
    title: validationPatterns.title,
    (match) => match.replace(':', '')string().min(1).max(50000),
    (match) => match.replace(':', '')string().max(500).optional(),
    (match) => match.replace(':', '')array(z.string().min(1).max(30)).max(10).optional(),
    (match) => match.replace(':', '')boolean().optional().default(false),
    (match) => match.replace(':', '')string().regex(/^[a-z0-9-]+$/).optional(),
    (match) => match.replace(':', '')number().int().positive().optional()
}),
  
  (match) => match.replace(':', '')object({
    id: validationPatterns.id,
    title: validationPatterns.title.optional(),
    (match) => match.replace(':', '')string().min(1).max(50000).optional(),
    (match) => match.replace(':', '')string().max(500).optional(),
    (match) => match.replace(':', '')array(z.string().min(1).max(30)).max(10).optional(),
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')string().regex(/^[a-z0-9-]+$/).optional(),
    (match) => match.replace(':', '')number().int().positive().optional()
}),
  
  (match) => match.replace(':', '')object({
    postId: validationPatterns.id,
    (match) => match.replace(':', '')string().min(1).max(2000),
    (match) => match.replace(':', '')string().min(2).max(100).optional(),
    authorEmail: validationPatterns.email.optional()
}),
  
  (match) => match.replace(':', '')object({
    id: validationPatterns.id,
    (match) => match.replace(':', '')boolean()
})
};

/**
 * Search schemas
 */
export const searchSchemas = {
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(1).max(100),
    type z.enum(['all', 'posts', 'products', 'users', 'comments']).optional().default('all'),
    page: validationPatterns.page,
    limit: validationPatterns.limit
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(1).max(100),
    (match) => match.replace(':', '')record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
    (match) => match.replace(':', '')object({
      (match) => match.replace(':', '')string().datetime().optional(),
      (match) => match.replace(':', '')string().datetime().optional()
}).optional(),
    page: validationPatterns.page,
    limit: validationPatterns.limit,
    (match) => match.replace(':', '')string().max(50).optional(),
    (match) => match.replace(':', '')enum(['asc', 'desc']).optional()
  })
};

/**
 * Product schemas
 */
export const productSchemas = {
  (match) => match.replace(':', '')object({
    title: validationPatterns.title,
    (match) => match.replace(':', '')string().min(1).max(5000),
    (match) => match.replace(':', '')number().positive(),
    (match) => match.replace(':', '')number().positive().optional(),
    (match) => match.replace(':', '')string().max(100).optional(),
    (match) => match.replace(':', '')number().int().min(0).optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')number().int().positive().optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')record(z.string()).optional()
}),
  
  (match) => match.replace(':', '')object({
    id: validationPatterns.id,
    title: validationPatterns.title.optional(),
    (match) => match.replace(':', '')string().min(1).max(5000).optional(),
    (match) => match.replace(':', '')number().positive().optional(),
    (match) => match.replace(':', '')number().positive().optional(),
    (match) => match.replace(':', '')string().max(100).optional(),
    (match) => match.replace(':', '')number().int().min(0).optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')number().int().positive().optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')record(z.string()).optional()
})
};

/**
 * Media schemas
 */
export const mediaSchemas = {
  (match) => match.replace(':', '')object({
    type z.enum(['image', 'document', 'audio', 'video']),
    (match) => match.replace(':', '')string().min(1).max(100).optional(),
    (match) => match.replace(':', '')string().max(500).optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')string().max(200).optional() // For accessibility
}),
  
  (match) => match.replace(':', '')object({
    id: validationPatterns.id,
    (match) => match.replace(':', '')string().min(1).max(100).optional(),
    (match) => match.replace(':', '')string().max(500).optional(),
    (match) => match.replace(':', '')array(z.string()).max(10).optional(),
    (match) => match.replace(':', '')string().max(200).optional()
})
};

/**
 * Stats and analytics schemas
 */
export const analyticsSchemas = {
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().datetime(),
    (match) => match.replace(':', '')string().datetime()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')array(z.enum([
      'page_views', 'unique_visitors', 'conversion_rate',
      'bounce_rate', 'avg_session_duration', 'revenue'
    ])),
    (match) => match.replace(':', '')object({
      (match) => match.replace(':', '')string().datetime(),
      (match) => match.replace(':', '')string().datetime()
}),
    (match) => match.replace(':', '')enum(['day', 'week', 'month']).optional(),
    (match) => match.replace(':', '')record(z.union([z.string(), z.number(), z.boolean()])).optional()
  })
};

/**
 * Security and admin schemas
 */
export const adminSchemas = {
  (match) => match.replace(':', '')object({
    userId: validationPatterns.id,
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')enum(['user', 'admin', 'super_admin']).optional(),
    (match) => match.replace(':', '')boolean().optional()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')enum(['full', 'api', 'auth', 'database', 'custom']),
    (match) => match.replace(':', '')boolean().optional(),
    (match) => match.replace(':', '')array(z.string()).optional(),
    (match) => match.replace(':', '')array(z.string()).optional()
}),
  
  (match) => match.replace(':', '')object({
    (match) => match.replace(':', '')string().min(3).max(100),
    (match) => match.replace(':', '')union([z.string(), z.number(), z.boolean()]),
    (match) => match.replace(':', '')enum(['global', 'api', 'auth', 'database']).optional()
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