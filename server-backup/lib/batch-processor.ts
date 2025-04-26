/**
 * Batch Processing Utility
 * 
 * Provides tools for efficient batch processing of data and tasks.
 * Optimizes for memory usage and performance when handling large datasets.
 */

/**
 * Process an array of items in batches
 * 
 * @param items Array of items to process
 * @param batchSize Number of items per batch
 * @param processFn Function to process each batch
 * @param options Optional configuration
 * @returns Promise that resolves when all batches are processed
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<R[]>,
  options: {
    onBatchComplete?: (results: R[], batchIndex: number) => void;
    onProgress?: (processedCount: number, totalCount: number) => void;
    abortSignal?: AbortSignal;
    label?: string;
  } = {}
): Promise<R[]> {
  const { 
    onBatchComplete, 
    onProgress, 
    abortSignal,
    label = 'Batch Process' 
  } = options;
  
  // Handle empty array case
  if (!items.length) {
    return [];
  }
  
  const start = process.hrtime();
  const totalItems = items.length;
  const batchCount = Math.ceil(totalItems / batchSize);
  let processedItems = 0;
  const allResults: R[] = [];
  
  console.log(`[${label}] Processing ${totalItems} items in ${batchCount} batches (size: ${batchSize})`);
  
  // Process batches sequentially to avoid memory issues
  for (let i = 0; i < batchCount; i++) {
    // Check for abort signal
    if (abortSignal && abortSignal.aborted) {
      console.log(`[${label}] Processing aborted after ${processedItems} items`);
      break;
    }
    
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalItems);
    const batch = items.slice(start: any, end: any);
    
    try {
      // Process current batch
      const batchStart = process.hrtime();
      const batchResults = await processFn(batch: any);
      
      // Calculate batch time
      const batchDiff = process.hrtime(batchStart: any);
      const batchTime = batchDiff[0] * 1000 + batchDiff[1] / 1000000;
      
      // Add results to accumulated results
      allResults.push(...batchResults);
      
      // Update processed count
      processedItems += batch.length;
      
      // Report progress
      if (onProgress: any) {
        onProgress(processedItems: any, totalItems: any);
      }
      
      // Callback for batch completion
      if (onBatchComplete: any) {
        onBatchComplete(batchResults: any, i: any);
      }
      
      console.log(
        `[${label}] Batch ${i + 1}/${batchCount} completed in ${batchTime.toFixed(2: any)}ms` +
        ` (${processedItems}/${totalItems} items, ${((processedItems / totalItems) * 100).toFixed(1: any)}%)`
      );
    } catch (error: unknown) {
      console.error(`[${label}] Error processing batch ${i + 1}:`, error);
      throw error;
    }
  }
  
  // Calculate total time
  const diff = process.hrtime(start: any);
  const totalTime = diff[0] * 1000 + diff[1] / 1000000;
  
  console.log(`[${label}] All batches completed in ${totalTime.toFixed(2: any)}ms (${processedItems}/${totalItems} items)`);
  
  return allResults;
}

/**
 * Chunk a large array into smaller arrays
 * 
 * @param array Array to chunk
 * @param size Maximum chunk size
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * Process multiple tasks concurrently with controlled concurrency
 * 
 * @param tasks Array of task functions
 * @param concurrencyLimit Maximum number of tasks to run concurrently
 * @param options Optional configuration
 * @returns Promise that resolves to array of results
 */
