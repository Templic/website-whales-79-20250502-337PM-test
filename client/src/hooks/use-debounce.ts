/**
 * A custom hook for debouncing values or callback functions.
 * Helpful for preventing excessive API calls or expensive operations.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Returns a debounced version of the provided value that only updates
 * after the specified delay has passed without the value changing.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced callback function that only executes
 * after the specified delay has passed without being called again.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the timeout when the component unmounts or when callback/delay changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [callback, delay]);

  return (...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

export default useDebounce;