# Security Troubleshooting Guide

This document provides guidance for troubleshooting common security-related issues in the application.

## Common Issues and Solutions

### White Screen / Application Not Loading

**Symptoms:**
- Application displays a white/blank page
- Console shows numerous security alerts (rate limit abuse, IP blocking)
- Application resources may be blocked by security measures

**Potential Causes:**
1. **Overly Aggressive Rate Limiting**: The rate limiting thresholds may be too low, causing legitimate traffic to be throttled
2. **Infrastructure IP Blocking**: The security system may be blocking infrastructure IPs that are essential for the application
3. **CSRF Token Issues**: CSRF protection may be blocking legitimate requests due to missing or invalid tokens
4. **Security Level Too High**: The security level may be set too high for normal operation

**Solutions:**

1. **Temporarily Lower Security Level**
```typescript
// Set security to MONITOR mode (detection only, no blocking)
securityConfig.setSecurityLevel('MONITOR');

// Or if issues persist, disable specific features
securityConfig.updateSecurityFeatures({
  rateLimiting: false,
  threatDetection: false,
  csrfProtection: false
});
```

2. **Add Infrastructure IPs to Whitelist**
```typescript
// In server/security/advanced/threat/ThreatProtectionMiddleware.ts
// Add your infrastructure IPs to the whitelist
const infraWhitelist = [
  '34.75.203.116', // Replit infrastructure
  '68.230.197.31',  // Your IP address
  '127.0.0.1'      // Local development
];
```

3. **Increase Rate Limiting Thresholds**
```typescript
// In server/security/advanced/threat/TokenBucketRateLimiter.ts
// Increase tokens per interval
const ipRateLimiter = new TokenBucketRateLimiter({
  tokensPerInterval: 300,  // Increased from 100
  interval: 60000,         // 1 minute
  burstCapacity: 500       // Increased from 200
});
```

4. **Check CSRF Setup**
Make sure your client-side code is correctly including CSRF tokens in all requests:
```typescript
// Check that API requests include CSRF token
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': document.cookie.split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1]
  },
  body: JSON.stringify(data)
});
```

### Security Blocking Legitimate Requests

**Symptoms:**
- Legitimate API requests are blocked with 403 or 429 status codes
- Security logs show false positive threats
- Certain user actions consistently fail

**Solutions:**

1. **Enable Debug Mode**
```typescript
// Enable security debug mode to get more detailed logs
securityConfig.setDebugMode(true);
```

2. **Adjust Detection Rules**
Review and adjust threat detection rules to reduce false positives:
```typescript
// Example of relaxing SQL injection detection pattern
const sqlInjectionPattern = /'\s*(?:or|and|union|select|insert|update|delete|drop)\s+/i;
```

3. **Create Route-Specific Security Rules**
```typescript
// Apply different security rules to different routes
app.use('/api/public/*', publicSecurityMiddleware);
app.use('/api/admin/*', strictSecurityMiddleware);
app.use('/static/*', minimalSecurityMiddleware);
```

### MFA Issues

**Symptoms:**
- Users unable to access MFA-protected routes
- MFA verification constantly fails
- MFA setup process fails

**Solutions:**

1. **Check MFA Configuration**
```typescript
// Verify MFA is properly configured
console.log(securityConfig.getSecurityFeatures().mfa); // Should be true
```

2. **Debug MFA Sessions**
```typescript
// Add logging to MFA verification process
app.use((req, res, next) => {
  console.log('Session MFA status:', req.session?.mfaVerified);
  console.log('MFA verified at:', req.session?.mfaVerifiedAt);
  next();
});
```

3. **Verify TOTP Settings**
```typescript
// Check TOTP service configuration
console.log(totpService.getOptions());
```

### CSRF Token Validation Failures

**Symptoms:**
- Form submissions fail with CSRF errors
- API requests fail with 403 Forbidden
- CSRF errors in browser console

**Solutions:**

1. **Inspect Cookies**
Check that the CSRF cookie is being set correctly:
```typescript
// Add logging for CSRF cookie
app.use((req, res, next) => {
  console.log('CSRF cookie:', req.cookies['csrf-token']);
  next();
});
```

2. **Check Request Headers**
Verify that requests include the correct CSRF header:
```typescript
app.use((req, res, next) => {
  console.log('CSRF header:', req.headers['x-csrf-token']);
  next();
});
```

3. **Test CSRF Token Generation**
```typescript
// Test CSRF token generation
const token = csrfProtectionService.generateToken('test-session');
console.log('Generated token:', token);
```

## Emergency Procedures

### Temporarily Disable Security

If security features are causing major issues in production, you can temporarily disable them:

```typescript
// Completely disable security features in emergency
securityConfig.updateSecurityFeatures({
  threatDetection: false,
  realTimeMonitoring: false,
  ipReputation: false,
  csrfProtection: false,
  xssProtection: false,
  sqlInjectionProtection: false,
  rateLimiting: false,
  twoFactorAuth: false,
  mfa: false,
  passwordPolicies: false,
  bruteForceProtection: false,
  zeroKnowledgeProofs: false,
  aiThreatDetection: false
});
```

⚠️ **WARNING**: This completely disables all security features and should only be used as a last resort in emergency situations. Re-enable security features as soon as possible.

### Clearing Security Caches

If there are issues with blocked IPs or security caches, you can clear them:

```typescript
// Clear all security caches
blockedIpsCache.clear();
usedTokensCache.clear();
rateLimitCounters.clear();
```

### Reset Security to Default State

To reset security to its default state:

```typescript
// Reset security configuration to defaults
securityConfig.reset();
```

## Monitoring Security Status

To monitor the current security status:

```typescript
// Get current security configuration
const currentFeatures = securityConfig.getSecurityFeatures();
const currentLevel = securityConfig.getSecurityLevel();

console.log('Security Level:', currentLevel);
console.log('Enabled Features:', currentFeatures);
```

## Logging and Debugging

Enable additional logging for security components:

```typescript
// Enable verbose logging for security components
process.env.SECURITY_LOG_LEVEL = 'debug';
```

Check security metrics:

```typescript
// Get security metrics
threatMonitoringService.getMetrics().then(metrics => {
  console.log('Security Metrics:', metrics);
});
```

## Next Steps After Troubleshooting

After resolving immediate issues:

1. Review security logs to understand what caused the problem
2. Adjust security configuration based on findings
3. Add tests to prevent similar issues in the future
4. Document any permanent changes to security settings
5. Monitor the application to ensure the issue doesn't recur