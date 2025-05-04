# API Validation Framework

This document provides an overview of the API validation framework and explains how to use it for testing and integrating with your application.

## Overview

The API validation framework provides a simple, standalone server for validating user inputs and detecting potential security threats. It includes:

1. **Basic Schema Validation** - Uses predefined schemas to validate data structure and types
2. **Security Validation** - Detects potential security threats like SQL injection
3. **Health Check Endpoint** - Simple endpoint to verify the validation server is running

## Server Setup

The validation server runs on port 4000 by default to avoid conflicts with the main application server. This separation allows for independent testing and development of validation rules.

### Starting the Server

```bash
# Start the validation server
./start-api.sh
```

This will start the standalone validation server on port 4000.

## API Endpoints

The API validation server provides the following endpoints:

### 1. Health Check

```
GET /api/health
```

Returns the current status of the API server.

Example response:
```json
{
  "status": "ok",
  "timestamp": "2025-05-04T23:05:35.270Z"
}
```

### 2. Basic Validation

```
POST /api/validate/basic
```

Validates user data according to predefined schemas.

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

Example success response:
```json
{
  "success": true,
  "validation": {
    "passed": true,
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    }
  }
}
```

Example failure response:
```json
{
  "success": true,
  "validation": {
    "passed": false,
    "errors": [
      {
        "field": "name",
        "error": "Name must be at least 2 characters"
      },
      {
        "field": "email",
        "error": "Invalid email format"
      }
    ]
  }
}
```

### 3. Security Validation

```
POST /api/validate/security
```

Checks user inputs for potential security threats.

Request body:
```json
{
  "query": "normal user input"
}
```

Example response for safe input:
```json
{
  "success": true,
  "validation": {
    "passed": true,
    "securityScore": 0.9
  }
}
```

Example response for potentially malicious input:
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

## Testing the API

### Automated Tests

Run the automated test script to verify all endpoints are working correctly:

```bash
# Run the API validation tests
./run-api-validation-test.sh
```

This will perform tests on all endpoints and display the results in the console.

### Manual Testing

You can also test the API manually using the HTML test page:

1. Start the validation server with `./start-api.sh`
2. Open `public/validation-test.html` in a web browser
3. Use the interface to test different validation scenarios

## Integration with Your Application

To integrate the validation API with your application:

1. Make HTTP requests to the validation endpoints
2. Process the validation results as needed
3. Display appropriate feedback to users

Example JavaScript integration:

```javascript
async function validateUserData(userData) {
  try {
    const response = await fetch('http://localhost:4000/api/validate/basic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.validation.passed) {
      // Data is valid
      return {
        valid: true,
        data: result.validation.data
      };
    } else {
      // Data is invalid
      return {
        valid: false,
        errors: result.validation.errors
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      errors: [{ field: 'general', error: 'Validation service unavailable' }]
    };
  }
}
```

## Security Considerations

- The validation server is intended for development and testing
- In production, validation should be performed on the same server as your application
- CORS is enabled on the validation server to allow requests from any origin
- For production use, restrict CORS to specific origins

## Troubleshooting

If you encounter issues with the validation server:

1. Check that the server is running on port 4000
2. Verify that the port is not being used by another application
3. Check the console output for any error messages
4. Ensure your requests are properly formatted as JSON

## Advanced Usage

### Adding Custom Validation Rules

To add custom validation rules, modify the validation functions in `server/simple-validation-server.cjs`.

For example, to add a password strength check:

```javascript
// Add to validateBasic function
if (data.password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(data.password)) {
    errors.push({
      field: 'password',
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    });
  }
}
```

### Custom Security Rules

To add custom security validation rules, modify the `validateSecurity` function:

```javascript
// Add to sqlInjectionPatterns array
/\bEXEC\b.*?\bsp_/i, // Check for potential stored procedure execution
```