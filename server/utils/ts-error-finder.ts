/**
 * TypeScript Error Finder
 * 
 * A utility for finding TypeScript errors in a codebase using the TypeScript Compiler API.
 * Part of the TypeScript error management system (Detection phase).
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Configurable options for the error finder
 */
export interface ErrorFinderOptions {
  // Core options
  projectRoot: string;
  tsconfigPath?: string;
  
  // Filtering options
  includeNodeModules?: boolean;
  maxErrors?: number;
  includeWarnings?: boolean;
  minSeverity?: ErrorSeverity;
  filePatterns?: string[];
  excludePatterns?: string[];
  
  // Processing options
  concurrent?: boolean;
  concurrencyLimit?: number;
  useColors?: boolean;
  verbose?: boolean;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Error categories for organizing errors
 */
export enum ErrorCategory {
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  MISSING_DECLARATION = 'MISSING_DECLARATION',
  MODULE_RESOLUTION = 'MODULE_RESOLUTION',
  IMPORT_ERROR = 'IMPORT_ERROR',
  PROPERTY_ERROR = 'PROPERTY_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  API_USAGE_ERROR = 'API_USAGE_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  LINT_ERROR = 'LINT_ERROR',
  REACT_ERROR = 'REACT_ERROR',
  HOOK_ERROR = 'HOOK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Detailed information about a TypeScript error
 */
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

/**
 * Result of error finding process
 */
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

// Default options for the error finder
const defaultOptions: ErrorFinderOptions = {
  projectRoot: process.cwd(),
  includeNodeModules: false,
  maxErrors: 100,
  includeWarnings: true,
  minSeverity: ErrorSeverity.LOW,
  concurrent: false,
  concurrencyLimit: 4,
  useColors: true,
  verbose: false
};

// Events emitted during error finding
export interface ErrorFinderEvents {
  'file:start': (filePath: string) => void;
  'file:end': (filePath: string, errorCount: number) => void;
  'error:found': (error: TypeScriptErrorDetail) => void;
  'progress': (processed: number, total: number) => void;
  'complete': (result: ErrorFindingResult) => void;
}

// Create a typed event emitter for error finding
export interface TypedEventEmitter<T> {
  on<K extends keyof T>(event: K, listener: T[K]): this;
  once<K extends keyof T>(event: K, listener: T[K]): this;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean;
  removeListener<K extends keyof T>(event: K, listener: T[K]): this;
}

/**
 * Main function to find TypeScript errors in a project
 */
export async function findTypeScriptErrors(
  options: ErrorFinderOptions = defaultOptions
): Promise<ErrorFindingResult> {
  const startTime = Date.now();
  const emitter = new EventEmitter() as TypedEventEmitter<ErrorFinderEvents>;
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Find tsconfig.json if not specified
  const tsconfigPath = mergedOptions.tsconfigPath || 
    path.join(mergedOptions.projectRoot, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error(`TypeScript configuration file not found: ${tsconfigPath}`);
  }
  
  // Parse tsconfig.json
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
  }
  
  // Parse and convert tsconfig.json content
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  
  if (parsedConfig.errors.length > 0) {
    throw new Error(`Error parsing tsconfig.json: ${parsedConfig.errors[0].messageText}`);
  }
  
  // Find TypeScript files
  const filePatterns = mergedOptions.filePatterns || parsedConfig.fileNames;
  const files = await findTypeScriptFiles(mergedOptions.projectRoot);
  
  // Apply include/exclude patterns
  const filteredFiles = files.filter(file => {
    // Skip node_modules if not explicitly included
    if (!mergedOptions.includeNodeModules && file.includes('node_modules')) {
      return false;
    }
    
    // Apply include patterns if specified
    if (mergedOptions.filePatterns && mergedOptions.filePatterns.length > 0) {
      return mergedOptions.filePatterns.some(pattern => 
        new RegExp(pattern).test(file)
      );
    }
    
    // Apply exclude patterns if specified
    if (mergedOptions.excludePatterns && mergedOptions.excludePatterns.length > 0) {
      return !mergedOptions.excludePatterns.some(pattern => 
        new RegExp(pattern).test(file)
      );
    }
    
    return true;
  });
  
  // Initialize error tracking
  const result: ErrorFindingResult = {
    totalErrors: 0,
    totalWarnings: 0,
    errorsByFile: {},
    errorsByCategory: {},
    errorsByCode: {},
    processingTimeMs: 0,
    fileCount: filteredFiles.length,
    scannedLineCount: 0,
    errors: [],
    summary: ''
  };
  
