# API Validation Framework

## Overview

The API Validation Framework is a flexible and powerful system designed to validate API requests using multiple validation strategies. It provides a comprehensive validation pipeline that includes schema validation, security validation, and AI-powered validation capabilities.

## Key Features

- **Schema Validation**: Type checking and data structure validation using Zod schemas
- **Security Validation**: Protection against common security threats like SQL injection and XSS
- **AI-Powered Validation**: Advanced validation using AI models to detect potential security issues
- **Bypass Mechanisms**: Testing routes that bypass CSRF and other protections
- **Standalone Operation**: Can run independently from the main application

## Standalone Test Server

A dedicated test server can be started on port 4000 for testing API validation without affecting the main application:

```bash
./start-api-validation-server.sh
```

## API Endpoints

The validation API exposes several endpoints for testing and validation:

- **Health Check**: `GET /api/health`
- **Basic Schema Validation**: `POST /api/validate/basic`
- **Security Validation**: `POST /api/validate/security`

## Test UI

A simple HTML page is provided for easy testing of the validation API:

```
api-validation-test.html
```

This page allows you to:
- Check API health status
- Test basic schema validation
- Test security validation with both safe and malicious inputs

## Example Usage

### Schema Validation

```javascript
// Example schema validation request
const response = await fetch('http://localhost:4000/api/validate/basic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  })
});

const result = await response.json();
```

### Security Validation

```javascript
// Example security validation request (safe input)
const response = await fetch('http://localhost:4000/api/validate/security', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'normal user input'
  })
});

const result = await response.json();
// Expected score for safe input: ~0.9

// Example security validation request (malicious input)
const response = await fetch('http://localhost:4000/api/validate/security', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "' OR 1=1; DROP TABLE users; --"
  })
});

const result = await response.json();
// Expected score for malicious input: ~0.2
```

## Integration with Main Application

The validation system can be integrated with the main application by using the validation middleware:

```javascript
// Example integration
app.use('/api/protected-endpoint', validationMiddleware({
  rules: ['schema:user', 'security:high']
}), protectedEndpointHandler);
```

## Implementation Details

The implementation consists of several components:

1. **ValidationEngine**: Core validation engine that processes validation rules
2. **Schema Registry**: Registry of Zod schemas for type validation
3. **Security Validator**: Analyzes inputs for security threats
4. **Bypass Mechanisms**: Special routes for testing that bypass security checks

## Troubleshooting

If encountering issues with the standalone server:

1. Check if port 4000 is already in use: `lsof -i:4000`
2. Kill any existing process on port 4000: `kill $(lsof -t -i:4000)`
3. Restart the API validation server: `./start-api-validation-server.sh`

## Security Considerations

- The test endpoints bypass normal security protections and should NOT be enabled in production
- All test routes are controlled by environment variables that should be disabled in production
- CSRF protection is disabled for test routes but should be enabled for production routes