# Security Implementation Guide

This document outlines the security measures implemented in the application, based on the security audit plan.

## Implemented Security Features

### Authentication & Authorization

1. **Password Security**
   - Passwords are hashed using bcrypt with secure salt generation
   - Password strength requirements enforced (minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number)
   - Password reset tokens are invalidated after use

2. **Session Management**
   - Secure session configuration with httpOnly, sameSite, and secure flags
   - Session timeout after period of inactivity
   - Session analytics for tracking access patterns
   - Automatic cleanup of expired sessions

3. **User Roles**
   - Role-based access control with 'user', 'admin', and 'super_admin' roles
   - Restricted access to sensitive operations based on user role

### Input Validation & Output Encoding

1. **Input Validation**
   - Request body validation using Zod schemas
   - Content type validation
   - File upload validation for size, type, and content

2. **Output Encoding**
   - DOMPurify for sanitizing HTML content
   - Proper content-type headers

### Network Security

1. **HTTP Security Headers**
   - Content-Security-Policy to prevent XSS attacks
   - X-Content-Type-Options: nosniff
   - X-Frame-Options to prevent clickjacking
   - X-XSS-Protection
   - Referrer-Policy
   - Strict-Transport-Security

2. **CORS Configuration**
   - Restrictive CORS policy to prevent unauthorized cross-origin requests

3. **Rate Limiting**
   - API rate limiting to prevent abuse and DoS attacks

### Logging & Monitoring

1. **Security Event Logging**
   - Detailed logging of security events to `/logs/security/security.log`
   - Log rotation to prevent excessive disk usage
   - Console notifications for security events

2. **Audit Trail**
   - User activity tracking
   - Administrative action logging
   - Session analytics

## Using Security Features

### Security API Endpoints

1. **Change Password**
   ```
   POST /api/user/change-password
   Body: { currentPassword: string, newPassword: string }
   ```
   
2. **Security Settings Toggle**
   ```
   POST /api/security/settings
   Body: { setting: string, enabled: boolean }
   Authentication: Admin role required
   ```

3. **Security Log Viewing**
   ```
   GET /api/security/logs
   Authentication: Admin role required
   ```

### Security Settings

The application supports the following security settings that can be toggled via the Admin UI:

1. **Content Security Policy** - Controls which resources can be loaded
2. **HTTPS Enforcement** - Redirects HTTP requests to HTTPS
3. **Audio Download Protection** - Prevents unauthorized downloading of audio files
4. **Advanced Bot Protection** - Additional protections against automated attacks
5. **Two-Factor Authentication** - Optional 2FA for account security

## Monitoring Security

### Security Logs

Security logs are stored in the `logs/security/` directory. The main log file is `security.log`, with rotated logs having timestamps in their filenames.

To monitor security events in real-time, watch the application logs for entries prefixed with `[SECURITY]`.

### Automatic Security Measures

The application implements several automatic security measures:

1. **Automatic Session Expiry** - Inactive sessions are automatically terminated
2. **Log Rotation** - Security logs are automatically rotated when they exceed 10MB
3. **Database Maintenance** - Regular cleanups of expired sessions and tokens
4. **Failed Login Tracking** - Suspends accounts after multiple failed login attempts

## Security API Usage Examples

### Changing User Password
```javascript
await fetch('/api/user/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPassword: 'OldPassword123',
    newPassword: 'NewSecurePassword456'
  })
});
```

### Toggling Security Settings (Admin Only)
```javascript
await fetch('/api/security/settings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    setting: 'CONTENT_SECURITY_POLICY',
    enabled: true
  })
});
```

## Security Best Practices for Development

1. **Never log sensitive information** such as passwords, tokens, or personal data
2. **Always validate user input** before processing
3. **Use parameterized queries** for database operations to prevent SQL injection
4. **Apply the principle of least privilege** when designing role-based permissions
5. **Regularly review security logs** for suspicious activity
6. **Keep dependencies updated** to avoid known vulnerabilities
