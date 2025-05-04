# API Validation System User Guide

## Overview

The API Validation System is a comprehensive solution for validating API requests through multiple validation strategies:

1. **Schema Validation**: Enforces data types, required fields, and value constraints
2. **Security Validation**: Detects and blocks malicious inputs like SQL injection and XSS attacks
3. **Advanced Pattern Detection**: Identifies suspicious patterns in user input

## Getting Started

### Running the Standalone Validation Server

For a quick demonstration of the API validation capabilities, run:

```bash
./run-simplified-validation.sh
```

This starts a standalone server on port 8080 that you can access via:
- http://localhost:8080 
- Through the Replit Web tab

### Testing API Validation

The standalone server provides a simple UI with three main validation tests:

1. **Health Check**: Verifies the server is running correctly
2. **Basic Validation**: Tests schema validation for user data
3. **Security Validation**: Tests threat detection for potentially malicious input

Click the "Test Malicious Input" button to see how the system identifies SQL injection attempts.

## API Endpoints

The validation system exposes the following endpoints:

### Health Check
```
GET /health
```
Returns: Server status information

### Basic Schema Validation
```
POST /validate/basic
```
Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```
Returns: Validation results and errors if any

### Security Validation
```
POST /validate/security
```
Request Body:
```json
{
  "query": "user input to validate"
}
```
Returns: Security score and threat assessment

## Understanding Validation Results

### Schema Validation Results

```json
{
  "valid": true,
  "validatedData": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  "message": "Input data is valid"
}
```

If validation fails:
```json
{
  "valid": false,
  "errors": [
    "Name must be at least 2 characters",
    "Valid email is required"
  ]
}
```

### Security Validation Results

```json
{
  "valid": true,
  "securityScore": 0.9,
  "threatAssessment": {
    "input": "normal user input",
    "score": 0.9,
    "threats": ["No threats detected"],
    "recommendation": "Accept"
  }
}
```

For potentially malicious input:
```json
{
  "valid": false,
  "securityScore": 0.2,
  "threatAssessment": {
    "input": "' OR 1=1; DROP TABLE users; --",
    "score": 0.2,
    "threats": ["Potential SQL injection detected"],
    "recommendation": "Reject"
  }
}
```

## Integration with Main Application

To integrate the validation system with your application:

1. Import the validation middleware:
```javascript
import { validationMiddleware } from './server/validation/ValidationEngine';
```

2. Apply validation rules to endpoints:
```javascript
app.post('/api/users', 
  validationMiddleware({ rules: ['schema:user', 'security:high'] }), 
  (req, res) => {
    // Handle validated request
    res.json({ success: true });
  }
);
```

## Production Configuration

Before deploying to production, ensure validation test routes are disabled:

```
API_VALIDATION_TEST_MODE=false
API_VALIDATION_BYPASS_SECURITY=false
ENABLE_DIRECT_VALIDATION=false
CSRF_PROTECTION=true
```

You can use the `disable-test-routes.sh` script to update these settings automatically.

## Advanced Usage

### Custom Validation Rules

You can create custom validation rules by defining them in `apiValidationRules.ts`:

```javascript
const customRule = {
  id: 'schema:custom',
  type: 'schema',
  schema: {
    // Zod schema or validation definition
  }
};

registerValidationRule(customRule);
```

### Method-Specific Validation

Apply different validation rules based on HTTP method:

```javascript
app.use('/api/resources',
  validationMiddleware({
    byMethod: {
      GET: ['security:low'],
      POST: ['schema:resource', 'security:high'],
      PUT: ['schema:resourceUpdate', 'security:high'],
      DELETE: ['security:high']
    }
  }),
  resourceHandler
);
```

### Conditional Validation

Apply validation based on request properties:

```javascript
validationMiddleware({
  getRules: (req) => {
    if (req.needsStrictValidation) {
      return ['schema:user', 'security:high'];
    }
    return ['schema:user', 'security:low'];
  }
})
```

## Troubleshooting

### Common Issues

#### CSRF Errors
If you encounter CSRF-related errors, ensure proper headers are included in requests or apply the CSRF exemption to test endpoints.

#### Schema Validation Failures
Review validation error messages for details on which fields failed validation and why.

#### Security Validation Failures
Examine the `threatAssessment` object in the response for specific details about detected threats.

## Known Limitations

- In the Replit environment, the main application UI may not display correctly due to conflicts between the security system and Replit's preview environment.
- The standalone validation server provides all validation capabilities without these conflicts.

## Further Reading

- `API-VALIDATION-SUMMARY.md`: Technical overview of the validation system
- `validation-integration-example.js`: Examples of integrating validation with Express