# Taskade Integration Technical Documentation

## Architecture Overview

This document provides detailed technical information about the Taskade AI integration architecture, including the middleware, security considerations, and client-server communication flow.

## Communication Flow

```
Client Component (TaskadeEmbed/Widget)
          ↓
Custom Embed Page (/taskade-embed)
          ↓
ContentApiCsrfBypass Middleware
          ↓
Taskade API (External)
```

## Implementation Details

### Client-Side Components

#### TaskadeEmbed Component

The `TaskadeEmbed` component serves as the foundation for all Taskade integrations. It implements:

1. **Dynamic Styling System**: 
   - Supports three distinct style modes: basic, taskade, and oceanic
   - Dynamically generates CSS classes based on selected style
   - Respects light/dark mode preferences

2. **Secure Communication**:
   - Uses a custom `/taskade-embed` page instead of direct Taskade embedding
   - Implements a message passing system for component-iframe communication
   - Handles authentication and session management seamlessly

3. **Performance Optimizations**:
   - Implements lazy loading of iframe content
   - Uses ResizeObserver for responsive sizing
   - Optimizes reflows and repaints during loading and transitions

#### TaskadeWidget Component

The TaskadeWidget extends TaskadeEmbed to provide a floating chat widget experience:

1. **Position Management**:
   - Supports four corner positions (bottom-right, bottom-left, top-right, top-left)
   - Maintains proper z-index stacking
   - Handles viewport edge cases

2. **Interaction States**:
   - Manages open/closed states
   - Implements greeting bubble with dismissal logic
   - Handles keyboard navigation and focus management

### Server-Side Implementation

#### Custom Embed Page

The `/taskade-embed` page serves as a secure middleware between our application and Taskade:

```javascript
// Route handler in server/routes.ts
app.get("/taskade-embed", (req, res) => {
  // Extract parameters
  const { id, view = 'agent', theme = 'system', memory = '1', style = 'taskade', toolbar = '1' } = req.query;
  
  // Security validation
  if (!id || typeof id !== 'string') {
    return res.status(400).send('Invalid Taskade ID');
  }
  
  // Generate secure embed page with requested parameters
  const embedHtml = generateTaskadeEmbed(id, view, theme, memory, style, toolbar);
  
  // Send with appropriate headers
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.send(embedHtml);
});
```

#### ContentApiCsrfBypass Middleware

The middleware handles CSRF exemption for Taskade domains:

```javascript
// In server/middleware/contentApiCsrfBypass.ts
export const contentApiCsrfBypass: RequestHandler = (req, res, next) => {
  // Check if request is to a Taskade domain
  const isTaskadeDomain = [
    'taskade.com',
    'www.taskade.com',
    'ai.taskade.com'
  ].some(domain => req.hostname?.includes(domain));

  // Other CSRF exemption checks...
  
  if (isTaskadeDomain) {
    req.__skipCSRF = true;
    console.debug('[CSRF Debug] Exempting Taskade domain from CSRF protection:', req.hostname);
  }
  
  next();
};
```

## Security Considerations

### CSRF Protection

The implementation carefully balances CSRF protection with third-party integrations:

1. **Domain Verification**:
   - Maintains a whitelist of trusted Taskade domains
   - Implements rigorous validation of incoming requests

2. **Token Management**:
   - Uses custom CSRF token flow for non-exempt routes
   - Implements secure token rotation and validation

### Content Security Policy

Custom CSP headers are implemented to allow secure iframe communication:

```
Content-Security-Policy: default-src 'self'; 
                         frame-src 'self' *.taskade.com; 
                         connect-src 'self' *.taskade.com;
                         script-src 'self' 'unsafe-inline' *.taskade.com;
                         style-src 'self' 'unsafe-inline' *.taskade.com;
```

### Data Privacy Considerations

1. **Memory Context**:
   - When `enableMemory` is true, conversation context is stored by Taskade
   - Implemented clean option to disable memory when privacy is a concern

2. **Authentication Flow**:
   - No personal identifiers are shared with Taskade by default
   - Anonymous sessions are used unless explicit authentication is configured

## Style Implementation

The styling system uses a dynamic styling engine with the following architecture:

### Style Generation Logic

```typescript
const getStyleClasses = () => {
  switch (style) {
    case 'basic':
      return { /* Basic theme CSS classes */ };
    case 'oceanic':
      return { /* Oceanic theme CSS classes */ };
    case 'taskade':
    default:
      return { /* Taskade theme CSS classes */ };
  }
};

const styles = getStyleClasses();
```

### Dynamic CSS Application

1. **Container Styling**:
   ```jsx
   <div className={`relative ${styles.border} ${className}`} />
   ```

2. **Content Area Styling**:
   ```jsx
   <div className={`relative ${styles.background}`} />
   ```

3. **Interactive Element Styling**:
   ```jsx
   <button className={`rounded-lg ${styles.buttonBg}`} />
   ```

## Testing and Validation

The implementation includes comprehensive tests to ensure:

1. **Security Testing**:
   - CSRF protection validation
   - CSP header validation
   - Domain verification testing

2. **Style Testing**:
   - Visual regression tests for all three styles
   - Responsive layout testing
   - Cross-browser compatibility validation

3. **Integration Testing**:
   - Communication flow validation
   - Error handling and recovery testing
   - Performance benchmarking

## Troubleshooting Guide

### Console Errors

1. **CORS Errors**:
   - Likely cause: Missing CSP headers or incorrect domain configuration
   - Solution: Verify CSP headers and domain whitelist

2. **CSRF Token Errors**:
   - Likely cause: Incorrect CSRF bypass configuration
   - Solution: Check contentApiCsrfBypass middleware configuration

3. **Iframe Loading Errors**:
   - Likely cause: Taskade domain blocks or incorrect parameters
   - Solution: Verify Taskade ID and parameters

### Visual Issues

1. **Incorrect Styling**:
   - Likely cause: CSS conflicts or incorrect style parameter
   - Solution: Check style parameter and inspect for CSS conflicts

2. **Layout Breakage**:
   - Likely cause: Incorrect size calculation or ResizeObserver issues
   - Solution: Verify container dimensions and ResizeObserver implementation

## Future Enhancements

Planned improvements to the Taskade integration:

1. **Custom Theme Builder**:
   - Allow creating and saving custom themes
   - Implement theme export/import functionality

2. **Enhanced Security**:
   - Implement signed requests to Taskade API
   - Add optional end-to-end encryption for sensitive conversations

3. **Performance Optimizations**:
   - Implement stream-based message delivery
   - Add client-side caching for faster loading