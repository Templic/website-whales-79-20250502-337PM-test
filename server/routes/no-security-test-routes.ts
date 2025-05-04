/**
 * No Security Test Routes
 * 
 * These routes bypass ALL security checks for direct testing purposes.
 * NEVER enable these routes in a production environment.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

// Define test schemas
const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

// Basic schema validation endpoint (no middleware, pure testing)
router.post('/basic', (req: Request, res: Response) => {
  console.log('[NO-SECURITY TEST] Basic validation request received:', req.body);
  
  try {
    // Perform validation directly
    const result = contactSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.errors
      });
    }
    
    // Return success response
    res.json({
      success: true,
      message: 'Validation passed',
      data: result.data
    });
  } catch (error) {
    console.error('[NO-SECURITY TEST] Error in basic validation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during validation'
    });
  }
});

// Simulated AI security validation endpoint
router.post('/ai-security', (req: Request, res: Response) => {
  console.log('[NO-SECURITY TEST] AI security validation request received:', req.body);
  
  try {
    // Simple pattern matching to simulate AI validation
    const suspiciousPatterns = [
      "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", 
      "1=1", "OR 1=1", "--", "/*", "*/", ";", 
      "<script>", "</script>", "eval(", "document.cookie"
    ];
    
    const requestStr = JSON.stringify(req.body).toLowerCase();
    const warnings = [];
    let securityScore = 1.0;
    
    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (requestStr.includes(pattern.toLowerCase())) {
        warnings.push(`Suspicious pattern detected: ${pattern}`);
        securityScore -= 0.1; // Reduce score for each pattern
      }
    }
    
    securityScore = Math.max(0.1, securityScore); // Don't go below 0.1
    
    // Return validation result
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
    console.error('[NO-SECURITY TEST] Error in AI security validation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during AI validation'
    });
  }
});

// Status endpoint
router.get('/status', (req: Request, res: Response) => {
  console.log('[NO-SECURITY TEST] Status request received');
  
  // Return a mock status response
  res.json({
    success: true,
    message: 'No-security test routes are functioning correctly',
    status: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

export default router;