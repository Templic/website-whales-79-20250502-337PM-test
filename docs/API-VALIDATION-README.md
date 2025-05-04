# API Validation Testing System

This document describes the API validation testing system implemented in the application. This system allows for testing the API validation features without being blocked by security mechanisms like CSRF protection.

## Overview

The API validation system allows for testing three types of validation:

1. **Schema Validation**: Validates that the input data conforms to the expected schema (e.g., field types, required fields)
2. **Security Validation**: Checks for potential security threats (e.g., SQL injection, XSS)
3. **AI-Powered Validation**: Uses AI models to analyze the content for complex threats or issues

## Test HTML Page

A direct validation test HTML page is available at:

```
/direct-validation-test.html
```

This page provides a user interface for testing the direct validation endpoints without having to deal with CSRF tokens or other security measures.

## Direct Validation Endpoints

All direct validation endpoints are accessible via the `/api/direct-validation` prefix and have CSRF and security checks completely bypassed for testing purposes.

### Available Endpoints

- **GET** `/api/direct-validation/rules`
  - Returns a list of available validation rules
  - No authentication or security checks required

- **GET** `/api/direct-validation/mappings`
  - Returns the mappings between API endpoints and validation rules
  - No authentication or security checks required

- **GET** `/api/direct-validation/status`
  - Returns the current status of the validation system
  - Includes cache stats, performance metrics, and configuration

- **POST** `/api/direct-validation/basic`
  - Tests basic schema validation
  - Request format:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "This is a test message for validation."
    }
    ```
  - Validates that the name is at least 2 characters, the email is valid, and the message is at least 10 characters

- **POST** `/api/direct-validation/security`
  - Tests security validation, including SQL injection detection
  - Request format:
    ```json
    {
      "query": "your query here"
    }
    ```
  - Returns a security score (high score for safe queries, low score for potentially malicious ones)

## Implementation Details

The system uses several bypass mechanisms to enable validation testing without triggering security restrictions:

1. **Complete CSRF Bypass**: Using the `completeCsrfBypass` middleware
2. **No Security Middleware**: Using the `noSecurityMiddleware` to completely bypass security checks
3. **Special Route Handling**: A direct Express route for serving the HTML test file

### Security Notice

These endpoints are designed for testing only and bypass all security measures. In a production environment, they should be:

1. Disabled completely, or
2. Protected behind additional authentication and available only in dev/test environments
3. Never exposed to public networks

## Example Usage

### Test Basic Validation

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"John Doe", "email":"john@example.com", "message":"This is a test message for validation."}' \
  http://localhost:5000/api/direct-validation/basic
```

### Test Security Validation (SQL Injection)

```bash
# Test malicious query
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"DROP TABLE users"}' \
  http://localhost:5000/api/direct-validation/security

# Test safe query
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"find users by name"}' \
  http://localhost:5000/api/direct-validation/security
```

### Get Validation Rules

```bash
curl http://localhost:5000/api/direct-validation/rules
```

### Get API Mappings

```bash
curl http://localhost:5000/api/direct-validation/mappings
```

### Get System Status

```bash
curl http://localhost:5000/api/direct-validation/status
```