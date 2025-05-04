/**
 * Validation Test Routes
 * 
 * This file contains test routes for the API validation system.
 * These routes demonstrate how to use both schema-based and AI-powered validation.
 * Now enhanced with the ValidationPipeline for improved performance and security.
 */

import express from 'express';
import { z } from 'zod';
import { apiValidationMiddleware } from '../middleware/apiValidationMiddleware';
import { ValidationEngine } from '../security/advanced/apiValidation/ValidationEngine';
import secureLog from '../security/utils/secureLogger';
import { 
  createValidationMiddleware, 
  createAIValidationMiddleware,
  createDatabaseValidationMiddleware
} from '../middleware/validationPipelineMiddleware';
import { validationPipeline } from '../security/advanced/validation/ValidationPipeline';

// Create a router
const router = express.Router();

// Define logger component name
const logComponent = 'validation-test-routes';

// Basic test authentication middleware
// In a real application, use a proper authentication system
const testAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Check for test auth header
  const testAuthSecret = process.env.TEST_AUTH_SECRET || 'test-secret-key';
  const authHeader = req.headers['x-test-auth'];
  
  if (!authHeader || authHeader !== testAuthSecret) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for validation test endpoints'
    });
  }
  
  next();
};

// Register example validation rules
ValidationEngine.registerRule('contact-form', {
  name: 'Contact Form Validation',
  description: 'Validates contact form submissions',
  schema: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
  }),
  target: 'body',
  priority: 10,
  tags: ['form', 'contact']
});

ValidationEngine.registerRule('signup-form', {
  name: 'Signup Form Validation',
  description: 'Validates user signup information',
  schema: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),
  target: 'body',
  priority: 20,
  tags: ['form', 'auth', 'signup']
});

ValidationEngine.registerRule('pagination', {
  name: 'Pagination Parameters',
  description: 'Validates pagination query parameters',
  schema: z.object({
    page: z.string().optional().transform(val => val ? Number(val) : 1),
    limit: z.string().optional().transform(val => val ? Number(val) : 10),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional()
  }),
  target: 'query',
  priority: 5,
  tags: ['pagination', 'query']
});

// Associate rules with endpoints
ValidationEngine.applyRulesToEndpoint('/api/validation-test/contact', ['contact-form']);
ValidationEngine.applyRulesToEndpoint('/api/validation-test/signup', ['signup-form']);
ValidationEngine.applyRulesToEndpoint('/api/validation-test/items', ['pagination']);

/**
 * Helper function to validate request body against a Zod schema
 */
function validateRequest(schema: z.ZodType<any>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            message: err.message,
            path: err.path,
            code: err.code
          }))
        });
      } else {
        console.error('Unexpected validation error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    }
  };
}

/**
 * Helper function to validate request using AI security analysis
 */
function validateRequestWithAI(options: any) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // This is a simplified implementation that would connect to the real AI validation
    // In a real implementation, this would use ValidationAIConnector
    
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
    
    // For high security requirements, block suspicious requests
    if (securityScore < 0.7 && options.aiOptions?.threshold > securityScore) {
      return res.status(400).json({
        success: false,
        message: 'Security validation failed',
        warnings: warnings
      });
    }
    
    // Add validation metadata to request
    (req as any).securityValidation = {
      score: securityScore,
      warnings: warnings,
      passed: true
    };
    
    next();
  };
}

// Test route with basic schema validation
router.post('/contact', validateRequest(
  z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
  })
), (req: express.Request, res: express.Response) => {
  secureLog('info', logComponent, `Contact form submission from ${req.body.email}`);
  
  res.json({
    success: true,
    message: 'Contact form validated successfully',
    data: {
      name: req.body.name,
      email: req.body.email,
      messageLength: req.body.message.length
    }
  });
});

