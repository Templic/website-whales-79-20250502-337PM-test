/**
 * TypeScript Error Fixer
 * 
 * This module provides functions to automatically fix TypeScript errors in a project.
 * It works with the ts-error-analyzer to identify errors and apply appropriate fixes.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { analyzeTypeScriptErrors, TypeScriptError, DependencyInfo } from './ts-error-analyzer';
import { ErrorCategory, ErrorSeverity } from '../../shared/schema';

// Interfaces
export interface FixOptions {
  createBackups: boolean;
  backupDir: string;
  categories?: string[];
  maxErrorsPerFile?: number;
  logLevel: 'quiet' | 'normal' | 'verbose';
  dryRun: boolean;
  generateTypeDefinitions: boolean;
  fixMissingInterfaces: boolean;
  fixImplicitAny: boolean;
  fixMissingProperties: boolean;
  prioritizeCriticalErrors: boolean;
  fixDependencies?: boolean;
  useAI?: boolean;
  batchFix?: boolean;
  targetFiles?: string[];
  exclude?: string[];
  saveToDb?: boolean;
}

export interface FixResult {
  totalErrors: number;
  fixedErrors: number;
  unfixedErrors: number;
  fixedFiles: string[];
  unfixableFiles: string[];
  duration: number;
  fixDetails?: FixDetail[];
}

export interface FixDetail {
  file: string;
  line: number;
  errorCode: number;
  errorMessage: string;
  fixDescription: string;
  beforeFix?: string;
  afterFix?: string;
  fixMethod: 'automatic' | 'ai' | 'pattern';
  timestamp: Date;
}

/**
 * Fixes TypeScript errors in a project
 * 
 * @param rootDir - The root directory of the project
 * @param tsconfigPath - Path to the tsconfig.json file
 * @param options - Fix options
 * @returns Fix result
 */
