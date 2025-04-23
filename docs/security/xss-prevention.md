# XSS Prevention System

This document provides a comprehensive guide to the Cross-Site Scripting (XSS) prevention system implemented in our application. The system consists of detection tools, prevention libraries, and automated remediation capabilities.

## Table of Contents

1. [Overview](#overview)
2. [XSS Vulnerability Types](#xss-vulnerability-types)
3. [Detection Tools](#detection-tools)
4. [Prevention Libraries](#prevention-libraries)
5. [React Components](#react-components)
6. [Express Middleware](#express-middleware)
7. [Automated Remediation](#automated-remediation)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

## Overview

Cross-Site Scripting (XSS) is a type of security vulnerability that allows attackers to inject malicious scripts into web pages viewed by users. Our XSS prevention system provides a comprehensive approach to detecting, preventing, and remediating XSS vulnerabilities.

The system consists of:

- Detection tools to identify potential XSS vulnerabilities in the codebase
- Prevention libraries to sanitize and encode data to prevent XSS
- React components for safe rendering of user-generated content
- Express middleware to add security headers and sanitize input
- Automated remediation tools to fix common XSS issues

## XSS Vulnerability Types

Our system addresses three main types of XSS vulnerabilities:

### Stored XSS

In stored XSS attacks, the malicious script is permanently stored on the target server (e.g., in a database). When a user requests the affected page, the server retrieves the script and includes it in the response.

### Reflected XSS

In reflected XSS attacks, the malicious script is reflected off a web server, such as in an error message or search result. The script is embedded in a URL and activated when a user clicks the link.

### DOM-based XSS

In DOM-based XSS attacks, the vulnerability exists in client-side code rather than server-side code. The attack payload is executed as a result of modifying the DOM environment in the victim's browser.

## Detection Tools

### XSS Vulnerability Detector

The `XssDetector.ts` module provides tools to detect potential XSS vulnerabilities in source code. It scans files for patterns that could indicate XSS vulnerabilities and generates detailed reports.

#### Usage

```bash
# Scan all directories
./server/tools/detect-xss.sh

# Scan specific directories
./server/tools/detect-xss.sh client server

# Generate JSON output
./server/tools/detect-xss.sh --json

# Specify output file
./server/tools/detect-xss.sh --output=./reports/custom-xss-report.txt
```

The detector identifies vulnerabilities by pattern matching and classifies them by:
- Risk level (Critical, High, Medium, Low)
- Type (Stored, Reflected, DOM-based)

## Prevention Libraries

### Server-Side Prevention

The `XssPrevention.ts` module provides tools to prevent XSS attacks by sanitizing and encoding data for different contexts.

#### Key Functions

- `encodeForHtml()`: Encodes special characters in text to prevent XSS in HTML contexts
- `encodeForJavaScript()`: Encodes for JavaScript contexts
- `encodeForUrl()`: Encodes for URL contexts
- `encodeForCss()`: Encodes for CSS contexts
- `sanitizeHtml()`: Removes potentially dangerous HTML tags and attributes
- `ContentSecurityPolicyBuilder`: Class to build Content-Security-Policy headers
- `securityHeadersMiddleware()`: Express middleware for setting security headers
- `xssMiddleware()`: Express middleware to protect against XSS in request data

### Client-Side Prevention

The client-side prevention library (`client/src/lib/security/XssPrevention.tsx`) provides React components and hooks to help prevent XSS attacks in a React application.

## React Components

The following React components are provided for safe rendering of potentially unsafe content:

### SafeHtml

Use this component instead of `dangerouslySetInnerHTML` when you need to render HTML content:

```jsx
import { SafeHtml } from '@/lib/security/XssPrevention';

function MyComponent() {
  return (
    <SafeHtml 
      html={userGeneratedContent} 
      allowedTags={['b', 'i', 'em', 'strong', 'a']}
    />
  );
}
```

### SafeImage

A URL-safe image component that validates the src URL to prevent XSS via malicious image URLs:

```jsx
import { SafeImage } from '@/lib/security/XssPrevention';

function MyComponent() {
  return (
    <SafeImage 
      src={userProvidedImageUrl} 
      alt="User image"
    />
  );
}
```

### SafeExternalLink

A safe external link component that ensures proper security attributes are set for external links:

```jsx
import { SafeExternalLink } from '@/lib/security/XssPrevention';

function MyComponent() {
  return (
    <SafeExternalLink href={userProvidedUrl}>
      Click here
    </SafeExternalLink>
  );
}
```

### UserContent

A component that safely renders user-generated content with appropriate escaping based on context:

```jsx
import { UserContent } from '@/lib/security/XssPrevention';

function MyComponent() {
  return (
    <UserContent 
      content={userGeneratedContent} 
      context="html" // or "text" or "code"
    />
  );
}
```

### SecureIframe

A secure iframe component that prevents XSS and clickjacking attacks:

```jsx
import { SecureIframe } from '@/lib/security/XssPrevention';

function MyComponent() {
  return (
    <SecureIframe 
      src={iframeUrl} 
      title="Secure content"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
```

## React Hooks

### useSafeQueryParams

A hook to safely parse and use URL query parameters:

```jsx
import { useSafeQueryParams } from '@/lib/security/XssPrevention';

function MyComponent() {
  const params = useSafeQueryParams();
  
  return (
    <div>
      <p>Search query: {params.q}</p>
    </div>
  );
}
```

### useSafeInput

A hook to safely handle user input in forms with built-in validation and sanitization:

```jsx
import { useSafeInput } from '@/lib/security/XssPrevention';

function MyForm() {
  const { value, handleChange, isSafe, getSafeValue } = useSafeInput('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Use getSafeValue() when submitting to get sanitized value
    submitForm(getSafeValue());
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={value} 
        onChange={handleChange} 
      />
      {!isSafe && (
        <p className="error">Potentially unsafe input detected</p>
      )}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Express Middleware

The XSS prevention system includes Express middleware to protect against XSS attacks at the server level.

### applyXssProtection

This function applies all XSS protection middleware at once:

```javascript
import express from 'express';
import { applyXssProtection } from './middleware/xssProtection';

const app = express();

// Apply all XSS protection middleware
applyXssProtection(app);

// Rest of application
```

This middleware:
1. Sets security headers including Content-Security-Policy
2. Sanitizes request body, query parameters, and URL parameters
3. Detects potential XSS attacks in real-time

### cspNonceMiddleware

This middleware adds a Content-Security-Policy nonce to the response locals:

```javascript
import express from 'express';
import { cspNonceMiddleware } from './middleware/xssProtection';

const app = express();

// Apply CSP nonce middleware
app.use(cspNonceMiddleware());

// Use the nonce in templates
app.get('/', (req, res) => {
  res.render('index', { 
    cspNonce: res.locals.cspNonce 
  });
});
```

## Automated Remediation

The XSS prevention system includes tools to automatically remediate common XSS vulnerabilities.

### Fix XSS Vulnerabilities

The `fixXssVulnerabilities.ts` module provides automated remediation for common XSS issues:

```bash
# Fix all vulnerabilities
./server/tools/fix-xss.sh

# Fix only critical vulnerabilities
./server/tools/fix-xss.sh --critical-only

# Fix critical and high vulnerabilities
./server/tools/fix-xss.sh --high-only

# Run in dry-run mode (no changes applied)
./server/tools/fix-xss.sh --dry-run

# Fix vulnerabilities in specific directories
./server/tools/fix-xss.sh client server
```

The tool automatically fixes:
- Unsafe innerHTML assignments by adding DOMPurify.sanitize()
- Unsafe document.write usage
- Unsafe React dangerouslySetInnerHTML usage
- Unsafe location assignments
- Unsafe insertAdjacentHTML usage
- Unsafe jQuery DOM manipulation
- Unsafe Express responses
- Unsafe attribute setting

## Best Practices

To prevent XSS vulnerabilities in your code, follow these best practices:

1. **Never trust user input**: Always validate and sanitize user input before using it.

2. **Use the right encoding for the right context**:
   - HTML context: Use `encodeForHtml()`
   - JavaScript context: Use `encodeForJavaScript()`
   - URL context: Use `encodeForUrl()`
   - CSS context: Use `encodeForCss()`

3. **Use safe alternatives to dangerous methods**:
   - Use `textContent` instead of `innerHTML` for text
   - Use `SafeHtml` instead of `dangerouslySetInnerHTML`
   - Use `SafeImage` for user-provided image URLs
   - Use `SafeExternalLink` for external links

4. **Implement Content-Security-Policy (CSP)** to restrict script execution

5. **Validate and sanitize all input** from:
   - Request body
   - Query parameters
   - URL parameters
   - Local storage
   - Session storage
   - Cookies

6. **Use framework-provided security features**:
   - React escapes content by default
   - Express template engines often escape by default
   - Use validated libraries for HTML sanitization

7. **Keep dependencies updated** to avoid known vulnerabilities

## Examples

### Implementing XSS Protection in React Components

```jsx
import React from 'react';
import { 
  SafeHtml, 
  SafeImage, 
  SafeExternalLink, 
  useSafeQueryParams,
  useSafeInput
} from '@/lib/security/XssPrevention';

function UserProfile() {
  const params = useSafeQueryParams();
  const { value: bio, handleChange: handleBioChange, getSafeValue: getSafeBio } = useSafeInput('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserBio(getSafeBio());
  };
  
  return (
    <div>
      <h1>User Profile: {user.name}</h1>
      
      {/* Safely render HTML bio */}
      <SafeHtml html={user.bio} className="user-bio" />
      
      {/* Safely display user avatar */}
      <SafeImage src={user.avatarUrl} alt="User avatar" />
      
      {/* Safely link to user website */}
      <SafeExternalLink href={user.website}>
        Visit website
      </SafeExternalLink>
      
      {/* Safe form input */}
      <form onSubmit={handleSubmit}>
        <textarea value={bio} onChange={handleBioChange} />
        <button type="submit">Update Bio</button>
      </form>
    </div>
  );
}
```

### Implementing XSS Protection in Express

```javascript
import express from 'express';
import { applyXssProtection } from './middleware/xssProtection';
import { encodeForHtml, sanitizeHtml } from './security/xss/XssPrevention';

const app = express();

// Apply XSS protection middleware
applyXssProtection(app);

// Example of manual encoding in route handler
app.get('/search', (req, res) => {
  const query = req.query.q;
  
  // Even though the middleware sanitizes input, it's a good practice
  // to explicitly encode output in the right context
  const encodedQuery = encodeForHtml(query);
  
  res.send(`
    <h1>Search Results for: ${encodedQuery}</h1>
    <p>...</p>
  `);
});

// Example of sanitizing HTML content
app.post('/comments', (req, res) => {
  const commentHtml = req.body.comment;
  
  // Sanitize HTML allowing only basic formatting
  const sanitizedComment = sanitizeHtml(commentHtml);
  
  // Save sanitized comment
  saveComment(sanitizedComment);
  
  res.redirect('/comments');
});
```

## Conclusion

By implementing the XSS prevention system and following the best practices outlined in this document, you can significantly reduce the risk of XSS vulnerabilities in your application. Remember that security is an ongoing process, and regular scanning and updating of prevention mechanisms is essential to maintain a strong security posture.