// Test route with AI validation (requires authentication)
router.post('/api-security', testAuth, validateRequestWithAI({
  useAI: true,
  target: 'body',
  aiOptions: {
    contentType: 'api',
    detailedAnalysis: true,
    threshold: 0.6
  }
}), (req: express.Request, res: express.Response) => {
  secureLog('info', logComponent, 'API security validation passed');
  
  res.json({
    success: true,
    message: 'API security validation passed',
    timestamp: new Date().toISOString()
  });
});

// Test route with combined schema and AI validation (requires authentication)
router.post('/signup', testAuth, [
  validateRequest(
    z.object({
      username: z.string().min(3).max(30),
      email: z.string().email(),
      password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  ),
  validateRequestWithAI({
    useAI: true,
    target: 'body',
    aiOptions: {
      contentType: 'api',
      detailedAnalysis: true
    }
  })
], (req: express.Request, res: express.Response) => {
  secureLog('info', logComponent, `User signup for ${req.body.username}`);
  
  res.json({
    success: true,
    message: 'Signup validated successfully',
    user: {
      username: req.body.username,
      email: req.body.email
    }
  });
});

// Test route for pagination with registered rule
router.get('/items', (req, res) => {
  const { page, limit, sortBy, order } = (req as any).validatedData?.query || { page: 1, limit: 10 };
  
  secureLog('info', logComponent, `Items request with pagination: page=${page}, limit=${limit}`);
  
  // Mock items data
  const items = Array.from({ length: limit }, (_, i) => ({
    id: (page - 1) * limit + i + 1,
    name: `Item ${(page - 1) * limit + i + 1}`,
    created: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    pagination: {
      page,
      limit,
      sortBy: sortBy || 'id',
      order: order || 'asc',
      total: 100, // Mock total
      pages: Math.ceil(100 / limit)
    },
    data: items
  });
});

// Test route with intentional security vulnerabilities for AI detection
router.post('/security-test', testAuth, validateRequestWithAI({
  useAI: true,
  target: 'body',
  aiOptions: {
    contentType: 'api',
    detailedAnalysis: true,
    threshold: 0.4
  }
}), (req, res) => {
  const { query, userId, adminOverride } = req.body;
  
  secureLog('info', logComponent, 'Security test endpoint accessed');
  
  // This is intentionally vulnerable for testing purposes
  if (adminOverride === 'true') {
    return res.json({
      success: true,
      message: 'Admin override active',
      data: {
        sensitiveData: "This is sensitive data that should be protected",
        query: query,
        userId: userId
      }
    });
  }
  
  res.json({
    success: true,
    message: 'Security test completed',
    data: {
      query: query
    }
  });
});

// Get validation rules information
router.get('/rules', (req, res) => {
  const rules = ValidationEngine.getAllRules();
  
  res.json({
    success: true,
    count: rules.length,
    rules: rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      target: rule.target,
      priority: rule.priority,
      isActive: rule.isActive,
      tags: rule.tags
    }))
  });
});

// Get endpoint mappings
router.get('/mappings', (req, res) => {
  const endpoints = ValidationEngine.getAllEndpoints();
  
  res.json({
    success: true,
    count: endpoints.length,
    mappings: endpoints
  });
});

