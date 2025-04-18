/**
 * Query Optimization Context
 * 
 * Provides a context for managing optimized data fetching strategies across the app.
 * Features include:
 * - Intelligent request batching
 * - Request deduplication
 * - Prioritized fetching for visible content
 * - Stale-while-revalidate patterns
 */

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useInView } from '@/lib/performance';

// Types for the optimization context
interface QueryBatch<T> {
  id: string;
  priority: 'high' | 'medium' | 'low';
  fetch: () => Promise<T>;
  timestamp: number;
  resolve: (data: T) => void;
  reject: (error: Error) => void;
}

interface BatchManagerContextType {
  /**
   * Add a query to the batch manager
   */
  batchQuery: <T>(
    id: string,
    fetchFn: () => Promise<T>,
    options?: { priority?: 'high' | 'medium' | 'low' }
  ) => Promise<T>;
  
  /**
   * Fetch data only when an element is in view
   */
  useLazyQuery: <T>(
    fetchFn: () => Promise<T>,
    options?: { 
      rootMargin?: string;
      threshold?: number;
      fallbackValue?: T;
    }
  ) => [React.RefObject<HTMLElement>, T | undefined, boolean, Error | null];
  
  /**
   * Manually flush all queued requests
   */
  flushQueue: () => void;
  
  /**
   * Get current batch queue status
   */
  queueStatus: {
    pending: number;
    processing: boolean;
  };
}

// Create the context
const BatchManagerContext = createContext<BatchManagerContextType | null>(null);

// Hook for using the context
export const useBatchManager = () => {
  const context = useContext(BatchManagerContext);
  if (!context) {
    throw new Error('useBatchManager must be used within a BatchManagerProvider');
  }
  return context;
};

// Provider component
export const BatchManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Queue state
  const [processing, setProcessing] = useState(false);
  const [pending, setPending] = useState(0);
  
  // Query batching queue
  const queryQueue = useRef<{
    high: Array<QueryBatch<any>>;
    medium: Array<QueryBatch<any>>;
    low: Array<QueryBatch<any>>;
  }>({
    high: [],
    medium: [],
    low: []
  });
  
  // Timer for processing batches
  const processingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for batch processing
  const MAX_BATCH_SIZE = 8;
  const BATCH_DELAY = 50; // milliseconds
  
  // Process the query queue, respecting priority
  const processQueue = useCallback(() => {
    if (processing) return;
    
    // Get total number of pending requests
    const totalPending = 
      queryQueue.current.high.length + 
      queryQueue.current.medium.length + 
      queryQueue.current.low.length;
    
    // Update pending count
    setPending(totalPending);
    
    // If no requests are pending, nothing to do
    if (totalPending === 0) {
      return;
    }
    
    // Set processing flag
    setProcessing(true);
    
    // Get next batch to process, respecting priority
    const getNextBatch = () => {
      if (queryQueue.current.high.length > 0) {
        return queryQueue.current.high.splice(0, MAX_BATCH_SIZE);
      } else if (queryQueue.current.medium.length > 0) {
        return queryQueue.current.medium.splice(0, MAX_BATCH_SIZE);
      } else {
        return queryQueue.current.low.splice(0, MAX_BATCH_SIZE);
      }
    };
    
    const batch = getNextBatch();
    
    // Execute all requests in the batch in parallel
    Promise.all(
      batch.map(({ fetch, resolve, reject }) => 
        fetch().then(resolve).catch(reject)
      )
    )
    .finally(() => {
      setProcessing(false);
      
      // If more items remain, schedule the next batch
      if (
        queryQueue.current.high.length > 0 || 
        queryQueue.current.medium.length > 0 || 
        queryQueue.current.low.length > 0
      ) {
        processingTimer.current = setTimeout(() => {
          processQueue();
        }, BATCH_DELAY);
      }
    });
  }, [processing]);
  
  // Add a query to the batch queue
  const batchQuery = useCallback(<T,>(
    id: string, 
    fetchFn: () => Promise<T>,
    options: { priority?: 'high' | 'medium' | 'low' } = {}
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      // Default to medium priority
      const priority = options.priority || 'medium';
      
      // Check for duplicate requests
      const existingRequest = [
        ...queryQueue.current.high,
        ...queryQueue.current.medium,
        ...queryQueue.current.low
      ].find(item => item.id === id);
      
      if (existingRequest) {
        // Piggyback on the existing request
        const originalResolve = existingRequest.resolve;
        
        existingRequest.resolve = (data: any) => {
          originalResolve(data);
          resolve(data);
        };
        
        return;
      }
      
      // Add new request to appropriate queue
      queryQueue.current[priority].push({
        id,
        priority,
        fetch: fetchFn,
        timestamp: Date.now(),
        resolve,
        reject
      });
      
      // Update pending count
      setPending(prev => prev + 1);
      
      // If not already processing, start processing
      if (!processing && !processingTimer.current) {
        processingTimer.current = setTimeout(() => {
          processQueue();
        }, BATCH_DELAY);
      }
    });
  }, [processQueue, processing]);
  
  // Manually flush the queue
  const flushQueue = useCallback(() => {
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
      processingTimer.current = null;
    }
    
    processQueue();
  }, [processQueue]);
  
  // Custom hook for lazy loading data when an element is in view
  const useLazyQuery = useCallback(<T,>(
    fetchFn: () => Promise<T>,
    options: {
      rootMargin?: string;
      threshold?: number;
      fallbackValue?: T;
    } = {}
  ): [React.RefObject<HTMLElement>, T | undefined, boolean, Error | null] => {
    const [ref, elementInView] = useInView({
      rootMargin: options.rootMargin || '200px',
      threshold: options.threshold || 0
    });
    
    const [data, setData] = useState<T | undefined>(options.fallbackValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const fetchedRef = useRef(false);
    
    useEffect(() => {
      if (elementInView && !fetchedRef.current) {
        fetchedRef.current = true;
        setLoading(true);
        
        batchQuery<T>(
          `lazy-${fetchFn.toString()}`,
          fetchFn,
          { priority: 'low' }
        )
        .then(result => {
          setData(result);
          setLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
      }
    }, [elementInView, fetchFn]);
    
    return [ref, data, loading, error];
  }, [batchQuery]);
  
  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (processingTimer.current) {
        clearTimeout(processingTimer.current);
      }
    };
  }, []);
  
  // Provide the context value
  const contextValue: BatchManagerContextType = {
    batchQuery,
    useLazyQuery,
    flushQueue,
    queueStatus: {
      pending,
      processing
    }
  };
  
  return (
    <BatchManagerContext.Provider value={contextValue}>
      {children}
    </BatchManagerContext.Provider>
  );
};

export default BatchManagerProvider;