export async function fixTypeScriptErrors(
  rootDir: string,
  tsconfigPath: string,
  options: Partial<FixOptions> = {}
): Promise<FixResult> {
  const startTime = new Date();
  
  // Set default options
  const opts: FixOptions = {
    createBackups: options.createBackups !== false,
    backupDir: options.backupDir || './ts-error-fixes-backup',
    categories: options.categories,
    maxErrorsPerFile: options.maxErrorsPerFile,
    logLevel: options.logLevel || 'normal',
    dryRun: options.dryRun || false,
    generateTypeDefinitions: options.generateTypeDefinitions !== false,
    fixMissingInterfaces: options.fixMissingInterfaces !== false,
    fixImplicitAny: options.fixImplicitAny !== false,
    fixMissingProperties: options.fixMissingProperties !== false,
    prioritizeCriticalErrors: options.prioritizeCriticalErrors !== false,
    fixDependencies: options.fixDependencies || false,
    useAI: options.useAI || false,
    batchFix: options.batchFix !== false,
    targetFiles: options.targetFiles,
    exclude: options.exclude,
    saveToDb: options.saveToDb !== undefined ? options.saveToDb : true
  };
  
  // Create backup directory if needed
  if (opts.createBackups && !opts.dryRun) {
    ensureDirectoryExists(opts.backupDir);
  }
  
  // Analyze the project to get errors
  const analysisOptions = {
    deep: opts.fixDependencies,
    useAI: opts.useAI,
    categories: opts.categories,
    exclude: opts.exclude,
    saveToDb: false
  };
  
  const analysis = await analyzeTypeScriptErrors(rootDir, tsconfigPath, analysisOptions);
  
  // Filter errors to target files if specified
  let errorsToFix: Record<string, TypeScriptError[]> = { ...analysis.errorsByFile };
  
  if (opts.targetFiles && opts.targetFiles.length > 0) {
    // Only include specified target files
    const targetFilePaths = opts.targetFiles.map(f => path.resolve(rootDir, f));
    
    const filteredErrors: Record<string, TypeScriptError[]> = {};
    for (const filePath of targetFilePaths) {
      if (errorsToFix[filePath]) {
        filteredErrors[filePath] = errorsToFix[filePath];
      }
    }
    
    errorsToFix = filteredErrors;
  }
  
  // Prepare for fixing
  const fixedFiles: string[] = [];
  const unfixableFiles: string[] = [];
  const fixDetails: FixDetail[] = [];
  let fixedErrorCount = 0;
  
  // Sort errors by dependency if that option is enabled
  if (opts.fixDependencies && analysis.dependencyInfo) {
    errorsToFix = sortErrorsByDependency(errorsToFix, analysis.dependencyInfo);
  } else if (opts.prioritizeCriticalErrors) {
    // Otherwise, sort by severity if prioritizing critical errors
    errorsToFix = sortErrorsBySeverity(errorsToFix);
  }
  
  // Process each file
  for (const [filePath, errors] of Object.entries(errorsToFix)) {
    let errorCount = errors.length;
    
    // Skip if max errors per file is set and there are too many errors
    if (opts.maxErrorsPerFile !== undefined && errorCount > opts.maxErrorsPerFile) {
      log(`Skipping ${filePath} (${errorCount} errors, max: ${opts.maxErrorsPerFile})`, 'normal', opts);
      unfixableFiles.push(filePath);
      continue;
    }
    
    // Apply fixes
    let fileContent = fs.readFileSync(filePath, 'utf8');
    let originalContent = fileContent;
    let fileModified = false;
    let fileFixedErrors = 0;
    
    // Create a backup if needed
    if (opts.createBackups && !opts.dryRun) {
      createBackup(filePath, opts.backupDir);
    }
    
    // Try batch fixing if enabled
    if (opts.batchFix) {
      const batchResult = await applyBatchFixes(filePath, fileContent, errors, opts);
      
      if (batchResult.modified) {
        fileContent = batchResult.content;
        fileModified = true;
        fileFixedErrors += batchResult.fixedErrors;
        fixDetails.push(...batchResult.details);
        
        log(`Applied batch fixes to ${filePath} (fixed ${batchResult.fixedErrors} errors)`, 'normal', opts);
      }
    }
    
    // If batch fixing failed or is disabled, try individual fixes
    if (!fileModified || fileFixedErrors < errorCount) {
      // Get remaining errors
      const remainingErrors = opts.batchFix
        ? errors.filter(e => !fixDetails.some(d => 
            d.file === filePath && 
            d.line === e.line && 
            d.errorCode === e.code
          ))
        : errors;
      
      // Apply individual fixes
      const individualResult = await applyIndividualFixes(filePath, fileContent, remainingErrors, opts);
      
      if (individualResult.modified) {
        fileContent = individualResult.content;
        fileModified = true;
        fileFixedErrors += individualResult.fixedErrors;
        fixDetails.push(...individualResult.details);
        
        log(`Applied individual fixes to ${filePath} (fixed ${individualResult.fixedErrors} errors)`, 'normal', opts);
      }
    }
    
    // Save changes if file was modified and not in dry run mode
    if (fileModified && !opts.dryRun) {
      fs.writeFileSync(filePath, fileContent, 'utf8');
      fixedFiles.push(filePath);
      fixedErrorCount += fileFixedErrors;
      
      log(`Updated ${filePath} (fixed ${fileFixedErrors} of ${errorCount} errors)`, 'normal', opts);
    } else if (fileModified && opts.dryRun) {
      // In dry run mode, count as fixed but don't save
      fixedFiles.push(filePath);
      fixedErrorCount += fileFixedErrors;
      
      log(`Would update ${filePath} (would fix ${fileFixedErrors} of ${errorCount} errors)`, 'normal', opts);
    } else {
      // No fixes applied
      unfixableFiles.push(filePath);
      log(`Could not fix errors in ${filePath}`, 'normal', opts);
    }
  }
  
  // Calculate total errors
  const totalErrors = Object.values(errorsToFix)
    .reduce((sum, errors) => sum + errors.length, 0);
  
  const unfixedErrors = totalErrors - fixedErrorCount;
  
  // Save fixes to database if enabled
  if (opts.saveToDb && fixDetails.length > 0 && !opts.dryRun) {
    await saveFixesToDb(fixDetails);
  }
  
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  // Return results
  return {
    totalErrors,
    fixedErrors: fixedErrorCount,
    unfixedErrors,
    fixedFiles,
    unfixableFiles,
    duration,
    fixDetails: opts.logLevel === 'verbose' ? fixDetails : undefined
  };
}

