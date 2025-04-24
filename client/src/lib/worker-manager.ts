/**
 * Worker Manager
 * 
 * Provides utilities for working with Web Workers to offload CPU-intensive tasks
 * from the main thread, improving application responsiveness.
 */

import { v4 as uuidv4 } from 'uuid';

// Worker types
export type ComputationTask = 
  | { type: 'COMPLEX_CALCULATION'; data: number[]; operation: 'sum' | 'average' | 'max' | 'min' | 'median' }
  | { type: 'MATRIX_OPERATION'; matrices: number[][][]; operation: 'multiply' | 'transpose' | 'inverse' }
  | { type: 'DATA_PROCESSING'; rawData: any[]; transformations: string[] }
  | { type: 'IMAGE_PROCESSING'; imageData: ImageData; filters: string[] }
  | { type: 'AUDIO_PROCESSING'; audioData: Float32Array; sampleRate: number; operation: string };

export type WorkerResponse = {
  taskId?: string;
  type: string;
  result: any;
  error?: string;
  processingTime?: number;
};

// Task queue type
type QueuedTask = {
  taskId: string;
  task: ComputationTask;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
};

/**
 * Worker Manager Class
 * 
 * Manages the lifecycle of web workers and provides a Promise-based API
 * for interacting with them, including task management and error handling.
 */
class WorkerManager {
  private workers: Worker[] = [];
  private taskQueue: QueuedTask[] = [];
  private activeWorkerTasks: Map<Worker, string> = new Map();
  private taskCallbacks: Map<string, { resolve: Function; reject: Function }> = new Map();
  private initialized = false;
  private readonly maxWorkers: number;
  private readonly maxTaskQueueSize: number;
  private readonly workerTimeout: number;

  /**
   * Creates a new WorkerManager instance
   * @param maxWorkers Maximum number of workers to spawn (default: CPU cores)
   * @param maxTaskQueueSize Maximum number of tasks to queue (default: 100)
   * @param workerTimeout Timeout in ms for worker tasks (default: 30000)
   */
  constructor(
    maxWorkers: number = navigator.hardwareConcurrency || 4,
    maxTaskQueueSize: number = 100,
    workerTimeout: number = 30000
  ) {
    this.maxWorkers = maxWorkers;
    this.maxTaskQueueSize = maxTaskQueueSize;
    this.workerTimeout = workerTimeout;
  }

