/**
 * Batched Security Events Example
 * 
 * This example demonstrates how to use the batched security event processing system.
 * It shows both direct use of the BatchedEventProcessor and the higher-level
 * SecurityEventService.
 * 
 * NOTE: This is an example file for demonstration purposes only.
 */

import express, { Request, Response } from 'express';
import chalk from 'chalk';

import { 
  securityEventService, 
  SecurityEventType, 
  SecurityEventSource 
} from '../events/SecurityEventService';
import { createSecurityEventsMiddleware } from '../middleware/securityEventsMiddleware';
import { 
  BatchedEventProcessor, 
  EventPriority, 
  SecurityEvent 
} from '../events/BatchedEventProcessor';
import { DatabaseEventProcessor } from '../events/DatabaseEventProcessor';
import { EventEmitter } from 'events';

/**
 * Example of using the security event service
 */
async function securityEventServiceExample() {
  console.log(chalk.blue('\n[Example] Using SecurityEventService:'));
  
  // Log an authentication event
  securityEventService.logEvent(
    SecurityEventType.AUTH_LOGIN_SUCCESS,
    SecurityEventSource.WEB,
    {
      userId: 'user123',
      ipAddress: '192.168.1.1',
      userAgent: 'Example Browser/1.0'
    }
  );
  
  // Log a threat event with high priority
  securityEventService.logEvent(
    SecurityEventType.THREAT_SQL_INJECTION,
    SecurityEventSource.API,
    {
      userId: 'user456',
      ipAddress: '192.168.1.2',
      userAgent: 'Suspicious Client/1.0',
      queryAttempt: "SELECT * FROM users WHERE username = 'admin' --",
      targetEndpoint: '/api/users'
    },
    {
      priority: EventPriority.CRITICAL
    }
  );
  
  // Log a system event
  securityEventService.logEvent(
    SecurityEventType.SYSTEM_CONFIG_CHANGE,
    SecurityEventSource.ADMIN_PANEL,
    {
      userId: 'admin',
      ipAddress: '192.168.1.3',
      changes: {
        'security.rateLimit.enabled': true,
        'security.rateLimit.maxRequests': 100
      }
    }
  );
  
  // Log 100 sample events for batch processing demonstration
  console.log(chalk.blue('[Example] Generating 100 sample events...'));
  
  for (let i = 0; i < 100; i++) {
    securityEventService.logEvent(
      SecurityEventType.API_REQUEST,
      SecurityEventSource.API,
      {
        userId: `user${i % 10}`,
        ipAddress: `192.168.1.${i % 255}`,
        endpoint: `/api/resource/${i % 20}`,
        method: i % 2 === 0 ? 'GET' : 'POST'
      },
      {
        priority: EventPriority.INFO
      }
    );
  }
  
  // Get stats before flush
  const statsBefore = securityEventService.getStats();
  console.log(chalk.blue('[Example] Stats before flush:'), {
    received: statsBefore.totalReceived,
    processed: statsBefore.totalProcessed,
    currentQueueSize: statsBefore.currentQueueSize
  });
  
  // Force flush all events
  console.log(chalk.blue('[Example] Flushing all events...'));
  const flushResult = await securityEventService.flush();
  
  console.log(chalk.green('[Example] Flush complete:'), {
    processed: flushResult.processed,
    failed: flushResult.failed
  });
  
  // Get stats after flush
  const statsAfter = securityEventService.getStats();
  console.log(chalk.blue('[Example] Stats after flush:'), {
    received: statsAfter.totalReceived,
    processed: statsAfter.totalProcessed,
    currentQueueSize: statsAfter.currentQueueSize
  });
  
  return {
    statsBefore,
    statsAfter,
    flushResult
  };
}

/**
 * Example of directly using the BatchedEventProcessor
 */
async function batchedEventProcessorExample() {
  console.log(chalk.blue('\n[Example] Using BatchedEventProcessor directly:'));
  
  // Create a custom event processor
  class CustomEventProcessor extends EventEmitter implements EventProcessor {
    async process(events: SecurityEvent[]): Promise<{
      processed: SecurityEvent[];
      failed: SecurityEvent[];
    }> {
      console.log(chalk.blue(`[CustomEventProcessor] Processing ${events.length} events`));
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate some failures (10% chance)
      const processed: SecurityEvent[] = [];
      const failed: SecurityEvent[] = [];
      
      for (const event of events) {
        if (Math.random() < 0.9) {
          processed.push({
            ...event,
            processed: true
          });
        } else {
          failed.push(event);
        }
      }
      
      console.log(chalk.green(
        `[CustomEventProcessor] Processed ${processed.length}/${events.length} events, ` +
        `Failed: ${failed.length}`
      ));
      
      return { processed, failed };
    }
  }
  
  // Create the event processor
  const processor = new BatchedEventProcessor(
    new CustomEventProcessor(),
    {
      maxBatchSize: {
        [EventPriority.CRITICAL]: 1,
        [EventPriority.HIGH]: 5,
        [EventPriority.MEDIUM]: 10,
        [EventPriority.LOW]: 20,
        [EventPriority.INFO]: 50
      },
      maxWaitTime: {
        [EventPriority.CRITICAL]: 0,
        [EventPriority.HIGH]: 500,
        [EventPriority.MEDIUM]: 1000,
        [EventPriority.LOW]: 2000,
        [EventPriority.INFO]: 5000
      },
      enableAutoFlush: true,
      enableDeduplication: true,
      processHighPriorityImmediately: true
    }
  );
  
  // Add event listeners
  processor.on('batch:processed', (result) => {
    console.log(chalk.blue('[Example] Batch processed:'), result);
  });
  
  processor.on('event:deduplicated', (event) => {
    console.log(chalk.yellow('[Example] Event deduplicated:'), {
      type: event.type,
      priority: event.priority
    });
  });
  
  // Add some events (mix of priorities)
  for (let i = 0; i < 50; i++) {
    // Determine priority
    let priority: EventPriority;
    const rand = Math.random();
    
    if (rand < 0.05) {
      priority = EventPriority.CRITICAL;
    } else if (rand < 0.15) {
      priority = EventPriority.HIGH;
    } else if (rand < 0.35) {
      priority = EventPriority.MEDIUM;
    } else if (rand < 0.65) {
      priority = EventPriority.LOW;
    } else {
      priority = EventPriority.INFO;
    }
    
    // Create event
    const event: SecurityEvent = {
      type: `sample:event:${i % 5}`,
      priority,
      source: `source:${i % 3}`,
      timestamp: new Date(),
      details: {
        index: i,
        timestamp: Date.now(),
        value: Math.random() * 100
      }
    };
    
    // Add with small delay between events
    setTimeout(() => {
      processor.addEvent(event);
    }, i * 10);
  }
  
  // Add duplicate events for deduplication demo
  setTimeout(() => {
    for (let i = 0; i < 10; i++) {
      const event: SecurityEvent = {
        type: 'sample:event:0',
        priority: EventPriority.MEDIUM,
        source: 'source:0',
        timestamp: new Date(),
        details: {
          index: 0,
          timestamp: Date.now(),
          value: 42
        }
      };
      
      processor.addEvent(event);
    }
  }, 500);
  
  // Wait for processing to complete
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Get stats
  const stats = processor.getStats();
  
  console.log(chalk.green('[Example] Processing complete with stats:'), {
    totalReceived: stats.totalReceived,
    totalProcessed: stats.totalProcessed,
    totalDeduplicated: stats.totalDeduplicated,
    totalFailed: stats.totalFailed,
    averageProcessingTime: stats.averageProcessingTime
  });
  
  // Dispose the processor
  processor.dispose();
  
  return stats;
}

