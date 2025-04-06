# Security Documentation

This document outlines the security measures implemented in the application, along with best practices for maintaining and extending these protections.

## Table of Contents

1. [Overview](#overview)
2. [Core Security Measures](#core-security-measures)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Rate Limiting](#rate-limiting)
5. [Input Validation](#input-validation)
6. [Error Handling](#error-handling)
7. [Security Dashboard](#security-dashboard)
8. [Security Scanning](#security-scanning)
9. [Security Logging](#security-logging)
10. [Best Practices](#best-practices)

## Overview

This application implements comprehensive security measures following industry best practices to protect against common web vulnerabilities and attacks. The security architecture is built with a defense-in-depth approach, employing multiple layers of protection.

## Core Security Measures

### Content Security Policy (CSP)

A strict Content Security Policy is enforced to mitigate cross-site scripting (XSS) attacks by controlling which resources can be loaded and executed by the browser.

```javascript
// server/index.ts
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.util.repl.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "connect-src 'self' wss: ws:; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'self' https://auth.util.repl.co;"
  );
  next();
});
```

### HTTPS Enforcement

All HTTP requests are automatically redirected to HTTPS in production environments.

```javascript
// server/index.ts
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### CORS (Cross-Origin Resource Sharing)

CORS is configured to restrict which domains can access the API, with different settings for development and production environments.

```javascript
// server/index.ts
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cosmic-community.replit.app'] 
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true
}));
```

### Helmet Middleware

Helmet is used to set various HTTP headers that enhance security.

```javascript
// server/index.ts
app.use(helmet());
```

### CSRF Protection

Cross-Site Request Forgery protection is implemented using the csurf middleware, with tokens required for modifying operations.

```javascript
// server/index.ts
const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to API routes
app.use('/api', (req, res, next) => {
  // Skip CSRF protection for the token endpoint
  if (req.path === '/csrf-token') {
    return next();
  }
  csrfProtection(req, res, next);
});
```

## Authentication and Authorization

### Role-Based Access Control

Access control is implemented using a role-based permission system with well-defined roles and permissions.

```javascript
// server/securityRoutes.ts
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

enum SecurityPermission {
  VIEW_SETTINGS = 'view_security_settings',
  MODIFY_SETTINGS = 'modify_security_settings',
  VIEW_LOGS = 'view_security_logs',
  RUN_SCAN = 'run_security_scan',
  VIEW_SCAN_RESULTS = 'view_scan_results'
}

const rolePermissions: Record<UserRole, SecurityPermission[]> = {
  [UserRole.USER]: [],
  [UserRole.ADMIN]: [
    SecurityPermission.VIEW_SETTINGS,
    SecurityPermission.VIEW_LOGS,
    SecurityPermission.VIEW_SCAN_RESULTS
  ],
  [UserRole.SUPER_ADMIN]: [
    SecurityPermission.VIEW_SETTINGS,
    SecurityPermission.MODIFY_SETTINGS,
    SecurityPermission.VIEW_LOGS,
    SecurityPermission.RUN_SCAN,
    SecurityPermission.VIEW_SCAN_RESULTS
  ]
};
```

### Permission Middleware

A reusable permission middleware checks whether a user has the required permissions before allowing access to protected routes.

```javascript
// server/securityRoutes.ts
const checkPermission = (requiredPermission: SecurityPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.session?.user?.role as UserRole;
    
    // Check if user is authenticated
    if (!userRole) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        details: `Unauthenticated user attempted to access ${req.path}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        severity: 'medium'
      });
      
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has required permission
    const hasPermission = rolePermissions[userRole]?.includes(requiredPermission);
    
    if (!hasPermission) {
      logSecurityEvent({
        type: 'PERMISSION_DENIED',
        details: `User with role ${userRole} attempted to access resource requiring ${requiredPermission}`,
        userId: req.session?.user?.id,
        userRole,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        severity: 'high'
      });
      
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // User has required permission, proceed
    next();
  };
};
```

## Rate Limiting

Rate limiting is implemented to prevent abuse and brute force attacks on endpoints. Different limits are applied to different types of endpoints based on their sensitivity.

```javascript
// server/middleware/rateLimit.ts
// Apply rate limiting to different routes based on their purposes
app.use('/api/auth', authLimiter);         // Stricter limits for authentication endpoints
app.use('/api/admin', adminLimiter);       // Admin operations get their own rate limit
app.use('/api/public', publicLimiter);     // Public API endpoints get more generous limits
app.use('/api', defaultLimiter);           // Default rate limiting for all other API routes
```

## Input Validation

Input validation is performed using Zod for type-checking and validation, ensuring that all user input is properly validated before processing.

```javascript
// Example from server/securityRoutes.ts
const schema = z.object({
  setting: z.string()
    .min(3, 'Setting name must be at least 3 characters')
    .max(100, 'Setting name must be at most 100 characters')
    .refine(
      (val) => Object.keys(defaultSecuritySettings).includes(val),
      { message: 'Invalid security setting name' }
    ),
  value: z.boolean({ 
    required_error: 'Value must be a boolean', 
    invalid_type_error: 'Value must be a boolean'
  })
});

const validationResult = schema.safeParse(req.body);

if (!validationResult.success) {
  // Log validation failure
  logSecurityEvent({
    type: 'SECURITY_SETTING_VALIDATION_FAILED',
    // ...more details
  });
  
  return res.status(400).json({ 
    message: 'Invalid input', 
    errors: validationResult.error.errors 
  });
}
```

## Error Handling

A centralized error handling system provides consistent error responses, logs errors appropriately, and prevents information leakage in production environments.

```javascript
// server/middleware/errorHandler.ts
// Global error handler middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  console.error(`${err.name || 'Error'}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Log to file
  logError(err, req);
  
  // Set default values for status and message
  const statusCode = err.statusCode || err.status || 500;
  
  // Format the error response based on environment
  const isDev = process.env.NODE_ENV !== 'production';
  const response: any = {
    success: false,
    message: err.message || 'Internal Server Error'
  };
  
  // Add error code if available
  if (err.code) {
    response.code = err.code;
  }
  
  // Include error details if available
  if (err.data) {
    response.data = err.data;
  }
  
  // Include stack trace only in development
  if (isDev && err.stack) {
    response.stack = err.stack.split('\n').map((line: string) => line.trim());
  }
  
  // Handle specific error types
  // ...
  
  // Send the response
  res.status(statusCode).json(response);
};
```

## Security Dashboard

The Security Dashboard provides an administrative interface for managing security settings, viewing security events, and running security scans.

### Features:

- View and modify security settings
- View security event logs
- Run security scans
- View security scan results
- Monitor security score

## Security Scanning

A comprehensive security scanning system checks for vulnerabilities in the application, including:

- Outdated dependencies
- Hardcoded secrets
- Missing security headers
- Missing CSRF protection
- Inadequate input validation
- SQL injection vulnerabilities

```javascript
// server/securityScan.ts
export async function scanProject(): Promise<SecurityScanResult> {
  const vulnerabilities: SecurityVulnerability[] = [];
  
  // Initialize counters
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;
  
  try {
    // 1. Check for outdated dependencies
    await checkDependencies(vulnerabilities);
    
    // 2. Check for secrets in code
    await checkForSecrets(vulnerabilities);
    
    // 3. Check for security headers in responses
    await checkSecurityHeaders(vulnerabilities);
    
    // 4. Check for proper CSRF protection
    await checkCSRFProtection(vulnerabilities);
    
    // 5. Check for input validation
    await checkInputValidation(vulnerabilities);
    
    // Count issues by severity and return results
    // ...
  } catch (error) {
    // Handle errors
    // ...
  }
}
```

## Security Logging

Security events are logged to a dedicated log file for monitoring and analysis. Critical events can trigger alerts.

```javascript
// server/security.ts
export function logSecurityEvent(event: SecurityEventData): void {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[SECURITY] ${timestamp} - ${JSON.stringify(event)}\n`;
    
    // Append to log file
    fs.appendFileSync(SECURITY_LOG_FILE, logEntry);
    
    // Console log critical events
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn(`Critical security event: ${event.type}`, event);
    }
    
    // Implement additional alerting for critical events if needed
    // ...
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
```

## Best Practices

### For Developers:

1. **Always Validate Input**: Use the provided validation functions for all user input.
2. **Use Permission Middleware**: Always wrap sensitive routes with the appropriate permission checks.
3. **Log Security Events**: Use the `logSecurityEvent` function to log significant security events.
4. **Use Error Handling**: Wrap async route handlers with `asyncHandler` or use proper try/catch blocks.
5. **Avoid Hardcoded Secrets**: Store sensitive data in environment variables.
6. **Apply Rate Limiting**: Apply appropriate rate limiting to new endpoints.
7. **Use Parameterized Queries**: Always use parameterized queries or ORM methods for database operations.
8. **Keep Dependencies Updated**: Regularly update dependencies to patch security vulnerabilities.
9. **Use CSRF Tokens**: Ensure state-changing operations require valid CSRF tokens.
10. **Run Security Scans**: Periodically run security scans to identify new vulnerabilities.

### For Administrators:

1. **Monitor Security Logs**: Regularly review security logs for suspicious activity.
2. **Review Security Dashboard**: Check the security dashboard for the overall security posture.
3. **Keep Security Settings Updated**: Review and update security settings as needed.
4. **Run Regular Scans**: Schedule regular security scans.
5. **Address Critical Vulnerabilities**: Prioritize fixing critical and high-severity vulnerabilities.