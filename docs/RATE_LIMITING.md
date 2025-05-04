# Advanced Context-Aware Rate Limiting System

## Overview

This document describes the advanced context-aware rate limiting system implemented for the application. The system provides intelligent protection against abuse while maintaining a good user experience for legitimate users.

## Core Components

### 1. TokenBucketRateLimiter

The foundation of our rate limiting system, implementing the token bucket algorithm with context-awareness.

- **Features**:
  - Variable token costs based on request type
  - Context-aware bucket sizes and refill rates
  - Adaptive multipliers for dynamic adjustment
  - Analytics integration for monitoring and reporting

- **Usage**:
  ```typescript
  const limiter = new TokenBucketRateLimiter({
    capacity: 100,        // Maximum tokens in bucket
    refillRate: 10,       // Tokens added per interval
    refillInterval: 60000, // Interval in ms (1 minute)
    contextAware: true    // Enable context awareness
  });
  
  // Consume tokens
  const result = limiter.consume(
    'user:123',           // Bucket identifier
    1,                    // Cost of request
    context,              // Context object
    adaptiveMultiplier    // Dynamic multiplier
  );
  ```

### 2. RateLimitContextBuilder

Extracts context from HTTP requests to inform rate limiting decisions.

- **Features**:
  - Identifies user roles and authentication status
  - Classifies resource types and sensitivity
  - Detects bot traffic (good vs. bad bots)
  - Calculates request costs based on multiple factors
  - Maintains IP blacklist and whitelist

- **Context Data**:
  ```typescript
  interface RateLimitContext {
    // Basic request metadata
    ip: string;             // Client IP address
    identifier: string;     // Unique identifier (IP or user ID based)
    method: string;         // HTTP method
    path: string;           // Request path
    
    // User information
    userId?: string | number; // User ID if authenticated
    userRole?: string;      // User role if available
    authenticated: boolean; // Authentication status
    roleWeight: number;     // Role weight (lower = higher privilege)
    
    // Resource information
    resourceType: string;   // Type of resource being accessed
    resourceId?: string;    // ID of specific resource
    resourceSensitivity: number; // Sensitivity level
    
    // Security context
    threatLevel: number;    // Threat level (0-1)
    riskLevel: number;      // Computed risk score
    isBlacklisted: boolean; // Whether IP is blacklisted
    isGoodBot: boolean;     // Whether it's a good bot
    isBadBot: boolean;      // Whether it's a bad bot
    
    // Request specifics
    contentLength: number;  // Request content length
    hasAttachments: boolean; // Whether request has attachments
    isWrite: boolean;       // Whether it's a write operation
    isRead: boolean;        // Whether it's a read operation
  }
  ```

### 3. AdaptiveRateLimiter

Dynamically adjusts rate limits based on system conditions.

- **Features**:
  - Adjusts based on CPU and memory load
  - Responds to global security threat levels
  - Considers error rates and violation patterns
  - Provides smooth transitions between states
  - Caches effective multipliers for performance

- **Adjustment Factors**:
  - **System Load Factor**: Scales down capacity during high load
  - **Threat Factor**: Decreases limits when threats are detected
  - **Error Rate Factor**: Adjusts based on rate limit violations

### 4. ThreatDetectionService

Identifies and tracks suspicious IPs and maintains global threat level.

- **Features**:
  - Tracks violations by IP and identifier
  - Calculates threat scores based on violation frequency
  - Provides global threat level for the entire system
  - Integrates with audit trail for security event recording
  - Performs periodic cleanup of old threat data

### 5. RateLimitingSystem

Coordinates all rate limiting components and provides middleware integration.

- **Features**:
  - Manages rate limiters for different tiers
  - Provides unified middleware for Express
  - Handles response headers for rate limit information
  - Integrates with analytics for logging and reporting
  - Provides configurable options for different endpoints

## Tier-Based Rate Limiting

The system provides different rate limit tiers for various parts of the application:

1. **Global Tier**: Base rate limit applied to all requests
   - Capacity: 300 tokens
   - Refill Rate: 100 tokens per minute