/**
 * Creates a backup of a file
 * 
 * @param filePath - Path to the file
 * @param backupDir - Backup directory
 */
function createBackup(filePath: string, backupDir: string): void {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);
  
  fs.copyFileSync(filePath, backupPath);
}

/**
 * Ensures that a directory exists, creating it if necessary
 * 
 * @param dirPath - Directory path
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Logs a message based on log level
 * 
 * @param message - Message to log
 * @param level - Message level
 * @param options - Fix options
 */
function log(message: string, level: 'quiet' | 'normal' | 'verbose', options: FixOptions): void {
  const levels = {
    quiet: 0,
    normal: 1,
    verbose: 2
  };
  
  if (levels[options.logLevel] >= levels[level]) {
    console.log(message);
  }
}

/**
 * Sorts errors by their dependencies
 * 
 * @param errorsByFile - Errors grouped by file
 * @param dependencyInfo - Dependency information
 * @returns Sorted errors
 */
function sortErrorsByDependency(
  errorsByFile: Record<string, TypeScriptError[]>,
  dependencyInfo: DependencyInfo
): Record<string, TypeScriptError[]> {
  const sorted: Record<string, TypeScriptError[]> = {};
  
  // Create a map of error hash to error
  const errorMap: Record<string, TypeScriptError> = {};
  
  for (const errors of Object.values(errorsByFile)) {
    for (const error of errors) {
      errorMap[error.hash] = error;
    }
  }
  
  // First, add root causes
  for (const rootCause of dependencyInfo.rootCauses) {
    const file = rootCause.file;
    
    if (!sorted[file]) {
      sorted[file] = [];
    }
    
    sorted[file].push(errorMap[rootCause.hash]);
  }
  
  // Then, add cascading errors in dependency order
  for (const cascadingError of dependencyInfo.cascadingErrors) {
    const file = cascadingError.file;
    
    if (!sorted[file]) {
      sorted[file] = [];
    }
    
    sorted[file].push(errorMap[cascadingError.hash]);
  }
  
  // Finally, add any errors that weren't in the dependency info
  for (const [file, errors] of Object.entries(errorsByFile)) {
    if (!sorted[file]) {
      sorted[file] = [];
    }
    
    for (const error of errors) {
      if (!sorted[file].some(e => e.hash === error.hash)) {
        sorted[file].push(error);
      }
    }
  }
  
  return sorted;
}

/**
 * Sorts errors by their severity
 * 
 * @param errorsByFile - Errors grouped by file
 * @returns Sorted errors
 */
function sortErrorsBySeverity(
  errorsByFile: Record<string, TypeScriptError[]>
): Record<string, TypeScriptError[]> {
  const sorted: Record<string, TypeScriptError[]> = {};
  
  // Define severity order (critical first)
  const severityOrder = {
    [ErrorSeverity.CRITICAL]: 0,
    [ErrorSeverity.HIGH]: 1,
    [ErrorSeverity.MEDIUM]: 2,
    [ErrorSeverity.LOW]: 3
  };
  
  for (const [file, errors] of Object.entries(errorsByFile)) {
    // Sort errors by severity
    const sortedErrors = [...errors].sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    sorted[file] = sortedErrors;
  }
  
  return sorted;
}

