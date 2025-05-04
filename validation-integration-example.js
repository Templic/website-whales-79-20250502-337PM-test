/**
 * API Validation Integration Example
 * 
 * This file demonstrates how to integrate the API validation framework
 * with your main application routes.
 */

// Import the validation middleware
const { validationMiddleware } = require('./server/validation/ValidationEngine');
const express = require('express');
const app = express();

// Example schema validation rule
// In a real application, these would be defined in apiValidationRules.ts
const userSchemaValidationRule = {
  id: 'schema:user',
  type: 'schema',
  schema: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'string', required: true, format: 'email' },
    age: { type: 'number', required: true, min: 18, max: 120 }
  }
};

// Example security validation rule
const highSecurityValidationRule = {
  id: 'security:high',
  type: 'security',
  level: 'high',
  checkInjection: true,
  checkXSS: true
};

// Register validation rules
require('./server/validation/apiValidationRules').registerValidationRule(userSchemaValidationRule);
require('./server/validation/apiValidationRules').registerValidationRule(highSecurityValidationRule);

// Example 1: Basic route with schema validation
app.post('/api/users', 
  validationMiddleware({ rules: ['schema:user'] }), 
  (req, res) => {
    // At this point, req.body has been validated against the user schema
    // If validation failed, the middleware would have sent an error response
    res.json({ success: true, user: req.body });
  }
);

// Example 2: Route with both schema and security validation
app.post('/api/sensitive-data', 
  validationMiddleware({ 
    rules: ['schema:user', 'security:high'],
    failFast: true  // Stop validation on first failure
  }), 
  (req, res) => {
    // Input has now passed both schema and security validation
    res.json({ success: true, data: req.body });
  }
);

// Example 3: API endpoint with custom validation options
app.post('/api/custom-validation', 
  validationMiddleware({
    rules: ['schema:user'],
    customOptions: {
      stripUnknown: true,     // Remove unknown properties
      abortEarly: false,      // Return all errors
      addValidatedData: true  // Add validated data to req.validatedData
    }
  }),
  (req, res) => {
    // Access the validated and sanitized data
    const validatedData = req.validatedData;
    res.json({ success: true, data: validatedData });
  }
);

// Example 4: Applying validation rules by HTTP method
app.use('/api/resources',
  validationMiddleware({
    byMethod: {
      GET: ['security:low'],
      POST: ['schema:resource', 'security:high'],
      PUT: ['schema:resourceUpdate', 'security:high'],
      DELETE: ['security:high']
    }
  }),
  (req, res) => {
    // Different validation rules have been applied based on HTTP method
    res.json({ success: true });
  }
);

// Example 5: Conditional validation
app.post('/api/conditional-endpoint',
  (req, res, next) => {
    // Set a flag for conditional validation
    req.needsStrictValidation = req.body.sensitive === true;
    next();
  },
  validationMiddleware({
    getRules: (req) => {
      // Apply different rules based on request properties
      if (req.needsStrictValidation) {
        return ['schema:user', 'security:high'];
      }
      return ['schema:user', 'security:low'];
    }
  }),
  (req, res) => {
    res.json({ success: true });
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});