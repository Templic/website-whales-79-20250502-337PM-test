/**
 * Validation Bypass Routes
 * 
 * These routes are specifically designed to bypass all security checks
 * for API validation testing. This includes authentication, CSRF protection,
 * and other security middleware.
 * 
 * WARNING: NEVER enable these routes in a production environment.
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Status endpoint for testing connectivity
router.get('/status', (req: Request, res: Response) => {
  console.log('[VALIDATION-BYPASS] Status check received');
  
  res.json({
    success: true,
    message: 'Validation bypass routes are active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic schema validation test
router.post('/basic', (req: Request, res: Response) => {
  console.log('[VALIDATION-BYPASS] Basic validation test:', req.body);
  
  try {
    // Simple validation
    const { name, email, message } = req.body;
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
    
    // Validation succeeded
    res.json({
      success: true,
      validation: {
        passed: true
      },
      data: { name, email, message }
    });
  } catch (error) {
    console.error('[VALIDATION-BYPASS] Error in basic validation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Security validation test (simulates AI security checking)
router.post('/security', (req: Request, res: Response) => {
  console.log('[VALIDATION-BYPASS] Security validation test:', req.body);
  
  try {
    // Get the input from request body
    const { query, userId, adminOverride } = req.body;
    
    // Define suspicious patterns to check for
    const suspiciousPatterns = [
      "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", 
      "1=1", "OR 1=1", "--", "/*", "*/", ";", 
      "<script>", "</script>", "eval(", "document.cookie",
      "admin", "password", "token", "secret"
    ];
    
    // Convert entire request to string for pattern matching
    const requestStr = JSON.stringify(req.body).toLowerCase();
    const warnings = [];
    let securityScore = 1.0;
    
    // Check for suspicious patterns in the request
    for (const pattern of suspiciousPatterns) {
      if (requestStr.includes(pattern.toLowerCase())) {
        warnings.push(`Suspicious pattern detected: ${pattern}`);
        securityScore -= 0.1; // Reduce score for each suspicious pattern found
      }
    }
    
    // Check for SQL injection specifically in the query field
    if (typeof query === 'string') {
      // Additional SQL injection checks
      const sqlInjectionPatterns = ["SELECT", "FROM", "WHERE", "DROP", "TABLE", "INSERT", "DELETE", "UPDATE", ";"];
      for (const pattern of sqlInjectionPatterns) {
        if (query.toUpperCase().includes(pattern)) {
          warnings.push(`SQL injection attempt detected in query: ${pattern}`);
          securityScore -= 0.15; // Larger penalty for SQL injection
        }
      }
    }
    
    // Check for injection in userId
    if (typeof userId === 'string' && userId.includes(';')) {
      warnings.push('Potential command injection detected in userId');
      securityScore -= 0.2;
    }
    
    // Check for admin override attempts
    if (adminOverride === 'true' || adminOverride === true) {
      warnings.push('Unauthorized admin override attempt detected');
      securityScore -= 0.3;
    }
    
    // Ensure score doesn't go below 0.1
    securityScore = Math.max(0.1, securityScore);
    
    // Return validation result
    res.json({
      success: true, // API call succeeded
      validation: {
        passed: securityScore > 0.75, // Validation passes if score is high enough
        securityScore,
        validationId: `bypass-${Date.now()}`,
        warnings: warnings.length > 0 ? warnings : ['No security issues detected'],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[VALIDATION-BYPASS] Error in security validation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during security validation'
    });
  }
});

// Return route configuration for testing validation mappings
router.get('/mappings', (req: Request, res: Response) => {
  console.log('[VALIDATION-BYPASS] Validation mappings request received');
  
  res.json({
    success: true,
    message: 'Validation mappings retrieved successfully',
    mappings: [
      {
        route: '/api/contact',
        validationType: 'schema',
        schemaName: 'contactSchema',
        requiredFields: ['name', 'email', 'message']
      },
      {
        route: '/api/newsletter',
        validationType: 'schema',
        schemaName: 'newsletterSchema',
        requiredFields: ['email']
      },
      {
        route: '/api/search',
        validationType: 'security',
        securityChecks: ['sql-injection', 'xss']
      },
      {
        route: '/api/user/profile',
        validationType: 'combined',
        schemaName: 'userProfileSchema',
        securityChecks: ['xss', 'data-exposure']
      },
      {
        route: '/api/admin/*',
        validationType: 'ai',
        aiModel: 'security-analyzer-v2',
        confidence: 0.85
      }
    ]
  });
});

// Return validation rules configuration
router.get('/rules', (req: Request, res: Response) => {
  console.log('[VALIDATION-BYPASS] Validation rules request received');
  
  res.json({
    success: true,
    message: 'Validation rules retrieved successfully',
    rules: [
      {
        name: 'email',
        type: 'regex',
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        errorMessage: 'Invalid email format'
      },
      {
        name: 'name',
        type: 'length',
        min: 2,
        max: 100,
        errorMessage: 'Name must be between 2 and 100 characters'
      },
      {
        name: 'message',
        type: 'length',
        min: 10,
        max: 2000,
        errorMessage: 'Message must be between 10 and 2000 characters'
      },
      {
        name: 'password',
        type: 'regex',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$',
        errorMessage: 'Password must be at least 8 characters and include uppercase, lowercase, and numbers'
      },
      {
        name: 'sqlInjection',
        type: 'security',
        patterns: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', '--'],
        errorMessage: 'Potential SQL injection detected'
      },
      {
        name: 'xss',
        type: 'security',
        patterns: ['<script>', '</script>', 'javascript:', 'onerror=', 'onload='],
        errorMessage: 'Potential XSS attack detected'
      }
    ]
  });
});

export default router;