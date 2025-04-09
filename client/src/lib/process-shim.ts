// This file provides a shim for the 'process' global variable for client-side code
// This helps with libraries that expect process.env to be available

// Import our centralized environment variables
import { IS_PRODUCTION, REPL_ID, REPL_SLUG } from './env';

// Create a minimal process object with common environment variables
interface ProcessShim {
  env: Record<string, string | undefined>;
}

// Define our shim
const processShim: ProcessShim = {
  env: {
    NODE_ENV: IS_PRODUCTION ? 'production' : 'development',
    REPL_ID,
    REPL_SLUG,
  }
};

// Export the shim
export default processShim;

// Try to polyfill the global process object if it doesn't exist
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = processShim;
}