/**
 * Applies batch fixes to a file
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param errors - Errors in the file
 * @param options - Fix options
 * @returns Batch fix result
 */
async function applyBatchFixes(
  filePath: string,
  content: string,
  errors: TypeScriptError[],
  options: FixOptions
): Promise<{
  content: string;
  modified: boolean;
  fixedErrors: number;
  details: FixDetail[];
}> {
  // This is a placeholder for batch fixing logic
  // In a real implementation, this would apply fixes in batches
  
  // For now, let's simulate batch fixing for certain error categories
  let modified = false;
  let fixedErrors = 0;
  const details: FixDetail[] = [];
  
  // Group errors by category
  const errorsByCategory: Record<string, TypeScriptError[]> = {};
  
  for (const error of errors) {
    if (!errorsByCategory[error.category]) {
      errorsByCategory[error.category] = [];
    }
    errorsByCategory[error.category].push(error);
  }
  
  // Try to fix missing types in batch
  if (errorsByCategory[ErrorCategory.MISSING_TYPE] && options.fixImplicitAny) {
    const typeErrors = errorsByCategory[ErrorCategory.MISSING_TYPE];
    const result = fixMissingTypesInBatch(filePath, content, typeErrors);
    
    if (result.modified) {
      content = result.content;
      modified = true;
      fixedErrors += result.fixedErrors;
      details.push(...result.details);
    }
  }
  
  // Try to fix import errors in batch
  if (errorsByCategory[ErrorCategory.IMPORT_ERROR]) {
    const importErrors = errorsByCategory[ErrorCategory.IMPORT_ERROR];
    const result = fixImportErrorsInBatch(filePath, content, importErrors);
    
    if (result.modified) {
      content = result.content;
      modified = true;
      fixedErrors += result.fixedErrors;
      details.push(...result.details);
    }
  }
  
  return {
    content,
    modified,
    fixedErrors,
    details
  };
}

/**
 * Fixes missing types in batch
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param errors - Type errors in the file
 * @returns Batch fix result
 */
function fixMissingTypesInBatch(
  filePath: string,
  content: string,
  errors: TypeScriptError[]
): {
  content: string;
  modified: boolean;
  fixedErrors: number;
  details: FixDetail[];
} {
  // This is a placeholder implementation
  // In a real implementation, this would parse the file and add types in batch
  
  // For now, let's use a simple regex-based approach
  let modified = false;
  let fixedErrors = 0;
  const details: FixDetail[] = [];
  
  // Get parameter implicit any errors
  const paramErrors = errors.filter(e => e.message.includes('implicitly has an \'any\' type'));
  
  // Sort by line (descending) to avoid line number changes affecting other fixes
  paramErrors.sort((a, b) => b.line - a.line);
  
  for (const error of paramErrors) {
    // Extract parameter name from message
    const paramMatch = error.message.match(/Parameter '([^']+)'/);
    
    if (paramMatch && paramMatch[1]) {
      const paramName = paramMatch[1];
      const lines = content.split('\n');
      const line = lines[error.line - 1];
      
      // Simple pattern: find the parameter and add `: any`
      const paramRegex = new RegExp(`(${paramName})(?![^\\(\\)]*:)`, 'g');
      const fixedLine = line.replace(paramRegex, '$1: any');
      
      if (fixedLine !== line) {
        lines[error.line - 1] = fixedLine;
        content = lines.join('\n');
        modified = true;
        fixedErrors++;
        
        details.push({
          file: filePath,
          line: error.line,
          errorCode: error.code,
          errorMessage: error.message,
          fixDescription: `Added 'any' type to parameter '${paramName}'`,
          beforeFix: line,
          afterFix: fixedLine,
          fixMethod: 'automatic',
          timestamp: new Date()
        });
      }
    }
  }
  
  return {
    content,
    modified,
    fixedErrors,
    details
  };
}

