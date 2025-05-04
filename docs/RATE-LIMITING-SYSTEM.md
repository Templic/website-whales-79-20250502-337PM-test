# Context-Aware Rate Limiting System

## Overview

This document describes the implementation of the context-aware rate limiting system in the Dale Loves Whales application. The system enhances security and performance by dynamically adjusting rate limits based on multiple contextual factors.

## System Architecture

The rate limiting system consists of multiple components that work together to provide intelligent, context-aware request throttling:

```
TokenBucketRateLimiter (Core Algorithm)
         ↓
    RateLimitingSystem (Context Engine)
         ↓
RateLimitIntegration (Express Middleware)
```

## Key Components

### TokenBucketRateLimiter

The core rate limiting algorithm implements a token bucket approach:

- **Capacity**: Maximum number of tokens a bucket can hold
- **Refill Rate**: How quickly tokens replenish over time
- **Storage Options**: In-memory or distributed (Redis)

Key methods:
- `consume(tokens)`: Attempt to consume tokens from the bucket
- `refill()`: Add tokens back to the bucket based on refill rate
- `drain()`: Empty the bucket (for penalties)
- `getTokens()`: Get current token count

### RateLimitingSystem

Provides context-aware decision making by considering:

1. **User Context**
   - Authentication status
   - User role/permissions
   - Historical behavior patterns

2. **Resource Context**
   - Endpoint sensitivity
   - Resource cost/impact
   - Operation type (read/write)

3. **System Context**
   - Current server load
   - Error rates
   - Security threat levels

4. **Request Context**
   - HTTP method
   - Request frequency
   - Request complexity
   - Payload size

### RateLimitIntegration

Express middleware that:
- Intercepts all HTTP requests
- Consults RateLimitingSystem for decisions
- Applies rate limits
- Manages response headers
- Tracks and logs rate limit events

## Configuration Options

The rate limiting system supports the following configuration options:

```javascript
{
  // General configuration
  enabled: true,                      // Enable/disable the entire system
  defaultLimit: 100,                  // Default requests per window
  defaultWindow: 60 * 1000,           // Default time window in ms (1 minute)
  
  // Tiered rate limits
  tiers: {
    auth: { limit: 300, window: 60 * 1000 },     // Authenticated routes
    admin: { limit: 600, window: 60 * 1000 },    // Admin routes
    api: { limit: 150, window: 60 * 1000 },      // API routes
    public: { limit: 60, window: 60 * 1000 }     // Public routes
  },
  
  // Context factors configuration
  contextFactors: {
    userRole: { weight: 0.4 },                 // Impact of user role
    resourceSensitivity: { weight: 0.3 },      // Impact of resource sensitivity
    systemLoad: { weight: 0.2 },               // Impact of system load
    securityThreatLevel: { weight: 0.1 },      // Impact of security context
  },
  
  // Redis configuration (optional)
  redis: {
    enabled: false,                  // Use Redis for distributed rate limiting
    host: 'localhost',
    port: 6379,
    keyPrefix: 'ratelimit:'
  },
  
  // Response headers
  headers: {
    remaining: 'X-RateLimit-Remaining',   // Remaining tokens
    limit: 'X-RateLimit-Limit',           // Total capacity
    reset: 'X-RateLimit-Reset'            // Time until reset
  }
}
```

## Context-Aware Decision Making

The system dynamically adjusts rate limits based on contextual factors using a weighted scoring system:

```javascript
function calculateContextualLimit(baseLimit, context) {
  const {
    userRole,                // e.g., 'admin', 'user', 'guest'
    resourceSensitivity,     // e.g., 'high', 'medium', 'low'
    requestMethod,           // e.g., 'GET', 'POST', 'DELETE'
    systemLoad,              // e.g., 0.8 (80% CPU)
    securityThreatLevel      // e.g., 'high', 'medium', 'low'
  } = context;
  
  // Apply weights to each factor and calculate adjustment
  const weights = config.contextFactors;
  
  let multiplier = 1.0;
  
  // User role adjustment
  if (userRole === 'admin') multiplier += weights.userRole.weight;
  if (userRole === 'guest') multiplier -= weights.userRole.weight / 2;
  
  // Resource sensitivity adjustment
  if (resourceSensitivity === 'high') multiplier -= weights.resourceSensitivity.weight;
  if (resourceSensitivity === 'low') multiplier += weights.resourceSensitivity.weight / 2;
  
  // Method adjustment
  if (requestMethod === 'POST' || requestMethod === 'DELETE') multiplier -= 0.1;
  if (requestMethod === 'GET') multiplier += 0.05;
  
  // System load adjustment
  if (systemLoad > 0.8) multiplier -= weights.systemLoad.weight;
  if (systemLoad < 0.3) multiplier += weights.systemLoad.weight / 2;
  
  // Security threat level adjustment
  if (securityThreatLevel === 'high') multiplier -= weights.securityThreatLevel.weight;
  
  // Calculate adjusted limit
  return Math.max(1, Math.round(baseLimit * multiplier));
}
```

