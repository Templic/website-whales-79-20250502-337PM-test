/**
 * Schema Types
 * 
 * This file contains Zod schema definitions for form validation.
 * These schemas are used to validate user input in forms across the application.
 */

import { z } from 'zod';

/**
 * Contact form schema
 */
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters')
});

/**
 * Newsletter subscription schema
 */
const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

/**
 * Login form schema
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false)
});

/**
 * Registration form schema
 */
const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Password reset request schema
 */
const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

/**
 * Password reset confirmation schema
 */
const passwordResetConfirmSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Profile update schema
 */
const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number').optional().or(z.literal(''))
});

/**
 * Address schema
 */
const addressSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  addressLine1: z.string().min(5, 'Address line 1 must be at least 5 characters').max(100, 'Address line 1 cannot exceed 100 characters'),
  addressLine2: z.string().max(100, 'Address line 2 cannot exceed 100 characters').optional().or(z.literal('')),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City cannot exceed 50 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(50, 'State cannot exceed 50 characters'),
  postalCode: z.string().regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Please enter a valid postal code'),
  country: z.string().min(2, 'Country must be at least 2 characters').max(50, 'Country cannot exceed 50 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
  isDefault: z.boolean().optional().default(false)
});

/**
 * Product review schema
 */
const productReviewSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review cannot exceed 1000 characters')
});

/**
 * Blog comment schema
 */
const blogCommentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  content: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment cannot exceed 500 characters')
});

/**
 * Credit card schema
 */
const creditCardSchema = z.object({
  cardNumber: z.string().regex(/^[0-9]{16}$/, 'Please enter a valid card number'),
  cardholderName: z.string().min(2, 'Cardholder name must be at least 2 characters').max(100, 'Cardholder name cannot exceed 100 characters'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Please enter a valid month (01-12)'),
  expiryYear: z.string().regex(/^[0-9]{4}$/, 'Please enter a valid year (4 digits)'),
  cvv: z.string().regex(/^[0-9]{3,4}$/, 'Please enter a valid CVV (3-4 digits)')
});

/**
 * Music upload schema
 */
const musicUploadSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
  artist: z.string().min(2, 'Artist must be at least 2 characters').max(100, 'Artist cannot exceed 100 characters'),
  album: z.string().max(100, 'Album cannot exceed 100 characters').optional().or(z.literal('')),
  genre: z.string().max(50, 'Genre cannot exceed 50 characters').optional().or(z.literal('')),
  releaseDate: z.string().optional(),
  file: z.any()
});

/**
 * Tour date schema
 */
const tourDateSchema = z.object({
  venue: z.string().min(2, 'Venue must be at least 2 characters').max(100, 'Venue cannot exceed 100 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City cannot exceed 50 characters'),
  state: z.string().max(50, 'State cannot exceed 50 characters').optional().or(z.literal('')),
  country: z.string().min(2, 'Country must be at least 2 characters').max(50, 'Country cannot exceed 50 characters'),
  date: z.string(),
  doorTime: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  ticketUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  isSoldOut: z.boolean().optional().default(false),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal(''))
});

/**
 * Blog post schema
 */
const blogPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title cannot exceed 200 characters'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().min(20, 'Excerpt must be at least 20 characters').max(300, 'Excerpt cannot exceed 300 characters'),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featuredImage: z.any().optional()
});

/**
 * Export schemas as a namespace for easy access
 */
export const schemas = {
  contact: contactSchema,
  newsletter: newsletterSchema,
  login: loginSchema,
  registration: registrationSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordResetConfirm: passwordResetConfirmSchema,
  profileUpdate: profileUpdateSchema,
  address: addressSchema,
  productReview: productReviewSchema,
  blogComment: blogCommentSchema,
  creditCard: creditCardSchema,
  musicUpload: musicUploadSchema,
  tourDate: tourDateSchema,
  blogPost: blogPostSchema
};