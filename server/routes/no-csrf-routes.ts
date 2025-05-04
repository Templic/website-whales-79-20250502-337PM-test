/**
 * No-CSRF Test Routes
 * 
 * These routes use the noCSRF middleware to completely bypass CSRF protection
 * for testing purposes. They provide simple validation functions identical to
 * those in the direct test validation routes.
 * 
 * WARNING: These routes are for testing purposes only and should not be exposed
 * in a production environment.
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Basic schema validation endpoint
router.post('/basic', (req: Request, res: Response) => {
  try {
    console.log("No-CSRF basic validation endpoint called");
    
    // Basic validation
    const { name, email, message } = req.body;
    
    // Simple validation rules
    const errors = [];
    
    if (!name || name.length < 2 || name.length > 100) {
      errors.push({ field: 'name', error: 'Name must be between 2 and 100 characters' });
    }
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ field: 'email', error: 'Invalid email address' });
    }
    
    if (!message || message.length < 10 || message.length > 2000) {
      errors.push({ field: 'message', error: 'Message must be between 10 and 2000 characters' });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        validation: {
          passed: false,
          errors
        }
      });
    }
    
    res.json({
      success: true,
      validation: {
        passed: true
      },
      data: { name, email, message }
    });
  } catch (error) {
    console.error('Error in no-CSRF basic validation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// AI security validation endpoint
router.post('/ai-security', (req: Request, res: Response) => {
  try {
    console.log("No-CSRF AI security validation endpoint called");
    
    // Simulate AI security validation
    const { query } = req.body;
    
    // Simple heuristic to detect SQL injection
    const hasSqlInjection = 
      typeof query === 'string' && (
        query.toLowerCase().includes('select') ||
        query.toLowerCase().includes('from') ||
        query.toLowerCase().includes('drop') ||
        query.toLowerCase().includes('table') ||
        query.toLowerCase().includes(';') ||
        query.toLowerCase().includes('--')
      );
    
    if (hasSqlInjection) {
      return res.json({
        success: true,
        validation: {
          passed: false,
          securityScore: 0.2,
          warnings: ['Potential SQL injection detected']
        }
      });
    }
    
    res.json({
      success: true,
      validation: {
        passed: true,
        securityScore: 0.9
      }
    });
  } catch (error) {
    console.error('Error in no-CSRF AI security validation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Status endpoint
router.get('/status', (req: Request, res: Response) => {
  try {
    console.log("No-CSRF validation status endpoint called");
    
    res.json({
      success: true,
      status: {
        cacheStats: {
          hits: 128,
          misses: 37,
          size: 45
        },
        activeBatches: 2,
        aiValidation: {
          enabled: true,
          lastProcessed: new Date().toISOString(),
          averageResponseTime: 230 // ms
        },
        performance: {
          avgProcessingTime: 18, // ms
          p95ProcessingTime: 47, // ms
          p99ProcessingTime: 102 // ms
        }
      }
    });
  } catch (error) {
    console.error('Error in no-CSRF validation status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;