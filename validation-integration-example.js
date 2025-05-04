/**
 * API Validation Integration Example
 * 
 * This example demonstrates how to integrate the API validation system
 * with a standard Express application.
 */

const express = require('express');
const { validationMiddleware } = require('./server/validation/ValidationEngine');
const { z } = require('zod');
const { registerValidationRule } = require('./server/validation/apiValidationRules');

// Create Express app
const app = express();
app.use(express.json());

// Define validation schemas
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  age: z.number().int().min(18, "Must be at least 18 years old").optional()
});

// Register custom validation rules
registerValidationRule({
  id: 'schema:user',
  type: 'schema',
  schema: userSchema
});

registerValidationRule({
  id: 'schema:product',
  type: 'schema',
  schema: z.object({
    name: z.string().min(3),
    price: z.number().positive(),
    description: z.string().optional()
  })
});

// Basic route with schema validation
app.post('/api/users', 
  validationMiddleware({ rules: ['schema:user', 'security:medium'] }), 
  (req, res) => {
    // At this point, the request body is guaranteed to be valid
    // and has passed both schema and security validation
    console.log('Creating user:', req.body);
    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: req.body
    });
  }
);

// Route with different validation based on HTTP method
app.route('/api/products')
  .get(
    // Light validation for read operations
    validationMiddleware({ rules: ['security:low'] }),
    (req, res) => {
      console.log('Getting products');
      res.json({ products: [
        { id: 1, name: 'Product 1', price: 29.99 },
        { id: 2, name: 'Product 2', price: 49.99 }
      ]});
    }
  )
  .post(
    // Strict validation for write operations
    validationMiddleware({ rules: ['schema:product', 'security:high'] }),
    (req, res) => {
      console.log('Creating product:', req.body);
      res.json({ 
        success: true, 
        message: 'Product created successfully',
        product: { id: 3, ...req.body }
      });
    }
  );

// Advanced: Method-specific validation with a single middleware
app.use('/api/resources',
  validationMiddleware({
    byMethod: {
      GET: ['security:low'],
      POST: ['schema:product', 'security:high'],
      PUT: ['schema:product', 'security:high'],
      DELETE: ['security:high']
    }
  }),
  (req, res) => {
    console.log(`${req.method} request for resources`);
    res.json({ success: true, message: `${req.method} operation succeeded` });
  }
);

// Advanced: Conditional validation based on request properties
app.post('/api/payments',
  validationMiddleware({
    getRules: (req) => {
      // Apply different validation rules based on payment type
      const paymentType = req.body.type || 'standard';
      if (paymentType === 'premium') {
        return ['schema:premiumPayment', 'security:high'];
      }
      return ['schema:standardPayment', 'security:medium'];
    }
  }),
  (req, res) => {
    console.log('Processing payment:', req.body);
    res.json({ success: true, message: 'Payment processed' });
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    errors: err.errors || []
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API validation example server running on port ${PORT}`);
  console.log('Try these example requests:');
  console.log('  - Valid user: curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d \'{"name":"John Doe","email":"john@example.com","age":30}\'');
  console.log('  - Invalid user: curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d \'{"name":"J","email":"invalid-email"}\'');
  console.log('  - Malicious input: curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d \'{"name":"DROP TABLE users;","email":"attack@evil.com"}\'');
});

/**
 * Important Note:
 * 
 * This example assumes you have the following files already set up:
 * 1. server/validation/ValidationEngine.js - Contains the validation middleware
 * 2. server/validation/apiValidationRules.js - Contains the rule registry
 * 
 * In a real application, you would have proper error handling, database connections,
 * authentication middleware, and more complex validation logic.
 */