  // Create TypeScript program
  const program = ts.createProgram(filteredFiles, parsedConfig.options);
  const checker = program.getTypeChecker();
  
  // Get all source files
  const sourceFiles = program.getSourceFiles();
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    // Skip lib files
    if (sourceFile.fileName.includes('node_modules') && !mergedOptions.includeNodeModules) {
      continue;
    }
    
    // Skip declaration files unless explicitly included
    if (sourceFile.fileName.endsWith('.d.ts') && !mergedOptions.filePatterns?.some(p => p.includes('.d.ts'))) {
      continue;
    }
    
    // Count lines in the file
    const fileContent = sourceFile.getFullText();
    const lineCount = fileContent.split('\n').length;
    result.scannedLineCount += lineCount;
    
    emitter.emit('file:start', sourceFile.fileName);
    
    // Get diagnostics for the file
    const syntaxDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);
    
    // Process all diagnostics
    const allDiagnostics = [
      ...syntaxDiagnostics,
      ...semanticDiagnostics
    ];
    
    let fileErrorCount = 0;
    
    for (const diagnostic of allDiagnostics) {
      // Skip if max errors reached
      if (mergedOptions.maxErrors && result.errors.length >= mergedOptions.maxErrors) {
        break;
      }
      
      // Skip warnings if not including warnings
      if (!mergedOptions.includeWarnings && 
          diagnostic.category === ts.DiagnosticCategory.Warning) {
        continue;
      }
      
      const severity = determineSeverity(
        diagnostic.category, 
        diagnostic.code, 
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
      
      // Skip if below minimum severity
      if (severityLevel(severity) < severityLevel(mergedOptions.minSeverity)) {
        continue;
      }
      
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const category = categorizeError(diagnostic.code, message);
      
      // Get location information
      let line = 0;
      let column = 0;
      let file = sourceFile.fileName;
      
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line: lineNum, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = lineNum + 1; // Convert to 1-based
        column = character + 1; // Convert to 1-based
        file = diagnostic.file.fileName;
      }
      
      // Get code snippet
      let snippet = '';
      if (diagnostic.file && diagnostic.start !== undefined && diagnostic.length !== undefined) {
        const start = Math.max(0, diagnostic.start - 40);
        const end = Math.min(diagnostic.file.text.length, diagnostic.start + diagnostic.length + 40);
        snippet = diagnostic.file.text.slice(start, end);
      }
      
      // Create error detail
      const error: TypeScriptErrorDetail = {
        code: `TS${diagnostic.code}`,
        message,
        file,
        line,
        column,
        severity,
        category,
        snippet,
        suggestedFix: getSuggestedFix(`TS${diagnostic.code}`, message, category)
      };
      
      // Update statistics
      result.errors.push(error);
      result.totalErrors++;
      if (diagnostic.category === ts.DiagnosticCategory.Warning) {
        result.totalWarnings++;
      }
      
      // Update error counts by file
      result.errorsByFile[file] = (result.errorsByFile[file] || 0) + 1;
      
      // Update error counts by category
      result.errorsByCategory[category] = (result.errorsByCategory[category] || 0) + 1;
      
      // Update error counts by code
      result.errorsByCode[`TS${diagnostic.code}`] = (result.errorsByCode[`TS${diagnostic.code}`] || 0) + 1;
      
      fileErrorCount++;
      
      // Emit error found event
      emitter.emit('error:found', error);
    }
    
