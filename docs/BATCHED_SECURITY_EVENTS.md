# Batched Security Event Processing

## Overview

The Batched Security Event Processing system provides an efficient way to handle security events by processing them in batches instead of individually. This approach significantly reduces database operations and improves overall system performance, particularly during high-traffic periods or security incidents.

Key benefits include:

1. **Reduced Database Load**: By batching events, the system makes fewer database calls, reducing connection overhead and improving database performance.
2. **Prioritized Processing**: Events are processed according to their priority, with critical security events processed immediately while lower-priority events are batched.
3. **Improved Throughput**: The system can handle a much higher volume of security events without degrading performance.
4. **Deduplication**: Similar events within a configurable time window are automatically deduplicated to prevent event storms.
5. **Backpressure Management**: The system can gracefully handle surges in event volume without crashing or running out of memory.
6. **Resilience**: Failed event processing is automatically retried with configurable backoff.

## Architecture

The batched security event processing system consists of the following key components:

### 1. BatchedEventProcessor (`BatchedEventProcessor.ts`)

This core component manages event queues, batching, and processing:
- Maintains separate queues for different event priorities
- Processes events in batches based on size and time thresholds
- Handles deduplication, retries, and backpressure
- Provides detailed statistics and monitoring

### 2. DatabaseEventProcessor (`DatabaseEventProcessor.ts`)

This component handles the actual processing of event batches:
- Takes batches of events and stores them in the database
- Handles transactional batch operations
- Provides fallback individual processing for errors
- Optimizes database operations for performance

### 3. SecurityEventService (`SecurityEventService.ts`)

This higher-level service provides a friendly API for logging security events:
- Manages event priorities and defaults
- Handles contextual information gathering
- Provides Express integration for request-based events
- Offers easy-to-use methods for different event types

### 4. SecurityEventsMiddleware (`securityEventsMiddleware.ts`)

Express middleware for automatic security event logging:
- Logs API, admin, and general requests based on configuration
- Captures error responses automatically
- Provides context-aware event logging
- Handles proper cleanup on application shutdown

## Usage

### Basic Event Logging

```typescript
import { securityEventService, SecurityEventType, SecurityEventSource } from './security/events/SecurityEventService';
import { EventPriority } from './security/events/BatchedEventProcessor';

// Log a simple event
securityEventService.logEvent(
  SecurityEventType.AUTH_LOGIN_SUCCESS,
  SecurityEventSource.WEB,
  {
    userId: 'user123',
    ipAddress: '192.168.1.1',
    userAgent: 'Example Browser/1.0'
  }
);

// Log a critical security event
securityEventService.logEvent(
  SecurityEventType.THREAT_SQL_INJECTION,
  SecurityEventSource.API,
  {
    userId: 'user456',
    ipAddress: '192.168.1.2',
    queryAttempt: "SELECT * FROM users WHERE username = 'admin' --",
    targetEndpoint: '/api/users'
  },
  {
    priority: EventPriority.CRITICAL
  }
);
```

### Logging from Express Requests

```typescript
import { securityEventService, SecurityEventType } from './security/events/SecurityEventService';

// In your Express route handler
app.post('/api/login', (req, res) => {
  try {
    // Authentication logic...
    
    // Log successful login
    securityEventService.logFromRequest(
      SecurityEventType.AUTH_LOGIN_SUCCESS,
      req,
      {
        userId: user.id,
        additionalInfo: 'Login from new device'
      }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    // Log authentication failure
    securityEventService.logFromRequest(
      SecurityEventType.AUTH_LOGIN_FAILURE,
      req,
      {
        username: req.body.username,
        reason: error.message
      }
    );
    
    res.status(401).json({ success: false, error: error.message });
  }
});
```

### Using the Express Middleware

```typescript
import express from 'express';
import { createSecurityEventsMiddleware } from './security/middleware/securityEventsMiddleware';
import { EventPriority } from './security/events/BatchedEventProcessor';

const app = express();

// Add security events middleware
app.use(createSecurityEventsMiddleware({
  logAllRequests: false,
  logApiRequests: true,
  logAdminRequests: true,
  logErrors: true,
  requestPriority: EventPriority.INFO,
  apiRequestPriority: EventPriority.LOW,
  adminRequestPriority: EventPriority.MEDIUM,
  errorPriority: EventPriority.HIGH,
  excludePaths: ['/health', '/metrics', '/static'],
  loggingOptions: {
    includeHeaders: false
  }
}));

// Rest of your Express setup...
```

