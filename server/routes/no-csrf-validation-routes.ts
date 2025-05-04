/**
 * No-CSRF Validation Test Routes
 * 
 * This file contains simplified test routes for the validation system that bypass CSRF protection.
 * These routes are for development and testing purposes only and should not be enabled in production.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { 
  createValidationMiddleware, 
  createAIValidationMiddleware,
  createDatabaseValidationMiddleware
} from '../middleware/validationPipelineMiddleware';

const router = express.Router();

// Schema for contact form validation
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

// Simple validation test endpoint (no CSRF protection)
router.post('/basic', createValidationMiddleware(contactSchema, {
  batchKey: 'test-contact-forms',
  enableCaching: true
}), (req: Request, res: Response) => {
  // Access the validated data
  const data = req.validatedData || req.body;
  
  console.log("[Validation Test] Basic validation test passed:", data);
  
  res.json({
    success: true,
    message: "Validation passed",
    validation: {
      passed: true,
      cacheHit: (req as any).validationResult?.cacheHit || false,
      validationId: (req as any).validationResult?.validationId
    },
    data
  });
});

// AI security validation test endpoint (no CSRF protection)
router.post('/ai-security', createAIValidationMiddleware({
  contentType: 'api',
  detailedAnalysis: true,
  threshold: 0.75 // Adjustable sensitivity threshold
}), (req: Request, res: Response) => {
  const data = req.validatedData || req.body;
  
  console.log("[Validation Test] AI security validation test:", data);
  
  res.json({
    success: true,
    message: "AI security validation passed",
    validation: {
      passed: true,
      securityScore: (req as any).validationResult?.securityScore || 1.0,
      validationId: (req as any).validationResult?.validationId,
      warnings: (req as any).validationResult?.warnings || []
    },
    data
  });
});

// Status check endpoint (no CSRF protection)
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Import pipeline directly to avoid circular dependencies
    const { validationPipeline } = await import('../security/advanced/validation/ValidationPipeline');
    const status = await validationPipeline.getStatus();
    
    res.json({
      success: true,
      message: "Validation pipeline status retrieved successfully",
      status: {
        cacheStats: status.cacheStats,
        activeBatches: status.activeBatches,
        aiValidation: status.aiValidation,
        performance: status.performance
      }
    });
  } catch (error) {
    console.error('Error fetching validation pipeline status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve validation pipeline status'
    });
  }
});

export default router;