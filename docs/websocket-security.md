# WebSocket Security Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Threat Model](#threat-model)
3. [Security Features](#security-features)
   - [Authentication and Authorization](#authentication-and-authorization)
   - [Input Validation](#input-validation)
   - [Rate Limiting](#rate-limiting)
   - [CSRF Protection](#csrf-protection)
   - [Message Sanitization](#message-sanitization)
   - [Session Management](#session-management)
   - [Anomaly Detection](#anomaly-detection)
   - [Connection Monitoring](#connection-monitoring)
   - [Transport Security](#transport-security)
   - [Secure Error Handling](#secure-error-handling)
   - [Logging and Auditing](#logging-and-auditing)
4. [Implementation Details](#implementation-details)
   - [Server-Side](#server-side)
   - [Client-Side](#client-side)
5. [Security Audit Process](#security-audit-process)
6. [Health Check System](#health-check-system)
7. [Integration Guide](#integration-guide)
8. [Best Practices](#best-practices)
9. [Compliance](#compliance)
10. [References](#references)

## Overview

This comprehensive WebSocket security implementation provides multi-layered protection against common WebSocket vulnerabilities and threats. It integrates with both native WebSockets and Socket.IO, offering robust security features while maintaining high performance.

Our implementation follows industry best practices from OWASP, NIST, and other security standards to ensure that WebSocket communications are:

- **Authenticated**: All connections are properly authenticated
- **Encrypted**: All data is transmitted securely
- **Validated**: All messages are validated and sanitized
- **Protected**: Against common attack vectors
- **Monitored**: For anomalies and performance issues
- **Compliant**: With relevant industry standards

## Threat Model

WebSockets are vulnerable to several attack vectors that this implementation defends against:

| Threat | Description | Mitigation |
|--------|-------------|------------|
| Unauthenticated access | Unauthorized connections | Token-based authentication |
| Man-in-the-middle attacks | Interception of WebSocket traffic | TLS enforcement (WSS) |
| Cross-Site WebSocket Hijacking | Similar to CSRF attacks | Origin validation, CSRF tokens |
| Message injection | Malicious payloads in messages | Input validation, schema enforcement |
| Denial of Service | Flooding with connections or messages | Multi-layer rate limiting |
| Information disclosure | Leaking sensitive information | Payload sanitization |
| Session hijacking | Taking over authenticated sessions | Secure session management |
| Prototype pollution | JavaScript prototype chain attacks | Object sanitization |
| Reconnaissance | Probing for information | Minimal error messages |
| Persistent connections | Resource exhaustion | Auto-expiration, health checks |

## Security Features

### Authentication and Authorization

- **Token-based authentication** required for all connections
- **JWT validation** with signature verification
- **Token expiration** with auto-refresh mechanism
- **Role-based access control** for message processing
- **Explicit session termination** capabilities

Implementation:
```typescript
// Server-side authentication example
function authenticateConnection(req, token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (isTokenExpired(decoded)) {
      return { authenticated: false, reason: 'expired_token' };
    }
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, reason: 'invalid_token' };
  }
}
```

### Input Validation

- **Schema-based validation** using Zod
- **Message type enforcement**
- **Deep validation** of nested structures
- **Strict schema adherence** with automatic rejection of non-conforming messages
- **Size limitations** for message payloads (default 64KB)

Example schema:
```typescript
const messageSchema = z.object({
  type: z.enum(['chat', 'file_upload', 'notification', 'ack', 'token_refresh', 'health-check']),
  payload: z.any(),
  timestamp: z.number().optional().default(() => Date.now()),
  csrfToken: z.string().optional(),
});
```

### Rate Limiting

- **Tiered rate limiting** with progressive penalties
- **Connection rate limiting** at the server level
- **Message rate limiting** per connection
- **Action-specific limits** based on message type
- **IP-based rate limiting** for connection attempts
- **Exponential backoff** for repeat violations
- **Automatic blacklisting** for severe violations

Implementation:
```typescript
// Progressive rate limiting with penalties
function checkRateLimit(clientId, messageType) {
  const now = Date.now();
  const clientStats = getClientStats(clientId);
  
  // Add the current message to the history
  clientStats.messageHistory.push({ type: messageType, timestamp: now });
  
  // Prune old messages (sliding window)
  clientStats.messageHistory = clientStats.messageHistory.filter(
    msg => (now - msg.timestamp) <= RATE_WINDOW_MS
  );
  
  // Check if over limit
  if (clientStats.messageHistory.length > MESSAGE_RATE_LIMIT) {
    // Apply penalty and increase score
    clientStats.anomalyScore += RATE_LIMIT_PENALTY;
    clientStats.penalties.push({
      type: 'rate_limit',
      timestamp: now,
      expires: now + PENALTY_DURATION
    });
    
    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      retryAfter: calculateBackoff(clientStats.penalties.length)
    };
  }
  
  return { allowed: true };
}
```

### CSRF Protection

- **Token-based CSRF protection** for all non-exempt messages
- **Token validation** on each message
- **Token rotation** on a configurable schedule
- **Exemptions** for specific message types (health checks, token refresh)

Implementation:
```typescript
// CSRF token validation
function validateCsrfToken(message, session) {
  // Check exemptions for certain message types
  if (CSRF_EXEMPT_MESSAGE_TYPES.includes(message.type)) {
    return true;
  }
  
  // Validate the token
  return message.csrfToken === session.csrfToken;
}
```

### Message Sanitization

- **HTML sanitization** to prevent XSS attacks
- **Prototype pollution prevention**
- **Recursive object freezing** for immutability
- **Path traversal prevention** in filenames and paths
- **Character encoding validation**

Implementation:
```typescript
// Object sanitization example
function sanitizeObject(obj, depth = 0, maxDepth = 10) {
  // Prevent prototype pollution
  if (!obj || typeof obj !== 'object' || depth > maxDepth) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return Object.freeze(
      obj.map(item => sanitizeObject(item, depth + 1, maxDepth))
    );
  }
  
  // Create a new object without prototype
  const sanitized = Object.create(null);
  
  // Process each property
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !DANGEROUS_PROPS.includes(key)) {
      sanitized[key] = sanitizeObject(obj[key], depth + 1, maxDepth);
    }
  }
  
  return Object.freeze(sanitized);
}
```

### Session Management

- **Explicit session tracking** for all connections
- **Session timeout** with configurable expiration
- **Session metadata storage**
- **Limit concurrent sessions** per user
- **Forced session termination** capabilities
- **Session revival prevention**

Implementation:
```typescript
// Session tracking example
const sessions = new Map();

function createSession(clientId, user) {
  const now = Date.now();
  const session = {
    id: generateUUID(),
    clientId,
    userId: user.id,
    createdAt: now,
    lastActivity: now,
    csrfToken: generateSecureToken(),
    tokenRefreshedAt: now,
    connectionMetadata: {
      userAgent: user.userAgent,
      ip: user.ip,
      connectionCount: 1
    },
    expires: now + SESSION_TIMEOUT
  };
  
  // Store the session
  sessions.set(clientId, session);
  
  // Schedule cleanup for expired sessions
  scheduleSessionCleanup();
  
  return session;
}
```

### Anomaly Detection

- **Behavior-based anomaly scoring**
- **Progressive penalties** for suspicious behavior
- **Automatic disconnection** for high-risk behavior
- **Detection of credential stuffing attempts**
- **Pattern recognition** for attack signatures
- **Integration with IP reputation services**

Implementation:
```typescript
// Anomaly detection
function updateAnomalyScore(clientId, event, score) {
  const clientStats = getClientStats(clientId);
  
  // Update the anomaly score
  clientStats.anomalyScore += score;
  
  // Add event to history
  clientStats.anomalyEvents.push({
    type: event,
    timestamp: Date.now(),
    score
  });
  
  // Prune old events
  clientStats.anomalyEvents = clientStats.anomalyEvents.filter(
    event => (Date.now() - event.timestamp) <= ANOMALY_WINDOW_MS
  );
  
  // Check if action needed
  if (clientStats.anomalyScore >= ANOMALY_THRESHOLD_DISCONNECT) {
    return {
      action: 'disconnect',
      reason: 'security_violation'
    };
  }
  
  if (clientStats.anomalyScore >= ANOMALY_THRESHOLD_RESTRICT) {
    return {
      action: 'restrict',
      reason: 'suspicious_activity'
    };
  }
  
  return { action: 'none' };
}
```

### Connection Monitoring

- **Health check system** for all connections
- **Ping/pong mechanisms** for connection verification
- **Statistical tracking** of connection patterns
- **Memory leak prevention**
- **Resource usage monitoring**
- **Automatic cleanup** of stale connections

Implementation:
```typescript
// Health check implementation
function setupHealthChecks(wss) {
  // Track connection statistics
  const stats = {
    totalConnections: 0,
    activeConnections: 0,
    disconnections: 0,
    failedHealthChecks: 0,
    anomalousConnections: 0,
    lastCheck: Date.now()
  };
  
  // Setup interval health check
  setInterval(() => {
    const now = Date.now();
    stats.lastCheck = now;
    
    wss.clients.forEach((client) => {
      // Skip clients that are not in open state
      if (client.readyState !== WebSocket.OPEN) return;
      
      // Get the client's session
      const session = sessions.get(client.id);
      
      // Check if session exists and is not expired
      if (!session || session.expires < now) {
        // Terminate expired sessions
        client.terminate();
        stats.disconnections++;
        return;
      }
      
      // Send a health check
      client.ping(PING_PAYLOAD, false, (err) => {
        if (err) {
          stats.failedHealthChecks++;
          // Handle failed ping
          client.terminate();
        }
      });
    });
    
    // Update active connection count
    stats.activeConnections = wss.clients.size;
  }, HEALTH_CHECK_INTERVAL);
  
  return stats;
}
```

### Transport Security

- **TLS enforcement** for all WebSocket connections
- **Secure WebSocket protocol** (WSS) only in production
- **HTTP strict transport security** (HSTS) integration
- **Protocol downgrade prevention**
- **Cipher suite restrictions**

Implementation:
```typescript
// TLS enforcement example
function setupWebSockets(server) {
  const wss = new WebSocket.Server({ server });
  
  // In production, reject non-secure connections
  if (process.env.NODE_ENV === 'production') {
    server.on('upgrade', (request, socket, head) => {
      const isSecure = request.headers['x-forwarded-proto'] === 'https' || request.connection.encrypted;
      
      if (!isSecure) {
        // Close the connection with error
        socket.write('HTTP/1.1 426 Upgrade Required\r\n' +
                    'Upgrade: TLS/1.2\r\n' +
                    'Connection: Upgrade\r\n' +
                    'Content-Type: text/plain\r\n' +
                    'Content-Length: 26\r\n' +
                    '\r\n' +
                    'Secure connection required');
        socket.destroy();
        return;
      }
      
      // Continue with the WebSocket upgrade
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  }
  
  return wss;
}
```

### Secure Error Handling

- **Minimal error information** exposed to clients
- **Structured error responses** with error codes
- **Detailed server-side logging** of errors
- **Graceful degradation** for non-critical errors
- **Circuit breaker patterns** for dependent services

Implementation:
```typescript
// Secure error handling
function handleError(client, error, context = {}) {
  // Log the full error on the server
  console.error('WebSocket error:', error, context);
  
  // Send minimized error to the client
  const clientError = {
    code: getErrorCode(error),
    message: getPublicErrorMessage(error),
    requestId: context.requestId
  };
  
  // Send the error if the connection is still open
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type: 'error',
      payload: clientError,
      timestamp: Date.now()
    }));
  }
  
  // Update metrics
  updateErrorMetrics(clientError.code);
}
```

### Logging and Auditing

- **Comprehensive event logging**
- **Security-focused audit trail**
- **Log correlation** with request IDs
- **Tamper-evident logging**
- **Compliance-focused logging** for regulatory requirements
- **Automated log analysis** for threat detection

Implementation:
```typescript
// Security audit logging
function auditLog(event, data, severity = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    data,
    source: 'websocket-security'
  };
  
  // Add to in-memory audit trail with limited size
  auditTrail.unshift(logEntry);
  if (auditTrail.length > MAX_AUDIT_TRAIL_SIZE) {
    auditTrail.pop();
  }
  
  // Write to persistent storage based on severity
  if (['warn', 'error', 'critical'].includes(severity)) {
    persistAuditLog(logEntry);
  }
  
  return logEntry;
}
```

## Implementation Details

### Server-Side

The server-side implementation in `server/websocket.ts` includes:

- **WebSocket server initialization**
- **Connection handling and authentication**
- **Message processing pipeline**
- **Security middleware** for all received messages
- **Session management**
- **Health check system**
- **Monitoring and metrics**

Key components:

1. **Connection Handler**: Manages new WebSocket connections, performs authentication, and sets up the session
2. **Message Handler**: Processes incoming messages, applies validation, and routes to appropriate handlers
3. **Security Middleware**: Applies security checks to all messages (CSRF, rate limiting, etc.)
4. **Session Manager**: Maintains and cleans up sessions
5. **Health Check System**: Monitors connection health and cleans up stale connections
6. **Statistics Tracker**: Collects performance and security metrics

### Client-Side

The client-side implementation in `client/src/utils/secureWebSocket.ts` provides:

- **Secure connection establishment**
- **Automatic authentication**
- **CSRF token management**
- **Automatic reconnection** with backoff
- **Token refresh**
- **Message queue** during disconnections
- **Health check response handling**

Key features:

1. **Secure by Default**: Uses secure WebSocket (WSS) protocol
2. **Authentication**: Automatically sends authentication token
3. **Token Management**: Handles token refresh before expiration
4. **CSRF Protection**: Automatically includes CSRF tokens in messages
5. **Reconnection Logic**: Reconnects with exponential backoff
6. **Message Queuing**: Queues messages when disconnected
7. **Error Handling**: Provides clear error feedback

## Security Audit Process

The security audit script (`scripts/websocket-security-audit.js`) performs:

1. **Configuration Check**: Validates security settings
2. **Vulnerability Testing**: Tests for common vulnerabilities
3. **Performance Testing**: Evaluates performance under load
4. **Compliance Check**: Verifies compliance with security standards
5. **Recommendation Generation**: Provides security improvement recommendations

Example audit:
```bash
# Run the security audit
node scripts/websocket-security-audit.js --verbose

# Sample output
[INFO] WebSocket Security Audit
[INFO] Testing WebSocket configuration...
[SUCCESS] TLS configuration passed
[SUCCESS] Authentication check passed
[WARNING] Rate limiting could be stricter
[INFO] Testing for vulnerabilities...
[SUCCESS] No CSRF vulnerabilities detected
[SUCCESS] Input validation is properly implemented
...
```

## Health Check System

The health check system:

1. **Periodic Checks**: Sends ping messages to verify connection
2. **Timeout Detection**: Identifies non-responsive connections
3. **Cleanup**: Automatically terminates stale connections
4. **Metrics Collection**: Gathers performance data
5. **API Endpoint**: Exposes health status via API

## Integration Guide

Integration with existing systems:

### Express.js Setup
```typescript
import express from 'express';
import http from 'http';
import { setupWebSockets } from './websocket';

const app = express();
const server = http.createServer(app);

// Set up WebSockets with the HTTP server
setupWebSockets(server);

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

### React Integration
```tsx
import React, { useEffect, useState } from 'react';
import { SecureWebSocket } from './utils/secureWebSocket';

function MyComponent() {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Get authentication token from your auth system
    const token = getAuthToken();
    
    // Create secure WebSocket
    const ws = new SecureWebSocket({
      url: 'wss://example.com/ws',
      authToken: token,
      onMessage: handleMessage
    });
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);
  
  // Rest of component...
}
```

## Best Practices

1. **Always use WSS in production**
   - WebSocket connections should always use TLS encryption in production

2. **Implement proper authentication**
   - Every WebSocket connection should be authenticated
   - Use short-lived tokens with refresh capability

3. **Validate all input**
   - Use schema validation for all incoming messages
   - Never trust client input

4. **Implement rate limiting**
   - Limit connections per IP address
   - Limit messages per connection
   - Use progressive penalties for violations

5. **Properly handle reconnections**
   - Use exponential backoff
   - Prevent reconnection storms

6. **Manage resources**
   - Clean up unused connections
   - Implement connection timeout
   - Limit payload sizes

7. **Secure error handling**
   - Don't expose sensitive information in errors
   - Log detailed errors server-side

8. **Regular security audits**
   - Run the security audit script regularly
   - Keep dependencies updated

## Compliance

This WebSocket security implementation is designed to help meet:

- **OWASP WebSocket Security Guidelines**
- **NIST Cybersecurity Framework**
- **PCI DSS** for payment applications
- **GDPR** for data protection
- **HIPAA** for healthcare applications (when applicable)

## References

1. OWASP WebSocket Security Cheatsheet
2. NIST Special Publication 800-95: Guide to Secure Web Services
3. RFC 6455: The WebSocket Protocol
4. RFC 7692: Compression Extensions for WebSocket
5. Socket.IO Documentation: Security Considerations