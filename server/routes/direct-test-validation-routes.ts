/**
 * Direct Test Validation Routes
 * 
 * These routes provide a direct testing interface for the validation system
 * with all security layers completely disabled. These are for development
 * and testing purposes only, and should NEVER be enabled in production.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { validationPipeline } from '../security/advanced/validation/ValidationPipeline';

const router = express.Router();

// Define our test schemas
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

const securityTestSchema = z.object({
  query: z.string(),
  filters: z.object({
    category: z.string(),
    priceRange: z.object({
      min: z.number(),
      max: z.number()
    })
  }).optional(),
  sort: z.string().optional()
});

// Direct validation endpoint (completely bypasses middleware)
router.post('/basic', (req: Request, res: Response) => {
  try {
    // Log the incoming request
    console.log('[DIRECT TEST] Basic validation request:', req.body);
    
    // Manually perform validation
    const result = contactSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.errors
      });
    }
    
    // If validation passes, return success
    res.json({
      success: true,
      message: 'Validation passed',
      data: result.data
    });
  } catch (error) {
    console.error('[DIRECT TEST] Error in basic validation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
});

// AI-based security validation endpoint
router.post('/ai-security', (req: Request, res: Response) => {
  try {
    // Log the incoming request
    console.log('[DIRECT TEST] AI security validation request:', req.body);
    
    // For testing purposes, just perform simple validation
    // Real AI validation would be integrated here
    const suspiciousPatterns = [
      "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", 
      "1=1", "OR 1=1", "--", "/*", "*/", ";", 
      "<script>", "</script>", "eval(", "document.cookie"
    ];
    
    let hasSuspiciousPattern = false;
    const warnings = [];
    let securityScore = 1.0;
    
    // Simple pattern matching to detect suspicious content
    const requestStr = JSON.stringify(req.body).toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (requestStr.includes(pattern.toLowerCase())) {
        hasSuspiciousPattern = true;
        warnings.push(`Suspicious pattern detected: ${pattern}`);
        securityScore -= 0.1; // Reduce score for each suspicious pattern
      }
    }
    
    securityScore = Math.max(0.1, securityScore); // Don't go below 0.1
    
    // Return the validation result
    res.json({
      success: true,
      message: 'AI security validation complete',
      validation: {
        passed: securityScore > 0.75,
        securityScore,
        validationId: `test-${Date.now()}`,
        warnings
      },
      data: req.body
    });
  } catch (error) {
    console.error('[DIRECT TEST] Error in AI security validation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during AI validation'
    });
  }
});

// Validation pipeline status endpoint
router.get('/status', (req: Request, res: Response) => {
  try {
    // Simplified status for testing
    const status = {
      cacheStats: {
        size: 0,
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      activeBatches: [],
      aiValidation: {
        requests: 0,
        averageResponseTime: 0,
        totalRequests: 0
      },
      performance: {
        averageValidationTime: 0,
        validationsPerMinute: 0,
        peakValidationsPerMinute: 0
      }
    };
    
    res.json({
      success: true,
      message: 'Validation pipeline status retrieved',
      status
    });
  } catch (error) {
    console.error('[DIRECT TEST] Error getting validation pipeline status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve validation pipeline status'
    });
  }
});

export default router;