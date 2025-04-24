/**
 * Central Type Definitions Index
 * 
 * This file exports all type definitions from the various type categories,
 * providing a single entry point for importing types.
 */

// Core Types
export * from './core/error-types';
export * from './core/security-types';
export * from './core/common-types';

// API Types
export * from './api/express-types';

// Database Types
export * from './database/db-types';

// Component Types
export * from './components/component-types';

/**
 * @file index.d.ts
 * @description Central export for all TypeScript type definitions
 * 
 * This file provides a unified entry point for importing all type definitions
 * defined in the application. Instead of importing from individual files,
 * consumers can import from this central location.
 * 
 * Example:
 * ```typescript
 * import { BaseError, SecurityEvent, User } from '@server/types';
 * ```
 * 
 * This approach ensures consistency and makes it easier to manage type dependencies.
 */