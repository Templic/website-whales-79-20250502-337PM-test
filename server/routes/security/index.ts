/**
 * Security Routes Index
 * 
 * This file aggregates and exports all security-related routes.
 */

import { Router } from 'express';
import { securityDashboardRoutes } from './dashboard';
import scanManagerRoutes from './scanManager';

// Create a router for all security routes
const securityRouter = Router();

// Use dashboard routes
securityRouter.use('/dashboard', securityDashboardRoutes);

// Use scan manager routes
securityRouter.use('/scan', scanManagerRoutes);

// Export the security router
export default securityRouter;