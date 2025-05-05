/**
 * TypeScript Error Management Schema
 * 
 * This file defines the schema for tables used by the TypeScript error management system.
 */

import { pgTable, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// TypeScript error status enum
export const errorStatusEnum = pgEnum('typescript_error_status', [
  'NEW',      // Newly detected error
  'FIXING',   // Error is being fixed (AI generation in progress)
  'FIXED',    // Error has been fixed
  'IGNORED',  // Error has been marked as ignored/false positive
  'PENDING',  // Error is pending review
]);

// TypeScript error severity enum
export const errorSeverityEnum = pgEnum('typescript_error_severity', [
  'ERROR',    // Critical error that blocks compilation
  'WARNING',  // Warning that allows compilation but may cause issues
  'SUGGESTION', // Suggestion for improvement
  'INFO',     // Informational message
]);

// TypeScript error category enum
export const errorCategoryEnum = pgEnum('typescript_error_category', [
  'TYPE_MISMATCH',     // Type mismatch errors
  'MISSING_PROPERTY',  // Missing property errors
  'UNDEFINED_VARIABLE', // Undefined variable errors
  'IMPORT_ERROR',      // Import related errors
  'SYNTAX_ERROR',      // Syntax errors
  'CONFIG_ERROR',      // Configuration errors
  'LIBRARY_ERROR',     // Errors related to external libraries
  'REACT_ERROR',       // React-specific errors
  'OTHER',             // Other errors
]);

// TypeScript scan status enum
export const scanStatusEnum = pgEnum('typescript_scan_status', [
  'IN_PROGRESS', // Scan is currently running
  'COMPLETED',   // Scan completed successfully
  'FAILED',      // Scan failed
  'PENDING',     // Scan is queued but not started
]);

// Scan results table
export const typescriptScanResults = pgTable('typescript_scan_results', {
  id: text('id').primaryKey(),
  status: scanStatusEnum('status').notNull().default('PENDING'),
  errorCount: integer('error_count').notNull().default(0),
  fixedCount: integer('fixed_count').notNull().default(0),
  aiEnabled: boolean('ai_enabled').notNull().default(false),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  summary: text('summary'),
});

// TypeScript errors table
export const typescriptErrors = pgTable('typescript_errors', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull().references(() => typescriptScanResults.id),
  code: text('code').notNull(),
  message: text('message').notNull(),
  file: text('file').notNull(),
  line: integer('line').notNull(),
  column: integer('column').notNull(),
  severity: errorSeverityEnum('severity').notNull(),
  category: errorCategoryEnum('category').notNull(),
  status: errorStatusEnum('status').notNull().default('NEW'),
  timestamp: timestamp('timestamp').notNull(),
  fixDetails: jsonb('fix_details'),
});

// TypeScript error fixes table
export const typescriptErrorFixes = pgTable('typescript_error_fixes', {
  id: text('id').primaryKey(),
  errorId: text('error_id').notNull().references(() => typescriptErrors.id),
  fixVersion: integer('fix_version').notNull(),
  fixedCode: text('fixed_code').notNull(),
  explanation: text('explanation'),
  applied: boolean('applied').notNull().default(false),
  confidence: text('confidence').notNull(),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Create insert schemas
export const insertScanResultSchema = createInsertSchema(typescriptScanResults).omit({
  id: true,
  errorCount: true,
  fixedCount: true,
  endTime: true,
  summary: true,
});

export const insertErrorSchema = createInsertSchema(typescriptErrors).omit({
  id: true,
  fixDetails: true,
});

export const insertFixSchema = createInsertSchema(typescriptErrorFixes).omit({
  id: true,
  createdAt: true,
});

// Export types
export type TypeScriptScanResult = typeof typescriptScanResults.$inferSelect;
export type InsertTypescriptScanResult = z.infer<typeof insertScanResultSchema>;

export type TypeScriptError = typeof typescriptErrors.$inferSelect;
export type InsertTypeScriptError = z.infer<typeof insertErrorSchema>;

export type TypeScriptErrorFix = typeof typescriptErrorFixes.$inferSelect;
export type InsertTypeScriptErrorFix = z.infer<typeof insertFixSchema>;