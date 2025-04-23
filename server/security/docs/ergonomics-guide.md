# Security Methods Ergonomics Guide

This guide explains how to leverage the enhanced security methods for both administrators and developers, making it easier to integrate and monitor advanced security features in your application.

## Table of Contents

1. [Introduction](#introduction)
2. [For Developers](#for-developers)
   - [Security Toolkit Overview](#security-toolkit-overview)
   - [Security Levels](#security-levels)
   - [Easy Integration Methods](#easy-integration-methods)
   - [Decorator-Based Security](#decorator-based-security)
   - [Validation Helpers](#validation-helpers)
   - [Security Headers](#security-headers)
3. [For Administrators](#for-administrators)
   - [Security Dashboard](#security-dashboard)
   - [Monitoring Security Events](#monitoring-security-events)
   - [Running Security Scans](#running-security-scans)
   - [Configuring Security Settings](#configuring-security-settings)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Introduction

The security architecture of this application has been designed with both security effectiveness and developer/administrator ergonomics in mind. We provide simple, intuitive interfaces to leverage advanced security features without requiring deep security expertise.

## For Developers

### Security Toolkit Overview

The Security Toolkit provides an ergonomic API for integrating security features into your application code. It encapsulates the complexity of the underlying security mechanisms while providing simple, intuitive methods.

```typescript
import { 
  SecurityLevel,
  securityToolkit,
  createSecurityToolkit 
} from '@server/security/toolkit';

// Use default toolkit with standard security level
app.use(securityToolkit.createMiddleware());

// Or create a toolkit with custom security level
const highSecurityToolkit = createSecurityToolkit(SecurityLevel.HIGH);
app.use(highSecurityToolkit.createMiddleware());
```

### Security Levels

The Security Toolkit provides predefined security levels to make it easy to apply appropriate security controls:

- **BASIC**: Essential security features with minimal performance impact
- **STANDARD**: Balanced security and performance for most applications (default)
- **HIGH**: Enhanced security for sensitive operations
- **MAXIMUM**: Maximum security for critical operations, with some performance impact

Each level automatically configures appropriate settings for anomaly detection, blockchain logging, runtime protection, and other security features.

```typescript
// Create a route with high security
app.get('/api/sensitive-data',
  createSecurityToolkit(SecurityLevel.HIGH).createMiddleware(),
  (req, res) => {
    // Route handler
  }
);

// Create a route with maximum security
app.get('/api/very-sensitive-data',
  createSecurityToolkit(SecurityLevel.MAXIMUM).createMiddleware(),
  (req, res) => {
    // Route handler
  }
);
```

### Easy Integration Methods

The toolkit provides several easy ways to integrate security features:

**1. Express Middleware:**

```typescript
import { securityToolkit } from '@server/security/toolkit';

// Apply to all routes
app.use(securityToolkit.createMiddleware());

// Apply to specific routes
app.get('/api/data', securityToolkit.createMiddleware(), (req, res) => {
  // Route handler
});

// Protect routes requiring authentication
app.get('/api/protected', securityToolkit.protectRoute(), (req, res) => {
  // Route handler - only runs if authenticated
});
```

**2. Custom Profile:**

```typescript
import { createSecurityToolkit } from '@server/security/toolkit';

// Create toolkit with custom profile
const customToolkit = createSecurityToolkit({
  level: 'high',
  enableAnomalyDetection: true,
  enableBlockchainLogging: true,
  enableRuntimeProtection: true,
  blockHighRiskRequests: true,
  anomalyThreshold: 0.7,
  rateLimit: 'strict'
});

// Apply custom security middleware
app.use(customToolkit.createMiddleware());
```

**3. Log Security Events:**

```typescript
import { securityToolkit, SecurityEventCategory, SecurityEventSeverity } from '@server/security/toolkit';

// Log a security event
securityToolkit.logSecurityEvent(
  SecurityEventCategory.AUTHENTICATION,
  SecurityEventSeverity.INFO,
  'User logged in successfully',
  {
    userId: user.id,
    ipAddress: req.ip
  }
);
```

### Decorator-Based Security

For TypeScript applications using classes, the toolkit provides decorators for ergonomic security integration:

```typescript
import { secure, secureController, SecurityLevel } from '@server/security/toolkit';

@secureController(SecurityLevel.STANDARD)
class UserController {
  // Standard security for this method
  getUsers(req: Request, res: Response) {
    // Method implementation
  }
  
  // Custom security for this method
  @secure({
    level: SecurityLevel.HIGH,
    requireAuth: true,
    logActivity: true,
    blockHighRisk: true
  })
  updateUser(req: Request, res: Response) {
    // Method implementation
  }
  
  // Maximum security for this method
  @secure({ level: SecurityLevel.MAXIMUM })
  deleteUser(req: Request, res: Response) {
    // Method implementation
  }
}
```

### Validation Helpers

The toolkit provides validation helpers to easily validate and sanitize request data:

```typescript
import { validateRequest, validators } from '@server/security/toolkit';

app.post('/api/user',
  validateRequest({
    name: validators.required,
    email: validators.email,
    age: validators.number,
    password: validators.minLength(8)
  }),
  (req, res) => {
    // Request data is validated and sanitized
  }
);
```

### Security Headers

Add security headers to all responses with a single middleware:

```typescript
import { securityHeaders } from '@server/security/toolkit';

// Apply security headers to all responses
app.use(securityHeaders());
```

## For Administrators

### Security Dashboard

The security dashboard provides a comprehensive view of your application's security status. Access it at `/admin/security` to monitor security events, run security scans, and configure security settings.

The dashboard includes:

1. **Overview Panel**: Shows the current health status of all security components
2. **Security Events Panel**: Lists all security events with filtering and sorting options
3. **Anomaly Detection Panel**: Displays detected anomalies and their details
4. **Blockchain Logs Panel**: Shows the security blockchain for audit purposes
5. **Settings Panel**: Allows configuration of security settings

### Monitoring Security Events

The Security Events panel in the dashboard allows you to monitor all security events captured by the system. You can:

1. **Filter Events**: Filter by category, severity, time period, or search term
2. **View Critical Events**: Quickly access high-priority events that require attention
3. **Analyze Trends**: View statistics and charts showing event patterns
4. **Export Data**: Export event data for external analysis

### Running Security Scans

Run security scans directly from the dashboard:

1. **Normal Scan**: Basic security check with minimal performance impact
2. **Deep Scan**: Comprehensive security check of all components
3. **Maximum Security Scan**: Exhaustive security analysis with detailed reporting
4. **Quantum Resistance Test**: Verify quantum-resistant cryptography implementation

### Configuring Security Settings

The Settings panel allows you to configure:

1. **Security Levels**: Set the default security level for the application
2. **Anomaly Detection**: Configure thresholds and detection parameters
3. **Blockchain Logging**: Configure what events to log and retention policies
4. **Runtime Protection**: Enable or disable runtime protection features
5. **Rate Limiting**: Adjust rate limiting thresholds for different endpoints

## Best Practices

1. **Start with Standard Level**: Begin with the `STANDARD` security level and increase to `HIGH` or `MAXIMUM` only when necessary for sensitive operations.

2. **Use Decorators for Controllers**: The decorator-based approach provides a clean, declarative way to add security to controller methods.

3. **Add Validation to All Endpoints**: Always use the validation helpers to validate and sanitize request data.

4. **Log Important Security Events**: Use `logSecurityEvent` to record important security-related actions.

5. **Run Regular Security Scans**: Schedule regular security scans to identify potential issues.

6. **Monitor the Dashboard**: Regularly check the security dashboard to stay aware of security events.

7. **Layer Security Controls**: Apply multiple security controls at different levels (application, route, method) for defense in depth.

## Troubleshooting

### Common Issues

1. **Performance Impact**: If you notice performance issues, consider:
   - Lowering the security level from `MAXIMUM` to `HIGH` or `STANDARD`
   - Disabling blockchain logging for non-critical operations
   - Adjusting anomaly detection thresholds

2. **False Positives**: If anomaly detection is flagging legitimate requests:
   - Increase the `anomalyThreshold` value
   - Exclude specific paths from anomaly detection
   - Disable blocking for anomaly detection

3. **Integration Issues**: If you're having trouble integrating security features:
   - Start with the simplest integration method (middleware)
   - Use the example files in `server/security/examples`
   - Refer to the API documentation for detailed usage information

### Getting Help

For more detailed information, refer to:

- The API documentation in `server/security/docs/api.md`
- The example files in `server/security/examples`
- The source code for the toolkit in `server/security/toolkit`