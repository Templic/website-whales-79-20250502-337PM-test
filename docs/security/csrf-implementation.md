# Advanced CSRF Protection Architecture

This guide provides detailed documentation for our enhanced Cross-Site Request Forgery (CSRF) protection system.

## Architecture Overview

Our CSRF protection implements a comprehensive defense mechanism based on double-submit cookies with path exemptions, providing maximum security while maintaining compatibility with authentication flows, particularly Replit Auth.

### Design Principles

The implementation follows these key principles:

1. **Defense in Depth**: Multiple layers of protection, both server and client side
2. **Progressive Enhancement**: Graceful degradation in development environments
3. **Performance Optimization**: Efficient token generation and validation
4. **Usability**: Automatic token refresh and intuitive error handling
5. **Transparency**: Comprehensive logging for security monitoring

## Server-Side Implementation

### Class-Based Architecture

We use a class-based approach for better organization, state management, and flexibility:

```typescript
// server/middleware/csrfProtection.ts
export class CSRFProtection {
  // Class properties store configuration state
  private options: CSRFProtectionOptions;
  private csrfInstance: any;
  
  // Constructor configures protection with secure defaults
  constructor(options: CSRFProtectionOptions = {}) {
    // Implementation details...
  }
  
  // Public middleware method for Express integration
  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Implementation details...
  }
  
  // Other methods...
}
```

### Configuration Options

The CSRF protection is highly configurable through the `CSRFProtectionOptions` interface:

```typescript
interface CSRFProtectionOptions {
  // Cookie configuration
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    maxAge?: number;
    path?: string;
    domain?: string;
  };
  
  // Path & method configuration
  exemptPaths?: string[];
  ignoreMethods?: string[];
  
  // Security features
  enableSecurityLogging?: boolean;
  tokenLength?: number;
  refreshTokenAutomatically?: boolean;
}
```

### Integration in Server Index

The protection is initialized early in the server startup process:

```typescript
// server/index.ts
const csrfProtection = new CSRFProtection({
  // Configuration options
});

// Apply middleware to all routes
app.use(csrfProtection.middleware);

// Set up token endpoint
csrfProtection.setupTokenEndpoint(app);
```

### Exempt Paths

The following paths are exempt from CSRF protection by default:

- Authentication endpoints: `/api/login`, `/api/callback`, `/api/auth/*`, `/api/logout`
- Public API endpoints: `/api/public/*`, `/api/health`, `/api/metrics/*`
- External webhooks: `/api/webhook/*`
- The CSRF token endpoint itself: `/api/csrf-token`

Additional exemptions can be configured as needed.

## Client-Side Implementation

### Singleton Token Manager

The client-side implementation uses a singleton token manager for efficient token handling:

```typescript
// client/src/utils/csrf.ts
class CSRFTokenManager {
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private tokenExpiryTime: number = 0;
  
  // Methods for token management...
}

// Create singleton instance
const tokenManager = new CSRFTokenManager();
```

### Enhanced Fetch Function

The `csrfFetch` function provides enhanced fetch capabilities with automatic token inclusion:

```typescript
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Refresh token if needed
  if (tokenManager.needsRefresh()) {
    await tokenManager.fetchToken();
  }
  
  // Add token to headers and make request
  // Implementation details...
}
```

### Usage in Frontend Components

To use CSRF protection in front-end components:

```typescript
import { csrfFetch, initializeCSRFProtection } from '@/utils/csrf';

// Initialize protection early in your app (e.g., in App.tsx)
useEffect(() => {
  initializeCSRFProtection();
}, []);

// Use enhanced fetch for API requests
async function submitForm(data) {
  const response = await csrfFetch('/api/some-endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Process response...
}
```

## Error Handling & User Experience

### Server-Side Error Responses

For API requests that fail CSRF validation, a JSON response is returned:

```json
{
  "error": "CSRF token validation failed",
  "code": "CSRF_ERROR",
  "message": "Invalid security token. Please refresh the page and try again."
}
```

For web page requests, a user-friendly HTML page is returned with:
- Clear explanation of the issue
- Automatic token refresh
- Button to refresh the page

### Client-Side Error Handling

The client-side implementation includes intelligent error handling:
- Automatic token refresh on 403 CSRF errors
- Request retry with the new token
- Graceful degradation in development environments

## Security Logging

The implementation includes detailed security logging:

```typescript
private logSecurityEvent(event: CSRFSecurityEvent, data: Record<string, any> = {}): void {
  // Log different events with appropriate details...
}
```

Events logged include:
- Token generation
- Token validation failures
- IP addresses and user agents for potential attacks

## Compatibility with Replit Auth

The CSRF protection is fully compatible with Replit Auth through:

1. Path-based exemptions for authentication endpoints
2. Proper cookie configuration (SameSite, HttpOnly, etc.)
3. Intelligent token refresh mechanism

## Performance Considerations

The implementation includes several performance optimizations:

1. Single token refresh promise to prevent duplicate requests
2. Token caching with controlled expiry
3. Minimal middleware overhead with path-based checks
4. Efficient validation logic

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Express CSRF Protection (csurf)](https://github.com/expressjs/csurf)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)