### Manual Flushing and Stats

```typescript
import { securityEventService } from './security/events/SecurityEventService';

// Flush all pending events
async function shutdownApplication() {
  console.log('Application shutting down, flushing security events...');
  
  try {
    const result = await securityEventService.flush();
    console.log(`Flushed ${result.processed} events, failed: ${result.failed}`);
  } catch (error) {
    console.error('Error flushing security events:', error);
  }
  
  // Continue shutdown...
}

// Get statistics
function getSecurityStats() {
  const stats = securityEventService.getStats();
  
  console.log('Security Event Stats:');
  console.log(`- Total received: ${stats.totalReceived}`);
  console.log(`- Total processed: ${stats.totalProcessed}`);
  console.log(`- Total deduplicated: ${stats.totalDeduplicated}`);
  console.log(`- Total failed: ${stats.totalFailed}`);
  console.log(`- Average processing time: ${stats.averageProcessingTime.toFixed(2)}ms`);
  
  return stats;
}
```

## Configuration Options

### BatchedEventProcessor Options

```typescript
const processorOptions: BatchProcessingOptions = {
  // Maximum batch size for each priority level
  maxBatchSize: {
    [EventPriority.CRITICAL]: 1,  // Process critical events immediately
    [EventPriority.HIGH]: 5,
    [EventPriority.MEDIUM]: 20,
    [EventPriority.LOW]: 50,
    [EventPriority.INFO]: 100
  },
  
  // Maximum time (ms) to wait before processing a batch
  maxWaitTime: {
    [EventPriority.CRITICAL]: 0,  // Process critical events immediately
    [EventPriority.HIGH]: 1000,   // 1 second
    [EventPriority.MEDIUM]: 5000, // 5 seconds
    [EventPriority.LOW]: 10000,   // 10 seconds
    [EventPriority.INFO]: 30000   // 30 seconds
  },
  
  // Enable auto-flush based on time
  enableAutoFlush: true,
  
  // Enable prioritized processing
  enablePrioritization: true,
  
  // Process high priority events immediately
  processHighPriorityImmediately: true,
  
  // Enable event deduplication
  enableDeduplication: true,
  
  // Deduplicate events within this time window (ms)
  deduplicationWindow: 60000, // 1 minute
  
  // Maximum retry attempts for failed events
  maxRetryAttempts: 3,
  
  // Delay between retry attempts (ms)
  retryDelay: 5000, // 5 seconds
  
  // Enable backpressure management
  enableBackpressure: true,
  
  // Maximum queue size for backpressure
  maxQueueSize: 10000
};
```

### SecurityEventService Options

```typescript
const serviceOptions: SecurityEventServiceConfig = {
  // Whether to enable event logging
  enabled: true,
  
  // Event batch processing options
  batchProcessing: {
    // See BatchProcessingOptions above
  },
  
  // Default priority for each event type
  defaultPriorities: {
    [SecurityEventType.AUTH_LOGIN_SUCCESS]: EventPriority.INFO,
    [SecurityEventType.AUTH_LOGIN_FAILURE]: EventPriority.MEDIUM,
    [SecurityEventType.THREAT_SQL_INJECTION]: EventPriority.CRITICAL,
    // ...more event types
  },
  
  // Default logging options
  defaultLoggingOptions: {
    includeHeaders: false
  }
};
```

### Middleware Options

```typescript
const middlewareOptions: SecurityEventsMiddlewareOptions = {
  // Whether to log all requests
  logAllRequests: false,
  
  // Whether to log API requests
  logApiRequests: true,
  
  // Whether to log admin requests
  logAdminRequests: true,
  
  // Whether to log errors
  logErrors: true,
  
  // What priority to assign to regular requests
  requestPriority: EventPriority.INFO,
  
  // What priority to assign to API requests
  apiRequestPriority: EventPriority.INFO,
  
  // What priority to assign to admin requests
  adminRequestPriority: EventPriority.MEDIUM,
  
  // What priority to assign to errors
  errorPriority: EventPriority.HIGH,
  
  // Paths to exclude from logging
  excludePaths: [
    '/health',
    '/favicon.ico',
    '/static'
  ],
  
  // Event logging options
  loggingOptions: {
    includeHeaders: false
  }
};
```

