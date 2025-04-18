/**
 * Batch Processing Utility
 * 
 * Provides utilities for batch processing data operations
 * to optimize database operations and API calls.
 */

import { logger } from './logger';

/**
 * BatchQueue class for processing operations in batches
 * to optimize database and API performance
 */
export class BatchQueue<T, R> {
  private queue: T[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;
  
  /**
   * Create a new BatchQueue
   * 
   * @param processor Function to process a batch of items
   * @param options Configuration options
   */
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private options: {
      /**
       * Maximum batch size
       */
      maxBatchSize?: number;
      
      /**
       * Maximum delay before processing
       */
      maxDelayMs?: number;
      
      /**
       * Whether to enable automatic processing based on size and delay
       */
      autoProcess?: boolean;
      
      /**
       * Error handling strategy
       */
      errorHandling?: 'fail-batch' | 'continue' | 'retry';
      
      /**
       * Maximum retry attempts (if errorHandling is 'retry')
       */
      maxRetries?: number;
    } = {}
  ) {
    this.options = {
      maxBatchSize: 100,
      maxDelayMs: 200,
      autoProcess: true,
      errorHandling: 'continue',
      maxRetries: 3,
      ...options,
    };
  }
  
  /**
   * Add an item to the batch queue
   * 
   * @param item Item to add
   * @returns Promise that resolves when the item is processed
   */
  public add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const wrappedItem = {
        data: item,
        resolve,
        reject,
        retries: 0,
      };
      
      this.queue.push(wrappedItem as any);
      
      // Start processing automatically if configured
      if (this.options.autoProcess) {
        if (this.queue.length >= this.options.maxBatchSize) {
          // Process immediately if we've reached max batch size
          this.process();
        } else if (!this.timer) {
          // Set a timer to process the batch after maxDelayMs
          this.timer = setTimeout(() => this.process(), this.options.maxDelayMs);
        }
      }
    });
  }
  
  /**
   * Add multiple items to the batch queue
   * 
   * @param items Items to add
   * @returns Promise that resolves when all items are processed
   */
  public addMany(items: T[]): Promise<R[]> {
    return Promise.all(items.map(item => this.add(item)));
  }
  
  /**
   * Process the current batch of items
   */
  public async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    // Clear any pending timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    this.processing = true;
    
    // Get the current batch
    const batch = this.queue.splice(0, this.options.maxBatchSize);
    const items = batch.map(item => (item as any).data);
    
    try {
      // Process the batch
      const results = await this.processor(items);
      
      // Resolve promises for each item
      batch.forEach((item, index) => {
        (item as any).resolve(results[index]);
      });
    } catch (error) {
      logger.error(`Batch processing error: ${error.message}`);
      
      switch (this.options.errorHandling) {
        case 'fail-batch':
          // Reject all items in the batch
          batch.forEach(item => {
            (item as any).reject(error);
          });
          break;
        
        case 'retry':
          // Put failed items back in the queue with incremented retry count
          batch.forEach(item => {
            const wrappedItem = item as any;
            wrappedItem.retries += 1;
            
            if (wrappedItem.retries <= this.options.maxRetries) {
              // Add back to queue with higher priority (at the beginning)
              this.queue.unshift(wrappedItem);
            } else {
              // Max retries reached, reject the item
              wrappedItem.reject(
                new Error(`Failed after ${this.options.maxRetries} retries: ${error.message}`)
              );
            }
          });
          break;
        
        case 'continue':
        default:
          // Reject each item individually
          batch.forEach(item => {
            (item as any).reject(error);
          });
          break;
      }
    } finally {
      this.processing = false;
      
      // Process next batch if there are more items
      if (this.queue.length > 0) {
        setImmediate(() => this.process());
      }
    }
  }
  
  /**
   * Get the current queue length
   */
  public get length(): number {
    return this.queue.length;
  }
  
  /**
   * Check if the queue is empty
   */
  public get isEmpty(): boolean {
    return this.queue.length === 0;
  }
  
  /**
   * Clear the queue and cancel any pending operations
   */
  public clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const error = new Error('Batch operation cancelled');
    this.queue.forEach(item => {
      (item as any).reject(error);
    });
    
    this.queue = [];
  }
}

/**
 * BatchProcessor factory for creating optimized data processors
 */
export const BatchProcessor = {
  /**
   * Create a database operation batch processor
   * 
   * @param operation Database operation function
   * @param options Configuration options
   */
  forDatabase<T, R>(
    operation: (items: T[]) => Promise<R[]>,
    options: {
      maxBatchSize?: number;
      maxDelayMs?: number;
      errorHandling?: 'fail-batch' | 'continue' | 'retry';
    } = {}
  ): BatchQueue<T, R> {
    return new BatchQueue<T, R>(operation, {
      maxBatchSize: options.maxBatchSize || 50,
      maxDelayMs: options.maxDelayMs || 100,
      autoProcess: true,
      errorHandling: options.errorHandling || 'continue',
    });
  },
  
  /**
   * Create an API operation batch processor
   * 
   * @param operation API operation function
   * @param options Configuration options
   */
  forApi<T, R>(
    operation: (items: T[]) => Promise<R[]>,
    options: {
      maxBatchSize?: number;
      maxDelayMs?: number;
      errorHandling?: 'fail-batch' | 'continue' | 'retry';
    } = {}
  ): BatchQueue<T, R> {
    return new BatchQueue<T, R>(operation, {
      maxBatchSize: options.maxBatchSize || 25,
      maxDelayMs: options.maxDelayMs || 150,
      autoProcess: true,
      errorHandling: options.errorHandling || 'retry',
      maxRetries: 3,
    });
  },
};

/**
 * Chunk an array into smaller arrays of specified size
 * 
 * @param array Array to chunk
 * @param size Chunk size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size)
  );
}

/**
 * Process a large dataset in chunks to avoid memory issues
 * 
 * @param items Array of items to process
 * @param processor Function to process a chunk of items
 * @param chunkSize Size of each chunk
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  chunkSize: number = 100
): Promise<R[]> {
  const chunks = chunkArray(items, chunkSize);
  const results: R[] = [];
  
  for (const chunk of chunks) {
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }
  
  return results;
}