  /**
   * Initializes the worker pool
   * @returns Promise that resolves when all workers are initialized
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check if Web Workers are available
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers are not supported in this browser');
    }

    try {
      // Create workers up to the maximum
      for (let i = 0; i < this.maxWorkers; i++) {
        await this.createWorker();
      }

      this.initialized = true;
      console.log(`Worker Manager initialized with ${this.workers.length} workers`);

      // Start processing the task queue
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize Worker Manager:', error);
      throw error;
    }
  }

  /**
   * Creates a new web worker and sets up message handling
   */
  private async createWorker(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create worker
        const worker = new Worker(new URL('../workers/computation.worker.ts', import.meta.url), {
          type: 'module'
        });

        // Set up message handling
        worker.addEventListener('message', (event) => {
          this.handleWorkerMessage(worker, event);
        });

        // Set up error handling
        worker.addEventListener('error', (event) => {
          this.handleWorkerError(worker, event);
        });

        // Wait for worker to initialize
        const initTimeout = setTimeout(() => {
          reject(new Error('Worker initialization timed out'));
        }, 5000);

        // Listen for the worker's ready message
        const readyHandler = (event: MessageEvent<WorkerResponse>) => {
          if (event.data?.type === 'WORKER_READY') {
            clearTimeout(initTimeout);
            worker.removeEventListener('message', readyHandler);
            this.workers.push(worker);
            resolve();
          }
        };

        worker.addEventListener('message', readyHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handles messages from workers
   * @param worker Worker instance that sent the message
   * @param event Message event from the worker
   */
  private handleWorkerMessage(worker: Worker, event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    const taskId = response.taskId;

    if (!taskId) {
      console.warn('Received worker message without taskId:', response);
      return;
    }

    // Get callbacks for this task
    const callbacks = this.taskCallbacks.get(taskId);
    if (!callbacks) {
      console.warn(`No callbacks found for task ${taskId}`);
      return;
    }

    // Mark worker as available
    this.activeWorkerTasks.delete(worker);

    // Remove task from callback map
    this.taskCallbacks.delete(taskId);

    // Handle response
    if (response.error) {
      callbacks.reject(new Error(response.error));
    } else {
      callbacks.resolve(response.result);
    }

    // Process next task in queue
    this.processQueue();
  }

  /**
   * Handles errors from workers
   * @param worker Worker instance that had an error
   * @param event Error event from the worker
   */
  private handleWorkerError(worker: Worker, event: ErrorEvent): void {
    const taskId = this.activeWorkerTasks.get(worker);
    console.error(`Worker error: ${event.message}`, event);

    // If there was an active task, reject it
    if (taskId) {
      const callbacks = this.taskCallbacks.get(taskId);
      if (callbacks) {
        callbacks.reject(new Error(`Worker error: ${event.message}`));
        this.taskCallbacks.delete(taskId);
      }

      // Mark worker as available
      this.activeWorkerTasks.delete(worker);
    }

    // Terminate and replace the worker
    this.replaceWorker(worker);

    // Process next task in queue
    this.processQueue();
  }

  /**
   * Terminates and replaces a worker
   * @param worker Worker to replace
   */
  private async replaceWorker(worker: Worker): Promise<void> {
    // Remove from workers array
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Terminate the worker
    worker.terminate();

    // Create a new worker to replace it
    try {
      await this.createWorker();
    } catch (error) {
      console.error('Failed to replace worker:', error);
    }
  }

  /**
   * Processes the next task in the queue if there's an available worker
   */
  private processQueue(): void {
    // If no tasks or no available workers, return
    if (this.taskQueue.length === 0 || this.getAvailableWorker() === null) {
      return;
    }

    // Get next task
    const nextTask = this.taskQueue.shift();
    if (!nextTask) return;

    // Get available worker
    const worker = this.getAvailableWorker();
    if (!worker) return;

    // Mark worker as busy with this task
    this.activeWorkerTasks.set(worker, nextTask.taskId);

    // Set up timeout for the task
    const timeoutId = setTimeout(() => {
      const callbacks = this.taskCallbacks.get(nextTask.taskId);
      if (callbacks) {
        callbacks.reject(new Error(`Task ${nextTask.taskId} timed out after ${this.workerTimeout}ms`));
        this.taskCallbacks.delete(nextTask.taskId);
      }

      // Replace the worker since it might be stuck
      this.replaceWorker(worker);
    }, this.workerTimeout);

    // Update the callbacks to clear the timeout
    const originalResolve = nextTask.resolve;
    const originalReject = nextTask.reject;
    this.taskCallbacks.set(nextTask.taskId, {
      resolve: (value: any) => {
        clearTimeout(timeoutId);
        originalResolve(value);
      },
      reject: (reason: any) => {
        clearTimeout(timeoutId);
        originalReject(reason);
      }
    });

    // Send the task to the worker
    worker.postMessage({
      ...nextTask.task,
      taskId: nextTask.taskId
    });
  }

  /**
   * Gets an available worker from the pool
   * @returns Available worker or null if none available
   */
  private getAvailableWorker(): Worker | null {
    for (const worker of this.workers) {
      if (!this.activeWorkerTasks.has(worker)) {
        return worker;
      }
    }
    return null;
  }

  /**
   * Executes a task using a web worker
   * @param task Task to execute
   * @returns Promise that resolves with the task result
   */
  public async executeTask<T = any>(task: ComputationTask): Promise<T> {
    // Ensure the manager is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate taskId
    const taskId = uuidv4();

    // Create Promise for task
    return new Promise<T>((resolve, reject) => {
      // Check if queue is full
      if (this.taskQueue.length >= this.maxTaskQueueSize) {
        reject(new Error(`Task queue is full (max size: ${this.maxTaskQueueSize})`));
        return;
      }

      // Add task to queue
      this.taskQueue.push({
        taskId,
        task,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Terminates all workers and cleans up resources
   */
  public terminate(): void {
    // Reject all pending tasks
    for (const [taskId, callbacks] of this.taskCallbacks.entries()) {
      callbacks.reject(new Error('Worker Manager is shutting down'));
    }
    this.taskCallbacks.clear();

    // Reject all queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker Manager is shutting down'));
    }
    this.taskQueue = [];

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.activeWorkerTasks.clear();
    this.initialized = false;
  }

  /**
   * Gets statistics about the worker manager
   * @returns Worker manager statistics
   */
  public getStats() {
    return {
      initialized: this.initialized,
      workerCount: this.workers.length,
      activeWorkers: this.activeWorkerTasks.size,
      availableWorkers: this.workers.length - this.activeWorkerTasks.size,
      queuedTasks: this.taskQueue.length,
      maxWorkers: this.maxWorkers,
      maxTaskQueueSize: this.maxTaskQueueSize
    };
  }
}

// Create singleton instance
const workerManager = new WorkerManager();

// Export singleton
export default workerManager;

// Export helper functions for specific task types

/**
 * Performs complex calculations using a web worker
 * @param data Array of numbers to process
 * @param operation Operation to perform
 * @returns Promise with calculation result
 */
export async function performComplexCalculation(
  data: number[], 
  operation: 'sum' | 'average' | 'max' | 'min' | 'median'
): Promise<number> {
  return workerManager.executeTask<number>({
    type: 'COMPLEX_CALCULATION',
    data,
    operation
  });
}

/**
 * Performs matrix operations using a web worker
 * @param matrices Array of matrices to operate on
 * @param operation Matrix operation type
 * @returns Promise with resulting matrix
 */
export async function performMatrixOperation(
  matrices: number[][][],
  operation: 'multiply' | 'transpose' | 'inverse'
): Promise<number[][]> {
  return workerManager.executeTask<number[][]>({
    type: 'MATRIX_OPERATION',
    matrices,
    operation
  });
}

/**
 * Processes data with transformations using a web worker
 * @param rawData Raw data to process
 * @param transformations Array of transformations to apply
 * @returns Promise with processed data
 */
export async function processData<T = any>(
  rawData: any[],
  transformations: string[]
): Promise<T[]> {
  return workerManager.executeTask<T[]>({
    type: 'DATA_PROCESSING',
    rawData,
    transformations
  });
}

/**
 * Processes image data with filters using a web worker
 * @param imageData Raw image data to process
 * @param filters Array of filters to apply
 * @returns Promise with processed image data
 */
export async function processImage(
  imageData: ImageData,
  filters: string[]
): Promise<ImageData> {
  return workerManager.executeTask<ImageData>({
    type: 'IMAGE_PROCESSING',
    imageData,
    filters
  });
}

/**
 * Processes audio data using a web worker
 * @param audioData Audio sample data
 * @param sampleRate Sample rate of the audio
 * @param operation Audio processing operation
 * @returns Promise with processed audio data
 */
export async function processAudio(
  audioData: Float32Array,
  sampleRate: number,
  operation: string
): Promise<Float32Array> {
  return workerManager.executeTask<Float32Array>({
    type: 'AUDIO_PROCESSING',
    audioData,
    sampleRate,
    operation
  });
}