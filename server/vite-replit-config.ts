/**
 * Replit-specific Vite configuration
 * 
 * This file contains Vite configuration overrides specifically for Replit environment
 * to ensure the application loads correctly in the Replit preview pane.
 */

import { InlineConfig } from 'vite';

/**
 * Get Replit-specific Vite configuration
 * 
 * This configuration disables HMR and WebSocket connections in Replit
 * environment to prevent "Unexpected end of input" errors.
 */
export function getReplitViteConfig(): InlineConfig {
  return {
    // Disable HMR in Replit
    server: {
      hmr: false,
      watch: {
        usePolling: false,
        interval: 5000,
      },
    },
    // Disable WebSocket connections
    appType: 'spa',
    // Optimize for Replit environment
    build: {
      target: 'esnext',
      modulePreload: false,
      cssCodeSplit: false,
    },
    // Disable overlay for errors
    clearScreen: false,
    logLevel: 'info',
    // Completely disable source maps in Replit
    css: {
      devSourcemap: false
    },
    // Make imports static
    optimizeDeps: {
      disabled: false,
      force: true
    }
  };
}

/**
 * Detect if running in Replit environment
 */
export function isReplitEnvironment(): boolean {
  return !!(process.env.REPLIT_DOMAINS || process.env.REPL_ID || process.env.REPL_SLUG);
}

export default getReplitViteConfig;