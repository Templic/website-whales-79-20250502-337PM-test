/**
 * TypeScript Error Management Type Definitions
 * 
 * This file provides common type definitions for use across
 * the TypeScript error management system.
 */

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ErrorCategory = 
  | 'syntax'
  | 'type-mismatch'
  | 'undefined-reference'
  | 'import-error'
  | 'null-undefined'
  | 'parameter-type'
  | 'return-type'
  | 'property-access'
  | 'naming-convention'
  | 'library-usage'
  | 'module-resolution'
  | 'jsx-error'
  | 'react-component'
  | 'decorators'
  | 'config-error'
  | 'compiler-option'
  | 'other';

export interface TypeScriptErrorDetail {
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: string;
  snippet?: string;
  suggestedFix?: string;
  relatedErrors?: number[];
}

export interface ErrorFindingResult {
  totalErrors: number;
  totalWarnings: number;
  errorsByFile: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  processingTimeMs: number;
  fileCount: number;
  scannedLineCount: number;
  errors: TypeScriptErrorDetail[];
  summary: string;
}

export interface AdvancedErrorFinderOptions {
  projectRoot: string;
  tsconfigPath?: string;
  includeNodeModules?: boolean;
  outputFormat?: 'json' | 'markdown' | 'console';
  outputPath?: string;
  maxErrors?: number;
  includeWarnings?: boolean;
  categories?: ErrorCategory[];
  minSeverity?: ErrorSeverity;
  sortBy?: 'severity' | 'file' | 'category' | 'code';
  filePatterns?: string[];
  excludePatterns?: string[];
  concurrent?: boolean;
  concurrencyLimit?: number;
  useColors?: boolean;
  verbose?: boolean;
}