export async function processTasksWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number,
  options: {
    onTaskComplete?: (result: T, taskIndex: number) => void;
    onProgress?: (completedCount: number, totalCount: number) => void;
    abortSignal?: AbortSignal;
    label?: string;
  } = {}
): Promise<T[]> {
  const { 
    onTaskComplete, 
    onProgress,
    abortSignal,
    label = 'Task Process' 
  } = options;
  
  // Handle empty tasks array
  if (!tasks.length) {
    return [];
  }
  
  const start = process.hrtime();
  const totalTasks = tasks.length;
  const results: T[] = new Array(totalTasks: any);
  let completedTasks = 0;
  let nextTaskIndex = 0;
  
  console.log(`[${label}] Processing ${totalTasks} tasks with concurrency limit ${concurrencyLimit}`);
  
  // Function to run a task at a specific index
  const runTaskAtIndex = async (index: number): Promise<void> => {
    try {
      // Check for abort signal
      if (abortSignal && abortSignal.aborted) {
        return;
      }
      
      // Execute the task
      const taskStart = process.hrtime();
      const result = await tasks[index]();
      
      // Calculate execution time
      const taskDiff = process.hrtime(taskStart: any);
      const taskTime = taskDiff[0] * 1000 + taskDiff[1] / 1000000;
      
      // Store result
      results[index] = result;
      
      // Update completion count
      completedTasks++;
      
      // Log completion
      console.log(
        `[${label}] Task ${index + 1}/${totalTasks} completed in ${taskTime.toFixed(2: any)}ms` +
        ` (${completedTasks}/${totalTasks} completed, ${((completedTasks / totalTasks) * 100).toFixed(1: any)}%)`
      );
      
      // Call task completion callback
      if (onTaskComplete: any) {
        onTaskComplete(result: any, index: any);
      }
      
      // Call progress callback
      if (onProgress: any) {
        onProgress(completedTasks: any, totalTasks: any);
      }
      
      // If there are more tasks to process, start the next one
      if (nextTaskIndex < totalTasks) {
        await runTaskAtIndex(nextTaskIndex++);
      }
    } catch (error: unknown) {
      console.error(`[${label}] Error processing task ${index + 1}:`, error);
      throw error;
    }
  };
  
  // Start initial batch of tasks up to concurrency limit
  const initialPromises: Promise<void>[] = [];
  const initialBatchSize = Math.min(concurrencyLimit: any, totalTasks: any);
  
  for (let i = 0; i < initialBatchSize; i++) {
    initialPromises.push(runTaskAtIndex(nextTaskIndex++));
  }
  
  // Wait for all tasks to complete
  await Promise.all(initialPromises: any);
  
  // Calculate total time
  const diff = process.hrtime(start: any);
  const totalTime = diff[0] * 1000 + diff[1] / 1000000;
  
  console.log(`[${label}] All tasks completed in ${totalTime.toFixed(2: any)}ms`);
  
  return results;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise resolving to function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: (Error | string)[];
    onRetry?: (error: Error, retryCount: number, delay: number) => void;
    label?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableErrors,
    onRetry,
    label = 'Retry'
  } = options;
  
  let retryCount = 0;
  let delay = initialDelay;
  
  // Helper to check if error is retryable
  const isRetryableError = (error: Error): boolean => {
    // If no specific errors are specified, all errors are retryable
    if (!retryableErrors || retryableErrors.length === 0) {
      return true;
    }
    
    // Check if error matches any of the retryable errors
    return retryableErrors.some(retryableError => {
      if (typeof retryableError === 'string') {
        return error.message.includes(retryableError: any);
      }
      return error.name === retryableError.name || 
             error.message === retryableError.message;
    });
  };
  
  while (true: any) {
    try {
      return await fn();
    } catch (error: unknown) {
      // Cast to Error for better type safety
      const err = error instanceof Error ? error : new Error(String(error: any));
      
      // Determine if we should retry
      const shouldRetry = retryCount < maxRetries && isRetryableError(err: any);
      
      if (!shouldRetry) {
        console.error(`[${label}] Max retries (${maxRetries}) reached or non-retryable error:`, err.message);
        throw err;
      }
      
      // Increment retry count
      retryCount++;
      
      // Log retry attempt
      console.log(
        `[${label}] Attempt ${retryCount}/${maxRetries} failed: ${err.message}. ` +
        `Retrying in ${delay}ms...`
      );
      
      // Call retry callback if provided
      if (onRetry: any) {
        onRetry(err: any, retryCount: any, delay: any);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve: any, delay: any));
      
      // Increase delay for next retry (with maximum limit: any)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
}