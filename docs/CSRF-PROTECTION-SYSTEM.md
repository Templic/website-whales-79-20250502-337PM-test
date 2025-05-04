# CSRF Protection System

## Overview

This document describes the Cross-Site Request Forgery (CSRF) protection system implemented in the Dale Loves Whales application. The system provides robust security while maintaining compatibility with third-party integrations like Taskade.

## Core Components

The CSRF protection system consists of several key components:

1. **CSRFProtectionMiddleware**: Main Express middleware that enforces CSRF token validation
2. **CSRFProtectionService**: Service layer that handles token generation and validation
3. **ContentApiCsrfBypass**: Specialized middleware for handling CSRF exemptions
4. **ThirdPartyIntegrationMiddleware**: Middleware for managing third-party service integrations

## Architecture

```
CSRFProtectionService (Token Management)
            ↓
CSRFProtectionMiddleware (Express Integration)
            ↓
ContentApiCsrfBypass (Exemption Logic)
            ↓
ThirdPartyIntegrationMiddleware (3rd Party Handling)
```

## Token Implementation

### Token Format

The CSRF tokens use a double-submit cookie pattern with the following format:

```
[random-token]-[timestamp]-[signature]
```

Where:
- `random-token`: Cryptographically secure random string
- `timestamp`: Token creation time for expiration checking
- `signature`: HMAC-SHA256 signature of the token and timestamp

### Token Storage

Tokens are stored in two places to enable the double-submit pattern:

1. **HTTP Cookie**: Secure, HTTP-only cookie that is not accessible to JavaScript
2. **Session Storage**: Token is also stored in the user's session for server-side validation

Example cookie setting:

```javascript
res.cookie('csrf-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: config.tokenMaxAge
});
```

## Integration with Express

The CSRF middleware integrates with Express for all routes by default:

```javascript
// Apply CSRF protection to all routes
app.use(csrfProtectionMiddleware);

// Apply CSRF exemptions
app.use(contentApiCsrfBypass);

// Set CSRF token cookie for client
app.use(csrfTokenSetter);
```

## Third-Party Integration Support

### ContentApiCsrfBypass Middleware

This middleware provides exemptions for specific routes and domains to maintain compatibility with third-party services:

```javascript
export const contentApiCsrfBypass: RequestHandler = (req, res, next) => {
  // Skip CSRF for specific paths
  const csrfExemptPaths = [
    '/service-worker.js',
    '/taskade-embed',
    '/_next/',
    '/favicon.ico'
  ];
  
  // Check for Vite development paths
  if (isVitePath(req.path)) {
    req.__skipCSRF = true;
    return next();
  }
  
  // Check for content API paths
  if (req.path.startsWith('/api/content/')) {
    req.__skipCSRF = true;
    console.log('[Content API] Setting __skipCSRF flag for content API route:', req.path);
    return next();
  }
  
  // Skip for exempt paths
  if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
    req.__skipCSRF = true;
    console.log('[CSRF Debug] Exempting special path from CSRF:', req.path);
    return next();
  }
  
  // Check for Taskade domains
  const taskadeDomains = [
    'taskade.com',
    'www.taskade.com',
    'ai.taskade.com'
  ];
  
  if (taskadeDomains.some(domain => req.hostname?.includes(domain))) {
    req.__skipCSRF = true;
    console.log('[CSRF Debug] Exempting Taskade domain from CSRF:', req.hostname);
    return next();
  }
  
  // Regular CSRF check for non-exempt routes
  next();
};
```

### Trusted Origins Management

The system maintains a list of trusted origins that are exempt from CSRF checks:

```javascript
// Trusted origins configuration
const trustedOrigins = [
  // Development origins
  'localhost',
  '127.0.0.1',
  // Replit-specific development origins
  '.repl.co',
  '.replit.dev',
  '.repl.run',
  // Production origins
  'daleloveswhales.com',
  'www.daleloveswhales.com',
  // Third-party integration origins
  'taskade.com',
  'www.taskade.com',
  'ai.taskade.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'maps.google.com',
  'googleapis.com',
  'api.openai.com',
  'openai.com',
  'js.stripe.com',
  'api.stripe.com'
];
```

## CSRF Token Validation

The validation process follows these steps:

1. Check if the route is exempt from CSRF protection
2. Extract the token from the request (headers, body, or query)
3. Retrieve the token from the session
4. Validate the token signature
5. Check if the token has expired
6. Verify the tokens match

