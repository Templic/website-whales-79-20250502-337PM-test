/**
 * TypeScript Error Scanner
 * 
 * This module provides utilities for scanning TypeScript projects for errors
 * and storing them in the database for analysis and fixing.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { ErrorCategory, ErrorSeverity, ErrorStatus } from '../../shared/schema';
import { InsertTypeScriptError, InsertScanResult } from '../tsErrorStorage';
import { tsErrorStorage } from '../tsErrorStorage';

const execAsync = promisify(exec);

/**
 * Configuration options for the TypeScript error scanner
 */
export interface ScannerOptions {
  project?: string;
  tsconfig?: string;
  exclude?: string[];
  include?: string[];
  maxErrors?: number;
  deepScan?: boolean;
  aiEnhanced?: boolean;
  incremental?: boolean;
  verbose?: boolean;
}

/**
 * Default configuration for the TypeScript error scanner
 */
const DEFAULT_OPTIONS: ScannerOptions = {
  project: '.',
  tsconfig: './tsconfig.json',
  exclude: ['node_modules', 'dist', 'build', '.git'],
  include: ['src', 'server', 'client', 'shared'],
  maxErrors: 500,
  deepScan: false,
  aiEnhanced: false,
  incremental: true,
  verbose: false
};

/**
 * Result of a TypeScript error scan
 */
export interface ScanResult {
  scanId: number;
  totalErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  scanDurationMs: number;
  isDeepScan: boolean;
  isAiEnhanced: boolean;
  newErrorsFound: number;
  errorsByCategory: Record<string, number>;
  errorsByFile: Record<string, number>;
}

/**
 * Parsed TypeScript error
 */
export interface ParsedError {
  filePath: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  lineContent?: string;
  context?: string;
}

/**
 * Classify an error into a category
 * 
 * @param code The TypeScript error code
 * @param message The error message
 * @returns The appropriate error category
 */
function classifyErrorCategory(code: string, message: string): ErrorCategory {
  // Type mismatches
  if (code.startsWith('TS2') && (message.includes('type') || message.includes('Type'))) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  
  // Missing types
  if (message.includes('implicit any') || message.includes('no type specified')) {
    return ErrorCategory.MISSING_TYPE;
  }
  
  // Import errors
  if (message.includes('Cannot find module') || message.includes('has no exported member')) {
    return ErrorCategory.IMPORT_ERROR;
  }
  
  // Null reference errors
  if (message.includes('null') || message.includes('undefined')) {
    return ErrorCategory.NULL_REFERENCE;
  }
  
  // Interface mismatches
  if (message.includes('interface') || message.includes('implements')) {
    return ErrorCategory.INTERFACE_MISMATCH;
  }
  
  // Generic constraint errors
  if (message.includes('constraint') || message.includes('extends')) {
    return ErrorCategory.GENERIC_CONSTRAINT;
  }
  
  // Declaration errors
  if (message.includes('declare') || message.includes('declaration')) {
    return ErrorCategory.DECLARATION_ERROR;
  }
  
  // Syntax errors
  if (message.includes('syntax') || 
      message.includes('expected') ||
      message.includes('missing') ||
      code.startsWith('TS1')) {
    return ErrorCategory.SYNTAX_ERROR;
  }
  
  // Default to Other
  return ErrorCategory.OTHER;
}

/**
 * Determine the severity of an error
 * 
 * @param code The TypeScript error code
 * @param message The error message
 * @returns The error severity
 */
function determineErrorSeverity(code: string, message: string): ErrorSeverity {
  // Critical errors (prevent compilation completely)
  if (code.startsWith('TS1') || 
      message.includes('syntax') || 
      message.includes('expected')) {
    return ErrorSeverity.CRITICAL;
  }
  
  // High severity (likely to cause runtime errors)
  if (message.includes('null') || 
      message.includes('undefined') || 
      message.includes('Cannot find') || 
      message.includes('no exported member')) {
    return ErrorSeverity.HIGH;
  }
  
  // Medium severity (potential issues but might work)
  if (message.includes('type') ||
      message.includes('implicit any') ||
      message.includes('assignable')) {
    return ErrorSeverity.MEDIUM;
  }
  
  // Default to low severity (code style issues, etc.)
  return ErrorSeverity.LOW;
}

/**
 * Parse TypeScript compiler output to extract errors
 * 
 * @param output The TypeScript compiler output
 * @returns Array of parsed errors
 */
function parseTypeScriptErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const errorRegex = /([^(]+)\((\d+),(\d+)\):\s+error\s+(\w+):\s+(.+)$/gm;
  
  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    const [_, filePath, line, column, code, message] = match;
    
    // Only process .ts and .tsx files
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      continue;
    }
    
    const category = classifyErrorCategory(code, message);
    const severity = determineErrorSeverity(code, message);
    
    const error: ParsedError = {
      filePath: filePath.trim(),
      line: parseInt(line, 10),
      column: parseInt(column, 10),
      code,
      message: message.trim(),
      category,
      severity
    };
    
    // Try to get the line content and context
    try {
      if (fs.existsSync(error.filePath)) {
        const fileContent = fs.readFileSync(error.filePath, 'utf8');
        const lines = fileContent.split('\n');
        
        // Get the error line and some context (a few lines before and after)
        const lineIndex = error.line - 1;
        error.lineContent = lines[lineIndex] || '';
        
        const contextStart = Math.max(0, lineIndex - 2);
        const contextEnd = Math.min(lines.length - 1, lineIndex + 2);
        error.context = lines.slice(contextStart, contextEnd + 1).join('\n');
      }
    } catch (err) {
      console.warn(`Failed to read file ${error.filePath} for context:`, err);
    }
    
    errors.push(error);
  }
  
  return errors;
}

/**
 * Run TypeScript compiler to find errors
 * 
 * @param options Scanner options
 * @returns Array of parsed errors and compilation output
 */
async function runTypeScriptCompiler(options: ScannerOptions): Promise<{ errors: ParsedError[], output: string }> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Build the TypeScript compiler command
  let command = `npx tsc --noEmit --pretty false`;
  
  if (config.tsconfig) {
    command += ` --project ${config.tsconfig}`;
  }
  
  if (config.verbose) {
    console.log(`Running TypeScript compiler: ${command}`);
  }
  
  try {
    // Execute the TypeScript compiler
    const { stdout, stderr } = await execAsync(command);
    const output = stdout || stderr;
    
    // Parse the errors from the compiler output
    const errors = parseTypeScriptErrors(output);
    
    // Apply filtering based on include/exclude patterns
    const filteredErrors = errors.filter(error => {
      // Check exclude patterns
      for (const excludePattern of config.exclude || []) {
        if (error.filePath.includes(excludePattern)) {
          return false;
        }
      }
      
      // Check include patterns (if specified)
      if (config.include && config.include.length > 0) {
        for (const includePattern of config.include) {
          if (error.filePath.includes(includePattern)) {
            return true;
          }
        }
        return false;
      }
      
      return true;
    });
    
    // Limit the number of errors if needed
    const limitedErrors = filteredErrors.slice(0, config.maxErrors);
    
    return { errors: limitedErrors, output };
  } catch (err) {
    // TypeScript compiler returns non-zero exit code when it finds errors,
    // which causes exec to throw an error. We need to handle this.
    if (err.stdout) {
      const output = err.stdout;
      const errors = parseTypeScriptErrors(output);
      
      // Filter and limit errors
      const filteredErrors = errors.filter(error => {
        for (const excludePattern of config.exclude || []) {
          if (error.filePath.includes(excludePattern)) {
            return false;
          }
        }
        
        if (config.include && config.include.length > 0) {
          for (const includePattern of config.include) {
            if (error.filePath.includes(includePattern)) {
              return true;
            }
          }
          return false;
        }
        
        return true;
      });
      
      const limitedErrors = filteredErrors.slice(0, config.maxErrors);
      
      return { errors: limitedErrors, output };
    }
    
    console.error('Failed to run TypeScript compiler:', err);
    throw err;
  }
}

