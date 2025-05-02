# Security Enhancements Documentation

This document outlines the comprehensive security enhancements implemented in the application, focusing on three key areas:

1. Threat Detection & Protection
2. Multi-Factor Authentication (MFA)
3. Anti-CSRF Protection

## 1. Threat Detection & Protection

### Core Components

- **ThreatProtectionMiddleware**: Intercepts all requests for real-time threat analysis
- **ThreatDetectionService**: Analyzes requests for suspicious patterns and behaviors
- **SecurityCache**: LRU cache for fast security data access without database overhead
- **TokenBucketRateLimiter**: Provides rate limiting based on the token bucket algorithm

### Features

- Pattern-based threat detection with configurable rules
- Rate limiting with dynamic thresholds
- IP reputation tracking and blocking
- Request inspection for suspicious content
- Behavioral anomaly detection
- Whitelist mechanism for trusted infrastructure

### Security Levels

The system supports multiple security levels:

- `MONITOR`: Detection only, no blocking (ideal for testing)
- `LOW`: Basic protection against serious threats
- `MEDIUM`: Balanced protection with moderate strictness
- `HIGH`: Strict protection with lower thresholds
- `MAXIMUM`: Maximum protection with aggressive blocking

### Usage

```typescript
// Enable threat detection in SecurityConfig
securityConfig.setSecurityLevel('MEDIUM');

// Monitor security events
threatMonitoringService.getActiveThreats().then(threats => {
  console.log(`Active threats: ${threats.length}`);
});
```

## 2. Multi-Factor Authentication (MFA)

### Core Components

- **TOTPService**: Generates and validates Time-based One-Time Passwords
- **MFAMiddleware**: Enforces MFA for protected routes
- **mfaRoutes**: API endpoints for managing MFA

### Features

- TOTP-based authentication (compatible with Google Authenticator, Authy, etc.)
- QR code generation for easy setup
- Backup codes for account recovery
- Trusted device management
- Selective MFA enforcement based on routes and user roles

### Database Schema

```typescript
// User MFA settings table
export const userMfaSettings = pgTable("user_mfa_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull().unique(),
  totpSecret: text("totp_secret"),
  backupCodes: json("backup_codes").$type<string[]>(),
  enabled: boolean("enabled").default(false),
  lastVerified: timestamp("last_verified"),
  verifiedDevices: json("verified_devices").$type<Array<{
    id: string;
    name: string;
    lastUsed: number;
    userAgent?: string;
    ip?: string;
  }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
```

### Usage

```typescript
// Check if user has MFA enabled
const mfaStatus = await totpService.getMFAStatus(userId);
console.log(`MFA enabled: ${mfaStatus.enabled}`);

// Generate setup information for new user
const { secret, uri, qrCodeUrl } = await totpService.generateSecret(userId, username);

// Verify a token
const isValid = await totpService.verifyToken(userId, token);
```

## 3. Anti-CSRF Protection

### Core Components

- **CSRFProtectionService**: Core service for token generation and validation
- **CSRFMiddleware**: Express middleware for CSRF protection
- **csrfProtectionMiddleware**: Application-specific CSRF integration

### Features

- Double Submit Cookie pattern
- SameSite cookie attributes
- Origin and Referer validation
- Per-request token validation
- Token rotation after each request
- Token expiration and replay protection
- Client-side utilities for API requests

### Implementation

The CSRF protection uses the Double Submit Cookie pattern:
1. Server sets a secure, HttpOnly cookie with the CSRF token
2. Client includes the token in requests via a custom header or form field
3. Server verifies that the token in the request matches the token in the cookie

### Client Usage

```typescript
// Using the csrfFetch utility
import { csrfFetch } from '@/utils/csrfUtils';

// The utility automatically adds CSRF tokens to requests
csrfFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
});

// For forms, include the CSRF token as a hidden field
// Server injects this automatically as {{ csrfHtml }}
<form action="/api/submit" method="post">
  <!-- CSRF token is automatically injected here -->
  {{{ csrfHtml }}}
  
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

## Security Configuration

All security features can be configured through the SecurityConfig service:

```typescript
import { securityConfig } from './security/advanced/config/SecurityConfig';

// Enable or disable specific features
securityConfig.updateSecurityFeatures({
  threatDetection: true,
  realTimeMonitoring: true,
  mfa: true,
  csrfProtection: true,
  ipReputation: true
});

// Set security level
securityConfig.setSecurityLevel('HIGH');
```

## Best Practices

1. **Defense in Depth**: Multiple security layers are designed to work together
2. **Fail Secure**: All features default to the more secure options
3. **Least Privilege**: MFA enforces additional verification for sensitive operations
4. **Monitoring**: Real-time threat monitoring provides visibility into security events
5. **Configurability**: Security levels allow for appropriate protection based on environment

## Troubleshooting

Common issues and solutions:

### Threat Detection
- False positives can be reduced by adjusting threat detection rules
- Infrastructure IPs can be whitelisted to prevent blocking necessary services

### MFA
- Users can use backup codes if they lose access to their authenticator app
- Expired MFA sessions require re-verification

### CSRF Protection
- SPA applications should fetch a new CSRF token on app initialization
- API clients need to include the CSRF token in headers for non-GET requests