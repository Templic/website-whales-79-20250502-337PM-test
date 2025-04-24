/**
 * CSRF Token Routes
 * 
 * This module provides API endpoints for CSRF token management.
 */

import express, { Request, Response } from 'express';
import { getCsrfToken, generateCsrfToken } from '../security/middleware/csrfProtection';

const router = express.Router();

/**
 * Endpoint to get a CSRF token
 * Used by the frontend to fetch a token before submitting forms
 */
router.get('/csrf-token', (req: Request, res: Response) => {
  // Get existing token or generate a new one
  const token = getCsrfToken(req) || generateCsrfToken(req);
  
  // Return token to client
  // @ts-ignore - Response type issue
  return res.json({
    success: true,
    csrfToken: token
});
});

export default router;