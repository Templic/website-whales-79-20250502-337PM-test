# CSRF Protection Implementation Guide

This guide explains how Cross-Site Request Forgery (CSRF) protection is implemented in the application.

## Overview

CSRF protection helps prevent attackers from tricking authenticated users into performing unintended actions. Our implementation uses a token-based approach with exemptions for authentication routes (particularly Replit Auth integration).

## Implementation Details

### Server-Side Implementation

The CSRF protection is implemented in the following files:

1. `server/middleware/csrfProtection.ts`: Contains the core CSRF middleware with path exemptions
2. `server/index.ts`: Sets up the CSRF middleware at the application level
3. `server/middleware/index.ts`: Acknowledges the CSRF configuration

#### Key Features

- **Path-based Exemptions**: Authentication routes and specific API endpoints are exempt from CSRF protection
- **Token Endpoint**: A dedicated endpoint (`/api/csrf-token`) provides tokens to clients
- **Error Handling**: Specific error handling for CSRF validation failures

### Client-Side Implementation

The client-side implementation includes:

1. `client/src/utils/csrfUtils.ts`: Core CSRF token utilities
2. `client/src/utils/csrfFetch.ts`: Enhanced fetch function that automatically includes CSRF tokens

#### Usage in Frontend

To make CSRF-protected requests:

```typescript
import { csrfFetch } from '@/utils/csrfFetch';

// The CSRF token is automatically included
const response = await csrfFetch('/api/data', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
});
```

## Exempted Routes

The following routes are exempt from CSRF protection:

- `/api/login`
- `/api/callback`
- `/api/auth` and `/api/auth/*`
- `/api/logout`
- `/api/csrf-token` (the token endpoint itself)
- `/api/public/*`
- `/api/health`
- `/api/webhook`
- `/api/metrics`

## How It Works with Replit Auth

Replit Auth is integrated with our CSRF protection by:

1. Exempting all authentication-related routes from CSRF checking
2. Ensuring the session management is properly integrated with token generation
3. Providing compatibility with Replit's authentication flow

## Troubleshooting

If you encounter CSRF-related issues:

1. **403 Errors with "CSRF token validation failed"**: 
   - Check that your client-side code is correctly fetching and including the token
   - Verify that cookies are being properly sent with requests

2. **Issues with Authentication Flow**:
   - Ensure the authentication routes are properly exempted
   - Check that the CSRF token cookie is being properly set

3. **Token Refresh Issues**:
   - The client automatically refreshes invalid tokens, but you can manually fetch a new token using:
   ```typescript
   import { fetchCSRFToken } from '@/utils/csrfUtils';
   await fetchCSRFToken();
   ```

## Best Practices

- Always use the `csrfFetch` utility instead of plain `fetch` for API requests
- Keep the list of exempted paths minimal
- Monitor for CSRF validation failures in server logs as they may indicate attack attempts

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Express CSRF Protection (csurf)](https://github.com/expressjs/csurf)