/**
 * Fixes import errors in batch
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param errors - Import errors in the file
 * @returns Batch fix result
 */
function fixImportErrorsInBatch(
  filePath: string,
  content: string,
  errors: TypeScriptError[]
): {
  content: string;
  modified: boolean;
  fixedErrors: number;
  details: FixDetail[];
} {
  // This is a placeholder implementation
  // In a real implementation, this would analyze imports and fix them
  
  // For now, let's just identify duplicate imports
  let modified = false;
  let fixedErrors = 0;
  const details: FixDetail[] = [];
  
  // Get duplicate identifier errors related to imports
  const duplicateErrors = errors.filter(e => 
    e.code === 2300 && // Duplicate identifier
    e.message.includes('Duplicate identifier') &&
    e.lineContent?.includes('import ')
  );
  
  // Sort by line (descending) to avoid line number changes affecting other fixes
  duplicateErrors.sort((a, b) => b.line - a.line);
  
  for (const error of errors) {
    // Process each error
    if (error.code === 2300 && error.message.includes('Duplicate identifier')) {
      const identMatch = error.message.match(/Duplicate identifier '([^']+)'/);
      
      if (identMatch && identMatch[1] && error.lineContent) {
        const identifier = identMatch[1];
        const lines = content.split('\n');
        
        // Find all import lines for this identifier
        const importLines: number[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`import`) && lines[i].includes(identifier)) {
            importLines.push(i);
          }
        }
        
        // If we found multiple import lines, remove duplicates
        if (importLines.length > 1) {
          // Keep the first import, remove others
          for (let i = 1; i < importLines.length; i++) {
            const lineIndex = importLines[i];
            const originalLine = lines[lineIndex];
            
            // Remove the line
            lines.splice(lineIndex, 1);
            content = lines.join('\n');
            modified = true;
            fixedErrors++;
            
            details.push({
              file: filePath,
              line: lineIndex + 1,
              errorCode: error.code,
              errorMessage: error.message,
              fixDescription: `Removed duplicate import of '${identifier}'`,
              beforeFix: originalLine,
              afterFix: '(removed)',
              fixMethod: 'automatic',
              timestamp: new Date()
            });
          }
        }
      }
    }
  }
  
  return {
    content,
    modified,
    fixedErrors,
    details
  };
}

/**
 * Applies individual fixes to errors in a file
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param errors - Errors in the file
 * @param options - Fix options
 * @returns Individual fix result
 */
async function applyIndividualFixes(
  filePath: string,
  content: string,
  errors: TypeScriptError[],
  options: FixOptions
): Promise<{
  content: string;
  modified: boolean;
  fixedErrors: number;
  details: FixDetail[];
}> {
  let modified = false;
  let fixedErrors = 0;
  const details: FixDetail[] = [];
  
  // Sort errors by line (descending) to avoid line number changes affecting other fixes
  const sortedErrors = [...errors].sort((a, b) => b.line - a.line);
  
  for (const error of sortedErrors) {
    // Skip errors without line content
    if (!error.lineContent) continue;
    
    // Try to fix the error
    const result = await fixIndividualError(filePath, content, error, options);
    
    if (result.fixed) {
      content = result.content;
      modified = true;
      fixedErrors++;
      
      details.push({
        file: filePath,
        line: error.line,
        errorCode: error.code,
        errorMessage: error.message,
        fixDescription: result.fixDescription,
        beforeFix: error.lineContent,
        afterFix: result.afterLine,
        fixMethod: result.fixMethod,
        timestamp: new Date()
      });
    }
  }
  
  return {
    content,
    modified,
    fixedErrors,
    details
  };
}

/**
 * Fixes an individual error
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param error - Error to fix
 * @param options - Fix options
 * @returns Individual fix result
 */
