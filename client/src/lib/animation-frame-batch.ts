/**
 * Animation Frame Batch Processor
 * 
 * This utility helps batch multiple animation updates into a single requestAnimationFrame callback,
 * reducing layout thrashing and improving animation performance.
 * 
 * Usage:
 * ```
 * // Add animation tasks to the batch
 * const id1 = AnimationBatch.add(() => updateElement1());
 * const id2 = AnimationBatch.add(() => updateElement2());
 * 
 * // Cancel a specific task if needed
 * AnimationBatch.cancel(id1);
 * 
 * // Force immediate execution of all batched tasks
 * AnimationBatch.flush();
 * ```
 */

export interface AnimationTask {
  id: number;
  callback: () => void;
  priority: number;
}

class AnimationFrameBatch {
  private tasks: AnimationTask[] = [];
  private nextTaskId = 0;
  private frameRequested = false;
  private measureTasks: AnimationTask[] = [];
  private mutateTasks: AnimationTask[] = [];
  
  /**
   * Add a task to be executed in the next animation frame
   * @param callback Function to execute
   * @param phase 'measure' for read operations, 'mutate' for write operations
   * @param priority Higher number = higher priority
   * @returns Task ID that can be used to cancel the task
   */
  add(
    callback: () => void, 
    phase: 'measure' | 'mutate' = 'mutate',
    priority: number = 0
  ): number {
    const task: AnimationTask = {
      id: this.nextTaskId++,
      callback,
      priority
    };
    
    if (phase === 'measure') {
      this.measureTasks.push(task);
    } else {
      this.mutateTasks.push(task);
    }
    
    this.scheduleFrame();
    return task.id;
  }
  
  /**
   * Cancel a previously scheduled task
   * @param id The task ID to cancel
   * @returns true if task was found and canceled, false otherwise
   */
  cancel(id: number): boolean {
    const measureIndex = this.measureTasks.findIndex(task => task.id === id);
    if (measureIndex !== -1) {
      this.measureTasks.splice(measureIndex, 1);
      return true;
    }
    
    const mutateIndex = this.mutateTasks.findIndex(task => task.id === id);
    if (mutateIndex !== -1) {
      this.mutateTasks.splice(mutateIndex, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Force immediate execution of all batched tasks
   */
  flush(): void {
    if (this.measureTasks.length > 0 || this.mutateTasks.length > 0) {
      this.executeFrame();
    }
  }
  
  /**
   * Schedule execution of tasks in the next animation frame
   */
  private scheduleFrame(): void {
    if (!this.frameRequested) {
      this.frameRequested = true;
      requestAnimationFrame(() => this.executeFrame());
    }
  }
  
  /**
   * Execute all tasks in the current batch
   */
  private executeFrame(): void {
    try {
      // Reset frame request flag
      this.frameRequested = false;
      
      // Execute measurement tasks first (read operations)
      this.measureTasks.sort((a, b) => b.priority - a.priority);
      while (this.measureTasks.length > 0) {
        const task = this.measureTasks.shift();
        if (task) {
          try {
            task.callback();
          } catch (err: unknown) {
            console.error('Error in animation frame measure task:', err);
          }
        }
      }
      
      // Then execute mutation tasks (write operations)
      this.mutateTasks.sort((a, b) => b.priority - a.priority);
      while (this.mutateTasks.length > 0) {
        const task = this.mutateTasks.shift();
        if (task) {
          try {
            task.callback();
          } catch (err: unknown) {
            console.error('Error in animation frame mutate task:', err);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error in animation frame batch execution:', err);
    }
  }
  
  /**
   * Create a throttled function that runs at most once per animation frame
   * @param callback Function to throttle
   * @param phase Whether this is a read or write operation
   * @returns Throttled function
   */
  createAnimationThrottled(
    callback: (...args: any[]) => void, 
    phase: 'measure' | 'mutate' = 'mutate'
  ): (...args: any[]) => void {
    let taskId: number | null = null;
    let lastArgs: any[] = [];
    
    return (...args: any[]) => {
      lastArgs = args;
      
      if (taskId === null) {
        taskId = this.add(() => {
          callback(...lastArgs);
          taskId = null;
        }, phase);
      }
    };
  }
  
  /**
   * Run two functions in proper sequence across animation frames to avoid layout thrashing
   * @param measure Function that reads from the DOM
   * @param mutate Function that writes to the DOM
   * @returns Function that can be called to trigger the sequence
   */
  createReadWriteSequence(
    measure: () => any, 
    mutate: (measureResult) => void
  ): () => void {
    return () => {
      this.add(() => {
        const measureResult = measure();
        this.add(() => mutate(measureResult), 'mutate');
      }, 'measure');
    };
  }
}

// Create a singleton instance
const AnimationBatch = new AnimationFrameBatch();

export default AnimationBatch;

// Helper hooks for React components
import { useCallback, useEffect, useRef } from 'react';

/**
 * React hook that returns an animation frame throttled callback
 * @param callback Function to throttle
 * @param phase Whether this is a read or write operation
 * @returns Throttled function
 */
export function useAnimationFrameThrottled(
  callback: (...args: any[]) => void,
  phase: 'measure' | 'mutate' = 'mutate'
) {
  const callbackRef = useRef(callback);
  
  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    AnimationBatch.createAnimationThrottled(
      (...args: any[]) => callbackRef.current(...args),
      phase
    ),
    [phase]
  );
}

/**
 * React hook for read-then-write pattern to avoid layout thrashing
 * @param measure Function that reads from the DOM
 * @param mutate Function that writes to the DOM based on the measurement
 * @returns Function that can be called to trigger the sequence
 */
export function useReadWriteSequence(
  measure: () => any,
  mutate: (measureResult) => void
) {
  const measureRef = useRef(measure);
  const mutateRef = useRef(mutate);
  
  useEffect(() => {
    measureRef.current = measure;
  }, [measure]);
  
  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);
  
  return useCallback(() => {
    AnimationBatch.add(() => {
      const measureResult = measureRef.current();
      AnimationBatch.add(() => mutateRef.current(measureResult), 'mutate');
    }, 'measure');
  }, []);
}