/**
 * Form Validation Schemas
 * 
 * This file contains centralized Zod schemas for form validation across the application.
 * These schemas ensure consistent validation rules across different forms.
 */

import { z } from 'zod';

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  subject: z.string()
    .min(3, { message: 'Subject must be at least 3 characters' })
    .max(200, { message: 'Subject must be less than 200 characters' }),
  message: z.string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message must be less than 2000 characters' }),
});

/**
 * Newsletter subscription form schema
 */
export const newsletterFormSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  name: z.string().optional(),
  interests: z.array(z.string()).optional(),
  acceptTerms: z.boolean()
    .refine(val => val === true, { message: 'You must accept the terms' }),
});

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  rememberMe: z.boolean().optional(),
});

/**
 * Registration form schema
 */
export const registerFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, { message: 'You must accept the terms and conditions' }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Product review form schema
 */
export const reviewFormSchema = z.object({
  rating: z.number()
    .min(1, { message: 'Please select a rating' })
    .max(5, { message: 'Maximum rating is 5 stars' }),
  title: z.string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  comment: z.string()
    .min(10, { message: 'Review must be at least 10 characters' })
    .max(1000, { message: 'Review must be less than 1000 characters' }),
  recommend: z.boolean().optional(),
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
});

/**
 * Collaboration proposal form schema
 */
export const collaborationFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  projectType: z.string()
    .min(2, { message: 'Project type must be at least 2 characters' }),
  description: z.string()
    .min(20, { message: 'Description must be at least 20 characters' })
    .max(2000, { message: 'Description must be less than 2000 characters' }),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

/**
 * User profile update form schema
 */
export const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  newReleaseNotifications: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  soundEffects: z.boolean().optional(),
}).refine(
  data => !data.newPassword || data.newPassword === data.confirmNewPassword,
  {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }
).refine(
  data => !data.newPassword || data.currentPassword,
  {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  }
).refine(
  data => !data.newPassword || data.newPassword.length >= 8,
  {
    message: 'New password must be at least 8 characters',
    path: ['newPassword'],
  }
);