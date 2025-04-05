/**
 * Utility functions for the application
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and then merges them using tailwind-merge
 * to ensure that conflicting utility classes are properly resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or Date object to a readable format
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Debounces a function to limit how often it can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generates a random string of specified length
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Adds custom animation class to tailwind config
 * Note: This is for documentation purposes only
 */
export const customAnimations = {
  twinkle: 'twinkle 3s ease-in-out infinite',
  fadeInUp: 'fadeInUp 0.5s ease-out',
  fadeInDown: 'fadeInDown 0.5s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  float: 'float 6s ease-in-out infinite',
  rotate: 'rotate 20s linear infinite',
};