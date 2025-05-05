/**
 * TypeScript Error Finder
 * 
 * This utility scans TypeScript files in a project and detects TypeScript errors
 * using the TypeScript Compiler API. It provides detailed error information
 * that can be used for analysis and automated fixing.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { logSecurityEvent } from '../security';

// Types for our error finder
export enum ErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Suggestion = 'suggestion',
  Message = 'message'
}

export enum ErrorCategory {
  Syntax = 'syntax',
  Type = 'type',
  Declaration = 'declaration',
  Import = 'import',
  Module = 'module',
  Generic = 'generic',
  Configuration = 'configuration',
  Performance = 'performance',
  Security = 'security',
  Validation = 'validation',
  Other = 'other'
}

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

export interface ErrorFinderOptions {
  projectRoot: string;
  tsconfigPath?: string;
  includeNodeModules?: boolean;
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

// Default options
const defaultOptions: ErrorFinderOptions = {
  projectRoot: '.',
  includeNodeModules: false,
  maxErrors: 100,
  includeWarnings: true,
  minSeverity: ErrorSeverity.Warning,
  sortBy: 'severity',
  concurrent: false,
  concurrencyLimit: 4,
  useColors: true,
  verbose: false
};

/**
 * Find TypeScript errors in a project
 */
export async function findTypeScriptErrors(
  options: ErrorFinderOptions = defaultOptions
): Promise<ErrorFindingResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };
  const projectRoot = path.resolve(mergedOptions.projectRoot);
  
  // Initialize result
  const result: ErrorFindingResult = {
    totalErrors: 0,
    totalWarnings: 0,
    errorsByFile: {},
    errorsByCategory: {},
    errorsByCode: {},
    processingTimeMs: 0,
    fileCount: 0,
    scannedLineCount: 0,
    errors: [],
    summary: ''
  };

  try {
    // Find TypeScript configuration
    const tsconfigPath = mergedOptions.tsconfigPath || 
      path.join(projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error(`TypeScript configuration file not found: ${tsconfigPath}`);
    }

    // Parse tsconfig.json
    const tsconfigJson = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    const compilerOptions = tsconfigJson.compilerOptions || {};

    // Create a TypeScript program
    const configParseResult = ts.parseJsonConfigFileContent(
      tsconfigJson,
      ts.sys,
      projectRoot
    );
    
    // Find TypeScript files
    let tsFiles = await findTypeScriptFiles(projectRoot, 
      mergedOptions.filePatterns,
      mergedOptions.excludePatterns,
      mergedOptions.includeNodeModules
    );
    
    result.fileCount = tsFiles.length;
    
    if (mergedOptions.verbose) {
      console.log(`Found ${tsFiles.length} TypeScript files to scan`);
    }

    // Create program with the files we found
    const program = ts.createProgram(
      tsFiles,
      configParseResult.options
    );

    // Get diagnostics
    const syntacticDiagnostics = program.getSyntacticDiagnostics();
    const semanticDiagnostics = program.getSemanticDiagnostics();
    const declarationDiagnostics = program.getDeclarationDiagnostics();
    
    const allDiagnostics = [
      ...syntacticDiagnostics,
      ...semanticDiagnostics,
      ...declarationDiagnostics
    ];
    
    let lineCount = 0;

    // Process each diagnostic
    for (const diagnostic of allDiagnostics) {
      if (mergedOptions.maxErrors && result.errors.length >= mergedOptions.maxErrors) {
        break;
      }

      // Skip if below minimum severity
      const severity = determineSeverity(
        diagnostic.category,
        diagnostic.code,
        diagnostic.messageText.toString()
      );
      
      if (mergedOptions.minSeverity && !shouldIncludeSeverity(severity, mergedOptions.minSeverity)) {
        continue;
      }

      // Skip warnings if not including them
      if (severity === ErrorSeverity.Warning && !mergedOptions.includeWarnings) {
        continue;
      }

      // Get source file
      const sourceFile = diagnostic.file;
      if (!sourceFile) {
        continue; // Skip diagnostics without a source file
      }

      // Get line and character
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        diagnostic.start!
      );

      // Get error message
      let errorMessage = '';
      if (typeof diagnostic.messageText === 'string') {
        errorMessage = diagnostic.messageText;
      } else {
        errorMessage = diagnostic.messageText.messageText;
      }

      // Categorize the error
      const category = categorizeError(
        diagnostic.code,
        errorMessage
      );

      // Skip if category is filtered
      if (
        mergedOptions.categories &&
        mergedOptions.categories.length > 0 &&
        !mergedOptions.categories.includes(category)
      ) {
        continue;
      }

      // Get file path relative to project root
      const filePath = path.relative(
        projectRoot,
        sourceFile.fileName
      );

      // Get code snippet
      const snippet = getErrorSnippet(
        sourceFile.text,
        diagnostic.start!,
        diagnostic.length!
      );

      // Get context around the error
      const context = getContextAround(
        sourceFile.text,
        diagnostic.start!,
        5
      );

      // Get suggested fix
      const suggestedFix = getSuggestedFix(
        String(diagnostic.code),
        errorMessage,
        category
      );

      // Create error detail
      const errorDetail: TypeScriptErrorDetail = {
        code: `TS${diagnostic.code}`,
        message: errorMessage,
        file: filePath,
        line: line + 1, // Convert to 1-based
        column: character + 1, // Convert to 1-based
        severity,
        category,
        context,
        snippet,
        suggestedFix
      };

      // Update counters
      result.errors.push(errorDetail);
      
      if (severity === ErrorSeverity.Error) {
        result.totalErrors++;
      } else if (severity === ErrorSeverity.Warning) {
        result.totalWarnings++;
      }

      // Update by-file counter
      result.errorsByFile[filePath] = (result.errorsByFile[filePath] || 0) + 1;
      
      // Update by-category counter
      result.errorsByCategory[category] = (result.errorsByCategory[category] || 0) + 1;
      
      // Update by-code counter
      result.errorsByCode[`TS${diagnostic.code}`] = (result.errorsByCode[`TS${diagnostic.code}`] || 0) + 1;

      // Count lines in the file
      lineCount += sourceFile.text.split('\n').length;
    }

    result.scannedLineCount = lineCount;

    // Sort errors
    if (mergedOptions.sortBy) {
      sortErrors(result.errors, mergedOptions.sortBy);
    }

    // Generate summary
    result.summary = generateSummary(result);

    // Calculate processing time
    result.processingTimeMs = Date.now() - startTime;

    if (mergedOptions.verbose) {
      console.log(`Completed TypeScript error scan in ${result.processingTimeMs}ms`);
      console.log(`Found ${result.totalErrors} errors and ${result.totalWarnings} warnings`);
    }

    // Log success
    logSecurityEvent('TypeScript error scan completed', 'info', { 
      errorCount: String(result.totalErrors),
      warningCount: String(result.totalWarnings),
      fileCount: String(result.fileCount)
    });

    return result;
  } catch (error) {
    console.error('Error finding TypeScript errors:', error);
    
    // Log error
    logSecurityEvent('TypeScript error scan failed', 'error', { 
      errorMessage: (error as Error).message
    });
    
    // Return partial result if available
    result.processingTimeMs = Date.now() - startTime;
    result.summary = `Error: ${(error as Error).message}`;
    return result;
  }
}

