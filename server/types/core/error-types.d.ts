/**
 * @file error-types.d.ts
 * @description Type definitions for the TypeScript error management system
 * 
 * This file defines the core types used throughout the TypeScript error management system,
 * including error categories, severities, statuses, and related entities.
 */

/**
 * Enum for TypeScript error categories
 */
export type ErrorCategory = 
  | 'type_mismatch'
  | 'missing_type'
  | 'undefined_variable'
  | 'null_reference'
  | 'interface_mismatch'
  | 'import_error'
  | 'syntax_error'
  | 'generic_constraint'
  | 'declaration_error'
  | 'other';

/**
 * Enum for error severity levels
 */
export type ErrorSeverity = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

/**
 * Enum for error statuses
 */
export type ErrorStatus =
  | 'detected'
  | 'analyzed'
  | 'in_progress'
  | 'fixed'
  | 'ignored'
  | 'recurring';

/**
 * Represents a TypeScript error detected in the codebase
 */
export interface TypeScriptError {
  id: number;
  errorCode: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  errorMessage: string;
  errorContext: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  status: ErrorStatus;
  detectedAt: Date;
  resolvedAt?: Date;
  fixId?: number;
  patternId?: number;
  userId?: number;
  metadata?: {
    tscVersion?: string;
    nodeVersion?: string;
    framework?: string;
    fixAttempts?: number;
    errorHash?: string;
    [key: string]: any;
  };
}

/**
 * Represents an error pattern in the TypeScript error management system
 */
export interface ErrorPattern {
  id: number;
  name: string;
  description: string;
  regex?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  detectionRules?: {
    code_patterns?: string[];
    message_patterns?: string[];
    context_clues?: string[];
  };
  autoFixable: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: number;
}

/**
 * Represents a fix for a TypeScript error
 */
export interface ErrorFix {
  id: number;
  errorId: number;
  patternId?: number;
  fixTitle: string;
  fixDescription: string;
  fixCode: string;
  originalCode?: string;
  fixScope: 'line' | 'token' | 'custom';
  fixType: 'automatic' | 'semi-automatic' | 'manual';
  fixPriority: number;
  successRate?: number;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: number;
}

/**
 * Represents a record of applying a fix to an error
 */
export interface ErrorFixHistory {
  id: number;
  errorId: number;
  fixId?: number;
  originalCode: string;
  fixedCode: string;
  fixedAt: Date;
  fixedBy?: number;
  fixDuration?: number;
  fixMethod: 'automatic' | 'assisted' | 'manual';
  fixResult: 'success' | 'partial' | 'failure';
}

/**
 * Represents a project-wide TypeScript analysis
 */
export interface ProjectAnalysis {
  id: number;
  projectId: number;
  startedAt: Date;
  completedAt?: Date;
  errorCount?: number;
  warningCount?: number;
  fixedCount?: number;
  analysisData?: {
    typeFoundation?: {
      coverage: number;
      missingTypes: string[];
      circularDependencies: string[][];
    };
    errorHotspots?: {
      files: Record<string, number>;
      components: Record<string, number>;
    };
    trends?: {
      errorReduction: number;
      fixSuccessRate: number;
    };
    [key: string]: any;
  };
  status: 'in_progress' | 'completed' | 'failed';
  duration?: number;
}

/**
 * Insert type for TypeScript errors
 */
export type InsertTypeScriptError = Omit<TypeScriptError, 'id' | 'detectedAt'>;

/**
 * Insert type for error patterns
 */
export type InsertErrorPattern = Omit<ErrorPattern, 'id' | 'createdAt'>;

/**
 * Insert type for error fixes
 */
export type InsertErrorFix = Omit<ErrorFix, 'id' | 'createdAt'>;

/**
 * Insert type for error fix history
 */
export type InsertErrorFixHistory = Omit<ErrorFixHistory, 'id'>;

/**
 * Insert type for project analysis
 */
export type InsertProjectAnalysis = Omit<ProjectAnalysis, 'id' | 'startedAt'>;