2. **Auth Tier**: Applied to authentication endpoints
   - Capacity: 20 tokens
   - Refill Rate: 10 tokens per minute

3. **Admin Tier**: Applied to admin endpoints
   - Capacity: 60 tokens
   - Refill Rate: 30 tokens per minute

4. **Security Tier**: Applied to security endpoints
   - Capacity: 30 tokens
   - Refill Rate: 15 tokens per minute

5. **API Tier**: Applied to API endpoints
   - Capacity: 120 tokens
   - Refill Rate: 60 tokens per minute

6. **Public Tier**: Applied to public resources
   - Capacity: 240 tokens
   - Refill Rate: 80 tokens per minute

## Request Cost Calculation

Request costs are calculated based on multiple factors:

1. **Base Cost**: All requests start with a base cost of 1 token
2. **Method-Based**: Write operations (POST, PUT, PATCH, DELETE) cost more than reads
3. **Content Size**: Larger payloads incur higher costs
4. **Attachments**: Requests with file attachments have additional cost
5. **Resource Sensitivity**: More sensitive resources have higher costs
6. **Threat Context**: Higher threat or risk levels increase the cost

## Special Case Handling

The system includes special handling for certain scenarios:

1. **Admin Users**: Lower costs for administrative users
2. **Whitelisted IPs**: Monitoring and internal services have reduced limits
3. **Good Bots**: Search engines and monitoring tools have adjusted limits
4. **Bad Bots**: Known bad actors face stricter limits

## API Endpoints

The following REST API endpoints are provided for monitoring and managing the rate limiting system:

### Status Endpoints

- **GET /api/security/rate-limit/status**
  - Returns status and statistics for the rate limiting system
  - Requires admin privileges

- **GET /api/security/rate-limit/threats**
  - Returns threat detection status and statistics
  - Requires admin privileges

- **GET /api/security/rate-limit/adaptive**
  - Returns adaptive rate limiting metrics
  - Requires admin privileges

### Management Endpoints

- **POST /api/security/rate-limit/adaptive/recalculate**
  - Forces recalculation of adaptive factors
  - Requires admin privileges

- **POST /api/security/rate-limit/threats/clear**
  - Clears old threat data
  - Requires admin privileges

- **POST /api/security/rate-limit/config/:tier**
  - Updates rate limit configuration for a specific tier
  - Required parameters: `capacity`, `refillRate`, `refillInterval`
  - Requires admin privileges

- **POST /api/security/rate-limit/blacklist**
  - Blacklists an IP address
  - Required parameter: `ip`
  - Requires admin privileges

- **DELETE /api/security/rate-limit/blacklist/:ip**
  - Removes an IP address from the blacklist
  - Requires admin privileges

- **POST /api/security/rate-limit/reset/:tier/:identifier**
  - Resets a specific rate limiter bucket
  - Requires admin privileges

## Implementation Notes

### Response Headers

When rate limiting is enabled, the following headers are added to responses:

- `X-RateLimit-Limit`: The maximum number of tokens allowed
- `X-RateLimit-Remaining`: The number of tokens remaining
- `X-RateLimit-Reset`: The time (in seconds) when the rate limit will reset
- `Retry-After`: The time (in seconds) to wait before retrying (only when limited)

### Error Responses

When a request is rate limited, the system returns a 429 status code with the following response body:

```json
{
  "success": false,
  "error": "rate_limited",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 30
}
```

### Integration with Audit Trail

The rate limiting system integrates with the application's audit trail to record significant events:

- Rate limit violations above a threshold
- Blacklist additions and removals
- Configuration changes

## Performance Considerations

- The system uses in-memory storage for rate limit buckets
- Periodic cleanup removes unused buckets to prevent memory leaks
- Context building is optimized to minimize impact on response times
- Adaptive adjustments occur on a scheduled basis to reduce overhead

## Security Considerations

- The system "fails open" in error cases to prevent accidental denial of service
- Special attention is given to avoiding CPU-intensive operations in the request path
- Care is taken to prevent resource exhaustion attacks