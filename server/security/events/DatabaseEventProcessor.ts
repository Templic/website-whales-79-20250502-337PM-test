/**
 * Database Event Processor
 * 
 * This module implements an event processor that stores security events
 * in the database using batched operations for better performance.
 */

import { sql } from 'drizzle-orm';
import chalk from 'chalk';

import {
  EventProcessor,
  SecurityEvent,
  EventPriority
} from './BatchedEventProcessor';
import { db } from '../../db';
import { securityEvents } from '../../../shared/schema';
import { performance } from 'perf_hooks';

/**
 * DatabaseEventProcessor processes batches of security events
 * and stores them in the database.
 */
export class DatabaseEventProcessor implements EventProcessor {
  private initialized: boolean = false;
  
  /**
   * Create a new DatabaseEventProcessor
   */
  constructor() {
    this.initialize().catch(err => {
      console.error(chalk.red('[DatabaseEventProcessor] Error initializing:'), err);
    });
  }
  
  /**
   * Initialize the processor
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      console.log(chalk.blue('[DatabaseEventProcessor] Initializing...'));
      
      // Verify database connection
      await db.execute(sql`SELECT 1`);
      
      this.initialized = true;
      console.log(chalk.green('[DatabaseEventProcessor] Initialized successfully'));
    } catch (error) {
      console.error(chalk.red('[DatabaseEventProcessor] Initialization failed:'), error);
      throw error;
    }
  }
  
  /**
   * Process a batch of security events
   * 
   * @param events The events to process
   * @returns The results of processing
   */
  async process(events: SecurityEvent[]): Promise<{
    processed: SecurityEvent[];
    failed: SecurityEvent[];
  }> {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Don't process empty batches
    if (events.length === 0) {
      return { processed: [], failed: [] };
    }
    
    console.log(chalk.blue(`[DatabaseEventProcessor] Processing batch of ${events.length} events`));
    
    const processed: SecurityEvent[] = [];
    const failed: SecurityEvent[] = [];
    const startTime = performance.now();
    
    try {
      // Prepare the events for database insertion
      const eventsToInsert = events.map(event => ({
        eventType: event.type,
        severity: event.priority,
        timestamp: event.timestamp || new Date(),
        userId: event.details.userId || null,
        ipAddress: event.source,
        userAgent: event.details.userAgent || null,
        details: event.details
      }));
      
      // Insert the events in a single batch operation
      const result = await db.insert(securityEvents).values(eventsToInsert).returning();
      
      // Map the inserted events back to the original events
      for (let i = 0; i < events.length; i++) {
        // If we have matching results, consider it processed
        if (i < result.length) {
          const processedEvent = {
            ...events[i],
            id: result[i].id,
            processed: true
          };
          processed.push(processedEvent);
        } else {
          // If missing from results, consider it failed
          failed.push(events[i]);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(chalk.green(
        `[DatabaseEventProcessor] Successfully processed ${processed.length}/${events.length} ` +
        `events in ${duration.toFixed(2)}ms (${(duration / events.length).toFixed(2)}ms per event)`
      ));
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(chalk.red('[DatabaseEventProcessor] Error processing events:'), error);
      
      // If batch insert fails, try to insert events individually to identify problematic ones
      if (events.length > 1) {
        console.log(chalk.yellow('[DatabaseEventProcessor] Retrying events individually...'));
        
        for (const event of events) {
          try {
            // Prepare the event for database insertion
            const eventToInsert = {
              eventType: event.type,
              severity: event.priority,
              timestamp: event.timestamp || new Date(),
              userId: event.details.userId || null,
              ipAddress: event.source,
              userAgent: event.details.userAgent || null,
              details: event.details
            };
            
            // Insert the event
            const result = await db.insert(securityEvents).values(eventToInsert).returning();
            
            // If the insert succeeded, add to processed list
            if (result.length > 0) {
              const processedEvent = {
                ...event,
                id: result[0].id,
                processed: true
              };
              processed.push(processedEvent);
            } else {
              failed.push(event);
            }
          } catch (individualError) {
            console.error(chalk.red(
              `[DatabaseEventProcessor] Error processing individual event (${event.type}):`, 
              individualError
            ));
            failed.push(event);
          }
        }
        
        const retryEndTime = performance.now();
        const retryDuration = retryEndTime - endTime;
        
        console.log(chalk.yellow(
          `[DatabaseEventProcessor] Individual retry completed. ` +
          `Processed: ${processed.length}, Failed: ${failed.length}, ` +
          `Duration: ${retryDuration.toFixed(2)}ms`
        ));
      } else {
        // If it's just a single event, mark it as failed
        failed.push(...events);
      }
    }
    
    return { processed, failed };
  }
}

// Create singleton instance
export const databaseEventProcessor = new DatabaseEventProcessor();

// Export default for convenience
export default databaseEventProcessor;