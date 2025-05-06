/**
 * Utility functions for the application
 */

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and properly handles Tailwind's utility classes
 * using tailwind-merge to prevent conflicts.
 * 
 * @param inputs - Class values to merge
 * @returns Merged classes string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a readable format
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a currency value according to the specified locale and currency
 * 
 * @param value - The value to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param currency - The currency code to use (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number, 
  locale: string = 'en-US', 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Truncates a string to a specified length and adds an ellipsis
 * 
 * @param text - The string to truncate
 * @param length - The maximum length of the string
 * @returns Truncated string
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generates a unique ID using current timestamp and random values
 * 
 * @returns A unique ID string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Delays execution for a specified time
 * 
 * @param ms - The time to delay in milliseconds
 * @returns A promise that resolves after the specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts a hex color to rgba
 * 
 * @param hex - The hex color to convert
 * @param alpha - The alpha value (0-1)
 * @returns The rgba color string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return the rgba color
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Gets the contrast color (black or white) for a given background color
 * 
 * @param hexColor - The hex color to get contrast for
 * @returns Either black or white, depending on which provides better contrast
 */
export function getContrastColor(hexColor: string): string {
  // Remove the hash if it exists
  const hex = hexColor.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate the brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black or white based on brightness
  return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * Debounces a function call
 * 
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Copies text to clipboard
 * 
 * @param text - The text to copy
 * @returns A promise that resolves when text is copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    return await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy text:', error);
    throw error;
  }
}