## Performance Considerations

### Batch Size Tuning

The batch size significantly affects processing performance:

- **Too Small**: Inefficient database operations, higher overhead
- **Too Large**: Longer processing times, potentially higher memory usage
- **Recommendation**: Start with the default batch sizes and adjust based on your observed event volumes and database performance.

### Priority Tuning

Properly configuring event priorities is crucial:

- **Critical Events**: Keep the batch size small (1-5) for immediate processing
- **Info Events**: Use larger batch sizes (50+) for efficiency
- **Wait Times**: Adjust max wait times based on your acceptable latency for security event visibility

### Database Optimization

The system works best with properly optimized database tables:

- Ensure appropriate indexes on the `security_events` table
- Consider partitioning for larger-scale deployments
- Use database monitoring to identify query performance issues

## Monitoring and Troubleshooting

### Event Statistics

The system provides detailed statistics through the `getStats()` method:

```typescript
const stats = securityEventService.getStats();
```

Key metrics to monitor:

- `totalReceived` vs `totalProcessed`: Large discrepancies indicate processing backlogs
- `totalFailed`: High failure rates require investigation
- `averageProcessingTime`: Sudden increases may indicate database or system problems
- `currentQueueSize`: Large queue sizes may indicate processing bottlenecks

### Event Subscription

The `BatchedEventProcessor` extends `EventEmitter`, allowing you to subscribe to internal events:

```typescript
const processor = securityEventService.getProcessor();

processor.on('batch:processed', (result) => {
  console.log(`Processed batch: ${result.processed}/${result.batchSize} events in ${result.processingTime}ms`);
});

processor.on('batch:error', (error) => {
  console.error('Batch processing error:', error);
});

processor.on('event:deduplicated', (event) => {
  console.log(`Deduplicated event: ${event.type}`);
});
```

## Best Practices

1. **Set Appropriate Priorities**: Not all security events are created equal. Ensure you have appropriate priorities for different event types.
2. **Manage Backpressure**: Enable backpressure management to prevent memory issues during event storms.
3. **Configure Timeouts**: Set appropriate processing timeouts to avoid stuck processing.
4. **Graceful Shutdown**: Always flush events on application shutdown to prevent data loss.
5. **Log Processing Errors**: Monitor and alert on processing errors to identify potential issues.
6. **Database Maintenance**: Regularly maintain your security events table (archiving, partitioning, etc.) to prevent performance degradation.
7. **Regular Cleanup**: Implement a regular cleanup policy for old security events to maintain database performance.

## Extension Points

### Custom Event Processors

You can create custom event processors for special handling needs:

```typescript
class CustomEventProcessor implements EventProcessor {
  async process(events: SecurityEvent[]): Promise<{
    processed: SecurityEvent[];
    failed: SecurityEvent[];
  }> {
    // Custom processing logic...
    return { processed, failed };
  }
}

// Use with the BatchedEventProcessor
const processor = new BatchedEventProcessor(new CustomEventProcessor(), options);
```

### Custom Event Sources

You can define custom event sources for your application:

```typescript
enum CustomEventSource {
  PAYMENT_GATEWAY = 'payment_gateway',
  EXTERNAL_API = 'external_api',
  SCHEDULED_TASK = 'scheduled_task'
}

// Use with the SecurityEventService
securityEventService.logEvent(
  SecurityEventType.API_ERROR,
  CustomEventSource.PAYMENT_GATEWAY,
  { details... }
);
```

## Common Troubleshooting

### High Failure Rates

If you're experiencing high event processing failure rates:

1. Check database connectivity and performance
2. Examine the specific errors in the application logs
3. Verify that the table schema matches expected column definitions
4. Check for database permission issues

### Queue Buildup

If events are building up in queues:

1. Reduce batch wait times to process more frequently
2. Increase batch sizes to process more events at once
3. Check for database performance issues
4. Consider scaling your database if necessary
5. Monitor processor resource usage (CPU/memory)

### Event Loss

If events are being lost:

1. Ensure flush is called during application shutdown
2. Check backpressure settings and adjust if necessary
3. Verify retry settings are appropriate
4. Monitor event dropped metrics for backpressure rejections
5. Consider implementing a dead letter queue for persistently failing events