/**
 * Scan a TypeScript project for errors
 * 
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function scanForErrors(options: ScannerOptions = {}): Promise<ScanResult> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  
  // Get existing errors for incremental scanning
  let existingErrors: Record<string, boolean> = {};
  if (config.incremental) {
    const allErrors = await tsErrorStorage.getAllTypeScriptErrors({});
    existingErrors = allErrors.reduce((acc, error) => {
      // Create a unique key for each error
      const key = `${error.file_path}:${error.line_number}:${error.column_number}:${error.error_code}`;
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }
  
  // Run the TypeScript compiler to find errors
  const { errors, output } = await runTypeScriptCompiler(config);
  
  // Calculate statistics
  let totalErrors = 0;
  let criticalErrors = 0;
  let highErrors = 0;
  let mediumErrors = 0;
  let lowErrors = 0;
  let newErrorsFound = 0;
  const errorsByCategory: Record<string, number> = {};
  const errorsByFile: Record<string, number> = {};
  
  // Store errors in the database and calculate statistics
  for (const error of errors) {
    // Create a unique key for this error
    const errorKey = `${error.filePath}:${error.line}:${error.column}:${error.code}`;
    
    // Skip if we've already seen this error (for incremental scanning)
    const isNewError = !existingErrors[errorKey];
    if (config.incremental && !isNewError && !config.deepScan) {
      continue;
    }
    
    // Count the error in our statistics
    totalErrors++;
    newErrorsFound += isNewError ? 1 : 0;
    
    // Count by severity
    if (error.severity === ErrorSeverity.CRITICAL) criticalErrors++;
    else if (error.severity === ErrorSeverity.HIGH) highErrors++;
    else if (error.severity === ErrorSeverity.MEDIUM) mediumErrors++;
    else if (error.severity === ErrorSeverity.LOW) lowErrors++;
    
    // Count by category
    errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    
    // Count by file
    errorsByFile[error.filePath] = (errorsByFile[error.filePath] || 0) + 1;
    
    // Skip storing if it's not a new error and we're not doing a deep scan
    if (config.incremental && !isNewError && !config.deepScan) {
      continue;
    }
    
    // Store the error in the database
    const errorData: InsertTypeScriptError = {
      error_code: error.code,
      file_path: error.filePath,
      line_number: error.line,
      column_number: error.column,
      error_message: error.message,
      error_context: error.context || error.lineContent || '',
      category: error.category,
      severity: error.severity,
      status: ErrorStatus.PENDING,
      first_detected_at: new Date(),
      last_occurrence_at: new Date(),
      occurrence_count: 1,
      metadata: {
        compiler_output: output,
        line_content: error.lineContent
      }
    };
    
    try {
      // If it's a new error, create it; otherwise update it
      if (isNewError) {
        await tsErrorStorage.createTypeScriptError(errorData);
      } else {
        // Find the existing error to update
        const existingError = await tsErrorStorage.getTypeScriptErrorByLocation(
          error.filePath,
          error.line,
          error.column,
          error.code
        );
        
        if (existingError) {
          await tsErrorStorage.updateTypeScriptError(existingError.id, {
            occurrence_count: existingError.occurrence_count + 1,
            last_occurrence_at: new Date()
          });
        }
      }
    } catch (err) {
      console.error(`Failed to store error ${error.code} in ${error.filePath}:`, err);
    }
  }
  
  const endTime = Date.now();
  const scanDurationMs = endTime - startTime;
  
  // Store the scan result
  const scanData: InsertScanResult = {
    scan_type: config.deepScan ? 'deep' : 'standard',
    total_errors: totalErrors,
    critical_errors: criticalErrors,
    high_errors: highErrors,
    medium_errors: mediumErrors,
    low_errors: lowErrors,
    scan_duration_ms: scanDurationMs,
    is_deep_scan: config.deepScan || false,
    is_ai_enhanced: config.aiEnhanced || false,
    scan_metadata: {
      new_errors_found: newErrorsFound,
      errors_by_category: errorsByCategory,
      errors_by_file: errorsByFile,
      scan_options: config
    }
  };
  
  const savedScan = await tsErrorStorage.createScanResult(scanData);
  
  // Return the scan result
  return {
    scanId: savedScan.id,
    totalErrors,
    criticalErrors,
    highErrors,
    mediumErrors,
    lowErrors,
    scanDurationMs,
    isDeepScan: config.deepScan || false,
    isAiEnhanced: config.aiEnhanced || false,
    newErrorsFound,
    errorsByCategory,
    errorsByFile
  };
}

/**
 * Run a deep scan of the TypeScript project for errors
 * 
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function deepScan(options: ScannerOptions = {}): Promise<ScanResult> {
  return scanForErrors({
    ...options,
    deepScan: true,
    incremental: false
  });
}

/**
 * Run an incremental scan, only storing new errors
 * 
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function incrementalScan(options: ScannerOptions = {}): Promise<ScanResult> {
  return scanForErrors({
    ...options,
    incremental: true
  });
}

/**
 * Run an AI-enhanced scan, using AI to analyze errors
 * 
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function aiEnhancedScan(options: ScannerOptions = {}): Promise<ScanResult> {
  const scanResult = await scanForErrors({
    ...options,
    aiEnhanced: true
  });
  
  // After the scan, we would normally trigger AI analysis for each error
  // But we'll skip the actual implementation here since it's complex and depends on other modules
  
  return scanResult;
}

/**
 * Scan a specific file for TypeScript errors
 * 
 * @param filePath Path to the file to scan
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function scanFile(filePath: string, options: ScannerOptions = {}): Promise<ScanResult> {
  return scanForErrors({
    ...options,
    include: [filePath]
  });
}

/**
 * Scan an array of files for TypeScript errors
 * 
 * @param filePaths Array of file paths to scan
 * @param options Scanner options
 * @returns Scan result including error statistics
 */
export async function scanFiles(filePaths: string[], options: ScannerOptions = {}): Promise<ScanResult> {
  return scanForErrors({
    ...options,
    include: filePaths
  });
}

// Export the module
export default {
  scanForErrors,
  deepScan,
  incrementalScan,
  aiEnhancedScan,
  scanFile,
  scanFiles
};