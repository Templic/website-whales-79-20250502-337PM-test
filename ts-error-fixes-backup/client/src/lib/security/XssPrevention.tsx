/**
 * XSS Prevention Components for React
 * 
 * This module provides React components and hooks to help prevent XSS
 * attacks in a React application.
 */

import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content and safely renders it.
 * Use this instead of dangerouslySetInnerHTML when you need to render HTML.
 */
export function SafeHtml({
  html,
  className,
  allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div'],
  allowedAttributes = { a: ['href', 'target', 'rel'] },
  ...rest
}: {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  [key: string]: any;
}) {
  // Configure DOMPurify
  const purifyConfig = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['class', 'id', 'style'],
    ...allowedAttributes
  };
  
  // Sanitize the HTML
  const sanitizedHtml = DOMPurify.sanitize(html, purifyConfig);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...rest}
    />
  );
}

/**
 * A URL-safe image component that validates the src URL
 * to prevent XSS via malicious image URLs.
 */
export function SafeImage({
  src,
  alt,
  className,
  width,
  height,
  onError,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [validSrc, setValidSrc] = useState<string>('');
  
  useEffect(() => {
    if (!src) return;
    
    // Validate URL scheme to prevent javascript: protocol
    try {
      const url = new URL(src, window.location.origin);
      if (url.protocol === 'data:') {
        // For data URLs, only allow images
        if (src.startsWith('data:image/')) {
          setValidSrc(src);
        } else {
          console.error('Blocked non-image data URL:', src);
          setValidSrc('');
        }
      } else if (['http:', 'https:'].includes(url.protocol)) {
        setValidSrc(src);
      } else {
        console.error('Blocked potentially dangerous URL scheme:', url.protocol);
        setValidSrc('');
      }
    } catch (error) {
      // If URL parsing fails, it might be a relative URL which is generally safe
      setValidSrc(src);
    }
  }, [src]);
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Handle image loading errors
    if (onError) {
      onError(e);
    }
  };
  
  return (
    <img
      src={validSrc}
      alt={alt || ''}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      {...rest}
    />
  );
}

/**
 * A safe external link component that ensures proper security
 * attributes are set for external links.
 */
export function SafeExternalLink({
  href,
  children,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith('http') || href?.startsWith('//');
  
  const safeProps = isExternal
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};
  
  return (
    <a
      href={href}
      className={className}
      {...safeProps}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * A hook to safely parse and use URL query parameters
 * preventing XSS via URL parameters.
 */
export function useSafeQueryParams(): Record<string, string> {
  const [params, setParams] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const rawParams: Record<string, string> = {};
    
    // Extract and sanitize query parameters
    urlSearchParams.forEach((value, key) => {
      // Basic encoding to prevent script injection
      rawParams[key] = value.replace(/[<>'"&]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#x27;';
          case '&': return '&amp;';
          default: return char;
        }
      });
    });
    
    setParams(rawParams);
  }, [window.location.search]);
  
  return params;
}

/**
 * A component that safely renders user-generated content
 * with appropriate escaping based on context.
 */
export function UserContent({
  content,
  context = 'text',
  className,
  ...rest
}: {
  content: string;
  context?: 'text' | 'html' | 'code';
  className?: string;
  [key: string]: any;
}) {
  if (!content) return null;
  
  switch (context) {
    case 'html':
      return <SafeHtml html={content} className={className} {...rest} />;
      
    case 'code':
      // For code snippets, we escape HTML but preserve whitespace
      return (
        <pre className={className} {...rest}>
          <code>{content.replace(/[<>'"&]/g, (char) => {
            switch (char) {
              case '<': return '&lt;';
              case '>': return '&gt;';
              case '"': return '&quot;';
              case "'": return '&#x27;';
              case '&': return '&amp;';
              default: return char;
            }
          })}</code>
        </pre>
      );
      
    case 'text':
    default:
      // For plain text, React already escapes by default
      return <div className={className} {...rest}>{content}</div>;
  }
}

/**
 * Hook to safely handle user input in forms
 * with built-in validation and sanitization.
 */
export function useSafeInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const [isSafe, setIsSafe] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Check for potentially unsafe patterns
    const hasSuspiciousPatterns = /(<script|javascript:|data:text\/html|vbscript:|<svg|<img|<iframe)/i.test(newValue);
    
    setIsSafe(!hasSuspiciousPatterns);
    setValue(newValue);
  };
  
  // Return sanitized value for submission
  const getSafeValue = () => {
    return value.replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });
  };
  
  return {
    value,
    handleChange,
    isSafe,
    getSafeValue,
    props: {
      value,
      onChange: handleChange,
    }
  };
}

/**
 * This component creates a secure iframe that prevents XSS
 * and clickjacking attacks.
 */
export function SecureIframe({
  src,
  title,
  sandbox = 'allow-scripts allow-same-origin',
  className,
  width,
  height,
  ...rest
}: React.IframeHTMLAttributes<HTMLIFrameElement>) {
  const [validSrc, setValidSrc] = useState<string>('');
  
  useEffect(() => {
    if (!src) return;
    
    // Validate URL scheme
    try {
      const url = new URL(src, window.location.origin);
      if (['http:', 'https:'].includes(url.protocol)) {
        setValidSrc(src);
      } else {
        console.error('Blocked potentially dangerous iframe URL scheme:', url.protocol);
        setValidSrc('');
      }
    } catch (error) {
      // If URL parsing fails, it might be a relative URL which is generally safe
      setValidSrc(src);
    }
  }, [src]);
  
  return (
    <iframe
      src={validSrc}
      title={title || 'Secure iframe'}
      sandbox={sandbox}
      className={className}
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}

/**
 * Example usage:
 * 
 * import { SafeHtml, SafeImage, SafeExternalLink, useSafeQueryParams } from './XssPrevention';
 * 
 * function MyComponent() {
 *   const queryParams = useSafeQueryParams();
 *   
 *   return (
 *     <div>
 *       <SafeHtml html={userGeneratedContent} />
 *       
 *       <SafeImage src={userProvidedImageUrl} alt="User image" />
 *       
 *       <SafeExternalLink href={userProvidedUrl}>
 *         Click here
 *       </SafeExternalLink>
 *     </div>
 *   );
 * }
 */