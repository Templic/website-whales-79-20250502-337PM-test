/**
 * TypeScript Error Pattern Finder
 * 
 * This module provides functions to identify common patterns in TypeScript errors.
 * It analyzes errors found by the ts-error-analyzer and groups them into patterns
 * based on similarities in code, message, and location.
 */

import path from 'path';
import fs from 'fs';
import ts from 'typescript';
import { analyzeTypeScriptErrors, TypeScriptError } from './ts-error-analyzer';
import { ErrorCategory, ErrorSeverity } from '../../shared/schema';

// Interfaces
export interface ErrorPattern {
  id?: number;
  name: string;
  pattern: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description: string;
  suggestedFix?: string;
  autoFixable: boolean;
  occurrences: number;
  examples: ErrorExample[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ErrorExample {
  file: string;
  line: number;
  code: string;
  errorHash: string;
}

export interface PatternFinderOptions {
  minOccurrences?: number;
  saveToDb?: boolean;
}

/**
 * Finds common error patterns in TypeScript errors
 * 
 * @param rootDir - The root directory of the project
 * @param tsconfigPath - Path to the tsconfig.json file
 * @param options - Pattern finder options
 * @returns Array of error patterns
 */
export async function findErrorPatterns(
  rootDir: string,
  tsconfigPath: string,
  options: PatternFinderOptions = {}
): Promise<ErrorPattern[]> {
  // Set default options
  const opts = {
    minOccurrences: options.minOccurrences || 3,
    saveToDb: options.saveToDb !== undefined ? options.saveToDb : true
  };
  
  // First, analyze the project to get errors
  const analysis = await analyzeTypeScriptErrors(rootDir, tsconfigPath, { saveToDb: false });
  
  // Get all errors
  const allErrors: TypeScriptError[] = [];
  Object.values(analysis.errorsByCategory).forEach(errors => {
    allErrors.push(...errors);
  });
  
  // No errors, no patterns
  if (allErrors.length === 0) {
    return [];
  }
  
  // Group errors by code and simplified message
  const errorGroups = groupErrorsBySignature(allErrors);
  
  // Convert groups to patterns
  const patterns: ErrorPattern[] = [];
  
  for (const [signature, errors] of Object.entries(errorGroups)) {
    // Skip if not enough occurrences
    if (errors.length < opts.minOccurrences) {
      continue;
    }
    
    // Create pattern from group
    const pattern = createPatternFromGroup(signature, errors, rootDir);
    patterns.push(pattern);
  }
  
  // Sort patterns by occurrences (descending)
  patterns.sort((a, b) => b.occurrences - a.occurrences);
  
  // Save patterns to database if enabled
  if (opts.saveToDb) {
    await savePatterns(patterns);
  }
  
  return patterns;
}

/**
 * Groups errors by their signature (code + simplified message)
 * 
 * @param errors - Array of TypeScript errors
 * @returns Record of error signatures to arrays of errors
 */
function groupErrorsBySignature(
  errors: TypeScriptError[]
): Record<string, TypeScriptError[]> {
  const groups: Record<string, TypeScriptError[]> = {};
  
  for (const error of errors) {
    // Create a simplified message by removing specific names, paths, etc.
    const simplifiedMessage = simplifyErrorMessage(error.message);
    
    // Create a signature for the error
    const signature = `${error.code}:${simplifiedMessage}`;
    
    // Add to group
    if (!groups[signature]) {
      groups[signature] = [];
    }
    groups[signature].push(error);
  }
  
  return groups;
}

/**
 * Simplifies an error message by replacing specific identifiers with placeholders
 * 
 * @param message - Original error message
 * @returns Simplified message
 */
function simplifyErrorMessage(message: string): string {
  return message
    // Replace specific types with placeholders
    .replace(/'[^']*'/g, "'X'")
    .replace(/"[^"]*"/g, '"X"')
    
    // Replace specific properties and variables
    .replace(/property '([^']*)'/, "property 'X'")
    .replace(/variable '([^']*)'/, "variable 'X'")
    .replace(/parameter '([^']*)'/, "parameter 'X'")
    .replace(/function '([^']*)'/, "function 'X'")
    .replace(/class '([^']*)'/, "class 'X'")
    
    // Replace specific file paths
    .replace(/in file '([^']*)'/, "in file 'X'")
    
    // Replace specific numbers
    .replace(/\b\d+\b/g, "N");
}

/**
 * Creates an error pattern from a group of errors
 * 
 * @param signature - Error signature
 * @param errors - Array of errors with the same signature
 * @param rootDir - Root directory of the project
 * @returns Error pattern
 */
