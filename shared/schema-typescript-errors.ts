/**
 * TypeScript Error Management System - Enhanced Schema
 * 
 * This schema provides an enhanced data model for the TypeScript error management system
 * that integrates with the application's security framework and provides more detailed
 * error analysis and tracking capabilities.
 */

import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums for categorizing TypeScript errors
export const ErrorCategoryEnum = pgEnum('error_category', [
  'TYPE_MISMATCH',
  'MISSING_TYPE',
  'INVALID_IMPORT',
  'SYNTAX_ERROR',
  'MODULE_ERROR',
  'DEPENDENCY_ERROR',
  'COMPILER_CONFIG',
  'LIBRARY_ERROR',
  'SECURITY_CONCERN',
  'OTHER'
]);

export const ErrorSeverityEnum = pgEnum('error_severity', [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO'
]);

export const ErrorStatusEnum = pgEnum('error_status', [
  'NEW',
  'ANALYZING',
  'FIXING',
  'FIXED',
  'IGNORED',
  'NEEDS_REVIEW',
  'SECURITY_REVIEW'
]);

export const ScanStatusEnum = pgEnum('scan_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

// Main tables for TypeScript error management

// Table for storing scan results
export const typescriptScanResults = pgTable('typescript_scan_results', {
  id: text('id').primaryKey(),
  status: ScanStatusEnum('status').notNull().default('PENDING'),
  errorCount: integer('error_count').notNull().default(0),
  fixedCount: integer('fixed_count').notNull().default(0),
  aiEnabled: boolean('ai_enabled').notNull().default(false),
  securityScanEnabled: boolean('security_scan_enabled').notNull().default(false),
  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),
  summary: text('summary'),
  initiatedBy: text('initiated_by'),
  projectRoot: text('project_root'),
  targetFiles: text('target_files'),
  executionTimeMs: integer('execution_time_ms'),
  securityContext: jsonb('security_context'),
  metadata: jsonb('metadata')
});

// Table for storing individual TypeScript errors
export const typescriptErrors = pgTable('typescript_errors', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull().references(() => typescriptScanResults.id),
  code: text('code').notNull(),
  message: text('message').notNull(),
  file: text('file').notNull(),
  line: integer('line').notNull(),
  column: integer('column').notNull(),
  severity: ErrorSeverityEnum('severity').notNull(),
  category: ErrorCategoryEnum('category').notNull(),
  status: ErrorStatusEnum('status').notNull().default('NEW'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  fixDetails: jsonb('fix_details'),
  securityImpact: text('security_impact'),
  dependsOn: text('depends_on').array(),
  contextHash: text('context_hash'),
  fileHash: text('file_hash'),
  patternId: text('pattern_id').references(() => errorPatterns.id)
});

