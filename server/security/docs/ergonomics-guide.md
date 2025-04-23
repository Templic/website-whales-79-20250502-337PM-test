# Security Ergonomics Guide

## Introduction

This guide is designed to help developers easily integrate advanced security features into their applications with minimal effort and cognitive load. The principles and patterns described here ensure that security becomes a natural part of development rather than an afterthought or burden.

## Security Toolkit: Development-Focused API

The Security Toolkit provides an ergonomic, developer-friendly API for integrating advanced security features:

```typescript
import { securityToolkit } from '@server/security/toolkit';

// Apply middleware with sensible defaults
app.use(securityToolkit.createMiddleware());

// Secure a specific route
app.get('/api/data', securityToolkit.secureRoute({
  authentication: 'required',
  authorization: ['admin', 'manager'],
  rateLimit: { max: 100, window: '15m' },
  inputValidation: 'strict'
}), (req, res) => {
  // Your route handler
});

// Validate input
const validatedData = securityToolkit.validateInput(data, schema);

// Secure output
const securedOutput = securityToolkit.secureOutput(data, {
  sanitize: true,
  sign: true
});
```

## Decorator-Based Security Controls (for TypeScript Applications)

For TypeScript applications, we provide decorators for adding security controls to classes and methods:

```typescript
import { 
  Secure, 
  ValidateInput, 
  Authorize, 
  RateLimit, 
  AuditLog 
} from '@server/security/toolkit/decorators';

class UserController {
  // Secure a method with multiple controls
  @Secure({
    authentication: 'required',
    authorization: ['admin'],
    rateLimit: { max: 10, window: '1m' },
    auditLog: 'high'
  })
  updateUser(id: string, data: UserData) {
    // Method implementation
  }
  
  // Apply individual security controls
  @ValidateInput(userSchema)
  @Authorize(['admin', 'user'])
  @RateLimit({ max: 5, window: '1m' })
  @AuditLog({ level: 'high', includeRequest: true })
  createUser(data: UserData) {
    // Method implementation
  }
}
```

## Automatic Security Enforcement

Many security controls can be applied automatically based on conventions:

```typescript
// Enable automatic security enforcement
securityToolkit.enableAutoSecurity({
  enforceHttps: true,
  secureHeaders: true,
  rateLimiting: true,
  inputValidation: true,
  outputSanitization: true,
  auditLogging: true
});

// The system will automatically:
// - Redirect HTTP to HTTPS
// - Add secure headers to all responses
// - Apply rate limiting based on endpoint sensitivity
// - Validate input based on parameter names and types
// - Sanitize output to prevent XSS
// - Log security-relevant operations
```

## Security Level Presets

Use security level presets to quickly apply appropriate security controls:

```typescript
import { SecurityLevel, setSecurityLevel } from '@server/security/toolkit';

// Set security level for the entire application
setSecurityLevel(SecurityLevel.HIGH);

// Override for specific components
setSecurityLevel(SecurityLevel.MAXIMUM, {
  component: 'authentication'
});

// Available levels:
// - STANDARD: Basic security for non-sensitive operations
// - HIGH: Enhanced security for sensitive operations (default)
// - MAXIMUM: Maximum security for critical operations
// - CUSTOM: Custom security configuration
```

## Validation Helpers

Simplify input validation with our validation helpers:

```typescript
import { validate } from '@server/security/toolkit/validation';

// Simple validation
const result = validate(data, {
  email: 'required|email',
  password: 'required|min:8|complex',
  role: 'in:admin,user,guest'
});

// Schema-based validation
const result = validate(data, userSchema);

// Advanced validation
const result = validate(data, {
  'user.email': {
    required: true,
    email: true,
    custom: (value) => value.endsWith('@company.com')
  },
  'transaction.amount': {
    required: true,
    number: true,
    min: 0.01,
    max: 10000
  }
});

// Access validation results
if (result.valid) {
  // Use validated data
  const validData = result.data;
} else {
  // Handle validation errors
  const errors = result.errors;
}
```

## Security Context

Access security information and utilities via the security context:

```typescript
import { useSecurityContext } from '@server/security/toolkit';

function processData(data) {
  // Get security context
  const securityContext = useSecurityContext();
  
  // Access security information
  const user = securityContext.currentUser;
  const permissionLevel = securityContext.permissionLevel;
  const isSecureConnection = securityContext.isSecureConnection;
  
  // Use security utilities
  const secureData = securityContext.secureData(data);
  const secureHash = securityContext.hash(data);
  const isValidSignature = securityContext.verifySignature(data, signature);
  
  // Log security events
  securityContext.logSecurityEvent({
    action: 'process_data',
    data: { size: data.length }
  });
}
```

## Quantum-Resistant Cryptography Made Easy

Simplify the use of quantum-resistant cryptography:

```typescript
import { quantum } from '@server/security/toolkit';

// Generate a key pair
const keyPair = await quantum.generateKeyPair();

// Encrypt data
const securedData = await quantum.encrypt(data, publicKey);

// Secure a payload for API transmission
const securedPayload = await quantum.securePayload(payload, {
  encrypt: true,
  sign: true
});

// Verify and process a secured payload
const { data, verified } = await quantum.processPayload(securedPayload);

// Create and verify a quantum-resistant token
const token = await quantum.createToken(tokenData);
const { valid, payload } = await quantum.verifyToken(token);
```

## Security Middleware Factory

Create custom security middleware with the middleware factory:

```typescript
import { createSecurityMiddleware } from '@server/security/toolkit';

// Create custom security middleware
const sensitiveDataMiddleware = createSecurityMiddleware({
  authentication: 'required',
  authorization: ['admin', 'data-officer'],
  inputValidation: 'strict',
  outputEncryption: true,
  quantum: 'enabled',
  auditLog: {
    level: 'high',
    includeRequest: true
  }
});

// Apply the middleware to routes
app.get('/api/sensitive-data', sensitiveDataMiddleware, (req, res) => {
  // Route handler
});
```