async function fixIndividualError(
  filePath: string,
  content: string,
  error: TypeScriptError,
  options: FixOptions
): Promise<{
  fixed: boolean;
  content: string;
  fixDescription: string;
  afterLine: string;
  fixMethod: 'automatic' | 'ai' | 'pattern';
}> {
  // Try different fix strategies based on error type
  
  // 1. Try automatic fixes for simple errors
  const automaticResult = tryAutomaticFix(filePath, content, error, options);
  
  if (automaticResult.fixed) {
    return automaticResult;
  }
  
  // 2. Try AI-powered fixes if enabled
  if (options.useAI) {
    const aiResult = await tryAIFix(filePath, content, error, options);
    
    if (aiResult.fixed) {
      return aiResult;
    }
  }
  
  // 3. No fix found
  return {
    fixed: false,
    content,
    fixDescription: 'No fix available',
    afterLine: error.lineContent || '',
    fixMethod: 'automatic'
  };
}

/**
 * Tries to automatically fix a simple error
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param error - Error to fix
 * @param options - Fix options
 * @returns Automatic fix result
 */
function tryAutomaticFix(
  filePath: string,
  content: string,
  error: TypeScriptError,
  options: FixOptions
): {
  fixed: boolean;
  content: string;
  fixDescription: string;
  afterLine: string;
  fixMethod: 'automatic';
} {
  // Split content into lines
  const lines = content.split('\n');
  const lineIndex = error.line - 1;
  const originalLine = lines[lineIndex];
  
  // If no line content, can't fix
  if (!originalLine) {
    return {
      fixed: false,
      content,
      fixDescription: 'No line content available',
      afterLine: '',
      fixMethod: 'automatic'
    };
  }
  
  let fixed = false;
  let fixedLine = originalLine;
  let fixDescription = '';
  
  // Try fixes based on error code and category
  switch (error.code) {
    // Missing semicolon
    case 1005:
      if (error.message.includes("';' expected")) {
        fixedLine = originalLine + ';';
        fixed = true;
        fixDescription = "Added missing semicolon";
      }
      break;
    
    // Implicitly any parameter
    case 7006:
      if (options.fixImplicitAny) {
        const paramMatch = error.message.match(/Parameter '([^']+)'/);
        
        if (paramMatch && paramMatch[1]) {
          const paramName = paramMatch[1];
          
          // Simple replacement: add ': any' after parameter
          const paramRegex = new RegExp(`(${paramName})(?![^\\(\\)]*:)`, 'g');
          fixedLine = originalLine.replace(paramRegex, '$1: any');
          
          if (fixedLine !== originalLine) {
            fixed = true;
            fixDescription = `Added 'any' type to parameter '${paramName}'`;
          }
        }
      }
      break;
      
    // Try some simple type mismatch fixes
    case 2322:
      if (error.message.includes('null') && error.message.includes('undefined')) {
        // Make non-null assertion
        if (originalLine.includes('.')) {
          // Find last dot and add ! before next punctuation
          const lastDotIndex = originalLine.lastIndexOf('.');
          if (lastDotIndex > 0) {
            const afterDot = originalLine.substring(lastDotIndex);
            const punctuationMatch = afterDot.match(/[^a-zA-Z0-9_]/);
            
            if (punctuationMatch) {
              const punctuationIndex = punctuationMatch.index;
              fixedLine = originalLine.substring(0, lastDotIndex + punctuationIndex) + 
                         '!' + 
                         originalLine.substring(lastDotIndex + punctuationIndex);
              fixed = true;
              fixDescription = "Added non-null assertion";
            }
          }
        }
      }
      break;
  }
  
  // Update content if fixed
  if (fixed) {
    lines[lineIndex] = fixedLine;
    content = lines.join('\n');
  }
  
  return {
    fixed,
    content,
    fixDescription,
    afterLine: fixedLine,
    fixMethod: 'automatic'
  };
}

/**
 * Tries to fix an error using AI
 * 
 * @param filePath - Path to the file
 * @param content - File content
 * @param error - Error to fix
 * @param options - Fix options
 * @returns AI fix result
 */
