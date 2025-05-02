/**
 * Batched Event Processor
 * 
 * This module implements batch processing for security events to reduce
 * database operations and improve performance.
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

/**
 * Security event priority levels
 */
export enum EventPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Base security event interface
 */
export interface SecurityEvent {
  id?: number;
  type: string;
  timestamp?: Date;
  priority: EventPriority;
  source: string;
  details: Record<string, any>;
  processed?: boolean;
}

/**
 * Event processing options
 */
export interface BatchProcessingOptions {
  // Maximum batch size for each priority level
  maxBatchSize: Record<EventPriority, number>;
  
  // Maximum time (in ms) to wait before processing a batch
  maxWaitTime: Record<EventPriority, number>;
  
  // Enable auto-flush based on time
  enableAutoFlush: boolean;
  
  // Enable prioritized processing
  enablePrioritization: boolean;
  
  // Process high priority events immediately
  processHighPriorityImmediately: boolean;
  
  // Enable event deduplication
  enableDeduplication: boolean;
  
  // Deduplicate events within this time window (ms)
  deduplicationWindow: number;
  
  // Maximum retry attempts for failed events
  maxRetryAttempts: number;
  
  // Delay between retry attempts (ms)
  retryDelay: number;
  
  // Enable backpressure management
  enableBackpressure: boolean;
  
  // Maximum queue size for backpressure
  maxQueueSize: number;
}

/**
 * Default batch processing options
 */
const defaultOptions: BatchProcessingOptions = {
  maxBatchSize: {
    [EventPriority.CRITICAL]: 1, // Process critical events immediately
    [EventPriority.HIGH]: 5,
    [EventPriority.MEDIUM]: 20,
    [EventPriority.LOW]: 50,
    [EventPriority.INFO]: 100
  },
  maxWaitTime: {
    [EventPriority.CRITICAL]: 0, // Process critical events immediately
    [EventPriority.HIGH]: 1000, // 1 second
    [EventPriority.MEDIUM]: 5000, // 5 seconds
    [EventPriority.LOW]: 10000, // 10 seconds
    [EventPriority.INFO]: 30000 // 30 seconds
  },
  enableAutoFlush: true,
  enablePrioritization: true,
  processHighPriorityImmediately: true,
  enableDeduplication: true,
  deduplicationWindow: 60000, // 1 minute
  maxRetryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  enableBackpressure: true,
  maxQueueSize: 10000
};

/**
 * Event processing statistics
 */
export interface EventProcessingStats {
  totalReceived: number;
  totalProcessed: number;
  totalFailed: number;
  totalRetried: number;
  totalDropped: number;
  totalDeduplicated: number;
  eventsByPriority: Record<EventPriority, number>;
  eventsByType: Record<string, number>;
  averageProcessingTime: number;
  batchesByPriority: Record<EventPriority, number>;
  currentQueueSize: number;
  processingTimes: number[];
  lastProcessed: Date | null;
}

/**
 * Interface for event processors
 */
export interface EventProcessor {
  process(events: SecurityEvent[]): Promise<{
    processed: SecurityEvent[];
    failed: SecurityEvent[];
  }>;
}

/**
 * BatchedEventProcessor implements efficient batch processing of security events
 */
export class BatchedEventProcessor extends EventEmitter {
  // Configuration
  private options: BatchProcessingOptions;
  
  // Event processor (handles actual event processing)
  private processor: EventProcessor;
  
  // Event queues by priority
  private queues: Record<EventPriority, SecurityEvent[]> = {
    [EventPriority.CRITICAL]: [],
    [EventPriority.HIGH]: [],
    [EventPriority.LOW]: [],
    [EventPriority.MEDIUM]: [],
    [EventPriority.INFO]: []
  };
  
  // Timers for auto-flush
  private flushTimers: Record<EventPriority, NodeJS.Timeout | null> = {
    [EventPriority.CRITICAL]: null,
    [EventPriority.HIGH]: null,
    [EventPriority.MEDIUM]: null,
    [EventPriority.LOW]: null,
    [EventPriority.INFO]: null
  };
  
  // Track recent events for deduplication
  private recentEvents: Map<string, { event: SecurityEvent; timestamp: number }> = new Map();
  
