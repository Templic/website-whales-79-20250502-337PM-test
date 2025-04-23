# CSRF Protection Documentation

## Overview

Cross-Site Request Forgery (CSRF) is a type of security vulnerability that allows an attacker to trick a user into performing unwanted actions on a website where they're authenticated. Our application implements a comprehensive CSRF protection system to prevent these attacks.

## CSRF Protection Features

Our CSRF protection system includes the following features:

1. **Per-Request Token Rotation**
   - Each request generates a new CSRF token for enhanced security
   - Makes token prediction virtually impossible, even with token leakage

2. **Session Association**
   - CSRF tokens are securely associated with user sessions
   - Prevents token reuse across different user sessions

3. **Strict Validation**
   - Tokens are validated for authenticity, expiration, and session match
   - Comprehensive validation failure reporting for easier debugging

4. **Double-Submit Cookie Pattern**
   - Implements token submission in both headers and cookies
   - Provides protection even if the JavaScript context is compromised

5. **Multiple Submission Methods Support**
   - Supports token submission via HTTP headers, form fields, and query parameters
   - Configurable validation options for different types of requests

## Implementation Details

### Token Generation

CSRF tokens are generated using cryptographically secure random bytes and include:

- Random base (64 bytes)
- Session identifier (hashed)
- Timestamp for expiration
- Digital signature for verification

### Validation Process

The validation process follows these steps:

1. Extract the token from the request (header, body, or query parameter)
2. Verify the token format and structure
3. Check the token's expiration timestamp
4. Validate the token's association with the current session
5. Verify the token's digital signature

### Configuration Options

The CSRF protection system is highly configurable:

```typescript
const csrfProtection = new CSRFProtection({
  // Cookie options
  cookieName: 'XSRF-TOKEN',
  cookieOptions: {
    httpOnly: false,
    secure: true,
    sameSite: 'strict'
  },
  
  // Token options
  tokenLength: 64,
  headerName: 'X-CSRF-Token',
  expireTimeMs: 3600000, // 1 hour
  
  // Validation options
  enablePerRequestToken: true,
  allowMultipleSubmissionMethods: true,
  requireSessionMatch: true
});
```

## Using CSRF Protection in Your Code

### For API Endpoints

For API endpoints that modify state, use the CSRF middleware:

```typescript
// Apply CSRF protection to a route
app.post('/api/update-profile', csrfProtection.middleware, (req, res) => {
  // Route handler code
});
```

### For Templates/Frontend

In your frontend code or templates, include the CSRF token:

```html
<!-- In a form -->
<form method="POST" action="/api/update-profile">
  <input type="hidden" name="_csrf" value="${csrfToken}">
  <!-- Other form fields -->
</form>

<!-- For JavaScript fetch/ajax calls -->
<script>
  fetch('/api/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': '${csrfToken}'
    },
    body: JSON.stringify({ /* data */ })
  });
</script>
```

## Troubleshooting

### Common CSRF Validation Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `MISSING_TOKEN` | CSRF token is missing from the request | Ensure the token is included in the header, form field, or query parameter |
| `INVALID_TOKEN_FORMAT` | Token format is invalid | Regenerate the token and ensure it's not being modified |
| `EXPIRED_TOKEN` | Token has expired | Refresh the page or request a new token |
| `SESSION_MISMATCH` | Token doesn't match the current session | Ensure the token is being used in the same session it was generated |
| `SIGNATURE_INVALID` | Token signature verification failed | Regenerate the token and check for tampering |

### Testing CSRF Protection

To ensure your CSRF protection is working correctly:

1. **Positive testing:** Ensure valid requests with proper CSRF tokens are accepted
2. **Negative testing:** Verify that requests without tokens or with invalid tokens are rejected
3. **Cross-domain testing:** Confirm that requests from other domains cannot reuse your tokens

## Advanced Security Considerations

For maximum security, consider these additional measures:

1. **Implement SameSite Cookies:** Set cookies with `SameSite=Strict` to prevent cross-site cookie usage
2. **Use HTTPS Only:** Always use HTTPS to prevent token interception via man-in-the-middle attacks
3. **Short Token Lifetimes:** Use shorter token lifetimes for sensitive operations
4. **Rate Limiting:** Implement rate limiting on failed CSRF validations to prevent brute force attacks

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CSRF Protection in Express.js](https://github.com/expressjs/csurf)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)