/**
 * Find TypeScript files in a directory
 */
async function findTypeScriptFiles(
  directory: string,
  patterns?: string[],
  excludePatterns?: string[],
  includeNodeModules: boolean = false
): Promise<string[]> {
  const files: string[] = [];

  async function traverseDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules if not explicitly included
      if (!includeNodeModules && entry.name === 'node_modules') {
        continue;
      }

      // Skip excluded patterns
      if (excludePatterns && 
          excludePatterns.some(pattern => fullPath.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        await traverseDirectory(fullPath);
      } else if (entry.isFile() && 
                (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        
        // Check if file matches patterns
        if (!patterns || patterns.length === 0 || 
            patterns.some(pattern => fullPath.includes(pattern))) {
          files.push(fullPath);
        }
      }
    }
  }

  await traverseDirectory(directory);
  return files;
}

/**
 * Determine if a severity should be included based on minimum severity
 */
function shouldIncludeSeverity(severity: ErrorSeverity, minSeverity: ErrorSeverity | undefined): boolean {
  // If no minimum severity specified, include everything
  if (!minSeverity) {
    return true;
  }
  
  const severityOrder = {
    [ErrorSeverity.Error]: 0,
    [ErrorSeverity.Warning]: 1,
    [ErrorSeverity.Suggestion]: 2,
    [ErrorSeverity.Message]: 3
  };

  return severityOrder[severity] <= severityOrder[minSeverity];
}

