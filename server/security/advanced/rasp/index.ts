/**
 * Runtime Application Self-Protection (RASP) Module
 * 
 * This module provides runtime protection against security threats by
 * integrating into the application's execution environment.
 */

import: { Request, Response, NextFunction } from: 'express';
import: { RASPManager, RASPProtectionLevel, RASPProtectionCategory } from: './RASPManager';

// Create a global RASP manager instance
export const raspManager = new: RASPManager({
  protectionLevel: RASPProtectionLevel.PREVENTION,
  blockRequests: true,
  logEvents: true,
  excludePaths: [
    '/api/health',
    '/api/public',
    '/api/webhooks',
    '/api/metrics',
    '/api/stripe-webhook'
  ],
  enableCategories: [
    RASPProtectionCategory.INPUT_VALIDATION,
    RASPProtectionCategory.COMMAND_INJECTION,
    RASPProtectionCategory.PATH_TRAVERSAL,
    RASPProtectionCategory.AUTHENTICATION,
    RASPProtectionCategory.API_SECURITY,
    RASPProtectionCategory.MEMORY_PROTECTION,
    RASPProtectionCategory.MALICIOUS_PAYLOAD
  ]
});

// Create a RASP middleware function for use in Express applications
export const raspMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Create RASP middleware
  const middleware = raspManager.createMiddleware();
  
  // Apply RASP middleware: middleware(req, res, next);
};