## Integration with CSRF Protection

The rate limiting system integrates with CSRF protection to provide enhanced security:

1. **CSRF Event Monitoring**:
   - Tracks CSRF verification events
   - Penalizes clients that fail verification
   - Rewards clients that consistently pass verification

2. **Token Adjustment Algorithm**:
   ```javascript
   // When CSRF check succeeds
   function handleCsrfSuccess(ip, sessionId) {
     const userBucket = getUserBucket(ip, sessionId);
     userBucket.reward(); // Add bonus tokens
     decreaseThreatLevel(ip);
   }
   
   // When CSRF check fails
   function handleCsrfFailure(ip, sessionId) {
     const userBucket = getUserBucket(ip, sessionId);
     userBucket.penalize(); // Drain tokens
     increaseThreatLevel(ip);
     logSecurityEvent('csrf-failure', ip, sessionId);
   }
   ```

3. **Exemption Handling**:
   - CSRF-exempt routes maintain regular rate limiting
   - Third-party integrations (like Taskade) use specialized limits
   - Service workers and static assets use lenient limits

## Third-Party Integration Support

The rate limiting system includes specialized handling for third-party integrations like Taskade:

```javascript
// Example: Special rate limits for Taskade integration
function applyThirdPartyRateLimit(req, res, next) {
  const isTaskadeRequest = isTaskadeDomain(req.hostname) || 
                           req.path.startsWith('/taskade-embed');
  
  if (isTaskadeRequest) {
    // Apply specialized rate limits for Taskade
    const taskadeLimiter = getTaskadeRateLimiter();
    return taskadeLimiter.handleRequest(req, res, next);
  }
  
  // Continue with normal rate limiting
  next();
}
```

## System Load Monitoring

To enable context-aware decisions based on system load, the rate limiting system includes monitoring capabilities:

```javascript
// Example: System load monitoring
class SystemLoadMonitor {
  constructor() {
    this.cpuSamples = [];
    this.memorySamples = [];
    this.sampleInterval = 5000; // 5 seconds
    this.sampleSize = 12; // 1 minute of history
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => this.collectSample(), this.sampleInterval);
  }
  
  collectSample() {
    // Collect CPU and memory metrics
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    const memoryUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
    
    // Add to samples, maintain sample size
    this.cpuSamples.push(cpuUsage);
    this.memorySamples.push(memoryUsage);
    
    if (this.cpuSamples.length > this.sampleSize) {
      this.cpuSamples.shift();
      this.memorySamples.shift();
    }
  }
  
  getSystemLoad() {
    // Average the recent samples
    const avgCpu = this.cpuSamples.reduce((sum, value) => sum + value, 0) / 
                  this.cpuSamples.length;
    const avgMemory = this.memorySamples.reduce((sum, value) => sum + value, 0) / 
                     this.memorySamples.length;
    
    return {
      cpu: avgCpu,
      memory: avgMemory,
      combined: (avgCpu * 0.6) + (avgMemory * 0.4) // Weighted average
    };
  }
}
```

## Security Threat Detection

The rate limiting system includes threat detection capabilities to adjust limits based on security context:

```javascript
class SecurityThreatDetector {
  constructor() {
    this.ipThreats = new Map();
    this.globalThreatLevel = 'low';
    this.thresholds = {
      csrfFailures: { medium: 5, high: 10 },
      rateLimitExceeded: { medium: 10, high: 20 },
      suspiciousPatterns: { medium: 3, high: 7 }
    };
  }
  
  recordEvent(eventType, ip) {
    if (!this.ipThreats.has(ip)) {
      this.ipThreats.set(ip, {
        csrfFailures: 0,
        rateLimitExceeded: 0,
        suspiciousPatterns: 0,
        lastUpdated: Date.now()
      });
    }
    
    const threatInfo = this.ipThreats.get(ip);
    
    // Increment the appropriate counter
    if (threatInfo[eventType] !== undefined) {
      threatInfo[eventType]++;
    }
    
    threatInfo.lastUpdated = Date.now();
    
    // Update global threat level
    this.updateGlobalThreatLevel();
  }
  
  getThreatLevel(ip) {
    if (!this.ipThreats.has(ip)) return 'low';
    
    const threatInfo = this.ipThreats.get(ip);
    
    // Check thresholds
    if (threatInfo.csrfFailures >= this.thresholds.csrfFailures.high ||
        threatInfo.rateLimitExceeded >= this.thresholds.rateLimitExceeded.high ||
        threatInfo.suspiciousPatterns >= this.thresholds.suspiciousPatterns.high) {
      return 'high';
    }
    
    if (threatInfo.csrfFailures >= this.thresholds.csrfFailures.medium ||
        threatInfo.rateLimitExceeded >= this.thresholds.rateLimitExceeded.medium ||
        threatInfo.suspiciousPatterns >= this.thresholds.suspiciousPatterns.medium) {
      return 'medium';
    }
    
    return 'low';
  }
  
  getGlobalThreatLevel() {
    return this.globalThreatLevel;
  }
  
  updateGlobalThreatLevel() {
    // Count IPs at each threat level
    let highCount = 0;
    let mediumCount = 0;
    
    for (const [ip, threatInfo] of this.ipThreats.entries()) {
      const level = this.getThreatLevel(ip);
      if (level === 'high') highCount++;
      if (level === 'medium') mediumCount++;
    }
    
    // Update global threat level
    if (highCount >= 5) {
      this.globalThreatLevel = 'high';
    } else if (highCount >= 2 || mediumCount >= 10) {
      this.globalThreatLevel = 'medium';
    } else {
      this.globalThreatLevel = 'low';
    }
  }
}
```

## Usage Examples

### Basic Usage in Express

```javascript
import express from 'express';
import { rateLimitMiddleware } from './security/rate-limiting';

const app = express();

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// Example route
app.get('/api/data', (req, res) => {
  res.json({ message: 'Rate-limited API response' });
});
```

### Route-Specific Configuration

```javascript
// Apply custom rate limits to specific routes
app.get('/api/sensitive-resource', 
  rateLimitMiddleware({ 
    tier: 'api',
    sensitivity: 'high',
    contextFactors: {
      resourceSensitivity: { weight: 0.5 } // Override default weight
    }
  }), 
  (req, res) => {
    res.json({ message: 'Sensitive resource' });
  }
);
```

### Third-Party Route Configuration

```javascript
// Custom rate limiting for Taskade integration
app.get('/taskade-embed', 
  rateLimitMiddleware({
    tier: 'public',
    thirdParty: 'taskade',
    bypassStandard: true
  }),
  taskadeEmbedHandler
);
```

## Monitoring and Analytics

The rate limiting system includes monitoring capabilities to track and analyze rate limit events:

```javascript
// Example analytics event
{
  timestamp: '2025-04-19T14:32:45.123Z',
  type: 'ratelimit-exceeded',
  ip: '192.168.1.1',
  sessionId: 'user-session-123',
  path: '/api/data',
  method: 'POST',
  tier: 'api',
  limit: 150,
  remaining: 0,
  reset: 1618841565123,
  contextFactors: {
    userRole: 'user',
    resourceSensitivity: 'medium',
    systemLoad: 0.65,
    securityThreatLevel: 'low'
  }
}
```

## Maintenance and Tuning

Guidelines for maintaining and tuning the rate limiting system:

1. **Regular Review**:
   - Monitor rate limit events and adjust thresholds as needed
   - Review logs for patterns of legitimate users hitting limits
   - Analyze system performance impact

2. **Seasonal Adjustments**:
   - Increase limits during expected high traffic periods
   - Decrease limits during maintenance windows
   - Adjust context weights based on observed patterns

3. **Security Incident Response**:
   - Temporarily decrease limits during active attacks
   - Implement IP-based blocks for severe violations
   - Reset to normal operations after incident resolution

## Related Documentation

- [CSRF Protection System](./CSRF-PROTECTION-SYSTEM.md)
- [Security Framework Overview](./SECURITY-FRAMEWORK.md)
- [Taskade Integration](./TASKADE-INTEGRATION.md)