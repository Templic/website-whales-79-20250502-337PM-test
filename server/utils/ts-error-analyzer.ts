/**
 * TypeScript Error Analyzer
 * 
 * This utility analyzes TypeScript errors, categorizes them, and provides diagnostic information
 * to help identify patterns and root causes.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { tsErrorStorage } from '../tsErrorStorage';
import { InsertTypescriptError } from '../../shared/schema';

// Error category definitions
export const ERROR_CATEGORIES = {
  TYPE_MISMATCH: 'type_mismatch',
  MISSING_TYPE: 'missing_type', 
  UNDEFINED_VARIABLE: 'undefined_variable',
  NULL_UNDEFINED: 'null_undefined',
  SYNTAX_ERROR: 'syntax_error',
  IMPORT_ERROR: 'import_error',
  DECLARATION_ERROR: 'declaration_error',
  MODULE_ERROR: 'module_error',
  CONFIGURATION_ERROR: 'configuration_error',
  OTHER: 'other'
};

// Error severity levels
export const ERROR_SEVERITY = {
  CRITICAL: 'critical',   // Breaks compilation/runtime
  HIGH: 'high',           // Major functionality issues
  MEDIUM: 'medium',       // Moderate issues that should be fixed
  LOW: 'low',             // Minor issues, code works but could be improved
  INFO: 'info'            // Informational only
};

// Error status types
export const ERROR_STATUS = {
  DETECTED: 'detected',
  ANALYZING: 'analyzing',
  PATTERN_IDENTIFIED: 'pattern_identified',
  FIX_AVAILABLE: 'fix_available',
  FIX_APPLIED: 'fix_applied',
  FIXED: 'fixed',
  REQUIRES_MANUAL_FIX: 'requires_manual_fix',
  FALSE_POSITIVE: 'false_positive',
  IGNORED: 'ignored'
};

// TypeScript error object structure
export interface TypeScriptError {
  filePath: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: string;
  severity: string;
  context?: string;
  suggestions?: string[];
}

/**
 * Parses the output of 'tsc --noEmit' to extract TypeScript errors
 */
export function parseTypeScriptOutput(output: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];
  const errorRegex = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
  
  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    const [_, filePath, line, column, code, message] = match;
    
    // Get error context by reading the file content
    let context = '';
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        const lineNumber = parseInt(line);
        
        // Get a few lines before and after the error
        const startLine = Math.max(0, lineNumber - 3);
        const endLine = Math.min(lines.length, lineNumber + 2);
        context = lines.slice(startLine, endLine).join('\n');
      }
    } catch (error) {
      console.error(`Failed to get context for ${filePath}:${line}`, error);
    }
    
    errors.push({
      filePath,
      line: parseInt(line),
      column: parseInt(column),
      code,
      message,
      category: categorizeError(code, message),
      severity: determineSeverity(code, message),
      context
    });
  }
  
  return errors;
}

/**
 * Runs the TypeScript compiler to get error diagnostics
 */
export function runTypeScriptCompiler(): string {
  try {
    // Run tsc with --noEmit to just do type checking without emitting files
    return execSync('npx tsc --noEmit', { encoding: 'utf8' });
  } catch (error) {
    // tsc returns a non-zero exit code when there are errors, which throws an exception
    // We catch it and return the stderr output which contains the error diagnostics
    if (error.stdout) {
      return error.stdout.toString();
    }
    throw error;
  }
}

/**
 * Categorize errors based on error code and message
 */
