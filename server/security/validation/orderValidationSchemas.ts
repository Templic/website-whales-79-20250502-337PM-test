/**
 * Order and Cart API Validation Schemas
 * 
 * This module provides Zod validation schemas for order and cart-related endpoints.
 */

import { z } from 'zod';

/**
 * Validation schema for order ID parameter
 */
export const orderIdSchema = z.object({
  orderId: z.string().uuid({ message: 'Invalid order ID format' })
});

/**
 * Validation schema for GET /orders/:orderId
 */
export const getOrderSchema = z.object({
  orderId: z.string().uuid({ message: 'Invalid order ID format' })
});

/**
 * Validation schema for GET /user/orders query parameters
 */
export const userOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(['date', 'total', 'status']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional()
});

/**
 * Validation schema for POST /cart/coupon
 */
export const applyCouponSchema = z.object({
  couponCode: z.string().trim().min(3, { message: 'Coupon code must be at least 3 characters' })
    .max(50, { message: 'Coupon code must be less than 50 characters' })
    .regex(/^[A-Za-z0-9\-_]+$/, { message: 'Coupon code contains invalid characters' })
});

/**
 * Validation schema for adding an item to the cart
 */
export const addToCartSchema = z.object({
  productId: z.string().uuid({ message: 'Invalid product ID format' }),
  quantity: z.number().int().positive().max(100),
  options: z.record(z.string(), z.string()).optional()
});

/**
 * Validation schema for updating cart item quantity
 */
export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid({ message: 'Invalid cart item ID format' }),
  quantity: z.number().int().positive().max(100)
});

/**
 * Validation schema for removing an item from the cart
 */
export const removeCartItemSchema = z.object({
  cartItemId: z.string().uuid({ message: 'Invalid cart item ID format' })
});