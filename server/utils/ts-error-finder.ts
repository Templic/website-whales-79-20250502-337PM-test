/**
 * TypeScript Error Finder
 * 
 * This utility finds TypeScript errors in a project by running the TypeScript compiler
 * and processing the diagnostics.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { ErrorCategory, ErrorSeverity } from './ts-error-analyzer';

/**
 * Options for the error finder
 */
export interface ErrorFinderOptions {
  projectRoot: string;
  tsconfigPath?: string;
  includeNodeModules?: boolean;
  maxErrors?: number;
  excludePatterns?: string[];
}

/**
 * TypeScript error detail
 */
export interface TypeScriptErrorDetail {
  id: string;
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
}

/**
 * Result of error finding
 */
export interface ErrorFindingResult {
  errors: TypeScriptErrorDetail[];
  errorsByFile: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  totalErrors: number;
  totalWarnings: number;
  processingTimeMs: number;
  fileCount: number;
  scannedLineCount: number;
  summary: string;
}

/**
 * Default options
 */
const defaultOptions: ErrorFinderOptions = {
  projectRoot: process.cwd(),
  includeNodeModules: false,
  maxErrors: 1000,
  excludePatterns: []
};

/**
 * Find TypeScript errors in a project
 */
export async function findTypeScriptErrors(
  options: Partial<ErrorFinderOptions> = {}
): Promise<ErrorFindingResult> {
  const startTime = Date.now();
  
  // Merge options with defaults
  const opts: ErrorFinderOptions = {
    ...defaultOptions,
    ...options
  };
  
  // Find tsconfig.json
  const tsconfigPath = opts.tsconfigPath || path.join(opts.projectRoot, 'tsconfig.json');
  
  // Check if tsconfig.json exists
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error(`tsconfig.json not found at ${tsconfigPath}`);
  }
  
  // Parse tsconfig.json
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  
  if (configFile.error) {
    throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
  }
  
  // Parse the config
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  
  if (parsedConfig.errors.length > 0) {
    throw new Error(`Error parsing tsconfig.json: ${parsedConfig.errors[0].messageText}`);
  }
  
  // Find TypeScript files
  const tsFiles = await findTypeScriptFiles(opts.projectRoot, opts.includeNodeModules, opts.excludePatterns);
  
  // Create program
  const program = ts.createProgram({
    rootNames: tsFiles,
    options: parsedConfig.options
  });
  
  // Get diagnostics
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics()
  ];
  
  // Process diagnostics
  const errors: TypeScriptErrorDetail[] = [];
  const errorsByFile: Record<string, number> = {};
  const errorsByCategory: Record<string, number> = {};
  const errorsByCode: Record<string, number> = {};
  let totalWarnings = 0;
  let scannedLineCount = 0;
  
  // Count lines in scanned files
  for (const file of tsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      scannedLineCount += content.split('\n').length;
    } catch (error) {
      console.error(`Error reading file ${file}: ${error.message}`);
    }
  }
  
  // Process each diagnostic
  for (const diagnostic of diagnostics) {
    if (errors.length >= opts.maxErrors) {
      break;
    }
    
    if (!diagnostic.file) {
      continue;
    }
    
    const fileName = diagnostic.file.fileName;
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const code = `TS${diagnostic.code}`;
    
    // Determine error category and severity
    const category = categorizeError(diagnostic.code, message);
    const severity = determineSeverity(diagnostic.category, diagnostic.code, message);
    
    // Update counts
    if (!errorsByFile[fileName]) {
      errorsByFile[fileName] = 0;
    }
    errorsByFile[fileName]++;
    
    if (!errorsByCategory[category]) {
      errorsByCategory[category] = 0;
    }
    errorsByCategory[category]++;
    
    if (!errorsByCode[code]) {
      errorsByCode[code] = 0;
    }
    errorsByCode[code]++;
    
    if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      totalWarnings++;
    }
    
    // Add error
    errors.push({
      id: `${fileName}:${line}:${character}:${code}`,
      code,
      message,
      file: fileName,
      line: line + 1,
      column: character + 1,
      severity,
      category,
      context: getLineContext(diagnostic.file, diagnostic.start!, diagnostic.length!),
      snippet: getCodeSnippet(diagnostic.file, line)
    });
  }
  
  const processingTimeMs = Date.now() - startTime;
  
  // Generate summary
  const summary = generateSummary(errors, errorsByFile, errorsByCategory, processingTimeMs, tsFiles.length, scannedLineCount);
  
  return {
    errors,
    errorsByFile,
    errorsByCategory,
    errorsByCode,
    totalErrors: errors.length,
    totalWarnings,
    processingTimeMs,
    fileCount: tsFiles.length,
    scannedLineCount,
    summary
  };
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(
  dir: string,
  includeNodeModules = false,
  excludePatterns: string[] = []
): Promise<string[]> {
  const files: string[] = [];
  
  async function traverseDirectory(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Check exclude patterns
      if (excludePatterns.some(pattern => new RegExp(pattern).test(fullPath))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Skip node_modules unless explicitly included
        if (entry.name === 'node_modules' && !includeNodeModules) {
          continue;
        }
        
        // Skip common directories to avoid
        if (['dist', 'build', '.git', '.vscode'].includes(entry.name)) {
          continue;
        }
        
        await traverseDirectory(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await traverseDirectory(dir);
  return files;
}

/**
 * Get line context for an error
 */
function getLineContext(file: ts.SourceFile, start: number, length: number): string {
  const text = file.text;
  const startPos = Math.max(0, start - 20);
  const endPos = Math.min(text.length, start + length + 20);
  
  return text.substring(startPos, endPos);
}

/**
 * Get code snippet for an error
 */
function getCodeSnippet(file: ts.SourceFile, line: number): string {
  const lines = file.text.split('\n');
  const startLine = Math.max(0, line - 2);
  const endLine = Math.min(lines.length - 1, line + 2);
  
  return lines.slice(startLine, endLine + 1).map((l, i) => {
    const lineNum = startLine + i + 1;
    const prefix = lineNum === line + 1 ? '> ' : '  ';
    return `${prefix}${lineNum}: ${l}`;
  }).join('\n');
}

/**
 * Categorize error by code and message
 */
function categorizeError(code: number, message: string): ErrorCategory {
  if (message.includes('syntax') || message.includes('expected')) {
    return ErrorCategory.SYNTAX_ERROR;
  }
  
  if (message.includes('type') && (message.includes('not assignable') || message.includes('expected'))) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  
  if (message.includes('cannot find module') || message.includes('cannot find name')) {
    return ErrorCategory.IMPORT_ERROR;
  }
  
  if (message.includes('function') || message.includes('call') || message.includes('argument')) {
    return ErrorCategory.FUNCTION_ERROR;
  }
  
  if (message.includes('declared') || message.includes('declaration')) {
    return ErrorCategory.DECLARATION_ERROR;
  }
  
  if (message.includes('null') || message.includes('undefined')) {
    return ErrorCategory.NULL_REFERENCE;
  }
  
  if (message.toLowerCase().includes('security') || 
      message.toLowerCase().includes('vulnerability') ||
      code === 2335 || // Do not use private members in type annotations
      code === 2539) { // Cannot assign to 'X' because it is not a variable.
    return ErrorCategory.SECURITY;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity
 */
function determineSeverity(category: ts.DiagnosticCategory, code: number, message: string): ErrorSeverity {
  // Security-related errors are critical
  if (message.toLowerCase().includes('security') || 
      message.toLowerCase().includes('vulnerability')) {
    return ErrorSeverity.CRITICAL;
  }
  
  // Syntax errors and type errors that prevent compilation are high severity
  if (category === ts.DiagnosticCategory.Error) {
    if (message.includes('syntax') || 
        message.includes('expected') || 
        message.includes('cannot find') ||
        code === 2554) { // Expected X arguments, but got Y
      return ErrorSeverity.HIGH;
    }
    return ErrorSeverity.MEDIUM;
  }
  
  // Warnings are low severity
  if (category === ts.DiagnosticCategory.Warning) {
    return ErrorSeverity.LOW;
  }
  
  // Suggestions are low severity
  if (category === ts.DiagnosticCategory.Suggestion) {
    return ErrorSeverity.LOW;
  }
  
  return ErrorSeverity.MEDIUM;
}

/**
 * Generate a summary of the findings
 */
function generateSummary(
  errors: TypeScriptErrorDetail[],
  errorsByFile: Record<string, number>,
  errorsByCategory: Record<string, number>,
  processingTimeMs: number,
  fileCount: number,
  scannedLineCount: number
): string {
  const lines: string[] = [];
  
  lines.push(`TypeScript Error Finder Results`);
  lines.push(`===========================\n`);
  lines.push(`Found ${errors.length} errors in ${fileCount} files (${scannedLineCount} lines of code)`);
  lines.push(`Scan completed in ${(processingTimeMs / 1000).toFixed(2)} seconds\n`);
  
  // Add category breakdown
  lines.push(`Errors by category:`);
  for (const [category, count] of Object.entries(errorsByCategory)) {
    lines.push(`  ${category}: ${count}`);
  }
  lines.push('');
  
  // Add top files with errors
  const filesSorted = Object.entries(errorsByFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  lines.push(`Top files with errors:`);
  for (const [file, count] of filesSorted) {
    lines.push(`  ${file}: ${count}`);
  }
  
  return lines.join('\n');
}

export default {
  findTypeScriptErrors
};