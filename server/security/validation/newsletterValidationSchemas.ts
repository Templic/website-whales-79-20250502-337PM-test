/**
 * Newsletter API Validation Schemas
 * 
 * This module provides Zod validation schemas for newsletter-related endpoints.
 */

import { z } from 'zod';

/**
 * Validation schema for newsletter ID parameter
 */
export const newsletterIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid newsletter ID format' })
});

/**
 * Validation schema for GET /api/newsletters/:id
 */
export const getNewsletterSchema = z.object({
  id: z.string().uuid({ message: 'Invalid newsletter ID format' })
});

/**
 * Validation schema for newsletter query parameters
 */
export const newsletterQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(['date', 'title', 'status']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().trim().max(100).optional()
});

/**
 * Validation schema for creating a newsletter
 */
export const createNewsletterSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(200, { message: 'Title must be 200 characters or less' }),
  content: z.string().min(1, { message: 'Content is required' }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishDate: z.string().datetime({ offset: true }).optional(),
  expiryDate: z.string().datetime({ offset: true }).optional(),
  tags: z.array(z.string().trim()).optional().default([]),
  featuredImage: z.string().url().optional(),
  allowComments: z.boolean().optional().default(true)
});

/**
 * Validation schema for updating a newsletter (PATCH /api/newsletters/:id)
 */
export const updateNewsletterSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishDate: z.string().datetime({ offset: true }).optional().nullable(),
  expiryDate: z.string().datetime({ offset: true }).optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  featuredImage: z.string().url().optional().nullable(),
  allowComments: z.boolean().optional()
});