// Table for storing error analysis results
export const errorAnalysis = pgTable('error_analysis', {
  id: serial('id').primaryKey(),
  errorId: text('error_id').notNull().references(() => typescriptErrors.id),
  analysisType: text('analysis_type').notNull(),
  analysisResult: jsonb('analysis_result').notNull(),
  confidence: integer('confidence').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Table for storing error fix history
export const errorFixHistory = pgTable('error_fix_history', {
  id: serial('id').primaryKey(),
  errorId: text('error_id').notNull().references(() => typescriptErrors.id),
  fixedBy: text('fixed_by').notNull(),
  fixTimestamp: timestamp('fix_timestamp').notNull().defaultNow(),
  originalCode: text('original_code').notNull(),
  fixedCode: text('fixed_code').notNull(),
  fixMethod: text('fix_method').notNull(),
  successful: boolean('successful').notNull(),
  securityApproved: boolean('security_approved').default(false),
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  auditLogId: text('audit_log_id')
});

// Table for storing common error patterns
export const errorPatterns = pgTable('error_patterns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  patternRegex: text('pattern_regex').notNull(),
  commonFiles: text('common_files'),
  frequency: integer('frequency').notNull().default(0),
  securityImpact: text('security_impact'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata')
});

// Table for storing error fix suggestions
export const errorFixes = pgTable('error_fixes', {
  id: serial('id').primaryKey(),
  patternId: text('pattern_id').notNull().references(() => errorPatterns.id),
  fixTemplate: text('fix_template').notNull(),
  description: text('description').notNull(),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  confidence: integer('confidence').notNull().default(50),
  successRate: integer('success_rate').default(0),
  securityApproved: boolean('security_approved').default(false),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Table to connect scans with security audits
export const scanSecurityAudits = pgTable('scan_security_audits', {
  id: serial('id').primaryKey(),
  scanId: text('scan_id').notNull().references(() => typescriptScanResults.id),
  securityIncidentId: text('security_incident_id'),
  auditTimestamp: timestamp('audit_timestamp').notNull().defaultNow(),
  findings: jsonb('findings'),
  securityScore: integer('security_score'),
  vulnerabilitiesFound: integer('vulnerabilities_found').default(0),
  criticalIssues: integer('critical_issues').default(0),
  reviewedBy: text('reviewed_by'),
  status: text('status').notNull(),
  metadata: jsonb('metadata')
});

// Table for TypeScript error metrics
export const typescriptErrorMetrics = pgTable('typescript_error_metrics', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull().defaultNow(),
  totalErrors: integer('total_errors').notNull().default(0),
  criticalErrors: integer('critical_errors').notNull().default(0),
  highErrors: integer('high_errors').notNull().default(0),
  mediumErrors: integer('medium_errors').notNull().default(0),
  lowErrors: integer('low_errors').notNull().default(0),
  fixedErrors: integer('fixed_errors').notNull().default(0),
  aiFixSuccessRate: integer('ai_fix_success_rate').default(0),
  mostCommonCategory: text('most_common_category'),
  mostErrorProneFile: text('most_error_prone_file'),
  averageFixTime: integer('average_fix_time'), // in seconds
  securityImpactScore: integer('security_impact_score'),
  metadata: jsonb('metadata')
});

// Zod schemas for validation
export const insertTypescriptScanResultSchema = createInsertSchema(typescriptScanResults).omit({
  id: true,
  status: true,
  errorCount: true,
  fixedCount: true,
  startTime: true,
  endTime: true,
  executionTimeMs: true
});

export const insertTypescriptErrorSchema = createInsertSchema(typescriptErrors).omit({
  id: true,
  status: true,
  timestamp: true
});

export const insertErrorAnalysisSchema = createInsertSchema(errorAnalysis).omit({
  id: true,
  timestamp: true
});

export const insertErrorFixHistorySchema = createInsertSchema(errorFixHistory).omit({
  id: true,
  fixTimestamp: true
});

export const insertErrorPatternSchema = createInsertSchema(errorPatterns).omit({
  id: true,
  frequency: true,
  createdAt: true,
  updatedAt: true
});

export const insertErrorFixSchema = createInsertSchema(errorFixes).omit({
  id: true,
  successRate: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions
export type TypescriptScanResult = typeof typescriptScanResults.$inferSelect;
export type InsertTypescriptScanResult = z.infer<typeof insertTypescriptScanResultSchema>;

export type TypescriptError = typeof typescriptErrors.$inferSelect;
export type InsertTypescriptError = z.infer<typeof insertTypescriptErrorSchema>;

export type ErrorAnalysis = typeof errorAnalysis.$inferSelect;
export type InsertErrorAnalysis = z.infer<typeof insertErrorAnalysisSchema>;

export type ErrorFixHistory = typeof errorFixHistory.$inferSelect;
export type InsertErrorFixHistory = z.infer<typeof insertErrorFixHistorySchema>;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = z.infer<typeof insertErrorPatternSchema>;

export type ErrorFix = typeof errorFixes.$inferSelect;
export type InsertErrorFix = z.infer<typeof insertErrorFixSchema>;

export type ScanSecurityAudit = typeof scanSecurityAudits.$inferSelect;
export type TypescriptErrorMetric = typeof typescriptErrorMetrics.$inferSelect;

// Helper enums for TypeScript code
export enum ErrorCategory {
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  MISSING_TYPE = 'MISSING_TYPE',
  INVALID_IMPORT = 'INVALID_IMPORT',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  MODULE_ERROR = 'MODULE_ERROR',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  COMPILER_CONFIG = 'COMPILER_CONFIG',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
  SECURITY_CONCERN = 'SECURITY_CONCERN',
  OTHER = 'OTHER'
}

export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum ErrorStatus {
  NEW = 'NEW',
  ANALYZING = 'ANALYZING',
  FIXING = 'FIXING',
  FIXED = 'FIXED',
  IGNORED = 'IGNORED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  SECURITY_REVIEW = 'SECURITY_REVIEW'
}

export enum ScanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}