/**
 * Determine error severity
 */
function determineSeverity(
  category: ts.DiagnosticCategory,
  code: number,
  message: string
): ErrorSeverity {
  // Map TypeScript diagnostic category to our severity
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return ErrorSeverity.Error;
    case ts.DiagnosticCategory.Warning:
      return ErrorSeverity.Warning;
    case ts.DiagnosticCategory.Suggestion:
      return ErrorSeverity.Suggestion;
    case ts.DiagnosticCategory.Message:
      return ErrorSeverity.Message;
    default:
      return ErrorSeverity.Error;
  }
}

/**
 * Categorize TypeScript errors
 */
function categorizeError(code: number, message: string): ErrorCategory {
  // Type errors
  if (message.includes('type') || 
      message.includes('signature') || 
      message.includes('interface') ||
      message.includes('expected') ||
      message.includes('compatible')) {
    return ErrorCategory.Type;
  }

  // Import/export errors
  if (message.includes('import') || 
      message.includes('export') || 
      message.includes('require') ||
      message.includes('module')) {
    return ErrorCategory.Import;
  }

  // Declaration errors
  if (message.includes('declare') || 
      message.includes('cannot find name') || 
      message.includes('not defined') ||
      message.includes('identifier')) {
    return ErrorCategory.Declaration;
  }

  // Syntax errors
  if (message.includes('syntax') || 
      message.includes('expected') || 
      message.includes('token') ||
      message.includes('parsing')) {
    return ErrorCategory.Syntax;
  }
  
  // Configuration errors
  if (message.includes('config') || 
      message.includes('settings') || 
      message.includes('option')) {
    return ErrorCategory.Configuration;
  }

  // Default to Generic
  return ErrorCategory.Generic;
}

/**
 * Get a code snippet for an error
 */
function getErrorSnippet(text: string, start: number, length: number): string {
  return text.substring(start, start + length);
}

/**
 * Get context around an error
 */
function getContextAround(text: string, position: number, lineCount: number): string {
  const lineStart = getLineStart(text, position);
  const lineEnd = getLineEnd(text, position);
  
  // Get context before
  let startPos = lineStart;
  for (let i = 0; i < lineCount; i++) {
    const prevLineStart = getLineStartBefore(text, startPos);
    if (prevLineStart < 0) {
      break;
    }
    startPos = prevLineStart;
  }
  
  // Get context after
  let endPos = lineEnd;
  for (let i = 0; i < lineCount; i++) {
    const nextLineEnd = getLineEndAfter(text, endPos);
    if (nextLineEnd > text.length) {
      break;
    }
    endPos = nextLineEnd;
  }
  
  return text.substring(startPos, endPos);
}

/**
 * Get the start position of the line containing the position
 */
function getLineStart(text: string, position: number): number {
  for (let i = position; i >= 0; i--) {
    if (text[i] === '\n') {
      return i + 1;
    }
  }
  return 0;
}

/**
 * Get the end position of the line containing the position
 */
function getLineEnd(text: string, position: number): number {
  for (let i = position; i < text.length; i++) {
    if (text[i] === '\n') {
      return i + 1;
    }
  }
  return text.length;
}

/**
 * Get the start position of the line before the given position
 */
function getLineStartBefore(text: string, position: number): number {
  const lineStart = getLineStart(text, position - 1);
  if (lineStart < position) {
    return lineStart;
  }
  return -1;
}