export function categorizeError(code: string, message: string): string {
  // Type mismatch errors
  if (
    message.includes('is not assignable to') || 
    message.includes('Type') && message.includes('is not assignable')
  ) {
    return ERROR_CATEGORIES.TYPE_MISMATCH;
  }
  
  // Missing type annotations
  if (
    message.includes('implicitly has an \'any\' type') || 
    message.includes('parameter') && message.includes('implicitly has an') ||
    message.includes('no explicit type')
  ) {
    return ERROR_CATEGORIES.MISSING_TYPE;
  }
  
  // Undefined variables or properties
  if (
    message.includes('cannot find name') || 
    message.includes('Property') && message.includes('does not exist')
  ) {
    return ERROR_CATEGORIES.UNDEFINED_VARIABLE;
  }
  
  // Null or undefined related errors
  if (
    message.includes('null') || 
    message.includes('undefined') || 
    message.includes('possibly undefined')
  ) {
    return ERROR_CATEGORIES.NULL_UNDEFINED;
  }
  
  // Syntax errors
  if (
    message.includes('expected') || 
    message.includes('Declaration or statement expected') ||
    message.includes('Expression expected')
  ) {
    return ERROR_CATEGORIES.SYNTAX_ERROR;
  }
  
  // Import errors
  if (
    message.includes('Cannot find module') || 
    message.includes('has no exported member')
  ) {
    return ERROR_CATEGORIES.IMPORT_ERROR;
  }
  
  // Declaration errors
  if (
    message.includes('already declared') || 
    message.includes('Duplicate identifier')
  ) {
    return ERROR_CATEGORIES.DECLARATION_ERROR;
  }
  
  // Module errors
  if (
    message.includes('module') || 
    message.includes('namespace')
  ) {
    return ERROR_CATEGORIES.MODULE_ERROR;
  }
  
  // Configuration errors
  if (
    message.includes('Cannot find name \'require\'') ||
    message.includes('Cannot find name \'module\'') ||
    message.includes('Cannot find name \'__dirname\'') ||
    message.includes('JSX element implicitly')
  ) {
    return ERROR_CATEGORIES.CONFIGURATION_ERROR;
  }
  
  // Default to 'other' if we can't categorize
  return ERROR_CATEGORIES.OTHER;
}

/**
 * Determine error severity based on error code and message
 */
export function determineSeverity(code: string, message: string): string {
  // Critical errors that break compilation
  if (
    message.includes('Syntax error') ||
    message.includes('expected')
  ) {
    return ERROR_SEVERITY.CRITICAL;
  }
  
  // High severity errors that will likely cause runtime issues
  if (
    message.includes('cannot find name') ||
    message.includes('Property') && message.includes('does not exist') ||
    message.includes('Cannot find module')
  ) {
    return ERROR_SEVERITY.HIGH;
  }
  
  // Medium severity errors - code might run but with unexpected behavior
  if (
    message.includes('is not assignable to') ||
    message.includes('possibly undefined') ||
    message.includes('implicitly has an \'any\' type')
  ) {
    return ERROR_SEVERITY.MEDIUM;
  }
  
  // Low severity - mostly style or best practices issues
  if (
    message.includes('is declared but') ||
    message.includes('but never used')
  ) {
    return ERROR_SEVERITY.LOW;
  }
  
  // Default to medium severity if we can't determine
  return ERROR_SEVERITY.MEDIUM;
}

/**
 * Analyzes a project and stores TypeScript errors in the database
 */
export async function analyzeProject(): Promise<{ 
  totalErrors: number; 
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  filesWithErrors: string[];
}> {
  console.log('Running TypeScript error analysis...');
  
  try {
    // Run TypeScript compiler and parse output
    const output = runTypeScriptCompiler();
    const errors = parseTypeScriptOutput(output);
    
    console.log(`Found ${errors.length} TypeScript errors`);
    
    // Store errors in database
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const filesWithErrors: string[] = [];
    
    for (const error of errors) {
      // Track statistics
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      if (!filesWithErrors.includes(error.filePath)) {
        filesWithErrors.push(error.filePath);
      }
      
      // Create error record for database
      const errorRecord: InsertTypescriptError = {
        errorCode: `TS${error.code}`,
        filePath: error.filePath,
        lineNumber: error.line,
        columnNumber: error.column,
        errorMessage: error.message,
        errorContext: error.context || '',
        category: error.category as any,
        severity: error.severity as any,
        status: ERROR_STATUS.DETECTED,
        detectedAt: new Date(),
        occurrenceCount: 1,
        lastOccurrenceAt: new Date(),
        metadata: {
          suggestions: error.suggestions || []
        }
      };
      
      try {
        // Store in database
        await tsErrorStorage.createTypescriptError(errorRecord);
      } catch (dbError) {
        console.error('Failed to store TypeScript error:', dbError);
      }
    }
    
    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      filesWithErrors
    };
  } catch (error) {
    console.error('Error analyzing TypeScript project:', error);
    throw error;
  }
}