/**
 * Example of using the security events middleware with Express
 */
function securityEventsMiddlewareExample() {
  console.log(chalk.blue('\n[Example] Using SecurityEventsMiddleware with Express:'));
  
  const app = express();
  
  // Add security events middleware
  app.use(createSecurityEventsMiddleware({
    logAllRequests: true,
    logErrors: true,
    logApiRequests: true,
    logAdminRequests: true,
    requestPriority: EventPriority.INFO,
    apiRequestPriority: EventPriority.LOW,
    adminRequestPriority: EventPriority.MEDIUM,
    errorPriority: EventPriority.HIGH,
    loggingOptions: {
      includeHeaders: true
    }
  }));
  
  // Add some example routes
  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the sample API' });
  });
  
  app.get('/api/users', (req: Request, res: Response) => {
    res.json({ users: [{ id: 1, name: 'Sample User' }] });
  });
  
  app.get('/admin/dashboard', (req: Request, res: Response) => {
    res.json({ message: 'Admin dashboard' });
  });
  
  app.get('/api/error', (req: Request, res: Response) => {
    res.status(500).json({ error: 'Sample error', message: 'This is a sample error' });
  });
  
  app.get('/api/unauthorized', (req: Request, res: Response) => {
    res.status(401).json({ error: 'Unauthorized', message: 'You are not authorized to access this resource' });
  });
  
  // Start the server
  const port = 3001;
  const server = app.listen(port, () => {
    console.log(chalk.green(`[Example] Sample server listening on port ${port}`));
    
    // Make sample requests
    setTimeout(async () => {
      try {
        console.log(chalk.blue('[Example] Making sample requests...'));
        
        // Using Node's http module for simplicity
        const http = require('http');
        
        const makeRequest = (path: string) => {
          return new Promise<void>((resolve) => {
            http.get(`http://localhost:${port}${path}`, (res: any) => {
              res.on('data', () => {});
              res.on('end', () => {
                console.log(chalk.blue(`[Example] Made request to ${path}, status: ${res.statusCode}`));
                resolve();
              });
            }).on('error', (err: Error) => {
              console.error(chalk.red(`[Example] Error making request to ${path}:`), err);
              resolve();
            });
          });
        };
        
        // Make sample requests
        await makeRequest('/');
        await makeRequest('/api/users');
        await makeRequest('/admin/dashboard');
        await makeRequest('/api/error');
        await makeRequest('/api/unauthorized');
        
        // Wait for events to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Flush events
        await securityEventService.flush();
        
        // Get stats
        const stats = securityEventService.getStats();
        console.log(chalk.green('[Example] SecurityEventService stats:'), {
          totalReceived: stats.totalReceived,
          totalProcessed: stats.totalProcessed,
          totalDeduplicated: stats.totalDeduplicated,
          totalFailed: stats.totalFailed
        });
        
        // Close the server
        server.close(() => {
          console.log(chalk.green('[Example] Sample server closed'));
        });
      } catch (error) {
        console.error(chalk.red('[Example] Error in middleware example:'), error);
      }
    }, 1000);
  });
}

/**
 * Run all examples
 */
export async function runBatchedEventsExamples() {
  try {
    console.log(chalk.blue('Running Batched Events Examples...'));
    
    // Example 1: SecurityEventService
    await securityEventServiceExample();
    
    // Example 2: BatchedEventProcessor
    await batchedEventProcessorExample();
    
    // Example 3: SecurityEventsMiddleware
    securityEventsMiddlewareExample();
    
    // Note: Example 3 continues asynchronously
  } catch (error) {
    console.error(chalk.red('Error running batched events examples:'), error);
  }
}

/**
 * Run the examples if this module is executed directly
 */
if (require.main === module) {
  runBatchedEventsExamples().catch(err => {
    console.error(chalk.red('Fatal error running examples:'), err);
  });
}