/**
 * Get the end position of the line after the given position
 */
function getLineEndAfter(text: string, position: number): number {
  if (position >= text.length) {
    return text.length;
  }
  return getLineEnd(text, position);
}

/**
 * Get a suggested fix based on error type
 */
function getSuggestedFix(code: string, message: string, category: ErrorCategory): string | undefined {
  // Common error codes with known fixes
  switch (code) {
    case '2304': // Cannot find name
      if (message.includes('React')) {
        return "Import React by adding: import React from 'react';";
      }
      return "Ensure the variable is defined or import it from the correct module.";
      
    case '2339': // Property does not exist on type
      return "Verify the property name or add it to the type definition.";
      
    case '2345': // Argument type is not assignable
      return "Ensure the argument type matches the parameter type.";
      
    case '2322': // Type is not assignable
      return "Make sure the types are compatible or add a type assertion.";
      
    case '2307': // Cannot find module
      return "Check the import path and ensure the module is installed.";
      
    case '2769': // No overload matches this call
      return "Review the function signature and ensure arguments match the parameter types.";
      
    case '2532': // Object is possibly undefined
      return "Add a null check or use the optional chaining operator (?.).";
  }

  // Category-based generic suggestions
  switch (category) {
    case ErrorCategory.Syntax:
      return "Check for syntax errors like missing brackets, semicolons, or incorrect syntax.";
      
    case ErrorCategory.Type:
      return "Verify that the types are compatible or add appropriate type assertions.";
      
    case ErrorCategory.Import:
      return "Ensure the import path is correct and the module is installed.";
      
    case ErrorCategory.Declaration:
      return "Make sure the variable is defined or imported before use.";
      
    case ErrorCategory.Module:
      return "Check module resolution settings in tsconfig.json.";
      
    default:
      return undefined;
  }
}

/**
 * Sort errors based on specified criteria
 */
function sortErrors(errors: TypeScriptErrorDetail[], sortBy: string): void {
  switch (sortBy) {
    case 'severity':
      errors.sort((a, b) => {
        const severityOrder = {
          [ErrorSeverity.Error]: 0,
          [ErrorSeverity.Warning]: 1,
          [ErrorSeverity.Suggestion]: 2,
          [ErrorSeverity.Message]: 3
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      break;
      
    case 'file':
      errors.sort((a, b) => a.file.localeCompare(b.file));
      break;
      
    case 'category':
      errors.sort((a, b) => a.category.localeCompare(b.category));
      break;
      
    case 'code':
      errors.sort((a, b) => a.code.localeCompare(b.code));
      break;
  }
}

/**
 * Generate a summary of the findings
 */
function generateSummary(result: ErrorFindingResult): string {
  const fileCount = Object.keys(result.errorsByFile).length;
  
  let summary = `Found ${result.totalErrors} errors and ${result.totalWarnings} warnings in ${fileCount} files.\n`;
  
  // Most common error categories
  const categories = Object.entries(result.errorsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  if (categories.length > 0) {
    summary += '\nMost common error categories:\n';
    for (const [category, count] of categories) {
      summary += `- ${category}: ${count}\n`;
    }
  }
  
  // Most common error codes
  const codes = Object.entries(result.errorsByCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  if (codes.length > 0) {
    summary += '\nMost common error codes:\n';
    for (const [code, count] of codes) {
      summary += `- ${code}: ${count}\n`;
    }
  }
  
  // Files with most errors
  const files = Object.entries(result.errorsByFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  if (files.length > 0) {
    summary += '\nFiles with most errors:\n';
    for (const [file, count] of files) {
      summary += `- ${file}: ${count}\n`;
    }
  }
  
  summary += `\nProcessed ${result.fileCount} files (${result.scannedLineCount} lines) in ${result.processingTimeMs}ms.`;
  
  return summary;
}

// Export a singleton instance with default options
export const tsErrorFinder = {
  findErrors: (options: ErrorFinderOptions = defaultOptions) => findTypeScriptErrors(options)
};