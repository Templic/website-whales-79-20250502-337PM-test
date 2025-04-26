/**
 * TypeScript Error Analyzer
 * 
 * This module provides functions to analyze TypeScript errors in a project.
 * It scans the project using the TypeScript Compiler API, categorizes errors,
 * and provides detailed information about each error.
 */

import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { ErrorCategory, ErrorSeverity } from '../../shared/schema';
import { createHash } from 'crypto';

// Interfaces
export interface TypeScriptError {
  code: number;
  message: string;
  file: string;
  line: number;
  column: number;
  lineContent?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  suggestedFix?: string;
  hash: string;
}

export interface AnalysisResult {
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  errorsByCategory: Record<string, TypeScriptError[]>;
  errorsByFile: Record<string, TypeScriptError[]>;
  startTime: Date;
  endTime: Date;
  duration: number;
  dependencyInfo?: DependencyInfo;
}

export interface AnalysisOptions {
  deep?: boolean;
  useAI?: boolean;
  categories?: string[];
  exclude?: string[];
  saveToDb?: boolean;
}

export interface DependencyInfo {
  rootCauses: RootCauseError[];
  cascadingErrors: CascadingError[];
  dependencyTree: Record<string, string[]>;
}

export interface RootCauseError extends TypeScriptError {
  impactedErrors: string[]; // Array of error hashes that this error impacts
  impactScore: number; // The higher the score, the more important to fix this error
}

export interface CascadingError extends TypeScriptError {
  rootCauseHash: string; // Hash of the root cause error
  dependencyChain: string[]; // Chain of error hashes from root to this error
}

/**
 * Analyzes TypeScript errors in a project
 * 
 * @param rootDir - The root directory of the project
 * @param tsconfigPath - Path to the tsconfig.json file
 * @param options - Analysis options
 * @returns Analysis result
 */
export async function analyzeTypeScriptErrors(
  rootDir: string,
  tsconfigPath: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const startTime = new Date();
  
  // Set default options
  const opts = {
    deep: options.deep || false,
    useAI: options.useAI || false,
    categories: options.categories || [],
    exclude: options.exclude || [],
    saveToDb: options.saveToDb !== undefined ? options.saveToDb : true
  };
  
  // Load tsconfig.json
  const tsconfigFile = path.isAbsolute(tsconfigPath) 
    ? tsconfigPath 
    : path.join(rootDir, tsconfigPath);
  
  if (!fs.existsSync(tsconfigFile)) {
    throw new Error(`tsconfig.json not found at ${tsconfigFile}`);
  }
  
  const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf8');
  const tsconfig = JSON.parse(tsconfigContent);
  
  // Create TypeScript program
  const configParseResult = ts.parseJsonConfigFileContent(
    tsconfig,
    ts.sys,
    path.dirname(tsconfigFile)
  );
  
  // Apply exclusions
  if (opts.exclude && opts.exclude.length > 0) {
    const excludePatterns = opts.exclude.map(pattern => {
      // Convert glob patterns to regex
      return new RegExp(pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.'));
    });
    
    configParseResult.fileNames = configParseResult.fileNames.filter(fileName => {
      const relativePath = path.relative(rootDir, fileName);
      return !excludePatterns.some(pattern => pattern.test(relativePath));
    });
  }
  
  const program = ts.createProgram({
    rootNames: configParseResult.fileNames,
    options: configParseResult.options
  });
  
  // Get diagnostic messages
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  const semanticDiagnostics = program.getSemanticDiagnostics();
  const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];
  
  // Process diagnostics
  const errors: TypeScriptError[] = [];
  
  for (const diagnostic of allDiagnostics) {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      const lineContent = diagnostic.file.text.split('\n')[line];
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const category = categorizeError(diagnostic.code, message);
      const severity = determineSeverity(diagnostic.code, category, message);
      
      // Skip if category filtering is enabled and this category is not included
      if (opts.categories.length > 0 && !opts.categories.includes(category)) {
        continue;
      }
      
      // Create error hash for identification
      const hash = createHash('md5')
        .update(`${diagnostic.file.fileName}:${line}:${character}:${diagnostic.code}`)
        .digest('hex');
      
      errors.push({
        code: diagnostic.code,
        message,
        file: diagnostic.file.fileName,
        line: line + 1, // Convert to 1-based line number
        column: character + 1, // Convert to 1-based column number
        lineContent,
        category: category as ErrorCategory,
        severity: severity as ErrorSeverity,
        hash
      });
    }
  }
  
  // Categorize errors
  const errorsByCategory: Record<string, TypeScriptError[]> = {};
  const errorsByFile: Record<string, TypeScriptError[]> = {};
  
  // Initialize categories
  Object.values(ErrorCategory).forEach(category => {
    errorsByCategory[category] = [];
  });
  
  // Populate categories and files
  for (const error of errors) {
    // Add to category
    errorsByCategory[error.category].push(error);
    
    // Add to file
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  }
  
  // Count errors by severity
  const criticalErrors = errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
  const highSeverityErrors = errors.filter(e => e.severity === ErrorSeverity.HIGH).length;
  const mediumSeverityErrors = errors.filter(e => e.severity === ErrorSeverity.MEDIUM).length;
  const lowSeverityErrors = errors.filter(e => e.severity === ErrorSeverity.LOW).length;
  
  // Perform deep analysis if requested
  let dependencyInfo: DependencyInfo | undefined;
  
  if (opts.deep) {
    dependencyInfo = await analyzeErrorDependencies(errors, program);
  }
  
  // Add AI-powered suggestions if requested
  if (opts.useAI) {
    await addAISuggestions(errors);
  }
  
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  // Create analysis result
  const result: AnalysisResult = {
    totalErrors: errors.length,
    criticalErrors,
    highSeverityErrors,
    mediumSeverityErrors,
    lowSeverityErrors,
    errorsByCategory,
    errorsByFile,
    startTime,
    endTime,
    duration,
    dependencyInfo
  };
  
  return result;
}

