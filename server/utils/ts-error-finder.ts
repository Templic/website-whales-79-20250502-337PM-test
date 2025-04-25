/**
 * @file ts-error-finder.ts
 * @description Utility for finding TypeScript errors in the codebase
 * 
 * This module provides functionality for scanning a TypeScript project for errors
 * and adding them to the error management system.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { ErrorCategory, ErrorSeverity, ErrorStatus, InsertTypeScriptError } from '../types/core/error-types';
import * as tsErrorStorage from '../tsErrorStorage';
import { findTypeScriptFiles } from './ts-type-analyzer';

/**
 * Options for the error finding process
 */
export interface ErrorFinderOptions {
  projectRoot: string;
  tsconfigPath?: string;
  includeNodeModules?: boolean;
  severity?: ErrorSeverity;
  concurrency?: number;
}

/**
 * Default options for error finding
 */
const defaultOptions: ErrorFinderOptions = {
  projectRoot: '.',
  includeNodeModules: false,
  severity: 'high',
  concurrency: 4
};

/**
 * Result of the error finding process
 */
export interface ErrorFindingResult {
  errorCount: number;
  warningCount: number;
  errorsByFile: Record<string, number>;
  fileCount: number;
  processingTimeMs: number;
  addedErrors: {
    id: number;
    filePath: string;
    errorMessage: string;
  }[];
}

/**
 * Scans a TypeScript project for errors
 * 
 * @param options Options for the error finding process
 * @returns Results of the error finding process
 */