function createPatternFromGroup(
  signature: string,
  errors: TypeScriptError[],
  rootDir: string
): ErrorPattern {
  // Get a representative error
  const representative = errors[0];
  
  // Generate a name for the pattern
  const [codeStr, messageStr] = signature.split(':', 2);
  const name = `TS${codeStr}: ${messageStr.substring(0, 50)}${messageStr.length > 50 ? '...' : ''}`;
  
  // Get category and severity from representative
  const category = representative.category;
  const severity = representative.severity;
  
  // Create examples
  const examples: ErrorExample[] = [];
  
  for (const error of errors.slice(0, 5)) { // Limit to 5 examples
    if (error.file && error.lineContent) {
      examples.push({
        file: path.relative(rootDir, error.file),
        line: error.line,
        code: error.lineContent.trim(),
        errorHash: error.hash
      });
    }
  }
  
  // Determine if automatically fixable
  const autoFixable = isAutoFixable(representative);
  
  // Create pattern description
  const description = createPatternDescription(representative, errors.length);
  
  // Create suggested fix
  const suggestedFix = createSuggestedFix(representative);
  
  return {
    name,
    pattern: signature,
    category,
    severity,
    description,
    suggestedFix,
    autoFixable,
    occurrences: errors.length,
    examples
  };
}

/**
 * Determines if an error is automatically fixable
 * 
 * @param error - TypeScript error
 * @returns Whether the error is auto-fixable
 */
function isAutoFixable(error: TypeScriptError): boolean {
  // Errors that are typically auto-fixable
  const autoFixableCodes = [
    // Missing semicolons, parentheses, etc.
    1005, // ',' expected
    1003, // ';' expected
    
    // Import errors
    2307, // Cannot find module 'X'
    
    // Missing types
    7006, // Parameter 'X' implicitly has an 'any' type
    7005, // Variable 'X' implicitly has an 'any' type
    7010, // 'X', which lacks return-type annotation, implicitly has an 'any' return type
    
    // Simple property access
    2339, // Property 'X' does not exist on type 'Y'
    
    // Duplicate imports, identifiers
    2300, // Duplicate identifier 'X'
    2451  // Cannot redeclare block-scoped variable 'X'
  ];
  
  return autoFixableCodes.includes(error.code);
}

/**
 * Creates a description for an error pattern
 * 
 * @param error - Representative error
 * @param occurrences - Number of occurrences
 * @returns Pattern description
 */
function createPatternDescription(error: TypeScriptError, occurrences: number): string {
  const categoryStr = error.category.replace(/_/g, ' ').toLowerCase();
  const severityStr = error.severity.toLowerCase();
  
  return `This is a ${severityStr} severity ${categoryStr} error that occurs ${occurrences} times in the codebase. ` +
    `It is triggered by TypeScript error code TS${error.code}: ${error.message}`;
}

/**
 * Creates a suggested fix for an error
 * 
 * @param error - Representative error
 * @returns Suggested fix or undefined
 */
function createSuggestedFix(error: TypeScriptError): string | undefined {
  // Return existing suggested fix if available
  if (error.suggestedFix) {
    return error.suggestedFix;
  }
  
  // Otherwise, suggest based on error code and category
  switch (error.category) {
    case ErrorCategory.TYPE_MISMATCH:
      return 'Ensure the types match or add explicit type conversion. Consider using type guards or type assertions if necessary.';
      
    case ErrorCategory.MISSING_TYPE:
      return 'Add explicit type annotations to variables, parameters, or function return types.';
      
    case ErrorCategory.IMPORT_ERROR:
      return 'Check that the module exists and the import path is correct. Verify that the imported member is exported by the module.';
      
    case ErrorCategory.NULL_REFERENCE:
      return 'Add null checks before accessing properties or use optional chaining (?.) and nullish coalescing operators (??) for safer access.';
      
    case ErrorCategory.INTERFACE_MISMATCH:
      return 'Ensure all required properties from the interface are implemented correctly with matching types.';
      
    case ErrorCategory.GENERIC_CONSTRAINT:
      return 'Update the type to satisfy the constraint, or modify the constraint if appropriate.';
      
    case ErrorCategory.DECLARATION_ERROR:
      return 'Rename the duplicate identifier or remove one of the declarations.';
      
    case ErrorCategory.SYNTAX_ERROR:
      return 'Fix the syntax according to TypeScript language rules.';
      
    default:
      return 'Review the error message and fix accordingly.';
  }
}

/**
 * Saves patterns to the database
 * 
 * @param patterns - Array of error patterns
 */
async function savePatterns(patterns: ErrorPattern[]): Promise<void> {
  // This is a placeholder for database integration
  // In a real implementation, this would save patterns to the database
  
  console.log(`Patterns would be saved to database (${patterns.length} patterns)`);
  
  // TODO: Implement database integration
}

export default findErrorPatterns;