// Generate validation documentation
router.get('/documentation', async (req, res) => {
  try {
    const format = (req.query.format as 'json' | 'markdown' | 'html') || 'json';
    const documentation = await ValidationEngine.generateDocumentation(format);
    
    if (format === 'json') {
      res.json(JSON.parse(documentation));
    } else if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(documentation);
    } else {
      res.setHeader('Content-Type', 'text/markdown');
      res.send(documentation);
    }
  } catch (error) {
    secureLog('error', logComponent, 'Error generating documentation', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate documentation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

//
// New Pipeline-Based Routes
//

// Schema validation using pipeline
router.post('/pipeline/contact', createValidationMiddleware(
  z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(1000)
  }),
  { // Pipeline options
    batchKey: 'contact-forms',
    priority: 'normal'
  }
), (req, res) => {
  const validatedData = req.validatedData;
  const validationMetadata = req.validationResult;
  
  secureLog('info', logComponent, `Pipeline validated contact form from ${validatedData.email}`, {
    metadata: {
      validationId: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken
    }
  });
  
  res.json({
    success: true,
    message: 'Contact form validated with pipeline',
    validation: {
      id: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken,
      cacheHit: validationMetadata.cacheHit
    },
    data: {
      name: validatedData.name,
      email: validatedData.email,
      messageLength: validatedData.message.length
    }
  });
});

// AI-only validation using pipeline
router.post('/pipeline/security', testAuth, createAIValidationMiddleware({
  contentType: 'api',
  detailedAnalysis: true,
  threshold: 0.7,
  priority: 'high'
}), (req, res) => {
  const validationMetadata = req.validationResult;
  
  secureLog('info', logComponent, 'Pipeline AI validation passed', {
    metadata: {
      validationId: validationMetadata.validationId,
      securityScore: validationMetadata.securityScore,
      timeTaken: validationMetadata.timeTaken
    }
  });
  
  // Add security score to response headers
  res.set('X-Security-Score', String(validationMetadata.securityScore || 1));
  
  res.json({
    success: true,
    message: 'AI security validation passed via pipeline',
    validation: {
      id: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken,
      securityScore: validationMetadata.securityScore,
      warningCount: validationMetadata.warnings?.length || 0
    },
    timestamp: new Date().toISOString()
  });
});

// Combined schema and AI validation using pipeline
router.post('/pipeline/signup', testAuth, [
  createValidationMiddleware(
    z.object({
      username: z.string().min(3).max(30),
      email: z.string().email(),
      password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }),
    { skipCache: true } // Don't cache password data
  ),
  createAIValidationMiddleware({
    contentType: 'api',
    detailedAnalysis: true
  })
], (req, res) => {
  const validatedData = req.validatedData;
  const validationMetadata = req.validationResult;
  
  secureLog('info', logComponent, `Pipeline validated signup for ${validatedData.username}`, {
    metadata: {
      validationId: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken
    }
  });
  
  res.json({
    success: true,
    message: 'Signup validated with pipeline',
    validation: {
      id: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken,
      securityScore: validationMetadata.securityScore
    },
    user: {
      username: validatedData.username,
      email: validatedData.email
    }
  });
});

// Database operation validation
router.post('/pipeline/db-operation', testAuth, createDatabaseValidationMiddleware({
  detailedAnalysis: true,
  priority: 'high'
}), (req, res) => {
  const validationMetadata = req.validationResult;
  
  secureLog('info', logComponent, 'Database operation validated', {
    metadata: {
      validationId: validationMetadata.validationId, 
      timeTaken: validationMetadata.timeTaken
    }
  });
  
  res.json({
    success: true,
    message: 'Database operation validated',
    validation: {
      id: validationMetadata.validationId,
      timeTaken: validationMetadata.timeTaken,
      securityScore: validationMetadata.securityScore,
      warningCount: validationMetadata.warnings?.length || 0
    }
  });
});

// Get validation pipeline status
router.get('/pipeline/status', async (req, res) => {
  try {
    const status = await validationPipeline.getStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    secureLog('error', logComponent, 'Error getting pipeline status', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get validation pipeline status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manage validation cache
router.post('/pipeline/cache', testAuth, (req, res) => {
  const { action } = req.body;
  
  if (action === 'clear') {
    validationPipeline.clearCache();
    secureLog('info', logComponent, 'Validation cache cleared');
    
    res.json({
      success: true,
      message: 'Validation cache cleared',
      timestamp: new Date().toISOString()
    });
  } else {
    const stats = validationPipeline.getCacheStats();
    
    res.json({
      success: true,
      action: 'stats',
      stats
    });
  }
});

export default router;