# XSS Prevention Integration Guide

This guide explains how to integrate the XSS prevention system into your application. It provides step-by-step instructions for both server-side and client-side integration.

## Table of Contents

1. [Server-Side Integration](#server-side-integration)
   - [Express Middleware Integration](#express-middleware-integration)
   - [Secure API Endpoints](#secure-api-endpoints)
   - [Content Security Policy](#content-security-policy)
2. [Client-Side Integration](#client-side-integration)
   - [React Components Integration](#react-components-integration)
   - [Form Handling](#form-handling)
   - [URL Parameter Handling](#url-parameter-handling)
3. [Testing Your Integration](#testing-your-integration)
   - [Manual Testing](#manual-testing)
   - [Automated Testing](#automated-testing)
4. [Common Issues and Solutions](#common-issues-and-solutions)

## Server-Side Integration

### Express Middleware Integration

To protect your Express application from XSS attacks, add the middleware to your server setup:

```typescript
// server/index.ts or server/app.ts
import express from 'express';
import { applyXssProtection } from './middleware/xssProtection';

const app = express();

// Apply JSON and URL-encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply XSS protection middleware
applyXssProtection(app);

// Rest of your application...
```

This will apply:
- Security headers including Content-Security-Policy
- Input sanitization for request body, query parameters, and URL parameters
- XSS attack detection and logging

### Secure API Endpoints

When creating API endpoints that receive and return user-generated content, ensure proper sanitization:

```typescript
// Example: API endpoint for saving a comment
app.post('/api/comments', (req, res) => {
  const { author, content } = req.body;
  
  // The xssMiddleware has already sanitized the input,
  // but for HTML content, explicitly sanitize
  const sanitizedContent = sanitizeHtml(content);
  
  // Store the sanitized content
  storeComment(author, sanitizedContent);
  
  res.json({ success: true });
});

// Example: API endpoint for retrieving content
app.get('/api/comments/:id', (req, res) => {
  const commentId = req.params.id;
  const comment = getComment(commentId);
  
  // When sending back HTML content that will be rendered in the browser,
  // sanitize it again before sending
  comment.content = sanitizeHtml(comment.content);
  
  res.json(comment);
});
```

### Content Security Policy

Configure a strong Content-Security-Policy (CSP) to prevent XSS attacks:

```typescript
// Custom CSP configuration
import { ContentSecurityPolicyBuilder } from './security/xss/XssPrevention';

const cspBuilder = new ContentSecurityPolicyBuilder()
  .defaultSrc("'self'")
  .scriptSrc("'self'", "https://trusted-cdn.com")
  .styleSrc("'self'", "https://trusted-cdn.com", "'unsafe-inline'")
  .imgSrc("'self'", "https://trusted-images.com", "data:")
  .fontSrc("'self'", "https://trusted-fonts.com", "data:")
  .connectSrc("'self'", "https://api.yourdomain.com")
  .frameSrc("'none'")
  .frameAncestors("'none'")
  .formAction("'self'")
  .upgradeInsecureRequests();

// Apply custom CSP
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspBuilder.build());
  next();
});
```

## Client-Side Integration

### React Components Integration

Import and use the XSS prevention components in your React application:

```tsx
// Example: A blog post component
import React from 'react';
import { SafeHtml, SafeImage } from '@/lib/security/XssPrevention';
import { RichTextContent } from '@/components/security/SafeContent';

function BlogPost({ post }) {
  return (
    <article className="blog-post">
      <h1>{post.title}</h1>
      
      {post.coverImage && (
        <SafeImage 
          src={post.coverImage} 
          alt={post.title} 
          className="cover-image"
        />
      )}
      
      <div className="meta">
        <span className="author">{post.author}</span>
        <span className="date">{new Date(post.date).toLocaleDateString()}</span>
      </div>
      
      <RichTextContent 
        content={post.content} 
        className="post-content"
      />
    </article>
  );
}

export default BlogPost;
```

### Form Handling

Use the `useSafeInput` hook to safely handle user input in forms:

```tsx
// Example: A comment form
import React from 'react';
import { useSafeInput } from '@/lib/security/XssPrevention';

function CommentForm({ onSubmit }) {
  const { 
    value: comment, 
    handleChange: handleCommentChange, 
    isSafe: isCommentSafe,
    getSafeValue: getSafeComment
  } = useSafeInput('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isCommentSafe) {
      // Use the sanitized value when submitting
      onSubmit({ comment: getSafeComment() });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="comment">Your Comment</label>
        <textarea 
          id="comment"
          value={comment}
          onChange={handleCommentChange}
          className={!isCommentSafe ? 'error' : ''}
        />
        {!isCommentSafe && (
          <p className="error-message">
            Potentially unsafe content detected. HTML tags are not allowed.
          </p>
        )}
      </div>
      <button type="submit" disabled={!isCommentSafe}>
        Submit Comment
      </button>
    </form>
  );
}

export default CommentForm;
```

### URL Parameter Handling

Use the `useSafeQueryParams` hook to safely handle URL parameters:

```tsx
// Example: A search results component
import React, { useEffect, useState } from 'react';
import { useSafeQueryParams } from '@/lib/security/XssPrevention';
import { apiRequest } from '@/lib/queryClient';

function SearchResults() {
  const params = useSafeQueryParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // The query parameter is automatically sanitized
    const query = params.q;
    
    if (query) {
      setLoading(true);
      
      apiRequest('GET', `/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results);
          setLoading(false);
        })
        .catch(err => {
          console.error('Search error:', err);
          setLoading(false);
        });
    }
  }, [params.q]);
  
  return (
    <div className="search-results">
      <h1>Search Results for: {params.q}</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {results.map(result => (
            <li key={result.id}>
              <h2>{result.title}</h2>
              <p>{result.snippet}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchResults;
```

## Testing Your Integration

### Manual Testing

Test your XSS prevention by attempting to inject malicious scripts:

1. Try submitting forms with script tags: `<script>alert('XSS')</script>`
2. Try URL parameters with JavaScript: `?q=<img src="x" onerror="alert('XSS')">`
3. Try user profile fields with embedded scripts
4. Check if the Content-Security-Policy headers are being sent
5. Verify that user-generated content is being properly sanitized

### Automated Testing

Run the XSS vulnerability detection tool to scan your codebase:

```bash
# Run the XSS detection tool
./server/tools/detect-xss.sh

# Check for remaining vulnerabilities
cat reports/xss_vulnerabilities_*.txt
```

You can also add XSS testing to your test suite:

```typescript
// Example: Jest test for XSS prevention
import { sanitizeHtml, encodeForHtml } from './security/xss/XssPrevention';

describe('XSS Prevention', () => {
  test('sanitizeHtml removes script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    
    expect(output).toContain('<p>Hello</p>');
    expect(output).not.toContain('<script>');
  });
  
  test('encodeForHtml encodes special characters', () => {
    const input = '<img src="x" onerror="alert(\'XSS\')">';
    const output = encodeForHtml(input);
    
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img');
  });
});
```

## Common Issues and Solutions

### Issue: Content not displaying correctly after sanitization

**Solution:** You might be over-restricting allowed HTML tags. Configure `SafeHtml` with appropriate `allowedTags` and `allowedAttributes`:

```tsx
<SafeHtml 
  html={content} 
  allowedTags={['p', 'br', 'b', 'i', 'strong', 'em', 'a', 'ul', 'ol', 'li']}
  allowedAttributes={{ a: ['href', 'target', 'rel'] }}
/>
```

### Issue: Images not loading with SafeImage

**Solution:** Check that your image URLs use http, https, or data: schemes. SafeImage blocks other URL schemes for security:

```tsx
// Correct usage for external images
<SafeImage src="https://example.com/image.jpg" alt="Description" />

// Correct usage for local images
<SafeImage src="/assets/image.jpg" alt="Description" />
```

### Issue: Content-Security-Policy blocking legitimate resources

**Solution:** Adjust your CSP to allow resources from trusted domains:

```typescript
const cspBuilder = new ContentSecurityPolicyBuilder()
  .defaultSrc("'self'")
  .scriptSrc("'self'", "https://trusted-script-source.com")
  .styleSrc("'self'", "https://trusted-style-source.com")
  // Add more trusted sources as needed
```

### Issue: Form submissions failing with sanitized data

**Solution:** Ensure you're using the sanitized value from `getSafeValue()` when submitting forms:

```tsx
const { value, handleChange, getSafeValue } = useSafeInput('');

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Use the sanitized value for submission
  const safeValue = getSafeValue();
  submitForm({ comment: safeValue });
};
```

## Conclusion

By following this integration guide, you've significantly improved your application's resistance to XSS attacks. Remember to:

1. Use the middleware to protect your server routes
2. Use the React components to safely display user-generated content
3. Use the hooks for safely handling user input and URL parameters
4. Regularly scan your codebase for XSS vulnerabilities
5. Keep your dependencies updated to avoid known security issues

For more detailed information, refer to the [XSS Prevention System Documentation](./xss-prevention.md).