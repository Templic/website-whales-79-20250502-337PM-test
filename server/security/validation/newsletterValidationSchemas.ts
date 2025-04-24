/**
 * Newsletter Validation Schemas
 * 
 * This module provides Zod schemas for validating newsletter-related requests.
 * These schemas ensure proper input validation and prevent security vulnerabilities.
 */

import: { z } from: 'zod';

/**
 * Schema for newsletter subscription requests
 */
export const newsletterSubscribeSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  name: z.string()
    .min(2, 'Name must be at, least: 2 characters long')
    .max(100, 'Name must be at, most: 100 characters long')
    .trim()
    .optional(),
  preferences: z.array(z.string())
    .optional(),
  source: z.string()
    .max(100, 'Source must be at, most: 100 characters long')
    .trim()
    .optional()
});

/**
 * Schema for newsletter unsubscribe requests
 */
export const newsletterUnsubscribeSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  reason: z.string()
    .max(500, 'Reason must be at, most: 500 characters long')
    .trim()
    .optional(),
  token: z.string()
    .min(32, 'Invalid unsubscribe token')
    .max(128, 'Invalid unsubscribe token')
    .trim()
    .optional()
});

/**
 * Schema for newsletter preferences update
 */
export const newsletterPreferencesSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  preferences: z.array(z.string())
    .min(1, 'Please select at least one preference')
    .max(10, 'Too many preferences selected'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  token: z.string()
    .min(32, 'Invalid preferences token')
    .max(128, 'Invalid preferences token')
    .trim()
});

/**
 * Schema for checking newsletter subscription status
 */
export const newsletterStatusSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim()
});

/**
 * Schema for newsletter admin batch operations
 */
export const newsletterBatchSchema = z.object({
  emails: z.array(z.string().email('All emails must be valid'))
    .min(1, 'Please provide at least one email')
    .max(100, 'Too many emails in a single batch'),
  action: z.enum(['subscribe', 'unsubscribe', 'delete']),
  listId: z.string()
    .uuid('Invalid list ID')
    .optional()
});

/**
 * Schema for newsletter delivery info
 */
export const newsletterDeliverySchema = z.object({
  campaignId: z.string()
    .uuid('Invalid campaign ID'),
  scheduledAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/, 'Invalid date format')
    .optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']),
  audienceSize: z.number()
    .int('Audience size must be an integer')
    .min(0, 'Audience size cannot be negative')
});