export async function findTypeScriptErrors(
  options: Partial<ErrorFinderOptions> = {}
): Promise<ErrorFindingResult> {
  const startTime = Date.now();
  const opts = { ...defaultOptions, ...options };
  
  // Resolve tsconfig path
  const tsconfigPath = opts.tsconfigPath || ts.findConfigFile(
    opts.projectRoot,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsconfigPath) {
    throw new Error(`Could not find tsconfig.json in ${opts.projectRoot}`);
  }
  
  // Read the config file
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
  }
  
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  
  // Find TypeScript files
  const files = await findTypeScriptFiles(opts.projectRoot);
  
  // Filter out node_modules if requested
  const filteredFiles = opts.includeNodeModules 
    ? files 
    : files.filter(file => !file.includes('node_modules'));
  
  // Create a program instance
  const program = ts.createProgram(filteredFiles, parsedConfig.options);
  const checker = program.getTypeChecker();
  
  // Get all diagnostics
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  const semanticDiagnostics = program.getSemanticDiagnostics();
  const declarationDiagnostics = program.getDeclarationDiagnostics();
  
  const allDiagnostics = [
    ...syntacticDiagnostics,
    ...semanticDiagnostics,
    ...declarationDiagnostics
  ];
  
  // Process the diagnostics
  const result: ErrorFindingResult = {
    errorCount: 0,
    warningCount: 0,
    errorsByFile: {},
    fileCount: filteredFiles.length,
    processingTimeMs: 0,
    addedErrors: []
  };
  
  for (const diagnostic of allDiagnostics) {
    if (!diagnostic.file) continue;
    
    const filePath = diagnostic.file.fileName;
    
    // Increment error count by file
    result.errorsByFile[filePath] = (result.errorsByFile[filePath] || 0) + 1;
    
    // Determine if it's an error or warning
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      result.errorCount++;
    } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      result.warningCount++;
    }
    
    // Get line and character position
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    
    // Get the error message
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    
    // Get error code
    const code = `TS${diagnostic.code}`;
    
    // Get error context (lines around the error)
    const fileContent = diagnostic.file.text;
    const lineStart = getLineStart(fileContent, diagnostic.start!);
    const lineEnd = getLineEnd(fileContent, diagnostic.start!);
    const errorLine = fileContent.substring(lineStart, lineEnd);
    
    // Get a few lines before and after for context
    const contextStart = getPositionOfLineN(fileContent, Math.max(1, line - 3));
    const contextEnd = getPositionOfLineN(fileContent, line + 3);
    const context = fileContent.substring(contextStart, contextEnd);
    
    // Determine category and severity
    const category = mapToDiagnosticCategory(diagnostic.category, diagnostic.code, message);
    const severity = mapToSeverity(diagnostic.category, opts.severity);
    
    // Create an error object
    const error: InsertTypeScriptError = {
      errorCode: code,
      filePath,
      lineNumber: line + 1, // convert to 1-based
      columnNumber: character + 1, // convert to 1-based
      errorMessage: message,
      errorContext: context,
      category,
      severity,
      status: 'detected',
      metadata: {
        tscVersion: ts.version,
        compiler_options: parsedConfig.options
      }
    };
    
    try {
      // Add the error to the database
      const addedError = await tsErrorStorage.addTypescriptError(error);
      
      // Add to results
      result.addedErrors.push({
        id: addedError.id,
        filePath: addedError.filePath,
        errorMessage: addedError.errorMessage
      });
    } catch (err) {
      console.error(`Failed to add error to database: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  result.processingTimeMs = Date.now() - startTime;
  
  return result;
}

/**
 * Maps a TypeScript diagnostic category to our ErrorCategory
 */
function mapToDiagnosticCategory(
  category: ts.DiagnosticCategory,
  code: number,
  message: string
): ErrorCategory {
  // Determine category based on the error code and message
  if (message.includes('Type') && message.includes('is not assignable')) {
    return 'type_mismatch';
  }
  
  if (message.includes('Cannot find') || message.includes('does not exist')) {
    if (message.includes('type') || message.includes('interface')) {
      return 'missing_type';
    } else {
      return 'undefined_variable';
    }
  }
  
  if (message.includes('null') || message.includes('undefined')) {
    return 'null_reference';
  }
  
  if (message.includes('interface') && message.includes('implement')) {
    return 'interface_mismatch';
  }
  
  if (message.includes('Cannot find module') || message.includes('import')) {
    return 'import_error';
  }
  
  if (category === ts.DiagnosticCategory.Error && (code < 2000 || message.includes('Syntax'))) {
    return 'syntax_error';
  }
  
  if (message.includes('constraint') || message.includes('generic')) {
    return 'generic_constraint';
  }
  
  if (message.includes('declare') || message.includes('declaration')) {
    return 'declaration_error';
  }
  
  return 'other';
}

/**
 * Maps a TypeScript diagnostic category to our ErrorSeverity
 */
function mapToSeverity(
  category: ts.DiagnosticCategory,
  defaultSeverity: ErrorSeverity = 'high'
): ErrorSeverity {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return 'high';
    case ts.DiagnosticCategory.Warning:
      return 'medium';
    case ts.DiagnosticCategory.Suggestion:
      return 'low';
    case ts.DiagnosticCategory.Message:
      return 'low';
    default:
      return defaultSeverity;
  }
}

/**
 * Gets the start position of the line containing the position
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
 * Gets the end position of the line containing the position
 */
function getLineEnd(text: string, position: number): number {
  for (let i = position; i < text.length; i++) {
    if (text[i] === '\n') {
      return i;
    }
  }
  return text.length;
}

/**
 * Gets the position of the Nth line (0-based)
 */
function getPositionOfLineN(text: string, lineNumber: number): number {
  let line = 0;
  let pos = 0;
  
  while (line < lineNumber && pos < text.length) {
    if (text[pos] === '\n') {
      line++;
    }
    pos++;
  }
  
  return pos;
}

/**
 * Creates a project-wide analysis based on error finding results
 * 
 * @param result Error finding results
 * @returns The project analysis ID
 */
export async function createProjectAnalysis(
  result: ErrorFindingResult,
  userId?: number
): Promise<number> {
  const analysis = await tsErrorStorage.addProjectAnalysis({
    projectId: 1, // Default project ID
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    fixedCount: 0, // No fixes applied yet
    status: 'completed',
    duration: result.processingTimeMs,
    executedBy: userId || null,
    analysisData: {
      errorHotspots: {
        files: result.errorsByFile,
        components: {} // Empty components object to satisfy type requirements
      },
      stats: {
        fileCount: result.fileCount,
        filesWithErrors: Object.keys(result.errorsByFile).length,
      }
    }
  });
  
  return analysis.id;
}

/**
 * Scans a specific file for TypeScript errors
 * 
 * @param filePath Path to the file to scan
 * @param options Options for the error finding process
 * @returns Results of the error finding process
 */
export async function findErrorsInFile(
  filePath: string,
  options: Partial<ErrorFinderOptions> = {}
): Promise<ErrorFindingResult> {
  const opts = { ...defaultOptions, ...options };
  
  // Resolve tsconfig path
  const tsconfigPath = opts.tsconfigPath || ts.findConfigFile(
    opts.projectRoot,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsconfigPath) {
    throw new Error(`Could not find tsconfig.json in ${opts.projectRoot}`);
  }
  
  // Create a program just for this file
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  });
  
  // Get diagnostics for this file
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  const semanticDiagnostics = program.getSemanticDiagnostics();
  
  const allDiagnostics = [
    ...syntacticDiagnostics,
    ...semanticDiagnostics
  ];
  
  // Initialize result object
  const result: ErrorFindingResult = {
    errorCount: 0,
    warningCount: 0,
    errorsByFile: {},
    fileCount: 1,
    processingTimeMs: 0,
    addedErrors: []
  };
  
  const startTime = Date.now();
  
  // Process diagnostics
  for (const diagnostic of allDiagnostics) {
    if (!diagnostic.file) continue;
    
    // Only process diagnostics for the target file
    if (diagnostic.file.fileName !== filePath) continue;
    
    // Process this diagnostic same as in findTypeScriptErrors
    result.errorsByFile[filePath] = (result.errorsByFile[filePath] || 0) + 1;
    
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      result.errorCount++;
    } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      result.warningCount++;
    }
    
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const code = `TS${diagnostic.code}`;
    
    const fileContent = diagnostic.file.text;
    const lineStart = getLineStart(fileContent, diagnostic.start!);
    const lineEnd = getLineEnd(fileContent, diagnostic.start!);
    const errorLine = fileContent.substring(lineStart, lineEnd);
    
    const contextStart = getPositionOfLineN(fileContent, Math.max(1, line - 3));
    const contextEnd = getPositionOfLineN(fileContent, line + 3);
    const context = fileContent.substring(contextStart, contextEnd);
    
    const category = mapToDiagnosticCategory(diagnostic.category, diagnostic.code, message);
    const severity = mapToSeverity(diagnostic.category, opts.severity);
    
    const error: InsertTypeScriptError = {
      errorCode: code,
      filePath,
      lineNumber: line + 1,
      columnNumber: character + 1,
      errorMessage: message,
      errorContext: context,
      category,
      severity,
      status: 'detected',
      metadata: {
        tscVersion: ts.version
      }
    };
    
    try {
      const addedError = await tsErrorStorage.addTypescriptError(error);
      
      result.addedErrors.push({
        id: addedError.id,
        filePath: addedError.filePath,
        errorMessage: addedError.errorMessage
      });
    } catch (err) {
      console.error(`Failed to add error to database: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  result.processingTimeMs = Date.now() - startTime;
  
  return result;
}

/**
 * Gets the current project compilation status
 * 
 * @param options Options for the error finding process
 * @returns Object with error and warning counts
 */
export async function getProjectCompilationStatus(
  options: Partial<ErrorFinderOptions> = {}
): Promise<{
  success: boolean;
  errorCount: number;
  warningCount: number;
  timeMs: number;
}> {
  const startTime = Date.now();
  const opts = { ...defaultOptions, ...options };
  
  // Resolve tsconfig path
  const tsconfigPath = opts.tsconfigPath || ts.findConfigFile(
    opts.projectRoot,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsconfigPath) {
    throw new Error(`Could not find tsconfig.json in ${opts.projectRoot}`);
  }
  
  // Read the config file
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
  }
  
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  
  // Create a program instance
  const program = ts.createProgram(
    parsedConfig.fileNames,
    parsedConfig.options
  );
  
  // Get diagnostics
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  const semanticDiagnostics = program.getSemanticDiagnostics();
  
  // Count errors and warnings
  let errorCount = 0;
  let warningCount = 0;
  
  for (const diagnostic of [...syntacticDiagnostics, ...semanticDiagnostics]) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errorCount++;
    } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      warningCount++;
    }
  }
  
  return {
    success: errorCount === 0,
    errorCount,
    warningCount,
    timeMs: Date.now() - startTime
  };
}