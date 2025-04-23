# CSRF Protection

## Overview

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to execute unwanted actions on a web application in which they're currently authenticated. This protection module provides robust defenses against CSRF attacks through token-based verification.

## Implementation Details

The CSRF protection system implements multiple layers of defense:

1. **Double-Submit Cookie Pattern**: A cryptographically secure token is stored both in a cookie and sent in request headers, requiring both to match for state-changing requests.

2. **Per-Request Token Rotation**: After successful validation, a new token is generated for the next request, preventing token reuse.

3. **Token Association**: Tokens can be associated with specific user sessions and routes for context-based validation.

4. **Token Lifecycle Management**: Includes token expiration, token usage tracking, minimum token age validation, and route-specific validation.

5. **Immutable Security Logging**: Failed CSRF validations are logged to the blockchain-based security log with detailed contextual information.

## Components

### CSRFProtection Class

The core class implementing CSRF protection functionality:

- `generateToken(sessionId?, route?)`: Creates a new CSRF token with a unique identifier, expiration time, and optional session/route association
- `validateToken(request, route?)`: Validates a CSRF token from the request with comprehensive checks
- `setTokenCookie(response)`: Sets a CSRF token cookie and returns the token
- `createMiddleware()`: Creates Express middleware for CSRF validation on state-changing requests
- `createTokenMiddleware()`: Creates Express middleware to set initial CSRF tokens

### CSRFValidator Class

Provides CSRF vulnerability detection capabilities:

- `validateCSRFToken(request)`: Verifies if a request contains valid CSRF tokens
- `detectMissingCSRFProtection(html)`: Analyzes HTML content for forms missing CSRF tokens
- `analyzeCSRFVulnerability(request, response)`: Evaluates the overall CSRF protection status of requests/responses

## Configuration Options

The CSRF protection can be configured with the following options:

```typescript
interface CSRFOptions {
  cookieName?: string;            // Name of the CSRF token cookie (default: '_csrf')
  headerName?: string;            // Name of the CSRF token header (default: 'x-csrf-token')
  expiryTime?: number;            // Token expiration time in ms (default: 24 hours)
  excludeRoutes?: string[];       // Routes to exclude from CSRF protection
  doubleSubmitVerification?: boolean; // Whether to verify both cookie and header tokens
}
```

## Integration

The CSRF protection middleware is automatically integrated into the security system when maximum security mode is enabled. The middleware applies to all state-changing HTTP methods (POST, PUT, DELETE, etc.) except for excluded routes.

## Token Data Structure

Each CSRF token contains the following data:

```typescript
interface CSRFTokenData {
  token: string;       // The CSRF token value
  expires: number;     // Expiration timestamp
  id?: string;         // Unique identifier for this token
  sessionId?: string;  // Session ID this token is associated with
  route?: string;      // Route this token is for (if using per-route tokens)
  used?: boolean;      // Whether this token has been used (for one-time tokens)
  created: number;     // Creation timestamp
}
```

## Security Features

1. **Anti-Replay Protection**: Tokens can be marked as used after validation, preventing token replay attacks.

2. **Token Stealing Protection**: Validates token age to prevent token stealing through timing attacks.

3. **Context-Aware Validation**: Routes and session IDs can be validated to ensure tokens are used in the correct context.

4. **Automatic Token Refresh**: Tokens are automatically refreshed after each state-changing request.

5. **Security Event Logging**: Failed validations are logged as security events with detailed context information.

## Client-Side Integration

For client-side applications, the CSRF token is available in the `X-CSRF-Token` response header. This token should be included in the same header for subsequent state-changing requests.

Example client-side code:

```javascript
// Extract CSRF token from response header
const csrfToken = response.headers.get('X-CSRF-Token');

// Include token in subsequent requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

## Security Considerations

1. The CSRF tokens are cryptographically secure, generated using `crypto.randomBytes()`.
2. Tokens are transmitted as HTTP-only cookies with the 'Secure' flag in production and 'SameSite=Lax' attribute.
3. Token validation includes multiple security checks to prevent various attack vectors.
4. Failed validations are logged with detailed context for security analysis.