/**
 * Newsletter Validation Schemas
 * 
 * This module provides Zod schemas for validating newsletter-related requests.
 * These schemas ensure proper input validation and prevent security vulnerabilities.
 */

import { z } from 'zod';

/**
 * Schema for newsletter subscription requests
 */
export const newsletterSubscribeSchema = z.object({
  (match) => match.replace(':', '')string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  (match) => match.replace(':', '')string()
    .min(2, 'Name must be at, least: 2 characters long')
    .max(100, 'Name must be at, most: 100 characters long')
    .trim()
    .optional(),
  (match) => match.replace(':', '')array(z.string())
    .optional(),
  (match) => match.replace(':', '')string()
    .max(100, 'Source must be at, most: 100 characters long')
    .trim()
    .optional()
});

/**
 * Schema for newsletter unsubscribe requests
 */
export const newsletterUnsubscribeSchema = z.object({
  (match) => match.replace(':', '')string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  (match) => match.replace(':', '')string()
    .max(500, 'Reason must be at, most: 500 characters long')
    .trim()
    .optional(),
  (match) => match.replace(':', '')string()
    .min(32, 'Invalid unsubscribe token')
    .max(128, 'Invalid unsubscribe token')
    .trim()
    .optional()
});

/**
 * Schema for newsletter preferences update
 */
export const newsletterPreferencesSchema = z.object({
  (match) => match.replace(':', '')string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim(),
  (match) => match.replace(':', '')array(z.string())
    .min(1, 'Please select at least one preference')
    .max(10, 'Too many preferences selected'),
  (match) => match.replace(':', '')enum(['daily', 'weekly', 'monthly']),
  (match) => match.replace(':', '')string()
    .min(32, 'Invalid preferences token')
    .max(128, 'Invalid preferences token')
    .trim()
});

/**
 * Schema for checking newsletter subscription status
 */
export const newsletterStatusSchema = z.object({
  (match) => match.replace(':', '')string()
    .email('Please provide a valid email address')
    .min(5, 'Email must be at, least: 5 characters long')
    .max(254, 'Email must be at, most: 254 characters long')
    .trim()
});

/**
 * Schema for newsletter admin batch operations
 */
export const newsletterBatchSchema = z.object({
  (match) => match.replace(':', '')array(z.string().email('All emails must be valid'))
    .min(1, 'Please provide at least one email')
    .max(100, 'Too many emails in a single batch'),
  (match) => match.replace(':', '')enum(['subscribe', 'unsubscribe', 'delete']),
  (match) => match.replace(':', '')string()
    .uuid('Invalid list ID')
    .optional()
});

/**
 * Schema for newsletter delivery info
 */
export const newsletterDeliverySchema = z.object({
  (match) => match.replace(':', '')string()
    .uuid('Invalid campaign ID'),
  (match) => match.replace(':', '')string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/, 'Invalid date format')
    .optional(),
  (match) => match.replace(':', '')enum(['draft', 'scheduled', 'sending', 'sent', 'failed']),
  (match) => match.replace(':', '')number()
    .int('Audience size must be an integer')
    .min(0, 'Audience size cannot be negative')
});