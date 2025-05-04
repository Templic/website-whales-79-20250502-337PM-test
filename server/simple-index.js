/**
 * Simple Express server for API validation testing
 * 
 * This is a simplified version of our main server that focuses only on:
 * 1. Serving static files from /public
 * 2. Providing a health check endpoint
 * 3. Providing basic API validation examples
 */
import express from 'express';
import cors from 'cors';
import { z } from 'zod';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Basic validation schema using Zod
const basicValidationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  age: z.number().int().positive().optional(),
});

// Basic validation endpoint
app.post('/api/validate/basic', (req, res) => {
  try {
    const result = basicValidationSchema.safeParse(req.body);
    
    if (result.success) {
      res.json({
        success: true,
        validation: {
          passed: true,
          data: result.data
        }
      });
    } else {
      res.json({
        success: false,
        validation: {
          passed: false,
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            error: err.message
          }))
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
});

// Security validation endpoint
app.post('/api/validate/security', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      validation: {
        passed: false,
        errors: [{ field: 'query', error: 'Required' }]
      }
    });
  }
  
  // Simple SQL injection detection
  const sqlInjectionPatterns = [
    /'.*OR.*--/i,
    /'.*DROP.*--/i,
    /'.*DELETE.*--/i,
    /'.*SELECT.*--/i,
    /'.*1=1.*--/i,
  ];
  
  const isSuspicious = sqlInjectionPatterns.some(pattern => pattern.test(query));
  
  if (isSuspicious) {
    return res.json({
      success: true,
      validation: {
        passed: false,
        securityScore: 0.2,
        warnings: ["Potential SQL injection detected"]
      }
    });
  }
  
  // For demonstration, consider all other inputs safe
  return res.json({
    success: true,
    validation: {
      passed: true,
      securityScore: 0.9
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple API validation server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Basic validation: http://localhost:${PORT}/api/validate/basic`);
  console.log(`Security validation: http://localhost:${PORT}/api/validate/security`);
});