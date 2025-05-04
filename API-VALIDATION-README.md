# API Validation Framework

This repository contains a comprehensive API validation framework designed to ensure data integrity and security for your APIs. The system validates incoming requests using multiple strategies including schema validation, security validation, and AI-powered validation.

## Quick Start

To test the API validation system:

1. Run the simplified validation server:
   ```bash
   ./run-simplified-validation.sh
   ```

2. Open the test page in your browser:
   ```bash
   ./run-api-validation-test.sh
   ```

3. Try different validation tests:
   - Valid and invalid schema examples
   - Safe and malicious security inputs
   - Custom validation requests

## Documentation

- [API Validation User Guide](API-VALIDATION-USER-GUIDE.md) - Comprehensive guide for using the validation system
- [API Validation Technical Summary](API-VALIDATION-SUMMARY.md) - Technical overview of the validation framework

## Key Features

- **Schema Validation**: Enforce data types, required fields, and value constraints
- **Security Validation**: Detect and block malicious inputs (SQL injection, XSS)
- **Advanced Pattern Detection**: Identify suspicious patterns in user input
- **Method-specific Validation**: Apply different rules based on HTTP method
- **Conditional Validation**: Dynamic rule selection based on request properties

## Files and Components

- `simplified-validation-server.cjs` - Standalone server for testing
- `validation-integration-example.js` - Example of integrating with Express
- `api-validation-test.html` - Browser-based test UI
- `run-simplified-validation.sh` - Script to start the standalone server
- `run-api-validation-test.sh` - Script to run the test UI
- `disable-test-routes.sh` - Script to disable test routes for production

## Usage in Production

Before deploying to production:

1. Disable test routes:
   ```bash
   ./disable-test-routes.sh
   ```

2. Integrate validation middleware with your Express routes:
   ```javascript
   app.post('/api/users',
     validationMiddleware({ rules: ['schema:user', 'security:high'] }),
     userController.create
   );
   ```

3. Add custom validation rules as needed:
   ```javascript
   registerValidationRule({
     id: 'schema:myCustomRule',
     type: 'schema',
     schema: myZodSchema
   });
   ```

## Known Issues

- In the Replit environment, the main application UI may not display correctly due to conflicts between the security system and Replit's preview environment.
- The standalone validation server provides all validation capabilities without these conflicts.

## Next Steps

Future enhancements planned for the API validation system:

1. Enhanced AI validation with machine learning threat detection
2. Custom validation rules UI for easy configuration
3. Validation analytics dashboard
4. Rule import/export functionality