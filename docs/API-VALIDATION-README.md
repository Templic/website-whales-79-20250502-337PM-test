# API Validation Framework

This document outlines the API validation framework implemented in this application. The validation framework provides schema-based validation using Zod, security checks for detecting malicious input, and AI-assisted validation capabilities.

## Overview

The API validation framework consists of:

1. **Schema Validation**: Uses Zod schemas to validate input structure and types
2. **Security Validation**: Detects potential security threats like SQL injection
3. **AI-Assisted Validation**: Uses LLM models to analyze complex input patterns (available in the main application)

## API Endpoints

### Main Application Endpoints

The main application includes the following validation endpoints:

- `/api/direct-validation/basic`: Basic validation endpoint
- `/api/direct-validation/security`: Security validation endpoint that detects malicious input

These endpoints bypass CSRF protection and other security middleware for testing purposes. However, due to the Vite router in development mode, these endpoints may return HTML instead of the expected JSON response.

### Standalone Validation Server

A standalone validation server is available at port 4000 with the following endpoints:

- `/api/health`: Health check endpoint
- `/api/validate/basic`: Schema-based validation using Zod
- `/api/validate/security`: Security validation that detects SQL injection attempts

## Running the Standalone Server

To run the standalone validation server:

```bash
./start-api.sh
```

This will start the server on port 4000.

## Testing the API

To test the validation API, run:

```bash
node test-simple-validation-api.js
```

This will test all validation endpoints with both valid and invalid input.

## Response Format

### Basic Validation Response

For valid input:

```json
{
  "success": true,
  "validation": {
    "passed": true,
    "data": {
      // Validated and sanitized input
    }
  }
}
```

For invalid input:

```json
{
  "success": false,
  "validation": {
    "passed": false,
    "errors": [
      {
        "field": "fieldName",
        "error": "Error message"
      }
    ]
  }
}
```

### Security Validation Response

For safe input:

```json
{
  "success": true,
  "validation": {
    "passed": true,
    "securityScore": 0.9
  }
}
```

For potentially malicious input:

```json
{
  "success": true,
  "validation": {
    "passed": false,
    "securityScore": 0.2,
    "warnings": [
      "Potential SQL injection detected"
    ]
  }
}
```

## Integration Notes

1. The validation framework is designed to work with both direct API requests and form submissions.

2. The security score ranges from 0 to 1, with scores below 0.5 considered potentially malicious.

3. In production, all validation routes require proper authentication and authorization, but for testing, security can be bypassed using special testing routes.

4. When the main application is running in development mode, the Vite router may intercept API requests and return HTML instead of JSON. In this case, use the standalone validation server for testing.

## Security Considerations

- The validation test routes bypass normal security checks and should not be enabled in production.
- The standalone validation server should only be used for development and testing, not in production environments.
- In production, all API endpoints should enforce CSRF protection and other security measures.

## Future Enhancements

1. Add AI-assisted validation to the standalone validation server
2. Implement more sophisticated security validation patterns
3. Add performance metrics for validation operations