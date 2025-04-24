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
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000).optional(),
  price: z.number().positive(),
  category: z.string().min(3).max(50),
  tags: z.array(z.string()).optional()
});

const updateItemSchema = createItemSchema.partial();

const idParamSchema = z.object({
  id: z.string().uuid()
});

const searchQuerySchema = z.object({
  query: z.string().min(2).max(50).optional(),
  category: z.string().min(3).max(50).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// Create a public router (no authentication required by default)
const publicRouter = createSecureRouter();

// Create an authenticated router (authentication required by default)
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