```javascript
function validateToken(req, res, next) {
  // Skip validation if explicitly marked to bypass
  if (req.__skipCSRF) {
    return next();
  }
  
  // Get the token from the request
  const token = extractToken(req);
  
  // Check if token exists
  if (!token) {
    console.error('[CSRF Error] Missing CSRF token');
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  // Get token from session
  const sessionToken = req.session?.['csrf-token'];
  
  if (!sessionToken) {
    console.error('[CSRF Error] Missing session token');
    return res.status(403).json({ error: 'CSRF session token missing' });
  }
  
  // Validate signature
  if (!validateSignature(token)) {
    console.error('[CSRF Error] Invalid token signature');
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  // Check expiration
  if (isTokenExpired(token)) {
    console.error('[CSRF Error] Token expired');
    return res.status(403).json({ error: 'CSRF token expired' });
  }
  
  // Check if tokens match
  if (token !== sessionToken) {
    console.error('[CSRF Error] Token mismatch');
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }
  
  // Record successful validation (for rate limiting integration)
  recordCsrfSuccess(req.ip, req.session?.id);
  
  // Validation passed
  next();
}
```

## Integration with Rate Limiting

The CSRF protection system integrates with the rate limiting system to provide enhanced security:

```javascript
// When CSRF validation succeeds
function recordCsrfSuccess(ip, sessionId) {
  // Inform the rate limiting system
  rateLimitingSystem.recordEvent('csrf-success', {
    ip,
    sessionId,
    timestamp: Date.now()
  });
}

// When CSRF validation fails
function recordCsrfFailure(ip, sessionId) {
  // Inform the rate limiting system
  rateLimitingSystem.recordEvent('csrf-failure', {
    ip,
    sessionId,
    timestamp: Date.now()
  });
}
```

## Client-Side Implementation

The system includes client-side utilities for including CSRF tokens in requests:

```javascript
// Example client-side CSRF token inclusion
async function fetchWithCsrf(url, options = {}) {
  // Get the CSRF token from the meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  // Set up headers
  const headers = {
    ...options.headers,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  return response;
}
```

## Taskade-Specific Implementation

### Custom Embed Page

The `/taskade-embed` page is exempt from CSRF checks to enable seamless embedding of Taskade:

```javascript
// Taskade embed route handler
app.get('/taskade-embed', (req, res) => {
  // This route is exempt from CSRF via contentApiCsrfBypass
  
  // Extract parameters
  const { id, view = 'agent', theme = 'system', memory = '1', style = 'taskade' } = req.query;
  
  // Security validation
  if (!id || typeof id !== 'string') {
    return res.status(400).send('Invalid Taskade ID');
  }
  
  // Generate secure embed page
  const embedHtml = generateTaskadeEmbed(id, view, theme, memory, style);
  
  // Set appropriate headers
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.send(embedHtml);
});
```

### Frame Ancestors Policy

The system implements Content Security Policy (CSP) with frame-ancestors directive to control which domains can embed our content:

```javascript
// CSP for Taskade embed
app.use((req, res, next) => {
  // Set CSP header
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "frame-src 'self' *.taskade.com; " +
    "frame-ancestors 'self';" +
    "connect-src 'self' *.taskade.com api.openai.com;"
  );
  next();
});
```

## Security Considerations

### Token Rotation

The system implements automatic token rotation to enhance security:

- Tokens are rotated on authentication state change (login/logout)
- Tokens can be configured to rotate on a time-based schedule
- Forced rotation can be triggered on security events

### Logging and Monitoring

The system includes comprehensive logging to detect and respond to CSRF attacks:

```javascript
// Example CSRF security event
{
  timestamp: '2025-04-19T14:32:45.123Z',
  type: 'csrf-failure',
  subtype: 'token-mismatch',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0 ...',
  path: '/api/user/profile',
  method: 'POST',
  outcome: 'blocked'
}
```

## Configuration Options

The CSRF protection system supports the following configuration options:

```javascript
{
  // Core configuration
  enabled: true,               // Enable/disable CSRF protection
  tokenMaxAge: 86400000,       // Token validity period (24 hours)
  
  // Cookie settings
  cookie: {
    name: 'csrf-token',        // Cookie name
    httpOnly: true,            // Not accessible to JavaScript
    secure: true,              // HTTPS only
    sameSite: 'strict',        // Prevent cross-site delivery
  },
  
  // Token settings
  token: {
    length: 32,                // Token length
    headerName: 'X-CSRF-Token', // HTTP header name
    fieldName: '_csrf',        // Form field name
  },
  
  // Error handling
  errors: {
    missing: 'CSRF token missing',
    invalid: 'CSRF token invalid',
    expired: 'CSRF token expired',
    mismatch: 'CSRF token mismatch'
  },
  
  // Exemptions
  exemptPaths: [
    '/service-worker.js',
    '/taskade-embed',
    '/_next/',
    '/favicon.ico'
  ],
  
  // Trusted origins
  trustedOrigins: [
    'localhost',
    'daleloveswhales.com',
    'www.daleloveswhales.com',
    // Third-party integrations
    'taskade.com',
    'www.taskade.com',
    'ai.taskade.com',
    // Additional trusted origins
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'maps.google.com',
    'googleapis.com',
    'api.openai.com'
  ]
}
```