/**
 * Categorizes a TypeScript error based on its code and message
 * 
 * @param code - Error code
 * @param message - Error message
 * @returns Error category
 */
function categorizeError(code: number, message: string): ErrorCategory {
  // Type mismatch errors
  if (
    code === 2322 || // Type 'X' is not assignable to type 'Y'
    code === 2345 || // Argument of type 'X' is not assignable to parameter of type 'Y'
    code === 2741    // Property 'X' is missing in type 'Y' but required in type 'Z'
  ) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  
  // Missing type errors
  if (
    code === 7006 || // Parameter 'X' implicitly has an 'any' type
    code === 7005 || // Variable 'X' implicitly has an 'any' type
    code === 7010    // 'X', which lacks return-type annotation, implicitly has an 'any' return type
  ) {
    return ErrorCategory.MISSING_TYPE;
  }
  
  // Import errors
  if (
    code === 2307 || // Cannot find module 'X'
    code === 1192 || // Module 'X' has no default export
    code === 2305    // Module 'X' has no exported member 'Y'
  ) {
    return ErrorCategory.IMPORT_ERROR;
  }
  
  // Null reference errors
  if (
    code === 2531 || // Object is possibly 'null'
    code === 2532 || // Object is possibly 'undefined'
    code === 2533    // Object is possibly 'null' or 'undefined'
  ) {
    return ErrorCategory.NULL_REFERENCE;
  }
  
  // Interface mismatch errors
  if (
    code === 2420 || // Class 'X' incorrectly implements interface 'Y'
    code === 2559    // Type 'X' has no properties in common with type 'Y'
  ) {
    return ErrorCategory.INTERFACE_MISMATCH;
  }
  
  // Generic constraint errors
  if (
    code === 2344 || // Type 'X' does not satisfy the constraint 'Y'
    code === 2352    // Conversion of type 'X' to type 'Y' may be a mistake because neither type sufficiently overlaps with the other
  ) {
    return ErrorCategory.GENERIC_CONSTRAINT;
  }
  
  // Declaration errors
  if (
    code === 2451 || // Cannot redeclare block-scoped variable 'X'
    code === 2300 || // Duplicate identifier 'X'
    code === 2393    // Duplicate function implementation
  ) {
    return ErrorCategory.DECLARATION_ERROR;
  }
  
  // Syntax errors
  if (
    code === 1005 || // ',' expected
    code === 1003 || // Identifier expected
    code === 1143 || // The import meta object is only allowed in module files
    code === 1128    // Declaration or statement expected
  ) {
    return ErrorCategory.SYNTAX_ERROR;
  }
  
  // Default to OTHER category
  return ErrorCategory.OTHER;
}

/**
 * Determines the severity of a TypeScript error
 * 
 * @param code - Error code
 * @param category - Error category
 * @param message - Error message
 * @returns Error severity
 */
function determineSeverity(
  code: number,
  category: ErrorCategory,
  message: string
): ErrorSeverity {
  // Critical errors (prevent compilation)
  if (
    category === ErrorCategory.SYNTAX_ERROR ||
    category === ErrorCategory.IMPORT_ERROR ||
    code === 2307 || // Cannot find module 'X'
    message.includes('is not assignable to parameter') ||
    message.includes('expected 1 arguments, but got 0')
  ) {
    return ErrorSeverity.CRITICAL;
  }
  
  // High severity errors (likely runtime issues)
  if (
    category === ErrorCategory.NULL_REFERENCE ||
    category === ErrorCategory.TYPE_MISMATCH ||
    message.includes('Object is possibly') ||
    message.includes('undefined') ||
    message.includes('null')
  ) {
    return ErrorSeverity.HIGH;
  }
  
  // Medium severity errors (might cause runtime issues)
  if (
    category === ErrorCategory.INTERFACE_MISMATCH ||
    category === ErrorCategory.GENERIC_CONSTRAINT ||
    category === ErrorCategory.DECLARATION_ERROR
  ) {
    return ErrorSeverity.MEDIUM;
  }
  
  // Low severity errors (code quality issues)
  if (
    category === ErrorCategory.MISSING_TYPE ||
    message.includes('implicitly has an \'any\' type')
  ) {
    return ErrorSeverity.LOW;
  }
  
  // Default to MEDIUM severity
  return ErrorSeverity.MEDIUM;
}

