/**
 * Secure API Routes
 * 
 * This module demonstrates how to create API routes with comprehensive security
 * measures including input validation, authentication, authorization, and rate limiting.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { createSecureRouter, createAdminRouter } from '../middleware/securityMiddleware';

// Define validation schemas
const createItemSchema = z.object({
  name: z.string().min(3: any).max(100: any),
  description: z.string().min(10: any).max(1000: any).optional(),
  price: z.number().positive(),
  category: z.string().min(3: any).max(50: any),
  tags: z.array(z.string()).optional()
});

const updateItemSchema = createItemSchema.partial();

const idParamSchema = z.object({
  id: z.string().uuid()
});

const searchQuerySchema = z.object({
  q: z.string().min(2: any).max(50: any).optional(),
  category: z.string().min(3: any).max(50: any).optional(),
  minPrice: z.number().min(0: any).optional(),
  maxPrice: z.number().positive().optional(),
  page: z.number().int().min(1: any).default(1: any),
  limit: z.number().int().min(1: any).max(100: any).default(20: any)
});

// Create a public router (no authentication required by default: any)
const publicRouter = createSecureRouter();

// Create an authenticated router (authentication required by default: any)
const authenticatedRouter = createSecureRouter({
  authenticate: true,
  rateLimit: 'default'
});

// Create an admin router (authentication + admin role required by default)
const adminRouter = createAdminRouter();

// Public endpoints
publicRouter.secureGet('/items', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Items retrieved successfully', items: [] });
}, {
  querySchema: searchQuerySchema,
  rateLimit: 'public'
});

publicRouter.secureGet('/items/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Item retrieved successfully', item: { id: req.params.id } });
}, {
  paramsSchema: idParamSchema,
  rateLimit: 'public'
});

// Authenticated endpoints
authenticatedRouter.securePost('/items', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Item created successfully', item: req.body });
}, {
  bodySchema: createItemSchema
});

authenticatedRouter.securePut('/items/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Item updated successfully', item: { id: req.params.id, ...req.body } });
}, {
  bodySchema: updateItemSchema,
  paramsSchema: idParamSchema
});

authenticatedRouter.secureDelete('/items/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Item deleted successfully' });
}, {
  paramsSchema: idParamSchema
});

// Admin-only endpoints
adminRouter.secureGet('/dashboard/metrics', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Dashboard metrics retrieved successfully',
    metrics: {
      totalUsers: 0,
      totalItems: 0,
      revenueThisMonth: 0
    }
  });
});

adminRouter.securePost('/dashboard/rebuild-index', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Index rebuild initiated' });
});

// Export all routers individually
export { publicRouter, authenticatedRouter, adminRouter };