  // Track failed events for retry
  private failedEvents: Map<string, { event: SecurityEvent; attempts: number; nextRetry: number }> = new Map();
  
  // Flag for manual flush in progress
  private flushInProgress: boolean = false;
  
  // Event processing statistics
  private stats: EventProcessingStats = {
    totalReceived: 0,
    totalProcessed: 0,
    totalFailed: 0,
    totalRetried: 0,
    totalDropped: 0,
    totalDeduplicated: 0,
    eventsByPriority: {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.MEDIUM]: 0,
      [EventPriority.LOW]: 0,
      [EventPriority.INFO]: 0
    },
    eventsByType: {},
    averageProcessingTime: 0,
    batchesByPriority: {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 0,
      [EventPriority.MEDIUM]: 0,
      [EventPriority.LOW]: 0,
      [EventPriority.INFO]: 0
    },
    currentQueueSize: 0,
    processingTimes: [],
    lastProcessed: null
  };
  
  // Flag for background processing
  private isProcessing: boolean = false;
  
  // Retry timer
  private retryTimer: NodeJS.Timeout | null = null;
  
  /**
   * Create a new BatchedEventProcessor
   * 
   * @param processor The event processor that will handle the actual event processing
   * @param options Processing options
   */
  constructor(processor: EventProcessor, options: Partial<BatchProcessingOptions> = {}) {
    super();
    
    this.processor = processor;
    this.options = { ...defaultOptions, ...options };
    
    // Initialize statistics
    this.resetStats();
    
    // Start retry processing if enabled
    this.scheduleRetryProcessing();
    
    console.log(chalk.blue('[BatchedEventProcessor] Initialized with configuration:'), {
      maxBatchSizes: this.options.maxBatchSize,
      autoFlush: this.options.enableAutoFlush,
      deduplication: this.options.enableDeduplication
    });
  }
  
  /**
   * Add a security event to the processing queue
   * 
   * @param event The security event to add
   * @returns True if the event was added, false if rejected due to backpressure
   */
  addEvent(event: SecurityEvent): boolean {
    // Update statistics
    this.stats.totalReceived++;
    this.stats.eventsByPriority[event.priority]++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
    
    // Check for backpressure
    if (this.options.enableBackpressure) {
      const totalQueueSize = Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);
      if (totalQueueSize >= this.options.maxQueueSize) {
        // Only allow critical events when under backpressure
        if (event.priority !== EventPriority.CRITICAL) {
          console.warn(chalk.yellow(`[BatchedEventProcessor] Dropping event due to backpressure: ${event.type}`));
          this.stats.totalDropped++;
          this.emit('event:dropped', event, 'backpressure');
          return false;
        }
      }
    }
    
    // Set timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date();
    }
    
    // Check for deduplication if enabled
    if (this.options.enableDeduplication) {
      const eventKey = this.getEventKey(event);
      const existingEvent = this.recentEvents.get(eventKey);
      
      if (existingEvent) {
        const now = Date.now();
        const timeSinceLastEvent = now - existingEvent.timestamp;
        
        if (timeSinceLastEvent < this.options.deduplicationWindow) {
          // This is a duplicate event within the deduplication window
          this.stats.totalDeduplicated++;
          this.emit('event:deduplicated', event, existingEvent.event);
          return true; // Still return true since the event was "handled"
        }
      }
      
      // Add to recent events for future deduplication
      this.recentEvents.set(eventKey, {
        event,
        timestamp: Date.now()
      });
      
      // Clean up old events from the deduplication cache
      this.cleanupRecentEvents();
    }
    
    // Add to appropriate queue
    this.queues[event.priority].push(event);
    this.stats.currentQueueSize = this.getTotalQueueSize();
    
    // Emit event added event
    this.emit('event:added', event);
    
    // Check if we should process immediately
    if (
      (this.options.processHighPriorityImmediately && 
       (event.priority === EventPriority.CRITICAL || event.priority === EventPriority.HIGH)) ||
      this.queues[event.priority].length >= this.options.maxBatchSize[event.priority]
    ) {
      this.processQueue(event.priority);
    } else if (this.options.enableAutoFlush && !this.flushTimers[event.priority]) {
      // Start timer for auto-flush if not already running
      this.startFlushTimer(event.priority);
    }
    
    return true;
  }
  
  /**
   * Add multiple security events to the processing queue
   * 
   * @param events The security events to add
   * @returns The number of events successfully added
   */
  addEvents(events: SecurityEvent[]): number {
    let addedCount = 0;
    
    for (const event of events) {
      if (this.addEvent(event)) {
        addedCount++;
      }
    }
    
    return addedCount;
  }
  
  /**
   * Flush all queued events immediately
   * 
   * @returns A promise that resolves when all events have been processed
   */
  async flushAll(): Promise<{
    processed: number;
    failed: number;
  }> {
    if (this.flushInProgress) {
      console.warn(chalk.yellow('[BatchedEventProcessor] Flush already in progress, skipping'));
      return { processed: 0, failed: 0 };
    }
    
    this.flushInProgress = true;
    console.log(chalk.blue('[BatchedEventProcessor] Flushing all queued events'));
    
    // Cancel all timers
    for (const priority of Object.values(EventPriority)) {
      this.cancelFlushTimer(priority);
    }
    
    // Process all queues in priority order
    let totalProcessed = 0;
    let totalFailed = 0;
    
    try {
      for (const priority of [
        EventPriority.CRITICAL,
        EventPriority.HIGH,
        EventPriority.MEDIUM,
        EventPriority.LOW,
        EventPriority.INFO
      ]) {
        const result = await this.processQueue(priority);
        totalProcessed += result.processed;
        totalFailed += result.failed;
      }
      
      console.log(chalk.green(
        `[BatchedEventProcessor] Flush complete. Processed: ${totalProcessed}, Failed: ${totalFailed}`
      ));
      
      this.emit('flush:complete', { processed: totalProcessed, failed: totalFailed });
    } catch (error) {
      console.error(chalk.red('[BatchedEventProcessor] Error during flush:'), error);
      this.emit('flush:error', error);
    } finally {
      this.flushInProgress = false;
    }
    
    return {
      processed: totalProcessed,
      failed: totalFailed
    };
  }
  
  /**
   * Get current statistics about event processing
   * 
   * @returns Event processing statistics
   */
  getStats(): EventProcessingStats {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalReceived: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      totalDropped: 0,
      totalDeduplicated: 0,
      eventsByPriority: {
        [EventPriority.CRITICAL]: 0,
        [EventPriority.HIGH]: 0,
        [EventPriority.MEDIUM]: 0,
        [EventPriority.LOW]: 0,
        [EventPriority.INFO]: 0
      },
      eventsByType: {},
      averageProcessingTime: 0,
      batchesByPriority: {
        [EventPriority.CRITICAL]: 0,
        [EventPriority.HIGH]: 0,
        [EventPriority.MEDIUM]: 0,
        [EventPriority.LOW]: 0,
        [EventPriority.INFO]: 0
      },
      currentQueueSize: this.getTotalQueueSize(),
      processingTimes: [],
      lastProcessed: null
    };
  }
  
  /**
   * Start the flush timer for a specific priority level
   * 
   * @param priority The event priority
   * @private
   */
  private startFlushTimer(priority: EventPriority): void {
    // Cancel existing timer if any
    this.cancelFlushTimer(priority);
    
    // Only start timer if there are events in the queue
    if (this.queues[priority].length === 0) {
      return;
    }
    
    const waitTime = this.options.maxWaitTime[priority];
    
    // Don't set a timer for immediate processing
    if (waitTime <= 0) {
      this.processQueue(priority);
      return;
    }
    
    this.flushTimers[priority] = setTimeout(() => {
      this.processQueue(priority);
    }, waitTime);
  }
  
  /**
   * Cancel the flush timer for a specific priority level
   * 
   * @param priority The event priority
   * @private
   */
  private cancelFlushTimer(priority: EventPriority): void {
    if (this.flushTimers[priority]) {
      clearTimeout(this.flushTimers[priority]!);
      this.flushTimers[priority] = null;
    }
  }
  
  /**
   * Process events in a specific priority queue
   * 
   * @param priority The event priority to process
   * @returns A promise that resolves when the queue has been processed
   * @private
   */
  private async processQueue(priority: EventPriority): Promise<{
    processed: number;
    failed: number;
  }> {
    // Cancel the flush timer if running
    this.cancelFlushTimer(priority);
    
    // Don't process empty queues
    if (this.queues[priority].length === 0) {
      return { processed: 0, failed: 0 };
    }
    
    // Take a batch from the queue
    const batchSize = Math.min(
      this.queues[priority].length,
      this.options.maxBatchSize[priority]
    );
    
    const batch = this.queues[priority].splice(0, batchSize);
    
    // Update queue size stat
    this.stats.currentQueueSize = this.getTotalQueueSize();
    
    // Skip if empty batch
    if (batch.length === 0) {
      return { processed: 0, failed: 0 };
    }
    
    // Update batch count
    this.stats.batchesByPriority[priority]++;
    
    // Log processing
    console.log(chalk.blue(
      `[BatchedEventProcessor] Processing ${batch.length} events with priority ${priority}`
    ));
    
    // Process the batch
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    
    try {
      // Process the batch with the event processor
      const result = await this.processor.process(batch);
      const processedEvents = result.processed || [];
      const failedEvents = result.failed || [];
      
      processedCount = processedEvents.length;
      failedCount = failedEvents.length;
      
      // Update statistics
      this.stats.totalProcessed += processedCount;
      this.stats.totalFailed += failedCount;
      this.stats.lastProcessed = new Date();
      
      // Add failed events to retry queue
      for (const event of failedEvents) {
        const eventKey = this.getEventKey(event);
        const existingFailure = this.failedEvents.get(eventKey);
        
        if (existingFailure) {
          // Increment retry count
          existingFailure.attempts++;
          existingFailure.nextRetry = Date.now() + this.options.retryDelay;
          this.failedEvents.set(eventKey, existingFailure);
        } else {
          // Add to failed events queue
          this.failedEvents.set(eventKey, {
            event,
            attempts: 1,
            nextRetry: Date.now() + this.options.retryDelay
          });
        }
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      this.stats.processingTimes.push(processingTime);
      
      // Keep only the last 100 processing times
      if (this.stats.processingTimes.length > 100) {
        this.stats.processingTimes.shift();
      }
      
      // Recalculate average processing time
      this.stats.averageProcessingTime = this.stats.processingTimes.reduce(
        (sum, time) => sum + time, 0
      ) / this.stats.processingTimes.length;
      
      // Emit batch processed event
      this.emit('batch:processed', {
        priority,
        batchSize: batch.length,
        processed: processedCount,
        failed: failedCount,
        processingTime
      });
      
      console.log(chalk.green(
        `[BatchedEventProcessor] Processed ${processedCount}/${batch.length} events ` + 
        `with priority ${priority} in ${processingTime}ms`
      ));
      
      // If there are more events in the queue, start a new timer
      if (this.queues[priority].length > 0 && this.options.enableAutoFlush) {
        this.startFlushTimer(priority);
      }
    } catch (error) {
      console.error(chalk.red(`[BatchedEventProcessor] Error processing queue (${priority}):`), error);
      
      // All events failed
      this.stats.totalFailed += batch.length;
      failedCount = batch.length;
      
      // Add all events to retry queue
      for (const event of batch) {
        const eventKey = this.getEventKey(event);
        const existingFailure = this.failedEvents.get(eventKey);
        
        if (existingFailure) {
          // Increment retry count
          existingFailure.attempts++;
          existingFailure.nextRetry = Date.now() + this.options.retryDelay;
          this.failedEvents.set(eventKey, existingFailure);
        } else {
          // Add to failed events queue
          this.failedEvents.set(eventKey, {
            event,
            attempts: 1,
            nextRetry: Date.now() + this.options.retryDelay
          });
        }
      }
      
      // Emit batch error event
      this.emit('batch:error', {
        priority,
        batchSize: batch.length,
        error
      });
    }
    
    return {
      processed: processedCount,
      failed: failedCount
    };
  }
  
  /**
   * Get a unique key for an event for deduplication
   * 
   * @param event The security event
   * @returns A string key
   * @private
   */
  private getEventKey(event: SecurityEvent): string {
    // Use a combination of event properties to create a unique key
    const { type, priority, source, details } = event;
    
    // Create a simple hash of the details object
    let detailsHash = '';
    try {
      const sortedKeys = Object.keys(details).sort();
      const sortedDetails: Record<string, any> = {};
      
      for (const key of sortedKeys) {
        sortedDetails[key] = details[key];
      }
      
      detailsHash = JSON.stringify(sortedDetails);
    } catch (error) {
      console.warn(chalk.yellow('[BatchedEventProcessor] Error creating details hash:'), error);
      detailsHash = JSON.stringify(details);
    }
    
    return `${type}:${priority}:${source}:${detailsHash}`;
  }
  
  /**
   * Clean up old events from the recent events cache
   * 
   * @private
   */
  private cleanupRecentEvents(): void {
    if (!this.options.enableDeduplication) {
      return;
    }
    
    const now = Date.now();
    const expiredTime = now - this.options.deduplicationWindow;
    
    for (const [key, { timestamp }] of this.recentEvents.entries()) {
      if (timestamp < expiredTime) {
        this.recentEvents.delete(key);
      }
    }
  }
  
  /**
   * Schedule retry processing
   * 
   * @private
   */
  private scheduleRetryProcessing(): void {
    // Clear existing timer
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
    
    // Check for retries every minute
    this.retryTimer = setInterval(() => {
      this.processRetries();
    }, 60000); // Check every minute
  }
  
  /**
   * Process failed events for retry
   * 
   * @private
   */
  private async processRetries(): Promise<void> {
    if (this.isProcessing || this.failedEvents.size === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const now = Date.now();
      const eventsToRetry: SecurityEvent[] = [];
      const keysToRemove: string[] = [];
      
      // Find events that are ready for retry
      for (const [key, { event, attempts, nextRetry }] of this.failedEvents.entries()) {
        if (nextRetry <= now) {
          if (attempts < this.options.maxRetryAttempts) {
            // Add to retry batch
            eventsToRetry.push(event);
            
            // Remove from failed events (will be re-added if retry fails)
            keysToRemove.push(key);
          } else {
            // Max retries reached, drop the event
            keysToRemove.push(key);
            this.stats.totalDropped++;
            this.emit('event:dropped', event, 'max_retries');
          }
        }
      }
      
      // Remove processed keys
      for (const key of keysToRemove) {
        this.failedEvents.delete(key);
      }
      
      // Process retries if any
      if (eventsToRetry.length > 0) {
        console.log(chalk.blue(`[BatchedEventProcessor] Retrying ${eventsToRetry.length} failed events`));
        
        // Track statistics
        this.stats.totalRetried += eventsToRetry.length;
        
        // Process retries
        const result = await this.processor.process(eventsToRetry);
        
        // Update statistics
        this.stats.totalProcessed += result.processed.length;
        this.stats.totalFailed += result.failed.length;
        
        // Add failed events back to retry queue
        for (const event of result.failed) {
          const eventKey = this.getEventKey(event);
          const existingFailure = this.failedEvents.get(eventKey);
          
          if (existingFailure) {
            existingFailure.attempts++;
            existingFailure.nextRetry = Date.now() + this.options.retryDelay;
            this.failedEvents.set(eventKey, existingFailure);
          } else {
            this.failedEvents.set(eventKey, {
              event,
              attempts: 1,
              nextRetry: Date.now() + this.options.retryDelay
            });
          }
        }
        
        // Emit retry processed event
        this.emit('retry:processed', {
          total: eventsToRetry.length,
          processed: result.processed.length,
          failed: result.failed.length
        });
      }
    } catch (error) {
      console.error(chalk.red('[BatchedEventProcessor] Error processing retries:'), error);
      this.emit('retry:error', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get the total number of events in all queues
   * 
   * @returns The total queue size
   * @private
   */
  private getTotalQueueSize(): number {
    return Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0) + 
           this.failedEvents.size;
  }
  
  /**
   * Dispose the processor
   */
  dispose(): void {
    // Cancel all timers
    for (const priority of Object.values(EventPriority)) {
      this.cancelFlushTimer(priority);
    }
    
    // Cancel retry timer
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    
    // Clear all queues
    for (const priority of Object.values(EventPriority)) {
      this.queues[priority] = [];
    }
    
    // Clear caches
    this.recentEvents.clear();
    this.failedEvents.clear();
    
    // Reset statistics
    this.resetStats();
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log(chalk.green('[BatchedEventProcessor] Disposed'));
  }
}

// Export default for convenience
export default BatchedEventProcessor;