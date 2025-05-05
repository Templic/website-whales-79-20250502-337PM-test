/**
 * TypeScript Error Analyzer
 * 
 * This utility analyzes TypeScript errors to categorize and provide insights
 * for the TypeScript error management system.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptErrorDetail } from './ts-error-finder';

/**
 * TypeScript Error interface
 * This interface is used by the OpenAI enhanced fixer
 */
export interface TypeScriptError {
  errorCode: string;
  messageText: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  category: string;
  severity: string;
  relatedInformation?: any[];
  source?: string;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  FUNCTION_ERROR = 'FUNCTION_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',
  DECLARATION_ERROR = 'DECLARATION_ERROR',
  NULL_REFERENCE = 'NULL_REFERENCE',
  SECURITY = 'SECURITY', // Added SECURITY category for security-related issues
  UNKNOWN = 'UNKNOWN'
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  includeDependencies?: boolean;
  includeFileContext?: boolean;
  contextLines?: number;
  maxErrors?: number;
}

/**
 * Error analysis result
 */
export interface ErrorAnalysisResult {
  errors: TypeScriptErrorDetail[];
  categorized: Record<string, TypeScriptErrorDetail[]>;
  severityBreakdown: Record<string, number>;
  dependencyGraph?: Record<string, string[]>;
  contextMap?: Record<string, {
    before: string[];
    error: string;
    after: string[];
  }>;
  summary: string;
}

/**
 * Get context around an error
 */
function getFileContext(filePath: string, line: number, contextLines: number = 5): { 
  before: string[]; 
  error: string; 
  after: string[];
} {
  try {
    // Read the file and get lines around the error
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Calculate the range of lines to include
    const startLine = Math.max(0, line - contextLines - 1);
    const endLine = Math.min(lines.length - 1, line + contextLines - 1);
    
    const before = lines.slice(startLine, line - 1);
    const error = lines[line - 1];
    const after = lines.slice(line, endLine + 1);
    
    return { before, error, after };
  } catch (error: any) {
    return { before: [], error: `[Could not read file: ${error?.message || 'Unknown error'}]`, after: [] };
  }
}

/**
 * Analyze TypeScript errors and provide categorized insights
 */
export async function analyzeTypeScriptErrors(
  errors: TypeScriptErrorDetail[],
  options: AnalysisOptions = {}
): Promise<ErrorAnalysisResult> {
  // Default options
  const opts = {
    includeDependencies: false,
    includeFileContext: false,
    contextLines: 5,
    maxErrors: 500,
    ...options
  };
  
  // Limit the number of errors to process
  const limitedErrors = errors.slice(0, opts.maxErrors);
  
  // Categorize errors
  const categorized: Record<string, TypeScriptErrorDetail[]> = {};
  const severityBreakdown: Record<string, number> = {};
  
  // Context map if requested
  const contextMap: Record<string, {
    before: string[];
    error: string;
    after: string[];
  }> = {};
  
  // Process each error
  for (const error of limitedErrors) {
    // Update category counts
    if (!categorized[error.category]) {
      categorized[error.category] = [];
    }
    categorized[error.category].push(error);
    
    // Update severity breakdown
    if (!severityBreakdown[error.severity]) {
      severityBreakdown[error.severity] = 0;
    }
    severityBreakdown[error.severity]++;
    
    // Add file context if requested
    if (opts.includeFileContext) {
      const errorKey = `${error.file}:${error.line}`;
      contextMap[errorKey] = getFileContext(
        error.file,
        error.line,
        opts.contextLines
      );
    }
  }
  
  // Build dependency graph if requested
  let dependencyGraph: Record<string, string[]> | undefined;
  if (opts.includeDependencies) {
    dependencyGraph = {};
    // In a real implementation, this would analyze error dependencies
    // For now, just create a placeholder
    for (const error of limitedErrors) {
      const errorKey = `${error.file}:${error.line}`;
      dependencyGraph[errorKey] = [];
    }
  }
  
  // Generate summary
  const summary = generateSummary(limitedErrors, categorized, severityBreakdown);
  
  return {
    errors: limitedErrors,
    categorized,
    severityBreakdown,
    dependencyGraph,
    contextMap: opts.includeFileContext ? contextMap : undefined,
    summary
  };
}

/**
 * Generate a summary of the analysis
 */
function generateSummary(
  errors: TypeScriptErrorDetail[],
  categorized: Record<string, TypeScriptErrorDetail[]>,
  severityBreakdown: Record<string, number>
): string {
  const lines: string[] = [];
  
  lines.push(`TypeScript Error Analysis Results`);
  lines.push(`===========================\n`);
  lines.push(`Total errors: ${errors.length}\n`);
  
  // Add severity breakdown
  lines.push(`Severity breakdown:`);
  for (const [severity, count] of Object.entries(severityBreakdown)) {
    lines.push(`  ${severity}: ${count}`);
  }
  lines.push('');
  
  // Add category breakdown
  lines.push(`Category breakdown:`);
  for (const [category, categoryErrors] of Object.entries(categorized)) {
    lines.push(`  ${category}: ${categoryErrors.length}`);
  }
  lines.push('');
  
  // Add files with most errors (top 5)
  const fileErrorCounts: Record<string, number> = {};
  for (const error of errors) {
    if (!fileErrorCounts[error.file]) {
      fileErrorCounts[error.file] = 0;
    }
    fileErrorCounts[error.file]++;
  }
  
  const filesSorted = Object.entries(fileErrorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  lines.push(`Top files with errors:`);
  for (const [file, count] of filesSorted) {
    lines.push(`  ${file}: ${count}`);
  }
  
  return lines.join('\n');
}

export default {
  analyzeTypeScriptErrors,
  ErrorCategory,
  ErrorSeverity
};