/**
 * Analyzes dependencies between errors
 * 
 * @param errors - List of TypeScript errors
 * @param program - TypeScript program
 * @returns Dependency information
 */
async function analyzeErrorDependencies(
  errors: TypeScriptError[],
  program: ts.Program
): Promise<DependencyInfo> {
  // Implement dependency tracking logic
  // This is a placeholder implementation
  const rootCauses: RootCauseError[] = [];
  const cascadingErrors: CascadingError[] = [];
  const dependencyTree: Record<string, string[]> = {};
  
  // For now, consider type definition errors as root causes
  for (const error of errors) {
    if (
      error.category === ErrorCategory.MISSING_TYPE ||
      error.category === ErrorCategory.IMPORT_ERROR
    ) {
      // This is a root cause error
      rootCauses.push({
        ...error,
        impactedErrors: [],
        impactScore: 0
      });
    } else {
      // This is potentially a cascading error
      cascadingErrors.push({
        ...error,
        rootCauseHash: '',
        dependencyChain: []
      });
    }
    
    // Initialize in dependency tree
    dependencyTree[error.hash] = [];
  }
  
  // Build dependency relationships
  // In a real implementation, this would analyze code structure to find dependencies
  
  // For this simplified implementation, we'll use file-based heuristics
  // Errors in the same file might be related
  const fileGroups: Record<string, TypeScriptError[]> = {};
  
  for (const error of errors) {
    if (!fileGroups[error.file]) {
      fileGroups[error.file] = [];
    }
    fileGroups[error.file].push(error);
  }
  
  // For each file, find potential dependencies
  for (const file in fileGroups) {
    const fileErrors = fileGroups[file];
    
    // Sort by line number (ascending)
    fileErrors.sort((a, b) => a.line - b.line);
    
    // Errors occurring earlier might affect later errors
    for (let i = 0; i < fileErrors.length; i++) {
      const earlyError = fileErrors[i];
      
      // Find possible root causes
      const isRootCause = rootCauses.some(rc => rc.hash === earlyError.hash);
      
      if (isRootCause) {
        // This is a root cause, look for cascading errors that might depend on it
        for (let j = i + 1; j < fileErrors.length; j++) {
          const laterError = fileErrors[j];
          
          // Add to dependency tree
          dependencyTree[earlyError.hash].push(laterError.hash);
          
          // Update root cause info
          const rootCause = rootCauses.find(rc => rc.hash === earlyError.hash);
          if (rootCause) {
            rootCause.impactedErrors.push(laterError.hash);
            rootCause.impactScore += 1;
          }
          
          // Update cascading error info
          const cascadingError = cascadingErrors.find(ce => ce.hash === laterError.hash);
          if (cascadingError) {
            cascadingError.rootCauseHash = earlyError.hash;
            cascadingError.dependencyChain.push(earlyError.hash);
          }
        }
      }
    }
  }
  
  // Sort root causes by impact score (descending)
  rootCauses.sort((a, b) => b.impactScore - a.impactScore);
  
  return {
    rootCauses,
    cascadingErrors,
    dependencyTree
  };
}

/**
 * Adds AI-powered suggestions to errors
 * 
 * @param errors - List of TypeScript errors
 */
async function addAISuggestions(errors: TypeScriptError[]): Promise<void> {
  // This is a placeholder for AI integration
  // In a real implementation, this would call the OpenAI API
  
  for (const error of errors) {
    // Add placeholder suggestions based on error category
    switch (error.category) {
      case ErrorCategory.TYPE_MISMATCH:
        error.suggestedFix = 'Ensure types match or add appropriate type conversion.';
        break;
      case ErrorCategory.MISSING_TYPE:
        error.suggestedFix = 'Add explicit type annotation.';
        break;
      case ErrorCategory.IMPORT_ERROR:
        error.suggestedFix = 'Check the module path and ensure the exported member exists.';
        break;
      case ErrorCategory.NULL_REFERENCE:
        error.suggestedFix = 'Add null/undefined check before accessing the property.';
        break;
      case ErrorCategory.INTERFACE_MISMATCH:
        error.suggestedFix = 'Implement all required properties from the interface.';
        break;
      case ErrorCategory.GENERIC_CONSTRAINT:
        error.suggestedFix = 'Ensure the type satisfies the required constraint.';
        break;
      case ErrorCategory.DECLARATION_ERROR:
        error.suggestedFix = 'Rename one of the duplicate identifiers.';
        break;
      case ErrorCategory.SYNTAX_ERROR:
        error.suggestedFix = 'Fix the syntax according to TypeScript grammar rules.';
        break;
      default:
        error.suggestedFix = 'Review the error message and fix accordingly.';
    }
  }
}

export default analyzeTypeScriptErrors;