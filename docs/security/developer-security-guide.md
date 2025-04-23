# Security Developer Guide

This guide provides security best practices for developers working on this application, explaining how to use the security features properly and avoid common security pitfalls.

## Table of Contents

1. [Input Validation](#input-validation)
2. [API Security](#api-security)
3. [Authentication & Authorization](#authentication--authorization)
4. [CSRF Protection](#csrf-protection)
5. [Rate Limiting](#rate-limiting)
6. [Security Headers](#security-headers)
7. [Secure Coding Practices](#secure-coding-practices)
8. [Security Monitoring & Logging](#security-monitoring--logging)

## Input Validation

All user inputs must be validated before processing. Our application uses Zod schemas for validation.

### Using Validation Middleware

```typescript
import { validate, validateRequest } from '../server/security/middleware/apiValidation';
import { myRequestSchema } from '../server/security/validation/mySchemas';

// Validate single part of request
router.post('/api/endpoint', 
  validate(myRequestSchema, 'body'),
  (req, res) => {
    // Your handler code
  }
);

// Validate multiple parts of request
router.patch('/api/endpoint/:id',
  validateRequest({
    params: myParamsSchema,
    body: myBodySchema,
    query: myQuerySchema
  }),
  (req, res) => {
    // Your handler code
  }
);
```

### Creating Validation Schemas

When creating new API endpoints, always define Zod validation schemas:

```typescript
import { z } from 'zod';

export const myRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  preferences: z.array(z.string()).optional()
});
```

### Validation Best Practices

1. Be specific in your schemas (use `.min()`, `.max()`, `.email()`, etc.)
2. Always validate IDs as proper UUIDs using `.uuid()`
3. For pagination, use `z.coerce.number()` to handle string inputs
4. Include clear error messages in your schema validations
5. Mark optional fields explicitly with `.optional()`

## API Security

### Basic API Security

Every API endpoint should:
1. Validate all inputs
2. Apply appropriate rate limiting
3. Include proper security headers
4. Check authentication/authorization where needed

### Using API Security Middleware

```typescript
import { apiSecurityMiddleware } from '../server/security/middleware/apiSecurity';

router.post('/api/endpoint', 
  apiSecurityMiddleware,
  (req, res) => {
    // Your handler code
  }
);
```

### API Parameter Sanitization

When sanitization is needed without strict validation:

```typescript
import { sanitize } from '../server/security/middleware/apiValidation';
import { myRequestSchema } from '../server/security/validation/mySchemas';

router.get('/api/endpoint', 
  sanitize(myRequestSchema, 'query'),
  (req, res) => {
    // Your handler code
  }
);
```

## Authentication & Authorization

### Checking Authentication

```typescript
import { isAuthenticated } from '../server/security/utils/securityUtils';

router.get('/api/protected-resource', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  // Continue handling the request
});
```

### Checking User Roles

```typescript
import { hasRole } from '../server/security/utils/securityUtils';

router.get('/api/admin-resource', (req, res) => {
  if (!hasRole(req, 'admin')) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  
  // Continue handling the request
});
```

## CSRF Protection

See the detailed [CSRF Protection Guide](csrf-protection.md) for specifics.

### Adding CSRF Protection to Routes

```typescript
import { csrfProtection } from '../server/security/advanced/csrf/CSRFProtection';

// Apply to state-changing routes
router.post('/api/update', 
  csrfProtection.middleware,
  (req, res) => {
    // Your handler code
  }
);
```

### CSRF Token in Frontend

Include the CSRF token in your API requests:

```javascript
// In your frontend JavaScript
fetch('/api/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
  },
  body: JSON.stringify(data)
})
```

## Rate Limiting

Use appropriate rate limiters for different types of endpoints:

```typescript
import { 
  standardRateLimiter, 
  authRateLimiter, 
  adminRateLimiter, 
  paymentRateLimiter,
  slidingWindowRateLimiter
} from '../server/security/middleware/rateLimiters';

// Regular API endpoints
router.get('/api/data', standardRateLimiter(), handler);

// Authentication endpoints
router.post('/api/login', authRateLimiter(), handler);

// Admin endpoints
router.get('/api/admin/users', adminRateLimiter(), handler);

// Payment endpoints
router.post('/api/payments', paymentRateLimiter(), handler);

// Custom rate limiting
router.post('/api/custom', 
  slidingWindowRateLimiter(30000, 10), // 10 requests per 30 seconds
  handler
);
```

## Security Headers

### Adding Security Headers to Responses

```typescript
import { securityHeadersMiddleware } from '../server/security/middleware/securityHeadersMiddleware';

// Apply to all routes
app.use(securityHeadersMiddleware);

// Or apply to specific routes
router.get('/api/endpoint', securityHeadersMiddleware, handler);
```

### Customizing Security Headers

```typescript
import { createSecurityHeadersMiddleware } from '../server/security/middleware/securityHeadersMiddleware';

const customHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: "default-src 'self'; script-src 'self'",
  strictTransportSecurity: 'max-age=63072000',
  xFrameOptions: 'SAMEORIGIN'
});
```

## Secure Coding Practices

### Preventing SQL Injection

Always use parameterized queries with Drizzle:

```typescript
// GOOD: Using parameterized queries
const result = await db
  .select()
  .from(users)
  .where(eq(users.id, userId));

// BAD: Never do this
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
```

### Preventing XSS

1. Validate and sanitize all inputs
2. Use React's built-in XSS protection (auto-escaping)
3. For direct DOM insertion, sanitize content:

```typescript
import { sanitizeString } from '../server/security/utils/securityUtils';

// Before inserting user-generated content into the DOM
const sanitizedContent = sanitizeString(userGeneratedContent);
```

### Sensitive Data Handling

1. Never log or expose:
   - Passwords/hashes
   - API keys or secrets
   - Session tokens
   - Personal identifiable information (PII)

2. Mask sensitive information in logs:

```typescript
import { maskSensitiveData } from '../server/security/utils/securityUtils';

// Before logging user data
const maskedData = maskSensitiveData(userData);
logger.info('User information', maskedData);
```

## Security Monitoring & Logging

### Logging Security Events

```typescript
import { logSecurityEvent } from '../server/security/utils/securityUtils';

// Log security-relevant events
logSecurityEvent('AUTHENTICATION_SUCCESS', {
  userId: user.id,
  ip: req.ip,
  timestamp: new Date()
});
```

### Available Security Event Types

- `AUTHENTICATION_SUCCESS`: Successful user authentication
- `AUTHENTICATION_FAILURE`: Failed authentication attempt
- `ACCESS_DENIED`: Access to a resource was denied
- `AUTHORIZATION_FAILURE`: User not authorized for a resource
- `SESSION_CREATED`: New user session created
- `SESSION_DESTROYED`: User session terminated
- `PASSWORD_CHANGED`: User changed their password
- `PASSWORD_RESET_REQUESTED`: Password reset requested
- `PASSWORD_RESET_COMPLETED`: Password reset completed
- `ACCOUNT_LOCKED`: User account locked
- `ACCOUNT_UNLOCKED`: User account unlocked
- `API_VALIDATION_FAILURE`: API request validation failed
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `CSRF_VALIDATION_FAILURE`: CSRF token validation failed
- `SUSPICIOUS_ACTIVITY`: Suspicious activity detected
- `SECURITY_CONFIGURATION_CHANGED`: Security configuration change

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [SANS Software Security Technical Implementation Guide](https://www.sans.org/security-resources/policies/general)