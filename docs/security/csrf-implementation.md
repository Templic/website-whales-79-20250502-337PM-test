# Deep CSRF Protection Implementation

This document provides detailed information about the Cross-Site Request Forgery (CSRF) protection system implemented in our application. The implementation provides defense-in-depth with multiple security layers beyond basic CSRF protection.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Deep Protection Features](#deep-protection-features)
4. [Server Implementation](#server-implementation)
5. [Client Implementation](#client-implementation)
6. [Configuration Options](#configuration-options)
7. [Custom Middleware Usage](#custom-middleware-usage)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

## Overview

Cross-Site Request Forgery (CSRF) is an attack that tricks the victim into submitting a malicious request to a website where they're authenticated. Our implementation goes beyond the standard double-submit cookie pattern to provide multiple layers of protection against sophisticated attacks.

### Key Benefits

- **Defense-in-depth**: Multiple validation layers for comprehensive protection
- **Compatibility**: Works with Replit Auth and other authentication systems
- **Configurability**: Extensive options for different security requirements
- **Adaptive Security**: Environment-aware configuration (dev vs. production)
- **Automatic Recovery**: Intelligent error handling with token refresh

## Architecture

The implementation uses a class-based singleton pattern with separation of concerns:

1. **Server-side CSRFProtection class**: Provides middleware, token generation, and validation
2. **Client-side CSRFTokenManager class**: Handles token fetching, caching, and request enhancement
3. **Integration utilities**: Helper functions for both server and client components

### Key Components

- **`server/middleware/csrfProtection.ts`**: Core server implementation
- **`client/src/utils/csrf.ts`**: Client-side implementation
- **`server/index.ts`**: CSRF middleware integration

## Deep Protection Features

Our implementation goes beyond basic CSRF protection with these advanced features:

### Server-side Features

1. **Token Binding**
   - Binds tokens to session IDs
   - Prevents token reuse across sessions
   - Configurable binding methods (session, IP, fingerprint)

2. **Origin Validation**
   - Verifies request origins against trusted list
   - Supports wildcard patterns for subdomains
   - Checks Referer header as fallback

3. **Entropy Validation**
   - Ensures tokens have sufficient randomness
   - Protects against weak or predictable tokens
   - Calculates Shannon entropy for validation

4. **Rate Limiting**
   - Tracks failed validation attempts per IP
   - Applies exponential backoff
   - Maintains list of suspicious IPs

5. **Security Diagnostics**
   - Comprehensive security event logging
   - Records patterns of suspicious behavior
   - Integrates with application's logging system

### Client-side Features

1. **Browser Fingerprinting**
   - Creates fingerprint for token binding
   - Enhances security against session hijacking
   - Used in token request/validation

2. **Automatic Token Management**
   - Handles token fetching and caching
   - Automatically refreshes expired tokens
   - Refreshes on page visibility changes

3. **Enhanced Request Security**
   - Adds security headers to requests
   - Enforces same-origin policy
   - Provides intelligent error handling

## Server Implementation

The server implementation is based on a class-based architecture with middleware functionality:

```typescript
// Create a CSRF protection instance with comprehensive configuration
const csrfProtection = new CSRFProtection({
  // Configure cookie properties
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // Exempt specific paths from protection
  exemptPaths: [
    '/api/webhook/stripe',
    '/api/health-check'
  ],
  
  // Enable deep protection features
  deepProtection: {
    enabled: true,
    tokenBinding: true,
    validateOrigin: true,
    // Add trusted origins
    trustedOrigins: ['https://*.example.com']
  }
});

// Apply middleware
app.use(csrfProtection.middleware);

// Set up token endpoint
csrfProtection.setupTokenEndpoint(app);
```

### Middleware Behavior

The middleware:
1. Checks if the path is exempt from protection
2. Applies deep protection validations if enabled
3. Performs standard CSRF token validation
4. Adds error handling and recovery

## Client Implementation

The client-side implementation provides a drop-in fetch replacement with automatic CSRF protection:

```typescript
// Initialize protection early in your application
import { initializeCSRFProtection, csrfFetch } from './utils/csrf';

// Initialize protection
await initializeCSRFProtection();

// Use csrfFetch instead of fetch for automatic protection
const response = await csrfFetch('/api/data', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Key Client Functions

- **`csrfFetch`**: Enhanced fetch with automatic token inclusion
- **`initializeCSRFProtection`**: Set up initial token and event listeners
- **`refreshCSRFToken`**: Manually refresh the token
- **`createCSRFHeaders`**: Create headers with CSRF token
- **`getCSRFSecurityDiagnostics`**: Get security diagnostics
- **`checkCSRFDeepProtection`**: Check if deep protection is working

## Configuration Options

The CSRFProtection class accepts these configuration options:

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cookie` | Object | See below | Cookie configuration options |
| `exemptPaths` | string[] | [] | Paths exempt from CSRF protection |
| `ignoreMethods` | string[] | ['GET', 'HEAD', 'OPTIONS'] | HTTP methods to skip protection for |
| `tokenLength` | number | 64 | Length of generated tokens |
| `enableSecurityLogging` | boolean | true | Enable security event logging |
| `refreshTokenAutomatically` | boolean | true | Auto-refresh tokens in error page |

### Cookie Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | string | '_csrf' | Cookie name |
| `path` | string | '/' | Cookie path |
| `secure` | boolean | false | HTTPS only |
| `sameSite` | boolean\|string | true | SameSite attribute |
| `httpOnly` | boolean | true | HTTP only flag |

### Deep Protection Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable deep protection features |
| `tokenBinding` | boolean | false | Bind tokens to sessions |
| `tokenSignatures` | boolean | false | Apply cryptographic signatures |
| `doubleSubmitCheck` | boolean | true | Standard double-submit pattern |
| `entropyValidation` | boolean | false | Validate token entropy |
| `validateOrigin` | boolean | false | Validate request origins |
| `trustedOrigins` | string[] | [] | Allowed origins |
| `enableRateLimiting` | boolean | false | Enable rate limiting |
| `rateLimitThreshold` | number | 5 | Max failures before limiting |
| `rateLimitWindowMs` | number | 60000 | Window for counting failures |
| `securityHeaderCheck` | boolean | false | Check for common security headers |
| `tokenBindingMethod` | string | 'session' | Binding method ('session', 'ip', or 'fingerprint') |
| `signatureSecret` | string | undefined | Secret for token signatures |

## Custom Middleware Usage

For custom routes or specialized protection, you can create a middleware instance:

```typescript
import { createCSRFMiddleware } from './middleware/csrfProtection';

// Create custom middleware
const apiProtection = createCSRFMiddleware({
  exemptPaths: ['/api/public'],
  deepProtection: { enabled: true }
});

// Apply to specific routes
app.use('/api', apiProtection);
```

## Troubleshooting

### Common Issues

1. **"CSRF token validation failed" errors**
   - Check that tokens are being correctly fetched and sent
   - Verify exempt paths are configured correctly
   - Ensure cookies are properly set and not being blocked

2. **Rate limiting triggered unexpectedly**
   - Check browser extensions that might be making API calls
   - Review request patterns in logs
   - Adjust rate limit threshold if needed

3. **Token binding failures**
   - Verify session configuration
   - Check that fingerprinting is working correctly
   - Validate that binding method is appropriate for your app

### Debugging Tips

The system includes diagnostic tools for troubleshooting:

**Client-side:**
```typescript
// Get detailed diagnostics
const diagnostics = getCSRFSecurityDiagnostics();
console.log(diagnostics);

// Check protection status
const protectionStatus = checkCSRFDeepProtection();
console.log(protectionStatus);
```

**Server-side:**
Enable verbose logging by setting `enableSecurityLogging: true` in your configuration.

## Security Considerations

1. **Token Exposure**
   - CSRF tokens should never be included in URLs
   - Always use HTTP headers for token transmission
   - Ensure tokens are not logged or exposed in error messages

2. **Cookie Security**
   - Always use HttpOnly, Secure, and SameSite attributes in production
   - Consider using "strict" SameSite policy for highest security

3. **Exempt Paths**
   - Minimize exempt paths to only what's necessary
   - Carefully review any path marked as exempt
   - Consider alternative protection for exempt endpoints

4. **Authentication Integration**
   - CSRF protection is most effective when paired with proper authentication
   - Ensure logout functionality invalidates CSRF tokens
   - Consider shorter token lifetimes for sensitive operations

---

## Implementation Credits

The deep CSRF protection system was designed and implemented by the security engineering team as part of the application's advanced security features.