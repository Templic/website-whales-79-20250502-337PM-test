/**
 * Order Validation Schemas
 * 
 * This module provides Zod schemas for validating order-related requests.
 * These schemas ensure proper input validation and prevent security vulnerabilities.
 */

import { z } from 'zod';

/**
 * Schema for validating product IDs
 */
const productIdSchema = z.string()
  .uuid('Invalid product ID format')
  .or(z.number().int('Product ID must be an integer').positive('Product ID must be positive'));

/**
 * Schema for postal/zip codes with international support
 */
const postalCodeSchema = z.string()
  .min(3, 'Postal code is too short')
  .max(12, 'Postal code is too long')
  .regex(/^[A-Za-z0-9\s-]+$/, 'Postal code contains invalid characters');

/**
 * Schema for validating address
 */
const addressSchema = z.object({
  streetAddress: z.string()
    .min(3, 'Street address is too short')
    .max(100, 'Street address is too long')
    .trim(),
  streetAddress2: z.string()
    .max(100, 'Street address line 2 is too long')
    .trim()
    .optional(),
  city: z.string()
    .min(2, 'City name is too short')
    .max(50, 'City name is too long')
    .trim(),
  state: z.string()
    .min(2, 'State/Province is too short')
    .max(50, 'State/Province is too long')
    .trim(),
  postalCode: postalCodeSchema,
  country: z.string()
    .min(2, 'Country is too short')
    .max(56, 'Country name is too long')
    .trim()
});

/**
 * Schema for creating new order
 */
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: productIdSchema,
      quantity: z.number()
        .int('Quantity must be an integer')
        .min(1, 'Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100'),
      price: z.number()
        .nonnegative('Price cannot be negative')
        .optional()
    })
  ).min(1, 'Order must contain at least one item'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameBillingAddress: z.boolean().optional(),
  paymentMethod: z.enum(['credit_card', 'paypal', 'crypto', 'bank_transfer']),
  paymentToken: z.string()
    .min(10, 'Invalid payment token')
    .max(256, 'Payment token too long')
    .optional(),
  discountCode: z.string()
    .max(30, 'Discount code too long')
    .optional(),
  notes: z.string()
    .max(500, 'Notes too long')
    .optional(),
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions')
});

/**
 * Schema for updating an existing order
 */
export const updateOrderSchema = z.object({
  orderId: z.string()
    .uuid('Invalid order ID format'),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['credit_card', 'paypal', 'crypto', 'bank_transfer']).optional(),
  paymentToken: z.string()
    .min(10, 'Invalid payment token')
    .max(256, 'Payment token too long')
    .optional(),
  notes: z.string()
    .max(500, 'Notes too long')
    .optional(),
  status: z.enum([
    'pending', 
    'processing', 
    'shipped', 
    'delivered', 
    'cancelled', 
    'refunded', 
    'on_hold'
  ]).optional()
});

/**
 * Schema for querying orders
 */
export const queryOrdersSchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1: any),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20: any),
  status: z.enum([
    'pending', 
    'processing', 
    'shipped', 
    'delivered', 
    'cancelled', 
    'refunded', 
    'on_hold',
    'all'
  ]).optional(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  customerId: z.string()
    .uuid('Invalid customer ID format')
    .optional(),
  sort: z.enum(['date_asc', 'date_desc', 'total_asc', 'total_desc']).optional()
});

/**
 * Schema for getting a specific order
 */
export const getOrderSchema = z.object({
  orderId: z.string()
    .uuid('Invalid order ID format')
});

/**
 * Schema for deleting/cancelling an order
 */
export const deleteOrderSchema = z.object({
  orderId: z.string()
    .uuid('Invalid order ID format'),
  reason: z.string()
    .max(500, 'Reason too long')
    .optional(),
  refundRequested: z.boolean().optional()
});

/**
 * Schema for processing payment
 */
export const processPaymentSchema = z.object({
  orderId: z.string()
    .uuid('Invalid order ID format'),
  paymentMethod: z.enum(['credit_card', 'paypal', 'crypto', 'bank_transfer']),
  amount: z.number()
    .positive('Amount must be positive'),
  currency: z.string()
    .length(3, 'Currency code must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be in ISO 4217 format (e.g., USD)'),
  paymentToken: z.string()
    .min(10, 'Invalid payment token')
    .max(256, 'Payment token too long'),
  billingAddress: addressSchema.optional(),
  savePaymentMethod: z.boolean().optional()
});