    emitter.emit('file:end', sourceFile.fileName, fileErrorCount);
  }
  
  // Sort errors by severity
  sortErrors(result.errors, 'severity');
  
  // Calculate processing time
  result.processingTimeMs = Date.now() - startTime;
  
  // Generate summary
  result.summary = generateSummary(result);
  
  // Emit complete event
  emitter.emit('complete', result);
  
  return result;
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function traverseDirectory(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            await traverseDirectory(fullPath);
          }
        } else if (
          entry.isFile() && 
          (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
          !entry.name.endsWith('.d.ts')
        ) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${currentDir}:`, error);
    }
  }
  
  await traverseDirectory(dir);
  return files;
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
  if (lineNumber <= 0) return 0;
  
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      count++;
      if (count === lineNumber) {
        return i + 1;
      }
    }
  }
  
  return text.length;
}

/**
 * Categorize TypeScript errors
 */
function categorizeError(code: number, message: string): ErrorCategory {
  const codeStr = `TS${code}`;
  const msg = message.toLowerCase();
  
  // Type errors
  if (
    msg.includes('type') && 
    (msg.includes('not assignable') || msg.includes('is incompatible'))
  ) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  
  // Syntax errors
  if (code >= 1000 && code < 1999) {
    return ErrorCategory.SYNTAX_ERROR;
  }
  
  // Module resolution errors
  if (
    msg.includes('cannot find module') || 
    msg.includes('cannot find name') ||
    msg.includes('has no exported member')
  ) {
    return ErrorCategory.MODULE_RESOLUTION;
  }
  
  // Import errors
  if (
    msg.includes('import') || 
    msg.includes('export') || 
    msg.includes('require')
  ) {
    return ErrorCategory.IMPORT_ERROR;
  }
  
  // Property errors
  if (
    msg.includes('property') || 
    msg.includes('does not exist on type')
  ) {
    return ErrorCategory.PROPERTY_ERROR;
  }
  
  // Initialization errors
  if (
    msg.includes('initialized') || 
    msg.includes('constructor')
  ) {
    return ErrorCategory.INITIALIZATION_ERROR;
  }
  
  // React errors
  if (
    msg.includes('jsx') || 
    msg.includes('react') || 
    msg.includes('component') ||
    msg.includes('props') ||
    msg.includes('children')
  ) {
    return ErrorCategory.REACT_ERROR;
  }
  
  // Hook errors
  if (msg.includes('hook')) {
    return ErrorCategory.HOOK_ERROR;
  }
  
  // API usage errors
  if (
    msg.includes('argument') || 
    msg.includes('parameter') || 
    msg.includes('expected')
  ) {
    return ErrorCategory.API_USAGE_ERROR;
  }
  
  // Config errors
  if (
    msg.includes('config') || 
    msg.includes('tsconfig')
  ) {
    return ErrorCategory.CONFIG_ERROR;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity
 */
function determineSeverity(
  category: ts.DiagnosticCategory, 
  code: number, 
  message: string
): ErrorSeverity {
  // Errors that break the build
  if (category === ts.DiagnosticCategory.Error) {
    // Critical errors
    if (
      // Null reference errors
      message.toLowerCase().includes('null') ||
      message.toLowerCase().includes('undefined') ||
      // Type assertions that are likely to fail at runtime
      message.toLowerCase().includes('assertion') ||
      // Likely runtime errors
      code === 2454 || // Value will be 'undefined' at runtime
      code === 2533  // Object is possibly 'null' or 'undefined'
    ) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors
    if (
      // Type mismatches that affect functionality
      (message.toLowerCase().includes('type') && message.toLowerCase().includes('not assignable')) ||
      // Missing required properties
      message.toLowerCase().includes('missing required property') ||
      // React-specific severe errors
      message.toLowerCase().includes('jsx element type') ||
      // Function argument errors
      message.toLowerCase().includes('argument') ||
      // Incorrect API usage
      message.toLowerCase().includes('no overload matches')
    ) {
      return ErrorSeverity.HIGH;
    }
    
    // Default for errors
    return ErrorSeverity.MEDIUM;
  }
  
  // Warnings
  if (category === ts.DiagnosticCategory.Warning) {
    // Medium severity warnings
    if (
      // Unreachable code
      message.toLowerCase().includes('unreachable') ||
      // Unused variables
      message.toLowerCase().includes('unused') ||
      // Fallthrough cases
      message.toLowerCase().includes('fallthrough')
    ) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Default for warnings
    return ErrorSeverity.LOW;
  }
  
  // Default for suggestions
  return ErrorSeverity.LOW;
}

/**
 * Get a suggested fix based on error type
 */
function getSuggestedFix(
  code: string, 
  message: string, 
  category: ErrorCategory
): string | undefined {
  const msg = message.toLowerCase();
  
  // Module resolution errors
  if (category === ErrorCategory.MODULE_RESOLUTION) {
    if (msg.includes('cannot find module')) {
      return 'Check the module path and make sure the module is installed.';
    }
    
    if (msg.includes('cannot find name')) {
      return 'Make sure the identifier is defined or import it from the appropriate module.';
    }
    
    if (msg.includes('has no exported member')) {
      return 'Verify the export name in the module or update the import statement.';
    }
  }
  
  // Type mismatch errors
  if (category === ErrorCategory.TYPE_MISMATCH) {
    return 'Update the type annotation or cast the value appropriately.';
  }
  
  // Property errors
  if (category === ErrorCategory.PROPERTY_ERROR) {
    return 'Check the object type definition to ensure the property exists.';
  }
  
  // React errors
  if (category === ErrorCategory.REACT_ERROR) {
    if (msg.includes('jsx')) {
      return 'Verify the JSX syntax and component properties.';
    }
    
    if (msg.includes('props')) {
      return 'Check the component props interface and ensure all required props are provided.';
    }
  }
  
  // Hook errors
  if (category === ErrorCategory.HOOK_ERROR) {
    return 'Make sure hooks are called at the top level of your component.';
  }
  
  // Generic suggestion
  return 'Review the error message and fix the issue accordingly.';
}

/**
 * Sort errors based on specified criteria
 */
function sortErrors(errors: TypeScriptErrorDetail[], sortBy: string): void {
  if (sortBy === 'severity') {
    errors.sort((a, b) => {
      return severityLevel(b.severity) - severityLevel(a.severity);
    });
  } else if (sortBy === 'file') {
    errors.sort((a, b) => {
      if (a.file === b.file) {
        return a.line - b.line;
      }
      return a.file.localeCompare(b.file);
    });
  } else if (sortBy === 'category') {
    errors.sort((a, b) => {
      return a.category.localeCompare(b.category);
    });
  } else if (sortBy === 'code') {
    errors.sort((a, b) => {
      return a.code.localeCompare(b.code);
    });
  }
}

/**
 * Convert severity to numeric level for comparison
 */
function severityLevel(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 4;
    case ErrorSeverity.HIGH:
      return 3;
    case ErrorSeverity.MEDIUM:
      return 2;
    case ErrorSeverity.LOW:
      return 1;
    default:
      return 0;
  }
}

/**
 * Generate a summary of the findings
 */
function generateSummary(result: ErrorFindingResult): string {
  // Generate error statistics
  const criticalCount = result.errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
  const highCount = result.errors.filter(e => e.severity === ErrorSeverity.HIGH).length;
  const mediumCount = result.errors.filter(e => e.severity === ErrorSeverity.MEDIUM).length;
  const lowCount = result.errors.filter(e => e.severity === ErrorSeverity.LOW).length;
  
  // Get top error categories
  const categoryEntries = Object.entries(result.errorsByCategory);
  categoryEntries.sort((a, b) => b[1] - a[1]);
  const topCategories = categoryEntries.slice(0, 3);
  
  // Get top error files
  const fileEntries = Object.entries(result.errorsByFile);
  fileEntries.sort((a, b) => b[1] - a[1]);
  const topFiles = fileEntries.slice(0, 3);
  
  // Generate summary text
  let summary = `Found ${result.totalErrors} TypeScript ${result.totalErrors === 1 ? 'error' : 'errors'} in ${result.fileCount} ${result.fileCount === 1 ? 'file' : 'files'} (${result.scannedLineCount} lines scanned).\n\n`;
  
  // Add severity breakdown
  summary += `Severity breakdown:\n`;
  summary += `- CRITICAL: ${criticalCount}\n`;
  summary += `- HIGH: ${highCount}\n`;
  summary += `- MEDIUM: ${mediumCount}\n`;
  summary += `- LOW: ${lowCount}\n\n`;
  
  // Add top categories
  if (topCategories.length > 0) {
    summary += `Top error categories:\n`;
    topCategories.forEach(([category, count]) => {
      summary += `- ${category}: ${count}\n`;
    });
    summary += '\n';
  }
  
  // Add top files
  if (topFiles.length > 0) {
    summary += `Top files with errors:\n`;
    topFiles.forEach(([file, count]) => {
      const filename = path.basename(file);
      summary += `- ${filename} (${count} ${count === 1 ? 'error' : 'errors'})\n`;
    });
    summary += '\n';
  }
  
  // Add recommendations
  if (criticalCount > 0) {
    summary += `⚠️ You have ${criticalCount} critical errors that should be addressed immediately.\n`;
  }
  
  // Processing time
  summary += `\nProcessing completed in ${(result.processingTimeMs / 1000).toFixed(2)} seconds.`;
  
  return summary;
}