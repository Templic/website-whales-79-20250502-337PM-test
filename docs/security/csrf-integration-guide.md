# CSRF Protection Integration Guide

This guide provides step-by-step instructions for integrating our deep CSRF protection system into your application.

## Quick Start

### Server-Side Integration

1. **Configure CSRF Protection in your Express app:**

```typescript
import express from 'express';
import { CSRFProtection } from './middleware/csrfProtection';

const app = express();

// Create protection instance
const csrfProtection = new CSRFProtection({
  // Basic configuration
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // Paths to exempt from CSRF protection
  exemptPaths: [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/webhooks/*'
  ],
  
  // Enable deep protection features
  deepProtection: {
    enabled: true,
    tokenBinding: true,
    validateOrigin: true,
    trustedOrigins: [
      'https://yourdomain.com',
      'https://*.yourdomain.com'
    ]
  }
});

// Apply CSRF middleware
app.use(csrfProtection.middleware);

// Set up the token endpoint
csrfProtection.setupTokenEndpoint(app);
```

2. **Enable additional security headers:**

```typescript
import helmet from 'helmet';

// Enable security headers with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      // other CSP directives
    }
  }
}));
```

### Client-Side Integration

1. **Initialize CSRF protection in your frontend app:**

```typescript
// In your main app entry point (e.g., index.ts, App.tsx)
import { initializeCSRFProtection } from './utils/csrf';

// Initialize early in your application
async function initApp() {
  try {
    await initializeCSRFProtection();
    // Continue with app initialization
    renderApp();
  } catch (error) {
    console.error('Failed to initialize CSRF protection:', error);
    // Show error or retry
  }
}

initApp();
```

2. **Use enhanced fetch for API calls:**

```typescript
import { csrfFetch } from './utils/csrf';

// Example API function with CSRF protection
async function fetchUserData() {
  try {
    const response = await csrfFetch('/api/user/profile', {
      method: 'GET',
      // Other fetch options as needed
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}
```

3. **For form submissions:**

```typescript
import { createCSRFHeaders } from './utils/csrf';

// Example form submission with CSRF protection
async function submitForm(formData) {
  try {
    const headers = createCSRFHeaders({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch('/api/form/submit', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
}
```

## Integration with Authentication

For optimal security, integrate CSRF protection with your authentication system:

### Secure Login Flow

```typescript
// Server: Login route (exempted from CSRF)
app.post('/api/auth/login', async (req, res) => {
  // Authenticate user
  const { user, token } = await authenticateUser(req.body);
  
  // Set session and authentication cookies
  req.session.userId = user.id;
  
  // Return response with user data
  res.json({ 
    success: true, 
    user: { id: user.id, name: user.name } 
  });
});

// Client: After login, initialize CSRF protection
async function handleLogin(credentials) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Initialize CSRF protection after login
    await initializeCSRFProtection();
    // Navigate to dashboard or home
    navigateTo('/dashboard');
  }
}
```

### Secure Logout Flow

```typescript
// Server: Logout route (may be CSRF protected)
app.post('/api/auth/logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    // Clear authentication cookies
    res.clearCookie('connect.sid');
    
    // Return success
    res.json({ success: true });
  });
});

// Client: Handle logout
async function handleLogout() {
  try {
    // Use CSRF protected fetch for logout
    const response = await csrfFetch('/api/auth/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      // Redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

## Testing CSRF Protection

Verify your CSRF protection implementation with these tests:

### Server-Side Tests

1. **Test token generation:**
   ```
   curl -v http://localhost:3000/api/csrf-token
   ```

2. **Test protected endpoint:**
   ```
   # This should fail with 403 CSRF error
   curl -v -X POST http://localhost:3000/api/protected-endpoint
   
   # Proper call with token (requires token extraction from previous request)
   curl -v -X POST \
     -H "X-CSRF-Token: TOKEN_VALUE" \
     -H "Content-Type: application/json" \
     --cookie "connect.sid=SESSION_COOKIE" \
     http://localhost:3000/api/protected-endpoint
   ```

### Client-Side Tests

In your browser console:

1. **Check CSRF diagnostics:**
   ```javascript
   import { getCSRFSecurityDiagnostics, checkCSRFDeepProtection } from './utils/csrf';
   
   // Get diagnostics
   console.log(getCSRFSecurityDiagnostics());
   
   // Check deep protection status
   console.log(checkCSRFDeepProtection());
   ```

2. **Test manual token refresh:**
   ```javascript
   import { refreshCSRFToken } from './utils/csrf';
   
   // Refresh token manually
   refreshCSRFToken().then(token => {
     console.log('New token:', token);
   });
   ```

## Troubleshooting

### Common Integration Issues

1. **CSRF validation errors**
   - Check for cookie settings, especially across domains
   - Verify exempt paths are configured correctly
   - Ensure tokens are being sent in the header, not as query parameters

2. **Authentication conflicts**
   - Make sure CSRF middleware runs after session middleware
   - Verify login/logout routes are properly exempted if needed
   - Check for cookie conflicts (name, path, domain)

3. **Client-side issues**
   - Confirm the initializeCSRFProtection function is called early
   - Use the browser dev tools to verify cookies and request headers
   - Check for CORS issues if your API is on a different domain

For more detailed information, refer to the [CSRF Implementation Documentation](./csrf-implementation.md).

---

## Best Practices

1. **Always use HTTPS in production**
2. **Set secure, httpOnly, and sameSite cookie attributes**
3. **Minimize exempt paths to only what's absolutely necessary**
4. **Integrate deep protection features gradually, testing each step**
5. **Use the diagnostic tools to verify your integration**

This integration guide provides the basics. For advanced configuration and security considerations, consult the full documentation.