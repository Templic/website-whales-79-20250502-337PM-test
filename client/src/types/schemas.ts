/**
 * Validation Schemas
 * 
 * This file contains Zod schemas for form validation and data parsing.
 * These schemas ensure data meets specified requirements before processing.
 */

import { z } from 'zod';

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  message: z.string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message must be less than 2000 characters' }),
  subject: z.string().optional(),
});

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  name: z.string().optional(),
  subscribeToUpdates: z.boolean().optional(),
});

/**
 * Authentication schema
 */
export const authSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  rememberMe: z.boolean().optional(),
});

/**
 * Registration schema
 */
export const registerSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Product schema
 */
export const productSchema = z.object({
  name: z.string()
    .min(2, { message: 'Product name must be at least 2 characters' })
    .max(100, { message: 'Product name must be less than 100 characters' }),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must be less than 2000 characters' }),
  price: z.number()
    .positive({ message: 'Price must be positive' }),
  image: z.string()
    .url({ message: 'Please enter a valid image URL' }),
  category: z.string(),
  categories: z.array(z.string()).optional(),
  inStock: z.boolean(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

/**
 * Cart item schema
 */
export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number()
    .int({ message: 'Quantity must be a whole number' })
    .positive({ message: 'Quantity must be positive' }),
});

/**
 * Address schema
 */
export const addressSchema = z.object({
  fullName: z.string()
    .min(2, { message: 'Full name must be at least 2 characters' }),
  line1: z.string()
    .min(3, { message: 'Address line 1 must be at least 3 characters' }),
  line2: z.string().optional(),
  city: z.string()
    .min(2, { message: 'City must be at least 2 characters' }),
  state: z.string()
    .min(2, { message: 'State must be at least 2 characters' }),
  postalCode: z.string()
    .min(3, { message: 'Postal code must be at least 3 characters' }),
  country: z.string()
    .min(2, { message: 'Country must be at least 2 characters' }),
  phone: z.string().optional(),
});

/**
 * Checkout form schema
 */
export const checkoutSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  shippingAddress: addressSchema,
  billingAddressSameAsShipping: z.boolean(),
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['card', 'paypal']),
  savePaymentInfo: z.boolean().optional(),
}).refine(
  (data) => data.billingAddressSameAsShipping || data.billingAddress,
  {
    message: 'Billing address is required when different from shipping address',
    path: ['billingAddress'],
  }
);

/**
 * Blog post schema
 */
export const blogPostSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(200, { message: 'Title must be less than 200 characters' }),
  content: z.string()
    .min(50, { message: 'Content must be at least 50 characters' }),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string(),
  status: z.enum(['draft', 'published']),
});

/**
 * Comment schema
 */
export const commentSchema = z.object({
  authorName: z.string()
    .min(2, { message: 'Name must be at least 2 characters' }),
  authorEmail: z.string()
    .email({ message: 'Please enter a valid email address' }),
  content: z.string()
    .min(3, { message: 'Comment must be at least 3 characters' })
    .max(1000, { message: 'Comment must be less than 1000 characters' }),
});

/**
 * Tour date schema
 */
export const tourDateSchema = z.object({
  venue: z.string()
    .min(2, { message: 'Venue name must be at least 2 characters' }),
  city: z.string()
    .min(2, { message: 'City must be at least 2 characters' }),
  state: z.string().optional(),
  country: z.string()
    .min(2, { message: 'Country must be at least 2 characters' }),
  date: z.string(),
  time: z.string(),
  ticketUrl: z.string().url().optional(),
  status: z.enum(['scheduled', 'cancelled', 'sold_out', 'postponed']),
  description: z.string().optional(),
});

// Export all validation schemas
export const schemas = {
  contactFormSchema,
  newsletterSchema,
  authSchema,
  registerSchema,
  productSchema,
  cartItemSchema,
  addressSchema,
  checkoutSchema,
  blogPostSchema,
  commentSchema,
  tourDateSchema,
};

export default schemas;