/**
 * Generates suggestions for fixing common TypeScript errors
 */
export function generateSuggestions(error: TypeScriptError): string[] {
  const suggestions: string[] = [];
  
  switch (error.category) {
    case ERROR_CATEGORIES.TYPE_MISMATCH:
      suggestions.push('Check the expected type and ensure your variable matches it');
      suggestions.push('Use type casting if you\'re confident the type is correct');
      suggestions.push('Update your interfaces or type definitions to match the implementation');
      break;
      
    case ERROR_CATEGORIES.MISSING_TYPE:
      suggestions.push('Add explicit type annotations to function parameters');
      suggestions.push('Define return types for functions');
      suggestions.push('Use interfaces or type aliases to define complex object shapes');
      break;
      
    case ERROR_CATEGORIES.UNDEFINED_VARIABLE:
      suggestions.push('Check if the variable or property name is spelled correctly');
      suggestions.push('Ensure the referenced module or dependency is installed');
      suggestions.push('Import the required component or function');
      break;
      
    case ERROR_CATEGORIES.NULL_UNDEFINED:
      suggestions.push('Add null checks before accessing properties');
      suggestions.push('Use optional chaining (obj?.prop) or nullish coalescing (obj ?? defaultValue)');
      suggestions.push('Consider using non-null assertion operator (!) if you\'re confident the value exists');
      break;
      
    case ERROR_CATEGORIES.SYNTAX_ERROR:
      suggestions.push('Check for missing semicolons, parentheses, or braces');
      suggestions.push('Ensure all blocks and statements are properly closed');
      suggestions.push('Verify that function declarations have proper parameter lists and return types');
      break;
      
    case ERROR_CATEGORIES.IMPORT_ERROR:
      suggestions.push('Verify the import path is correct');
      suggestions.push('Check if the module is installed and listed in package.json');
      suggestions.push('Make sure the exported member name matches what you\'re trying to import');
      break;
      
    case ERROR_CATEGORIES.DECLARATION_ERROR:
      suggestions.push('Rename one of the duplicate variables or functions');
      suggestions.push('Use namespaces or modules to avoid name conflicts');
      suggestions.push('Check if you\'re redeclaring a variable in the same scope');
      break;
      
    case ERROR_CATEGORIES.MODULE_ERROR:
      suggestions.push('Add proper module declarations or update tsconfig.json');
      suggestions.push('Ensure the module exists and is properly exported');
      suggestions.push('Check for namespace or module naming conflicts');
      break;
      
    case ERROR_CATEGORIES.CONFIGURATION_ERROR:
      suggestions.push('Update your tsconfig.json settings');
      suggestions.push('Ensure you have the right target and module settings for your environment');
      suggestions.push('Add appropriate type definitions (@types/...) for external libraries');
      break;
      
    default:
      suggestions.push('Review the error message carefully for hints on how to fix it');
      suggestions.push('Check TypeScript documentation for this specific error code');
      suggestions.push('Consider refactoring the code to use simpler types or patterns');
  }
  
  return suggestions;
}

/**
 * Gets context for a TypeScript error by reading the file
 */
export function getErrorContext(filePath: string, line: number, column: number): string {
  try {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Get a window of code around the error
    const startLine = Math.max(0, line - 3);
    const endLine = Math.min(lines.length, line + 2);
    
    return lines.slice(startLine, endLine).join('\n');
  } catch (error) {
    console.error(`Failed to get context for ${filePath}:${line}:${column}`, error);
    return '';
  }
}

// Export the module
export default {
  analyzeProject,
  parseTypeScriptOutput,
  runTypeScriptCompiler,
  categorizeError,
  determineSeverity,
  generateSuggestions,
  getErrorContext,
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  ERROR_STATUS
};