# API Security Guidelines

This document outlines the security guidelines for developing and maintaining secure APIs within our application. Following these guidelines will help ensure that all APIs adhere to industry best practices and meet our security requirements.

## Table of Contents
1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [Output Sanitization](#output-sanitization)
6. [Error Handling](#error-handling)
7. [Logging and Monitoring](#logging-and-monitoring)
8. [Transport Security](#transport-security)
9. [Implementation Examples](#implementation-examples)

## Authentication

All API endpoints that access or modify sensitive data must implement proper authentication mechanisms.

### Guidelines:
- **Use JWT for stateless APIs**: JSON Web Tokens provide a secure and stateless authentication mechanism.
- **Set appropriate token expiration**: Tokens should have a short lifetime (15-60 minutes) to reduce the risk of token theft.
- **Implement token refresh**: Use refresh tokens to allow for extended sessions without keeping the main token valid for too long.
- **Validate all tokens**: Always verify token signature, expiration, and claims before granting access.
- **Store tokens securely**: Clients should store tokens in HttpOnly cookies or secure storage mechanisms.

### Implementation:
```typescript
// Use the verifyApiAuthentication middleware for protected endpoints
router.get(
  '/protected-resource',
  verifyApiAuthentication,
  (req, res) => {
    // Handle the authenticated request
  }
);
```

## Authorization

Access to resources should be restricted based on user roles and permissions.

### Guidelines:
- **Implement role-based access control (RBAC)**: Define clear roles with specific permissions.
- **Follow the principle of least privilege**: Grant only the permissions necessary for a user to perform their tasks.
- **Check authorization on every request**: Don't rely on client-side restrictions.
- **Use proper authorization middleware**: Apply consistent authorization checks across similar endpoints.

### Implementation:
```typescript
// Use the verifyApiAuthorization middleware to restrict access by role
router.post(
  '/admin/resources',
  verifyApiAuthentication,
  verifyApiAuthorization(['admin', 'super_admin']),
  (req, res) => {
    // Handle the authorized request
  }
);
```

## Rate Limiting

Implement rate limiting to prevent abuse and denial of service attacks.

### Guidelines:
- **Set appropriate limits**: Define reasonable limits based on endpoint sensitivity and expected usage.
- **Use sliding window rate limiters**: These provide more accurate limiting than fixed windows.
- **Include rate limit headers**: Inform clients of their limit status through HTTP headers.
- **Apply different limits for different endpoints**: More sensitive operations should have stricter limits.

### Implementation:
```typescript
// Use the enforceApiRateLimit middleware with appropriate limit type
router.post(
  '/login',
  enforceApiRateLimit('auth'),
  (req, res) => {
    // Handle the login request
  }
);
```

## Input Validation

All user input must be validated before processing.

### Guidelines:
- **Validate on the server side**: Never rely solely on client-side validation.
- **Use a schema-based validation library**: Libraries like Zod, Joi, or express-validator provide robust validation.
- **Validate all input parameters**: This includes request body, query parameters, and URL parameters.
- **Validate types, formats, and ranges**: Ensure values conform to expected formats and reasonable ranges.
- **Reject unexpected inputs**: Don't process requests with unexpected fields or parameters.

### Implementation:
```typescript
// Define a validation schema
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8)
});

// Use the validateApiRequest middleware with your schema
router.post(
  '/users',
  validateApiRequest(createUserSchema),
  (req, res) => {
    // Handle the validated request
  }
);
```

## Output Sanitization

Ensure that responses don't include sensitive information.

### Guidelines:
- **Never expose sensitive data**: Passwords, tokens, and internal IDs should never be returned in responses.
- **Create safe user objects**: Create sanitized versions of data objects before sending them in responses.
- **Use consistent response formats**: Standardize response structures to avoid exposing implementation details.
- **Sanitize error messages**: Don't expose detailed technical errors to clients.

### Implementation:
```typescript
// Create a safe user object before sending in response
const safeUser = {
  id: user.id,
  username: user.username,
  email: user.email,
  // Exclude password, internal fields, etc.
};

res.json({ success: true, data: safeUser });
```

## Error Handling

Implement proper error handling to avoid exposing sensitive information.

### Guidelines:
- **Use generic error messages**: Don't expose internal details or stack traces to clients.
- **Log detailed errors server-side**: Maintain detailed logs for debugging and monitoring.
- **Return appropriate HTTP status codes**: Use standard HTTP status codes to indicate the nature of errors.
- **Include error identifiers**: Add unique error IDs to allow correlation between client errors and server logs.

### Implementation:
```typescript
try {
  // Operation that might fail
} catch (error) {
  // Log detailed error server-side
  console.error('Detailed error:', error);
  
  // Return generic message to client
  res.status(500).json({
    success: false,
    message: 'An error occurred while processing your request',
    errorId: 'err-' + Date.now() // Identifier for log correlation
  });
}
```

## Logging and Monitoring

Implement comprehensive logging for security events and API access.

### Guidelines:
- **Log all authentication attempts**: Record both successful and failed authentication attempts.
- **Log authorization failures**: Record when users attempt to access resources they don't have permission for.
- **Implement audit logging**: Keep records of sensitive operations for compliance and security review.
- **Monitor for suspicious activity**: Set up alerts for unusual patterns of API usage.
- **Protect log data**: Ensure logs themselves don't contain sensitive information.

### Implementation:
```typescript
// Example of logging a security event
logSecurityEvent({
  type: 'AUTHORIZATION_FAILURE',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  path: req.path,
  userId: req.user?.id,
  details: 'Attempted to access admin resource',
  severity: 'medium'
});
```

## Transport Security

Ensure that all API communication occurs over secure channels.

### Guidelines:
- **Use HTTPS exclusively**: Never allow API access over unencrypted HTTP.
- **Implement proper TLS configuration**: Use modern TLS versions and secure cipher suites.
- **Set appropriate security headers**: Use headers like Strict-Transport-Security, Content-Security-Policy, etc.
- **Validate certificates**: Ensure that clients validate server certificates to prevent man-in-the-middle attacks.

### Implementation:
```typescript
// Set security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

## Implementation Examples

The following files provide examples of secure API implementation:

- `server/middleware/apiSecurity.ts` - Core security middleware implementations
- `server/routes/secureApiRoutes.ts` - Example routes using the security middleware
- `server/security/apiSecurityVerification.ts` - Tools for validating API security

### Example Secure Endpoint:

```typescript
// Complete example of a secure API endpoint
router.post(
  '/resources',
  // Rate limiting middleware
  enforceApiRateLimit('default'),
  // Authentication middleware
  verifyApiAuthentication,
  // Authorization middleware
  verifyApiAuthorization(['admin']),
  // Input validation middleware
  validateApiRequest(resourceCreateSchema),
  // Request handler
  async (req, res) => {
    try {
      // Resource creation logic
      const newResource = await createResource(req.body);
      
      // Return success response
      res.status(201).json({
        success: true,
        data: newResource
      });
    } catch (error) {
      // Log error details server-side
      console.error('Error creating resource:', error);
      
      // Return appropriate error response
      res.status(500).json({
        success: false,
        message: 'Failed to create resource',
        errorId: `err-${Date.now()}`
      });
    }
  }
);
```

By following these guidelines and using the provided middleware, you can ensure that your API endpoints are secure, robust, and follow industry best practices.