## Configuration-Driven Security

Define security controls in configuration:

```typescript
// security.config.ts
export default {
  // API security configuration
  api: {
    // Route-specific security
    routes: {
      '/api/users': {
        get: {
          authentication: 'optional',
          rateLimit: { max: 100, window: '15m' }
        },
        post: {
          authentication: 'required',
          authorization: ['admin'],
          inputValidation: 'strict',
          rateLimit: { max: 20, window: '15m' },
          auditLog: 'high'
        }
      },
      '/api/public-data': {
        get: {
          authentication: 'none',
          rateLimit: { max: 200, window: '15m' }
        }
      }
    }
  },
  
  // Global security settings
  global: {
    secureHeaders: true,
    rateLimiting: true,
    auditLogging: true,
    quantumResistance: true
  }
};
```

## Security Builder Pattern

Use the builder pattern for complex security configurations:

```typescript
import { SecurityBuilder } from '@server/security/toolkit';

// Create a security configuration using the builder pattern
const security = new SecurityBuilder()
  .withAuthentication('required')
  .withAuthorization(['admin', 'manager'])
  .withRateLimit({ max: 50, window: '15m' })
  .withInputValidation('strict')
  .withOutputSanitization(true)
  .withQuantumResistance(true)
  .withAuditLogging({ level: 'high', includeRequest: true })
  .build();

// Apply the security configuration
app.use(security.createMiddleware());
```

## Security Chainable API

Use chainable methods for fluent configuration:

```typescript
import { createSecurity } from '@server/security/toolkit';

// Create and apply security in a fluent chainable way
createSecurity()
  .authenticate('required')
  .authorize(['admin'])
  .rateLimit({ max: 100, window: '15m' })
  .validateInput('strict')
  .sanitizeOutput()
  .enableQuantum()
  .auditLog('high')
  .apply(app);
```

## Practical Examples

### Example 1: Securing an Express Route

```typescript
import express from 'express';
import { securityToolkit } from '@server/security/toolkit';

const app = express();

// Apply global security middleware
app.use(securityToolkit.createMiddleware());

// Secure a specific route
app.post('/api/orders',
  securityToolkit.secureRoute({
    authentication: 'required',
    authorization: ['customer', 'admin'],
    rateLimit: { max: 20, window: '15m' },
    inputValidation: orderSchema,
    auditLog: 'high'
  }),
  (req, res) => {
    // The request is already validated and secured
    const order = req.validatedBody;
    
    // Process the order
    // ...
    
    // Send a secure response
    const secureResponse = securityToolkit.secureOutput({
      orderId: 'abc123',
      status: 'created'
    });
    
    res.json(secureResponse);
  }
);
```

### Example 2: Securing Data Transmission

```typescript
import { securityToolkit } from '@server/security/toolkit';

// Function to securely transmit data
async function securelyTransmitData(data, recipient) {
  // Generate secure keys if needed
  const { publicKey, privateKey } = await securityToolkit.quantum.generateKeyPair();
  
  // Secure the data
  const securedData = await securityToolkit.secureData(data, {
    recipientPublicKey: recipient.publicKey,
    sign: true,
    encrypt: true,
    quantum: true
  });
  
  // Transmit the secured data
  await transmitData(securedData, recipient);
  
  // Log the transmission
  securityToolkit.logSecurityEvent({
    action: 'data_transmission',
    recipient: recipient.id,
    dataSize: data.length,
    securityLevel: 'high'
  });
}
```

### Example 3: Securing a Database Operation

```typescript
import { securityToolkit } from '@server/security/toolkit';
import { db } from '@server/database';

// Function to securely update a user
async function securelyUpdateUser(userId, userData) {
  // Validate the input
  const validatedData = securityToolkit.validateInput(userData, userUpdateSchema);
  
  // Ensure authorization
  securityToolkit.enforceAuthorization(['admin', 'user-manager']);
  
  // Prepare secure storage
  const secureData = {
    ...validatedData,
    password: validatedData.password ? await securityToolkit.hashPassword(validatedData.password) : undefined,
    last_updated: Date.now(),
    updated_by: securityToolkit.getCurrentUserId()
  };
  
  // Create a secure database query
  const secureQuery = securityToolkit.createSecureQuery({
    operation: 'update',
    table: 'users',
    data: secureData,
    where: { id: userId }
  });
  
  // Execute the secure query
  const result = await db.query(secureQuery);
  
  // Log the operation
  securityToolkit.logSecurityEvent({
    action: 'user_update',
    userId,
    fieldsUpdated: Object.keys(validatedData)
  });
  
  return result;
}
```

## Best Practices for Ergonomic Security

1. **Default to secure**: Make the default path the secure path.
2. **Progressive disclosure**: Hide complexity behind simple interfaces with sensible defaults.
3. **Contextual help**: Provide guidance specific to the security context.
4. **Consistent API**: Use consistent patterns across all security interfaces.
5. **Sensible defaults**: Choose defaults that are secure but not overly restrictive.
6. **Clear error messages**: Provide actionable feedback for security errors.
7. **Security levels**: Allow quick adjustment of security strictness.
8. **Minimal boilerplate**: Reduce the code required to implement security.
9. **Automation**: Automate security tasks where possible.
10. **Discoverability**: Make security features easy to find and understand.

## Conclusion

By following these patterns and using the provided tools, you can make security a seamless part of your development process. The Security Toolkit is designed to make it easy to do the right thing, reducing the cognitive load of implementing advanced security features.