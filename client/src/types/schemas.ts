/**
 * Form Schemas
 * 
 * This file contains reusable Zod schemas for form validation.
 * Use these schemas with react-hook-form and zod resolver for consistent validation.
 */

import { z } from 'zod';

/**
 * Common validators and patterns
 */
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/[-a-zA-Z0-9.~:/?#[\]@!$&'()*+,;=]*)?$/,
  ZIPCODE: /^\d{5}(-\d{4})?$/,
};

const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  PHONE: 'Please enter a valid phone number',
  URL: 'Please enter a valid URL',
  ZIPCODE: 'Please enter a valid ZIP code',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
  PASSWORDS_MATCH: 'Passwords must match',
};

/**
 * Basic field schemas
 */
export const emailSchema = z.string()
  .trim()
  .min(1, { message: ERROR_MESSAGES.REQUIRED })
  .email({ message: ERROR_MESSAGES.EMAIL });

export const passwordSchema = z.string()
  .min(8, { message: ERROR_MESSAGES.MIN_LENGTH(8) })
  .regex(PATTERNS.PASSWORD, { message: ERROR_MESSAGES.PASSWORD });

export const nameSchema = z.string()
  .trim()
  .min(2, { message: ERROR_MESSAGES.MIN_LENGTH(2) })
  .max(100, { message: ERROR_MESSAGES.MAX_LENGTH(100) });

export const phoneSchema = z.string()
  .trim()
  .regex(PATTERNS.PHONE, { message: ERROR_MESSAGES.PHONE });

export const urlSchema = z.string()
  .trim()
  .regex(PATTERNS.URL, { message: ERROR_MESSAGES.URL })
  .optional()
  .or(z.literal(''));

export const zipCodeSchema = z.string()
  .trim()
  .regex(PATTERNS.ZIPCODE, { message: ERROR_MESSAGES.ZIPCODE });

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: ERROR_MESSAGES.PASSWORDS_MATCH,
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: ERROR_MESSAGES.PASSWORDS_MATCH,
  path: ['confirmPassword'],
});

/**
 * Contact and newsletter schemas
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  message: z.string().trim().min(10, { message: ERROR_MESSAGES.MIN_LENGTH(10) }),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
  interests: z.array(z.string()).optional(),
});

/**
 * Product and order schemas
 */
export const productSchema = z.object({
  name: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  description: z.string().trim().min(10, { message: ERROR_MESSAGES.MIN_LENGTH(10) }),
  price: z.number().positive({ message: 'Price must be positive' }),
  discountPrice: z.number().positive({ message: 'Discount price must be positive' }).optional(),
  categories: z.array(z.string()).min(1, { message: 'Select at least one category' }),
  inStock: z.boolean(),
  isFeatured: z.boolean().optional(),
});

export const addressSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  streetAddress: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  city: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  state: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  postalCode: zipCodeSchema,
  country: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  phone: phoneSchema,
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  sameAsBilling: z.boolean().optional(),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
  notes: z.string().optional(),
});

/**
 * Blog and content schemas
 */
export const blogPostSchema = z.object({
  title: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  content: z.string().trim().min(100, { message: ERROR_MESSAGES.MIN_LENGTH(100) }),
  excerpt: z.string().trim().min(10, { message: ERROR_MESSAGES.MIN_LENGTH(10) }),
  categories: z.array(z.string()).min(1, { message: 'Select at least one category' }),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  authorName: nameSchema,
  authorEmail: emailSchema,
});

/**
 * Music schemas
 */
export const musicSchema = z.object({
  title: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  artist: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  albumId: z.number().optional(),
  isArchived: z.boolean().optional(),
  features: z.object({
    bpm: z.number().optional(),
    key: z.string().optional(),
    moods: z.array(z.string()).optional(),
    instruments: z.array(z.string()).optional(),
    energy: z.number().min(0).max(100).optional(),
  }).optional(),
});