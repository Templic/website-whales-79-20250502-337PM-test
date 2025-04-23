# CSRF Protection Developer Guide

This guide provides practical instructions for implementing CSRF protection in various parts of the application.

## Why CSRF Protection is Necessary

Cross-Site Request Forgery (CSRF) attacks exploit the trust a web application has in a user's browser. Without proper protection, attackers can trick authenticated users into executing unwanted actions on websites they are logged into. CSRF protection prevents these attacks by ensuring requests originate genuinely from your application's frontend.

## Server-Side Implementation

### 1. For Express Routes

The CSRF middleware is already configured in the application. It is automatically applied to all state-changing HTTP methods (POST, PUT, DELETE, etc.).

For new routes that should be protected:

```typescript
import express from 'express';
import { csrfMiddleware } from '../security/advanced/csrf/CSRFProtection';

const router = express.Router();

// The route will be protected by the global CSRF middleware
router.post('/submit-data', (req, res) => {
  // Handle request...
});

export default router;
```

### 2. Excluding Routes from CSRF Protection

Some routes may need to be excluded from CSRF protection (e.g., webhook endpoints, public APIs):

```typescript
// In your configuration file
const csrfConfig = {
  excludeRoutes: [
    '/api/webhooks',
    '/api/public'
  ]
};

// When initializing CSRF protection
import { CSRFProtection } from '../security/advanced/csrf/CSRFProtection';
const csrfProtection = new CSRFProtection(csrfConfig);
const customCSRFMiddleware = csrfProtection.createMiddleware();
```

### 3. Route-Specific CSRF Tokens

For enhanced security, you can use route-specific tokens:

```typescript
import { csrfProtection } from '../security/advanced/csrf/CSRFProtection';

router.get('/sensitive-form', (req, res) => {
  // Generate a token specific to this route
  const routeSpecificToken = csrfProtection.generateToken(req.session?.id, '/api/sensitive-action');
  
  // Set it in the response
  res.cookie('_csrf_route', Buffer.from(JSON.stringify(routeSpecificToken)).toString('base64'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  res.setHeader('X-CSRF-Token', routeSpecificToken.token);
  
  // Render the form
  res.render('sensitive-form', { csrfToken: routeSpecificToken.token });
});
```

## Client-Side Implementation

### 1. For Regular HTML Forms

Add a hidden CSRF token field to your forms:

```html
<form action="/submit" method="post">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <!-- Other form fields -->
  <button type="submit">Submit</button>
</form>
```

### 2. For JavaScript Fetch/AJAX Requests (React)

```jsx
function SubmitForm() {
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Get the CSRF token from meta tag or response header
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ /* your data */ })
      });
      
      // Handle response...
      
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 3. Setting Up Axios Interceptors

```javascript
import axios from 'axios';

// Configure axios to include CSRF token in all requests
axios.interceptors.request.use(config => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Automatically update the CSRF token from responses
axios.interceptors.response.use(response => {
  const newToken = response.headers['x-csrf-token'];
  
  if (newToken) {
    // Update the meta tag with the new token
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', newToken);
    }
  }
  
  return response;
}, error => {
  return Promise.reject(error);
});
```

## Testing CSRF Protection

### 1. Manual Testing

1. Open your application in a browser
2. Log in to establish an authenticated session
3. Open the Network tab in DevTools
4. Make a state-changing request (form submission, etc.)
5. Verify the request includes the X-CSRF-Token header
6. Try modifying or removing the token and confirm the request is rejected

### 2. Automated Testing

```javascript
import request from 'supertest';
import app from '../app';

describe('CSRF Protection', () => {
  let csrfToken;
  let cookies;
  
  // Get CSRF token before tests
  beforeAll(async () => {
    const response = await request(app).get('/');
    cookies = response.headers['set-cookie'];
    csrfToken = response.headers['x-csrf-token'];
  });
  
  test('POST request with valid CSRF token should succeed', async () => {
    const response = await request(app)
      .post('/api/test')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .send({ test: 'data' });
      
    expect(response.status).toBe(200);
  });
  
  test('POST request without CSRF token should fail', async () => {
    const response = await request(app)
      .post('/api/test')
      .set('Cookie', cookies)
      .send({ test: 'data' });
      
    expect(response.status).toBe(403);
  });
  
  test('POST request with invalid CSRF token should fail', async () => {
    const response = await request(app)
      .post('/api/test')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', 'invalid-token')
      .send({ test: 'data' });
      
    expect(response.status).toBe(403);
  });
});
```

## Troubleshooting Common Issues

### 1. "Invalid CSRF token" Errors

- Check that your frontend is correctly extracting and sending the token
- Verify the token isn't expired (default lifetime is 24 hours)
- Ensure cookies are being sent with requests (check Same-Origin policy)
- For SPAs, make sure the token is refreshed after page load

### 2. Form Submissions Failing

- Verify the hidden form field has the correct name (`_csrf`)
- Check that the token value matches the one in the cookie
- Ensure the cookie is being sent with the request

### 3. AJAX Requests Failing

- Verify the X-CSRF-Token header is present and correct
- Check if your frontend framework is stripping custom headers
- Ensure you're handling token rotation (getting new tokens from responses)

## Security Best Practices

1. Never disable CSRF protection for authenticated routes
2. Always use HTTPS in production to protect token transmission
3. Implement token rotation for highly sensitive operations
4. Use route-specific tokens for critical actions
5. Apply additional verification for high-value operations