## Usage Examples

### Basic Implementation

```javascript
import express from 'express';
import { csrfProtectionMiddleware, contentApiCsrfBypass } from './security/csrf';

const app = express();

// Setup middleware
app.use(express.json());
app.use(sessionMiddleware);

// Apply CSRF protection
app.use(contentApiCsrfBypass); // Check for exemptions first
app.use(csrfProtectionMiddleware); 

// Example protected route
app.post('/api/user/profile', (req, res) => {
  // CSRF token already validated by middleware
  res.json({ message: 'Profile updated' });
});
```

### Setting the CSRF Token

```javascript
// Middleware to set the CSRF token cookie and expose to frontend
app.use((req, res, next) => {
  // Skip for exempted routes
  if (req.__skipCSRF) {
    return next();
  }
  
  // Generate token if not exists
  if (!req.session['csrf-token']) {
    const token = generateCsrfToken();
    req.session['csrf-token'] = token;
    req.session['csrf-token-timestamp'] = Date.now();
    
    // Set cookie
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.tokenMaxAge
    });
    
    console.log('[CSRF Debug] Token generated:', token.substring(0, 8) + '...');
  }
  
  // Make token available to templates
  res.locals.csrfToken = req.session['csrf-token'];
  
  next();
});
```

### Excluding Routes

```javascript
// Exclude specific routes from CSRF protection
app.post('/api/webhook', 
  (req, res, next) => {
    req.__skipCSRF = true;
    next();
  },
  webhookHandler
);
```

## Testing CSRF Protection

The CSRF protection can be tested using the following approaches:

### Manual Testing

```javascript
// Example test script
async function testCsrfProtection() {
  // Test valid token
  const validResponse = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({ test: true })
  });
  
  // Test missing token
  const missingResponse = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ test: true })
  });
  
  // Test invalid token
  const invalidResponse = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': 'invalid-token'
    },
    body: JSON.stringify({ test: true })
  });
  
  console.log('Valid token response:', validResponse.status);
  console.log('Missing token response:', missingResponse.status);
  console.log('Invalid token response:', invalidResponse.status);
}
```

### Automated Testing

```javascript
// Example Jest test
describe('CSRF Protection', () => {
  let csrfToken;
  
  beforeEach(async () => {
    // Login and get a CSRF token
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'password' });
    
    // Extract token from cookie
    const cookies = response.headers['set-cookie'];
    const csrfCookie = cookies.find(cookie => cookie.startsWith('csrf-token='));
    csrfToken = csrfCookie.split(';')[0].replace('csrf-token=', '');
  });
  
  test('requests with valid token should succeed', async () => {
    const response = await request(app)
      .post('/api/data')
      .set('X-CSRF-Token', csrfToken)
      .send({ test: true });
    
    expect(response.status).toBe(200);
  });
  
  test('requests without token should fail', async () => {
    const response = await request(app)
      .post('/api/data')
      .send({ test: true });
    
    expect(response.status).toBe(403);
  });
  
  test('requests with invalid token should fail', async () => {
    const response = await request(app)
      .post('/api/data')
      .set('X-CSRF-Token', 'invalid-token')
      .send({ test: true });
    
    expect(response.status).toBe(403);
  });
});
```

## Troubleshooting

Common issues and solutions:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Unexpected 403 errors | CSRF token missing or invalid | Check if token is properly included in requests |
| Third-party integration broken | CSRF exemption not applied | Verify contentApiCsrfBypass configuration |
| Token mismatch errors | Token rotation or session issues | Ensure consistent session handling |
| Performance impact | Excessive token generation | Configure token rotation frequency appropriately |

## Related Documentation

- [Rate Limiting System](./RATE-LIMITING-SYSTEM.md)
- [Security Framework Overview](./SECURITY-FRAMEWORK.md)
- [Taskade Integration](./TASKADE-INTEGRATION.md)