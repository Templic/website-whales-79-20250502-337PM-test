// Environment configuration for client-side code
// This centralizes all environment variable access to avoid issues with process.env

// Determine if we're in production mode
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

// Get Replit-specific variables
export const REPL_ID = import.meta.env.REPL_ID;
export const REPL_SLUG = import.meta.env.REPL_SLUG;

// Analytics ID
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// API URL - fallback to current domain if not specified
export const API_URL = import.meta.env.VITE_API_URL || '';

// Other environment variables can be added here