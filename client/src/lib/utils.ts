/**
 * utils.ts
 * 
 * A collection of utility functions used throughout the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string,
 * handling Tailwind CSS conflicts using twMerge.
 * 
 * @param inputs - Class values to combine
 * @returns Combined className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a string representation.
 * 
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions to customize the format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Truncates a string to a maximum length, adding an ellipsis if needed.
 * 
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the string
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Creates a debounced version of a function.
 * 
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, delay);
  };
}