async function tryAIFix(
  filePath: string,
  content: string,
  error: TypeScriptError,
  options: FixOptions
): Promise<{
  fixed: boolean;
  content: string;
  fixDescription: string;
  afterLine: string;
  fixMethod: 'ai';
}> {
  // This is a placeholder for AI-powered fixing
  // In a real implementation, this would call the OpenAI API
  
  // For now, let's simulate some AI fixes
  // In production, this would use a real AI service
  
  // For demonstration purposes only
  let fixed = false;
  let fixedContent = content;
  let fixDescription = '';
  let afterLine = error.lineContent || '';
  
  // Simulate some "AI" fixes based on error type
  const lines = content.split('\n');
  const lineIndex = error.line - 1;
  const originalLine = lines[lineIndex];
  
  // If no line content, can't fix
  if (!originalLine) {
    return {
      fixed: false,
      content,
      fixDescription: 'No line content available',
      afterLine: '',
      fixMethod: 'ai'
    };
  }
  
  switch (error.category) {
    case ErrorCategory.TYPE_MISMATCH:
      // Simulate an AI fix for type mismatch
      if (error.message.includes('Type') && error.message.includes('is not assignable to type')) {
        // Extract types from error message
        const typeMatch = error.message.match(/Type '([^']+)' is not assignable to type '([^']+)'/);
        
        if (typeMatch && typeMatch[1] && typeMatch[2]) {
          const fromType = typeMatch[1];
          const toType = typeMatch[2];
          
          // Add type assertion
          if (!originalLine.includes(' as ')) {
            const parts = originalLine.split('=');
            
            if (parts.length === 2) {
              // Add type assertion to right side
              const leftSide = parts[0].trim();
              const rightSide = parts[1].trim();
              
              lines[lineIndex] = `${leftSide} = ${rightSide.replace(/;$/, '')} as ${toType};`;
              fixedContent = lines.join('\n');
              fixed = true;
              afterLine = lines[lineIndex];
              fixDescription = `Added type assertion to cast from '${fromType}' to '${toType}'`;
            }
          }
        }
      }
      break;
      
    case ErrorCategory.MISSING_TYPE:
      // Simulate an AI fix for missing type
      if (error.message.includes('implicitly has an \'any\' type')) {
        // Extract name from error message
        const nameMatch = error.message.match(/'([^']+)' implicitly/);
        
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1];
          
          if (originalLine.includes(name)) {
            // Try to infer a better type than 'any'
            let inferredType = 'string'; // Default to string
            
            // Simple heuristics
            if (originalLine.includes('= []')) {
              inferredType = 'any[]';
            } else if (originalLine.includes('= {}')) {
              inferredType = 'Record<string, any>';
            } else if (originalLine.includes('= true') || originalLine.includes('= false')) {
              inferredType = 'boolean';
            } else if (/= \d+/.test(originalLine)) {
              inferredType = 'number';
            }
            
            // Add the type
            lines[lineIndex] = originalLine.replace(
              new RegExp(`(const|let|var)\\s+${name}\\b`),
              `$1 ${name}: ${inferredType}`
            );
            
            fixedContent = lines.join('\n');
            fixed = true;
            afterLine = lines[lineIndex];
            fixDescription = `Added type '${inferredType}' to '${name}'`;
          }
        }
      }
      break;
  }
  
  return {
    fixed,
    content: fixedContent,
    fixDescription,
    afterLine,
    fixMethod: 'ai'
  };
}

/**
 * Saves fix details to the database
 * 
 * @param details - Fix details
 */
async function saveFixesToDb(details: FixDetail[]): Promise<void> {
  // This is a placeholder for database integration
  // In a real implementation, this would save fixes to the database
  
  console.log(`Fix details would be saved to database (${details.length} fixes)`);
  
  // TODO: Implement database integration
}

export default fixTypeScriptErrors;