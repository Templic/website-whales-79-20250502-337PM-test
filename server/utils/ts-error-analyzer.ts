/**
 * TypeScript Error Analyzer
 * 
 * This module analyzes TypeScript files to detect and categorize errors.
 * It uses the TypeScript compiler API to parse files and generate diagnostics.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { tsErrorStorage } from '../tsErrorStorage';

// Interface for analysis result
interface AnalysisResult {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrorFiles: Array<{ filePath: string; errorCount: number }>;
  errors: Array<{
    errorCode: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    errorMessage: string;
    errorContext?: string;
    category?: string;
    severity?: string;
  }>;
}

/**
 * Analyze a TypeScript project for errors
 * 
 * @param configPath Path to tsconfig.json (optional)
 * @returns Analysis result
 */
export async function analyzeProject(configPath?: string): Promise<AnalysisResult> {
  try {
    // Determine project root
    const projectRoot = process.cwd();
    
    // If no config path provided, try to find tsconfig.json
    if (!configPath) {
      const configPaths = [
        path.join(projectRoot, 'tsconfig.json'),
        path.join(projectRoot, 'src', 'tsconfig.json')
      ];
      
      for (const possiblePath of configPaths) {
        if (fs.existsSync(possiblePath)) {
          configPath = possiblePath;
          break;
        }
      }
      
      if (!configPath) {
        console.warn('No tsconfig.json found, using default settings');
      }
    }
    
    // Create program
    let program: ts.Program;
    
    if (configPath && fs.existsSync(configPath)) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      
      if (configFile.error) {
        throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
      }
      
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      
      program = ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: parsedConfig.options
      });
    } else {
      // Find TypeScript files
      const fileNames = findTypeScriptFiles(projectRoot);
      
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      };
      
      program = ts.createProgram(fileNames, compilerOptions);
    }
    
    // Get diagnostics
    const syntaxDiagnostics = program.getSyntacticDiagnostics();
    const semanticDiagnostics = program.getSemanticDiagnostics();
    const allDiagnostics = [...syntaxDiagnostics, ...semanticDiagnostics];
    
    // Process diagnostics
    const result = await processDiagnostics(program, allDiagnostics);
    
    return result;
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw error;
  }
}

/**
 * Find TypeScript files in a directory
 * 
 * @param dir Directory to search
 * @returns Array of file paths
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  // Skip node_modules and other problematic directories
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'tmp'
  ];
  
  // Skip hidden files and test files
  const skipFiles = [
    /^\./,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/
  ];
  
  function scanDir(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        if (!skipDirs.includes(item)) {
          scanDir(itemPath);
        }
      } else if (stats.isFile()) {
        if (
          (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx')) &&
          !skipFiles.some(pattern => pattern.test(item))
        ) {
          files.push(itemPath);
        }
      }
    }
  }
  
  scanDir(dir);
  return files;
}

/**
 * Process TypeScript diagnostics
 * 
 * @param program TypeScript program
 * @param diagnostics Array of diagnostics
 * @returns Analysis result
 */
async function processDiagnostics(program: ts.Program, diagnostics: ts.Diagnostic[]): Promise<AnalysisResult> {
  // Initialize counters
  const errorsByCategory: Record<string, number> = {};
  const errorsBySeverity: Record<string, number> = {};
  const errorCountByFile: Record<string, number> = {};
  
  // Initialize results
  const errors: Array<{
    errorCode: string;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    errorMessage: string;
    errorContext?: string;
    category?: string;
    severity?: string;
  }> = [];
  
  // Process each diagnostic
  for (const diagnostic of diagnostics) {
    if (!diagnostic.file) continue;
    
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    const filePath = diagnostic.file.fileName;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const code = `TS${diagnostic.code}`;
    
    // Get error context (surrounding code)
    const fileContent = diagnostic.file.text;
    const startLine = Math.max(0, line - 2);
    const endLine = Math.min(fileContent.split('\n').length, line + 3);
    const errorContext = fileContent.split('\n').slice(startLine, endLine).join('\n');
    
    // Categorize error
    const category = categorizeError(code, message);
    
    // Determine severity
    const severity = determineSeverity(diagnostic.category, code, category);
    
    // Record error
    errors.push({
      errorCode: code,
      filePath,
      lineNumber: line + 1, // Convert to 1-based
      columnNumber: character + 1, // Convert to 1-based
      errorMessage: message,
      errorContext,
      category,
      severity
    });
    
    // Update counters
    errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
    errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
    errorCountByFile[filePath] = (errorCountByFile[filePath] || 0) + 1;
    
    // Save to database
    try {
      await saveErrorToDatabase({
        errorCode: code,
        filePath,
        lineNumber: line + 1,
        columnNumber: character + 1,
        errorMessage: message,
        errorContext,
        category,
        severity,
        status: 'detected'
      });
    } catch (error) {
      console.error('Error saving error to database:', error);
    }
  }
  
  // Get top error files
  const topErrorFiles = Object.entries(errorCountByFile)
    .map(([filePath, errorCount]) => ({ filePath, errorCount }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 10);
  
  return {
    totalErrors: errors.length,
    errorsByCategory,
    errorsBySeverity,
    topErrorFiles,
    errors
  };
}

/**
 * Categorize a TypeScript error
 * 
 * @param code Error code
 * @param message Error message
 * @returns Error category
 */
function categorizeError(code: string, message: string): string {
  // Type-related errors
  if (
    message.includes('type') ||
    message.includes('interface') ||
    message.includes('Type') ||
    message.includes('Interface')
  ) {
    if (message.includes('missing')) {
      return 'missing_type';
    } else if (message.includes('not assignable')) {
      return 'type_mismatch';
    } else if (message.includes('interface')) {
      return 'interface_mismatch';
    } else {
      return 'type_mismatch';
    }
  }
  
  // Import-related errors
  if (
    message.includes('import') ||
    message.includes('module') ||
    message.includes('cannot find')
  ) {
    return 'import_error';
  }
  
  // Null/undefined errors
  if (
    message.includes('null') ||
    message.includes('undefined') ||
    message.includes('possibly undefined')
  ) {
    return 'null_reference';
  }
  
  // Generic constraints
  if (message.includes('constraint')) {
    return 'generic_constraint';
  }
  
  // Declaration errors
  if (
    message.includes('declare') ||
    message.includes('duplicate') ||
    message.includes('already')
  ) {
    return 'declaration_error';
  }
  
  // Syntax errors
  if (
    code === 'TS1005' ||
    code === 'TS1128' ||
    code === 'TS1109'
  ) {
    return 'syntax_error';
  }
  
  // Default to 'other'
  return 'other';
}

/**
 * Determine the severity of a TypeScript error
 * 
 * @param diagnosticCategory TypeScript diagnostic category
 * @param code Error code
 * @param errorCategory Our error category
 * @returns Error severity
 */
function determineSeverity(
  diagnosticCategory: ts.DiagnosticCategory,
  code: string,
  errorCategory: string
): string {
  // Critical errors that prevent compilation
  if (diagnosticCategory === ts.DiagnosticCategory.Error) {
    // Import errors are critical
    if (errorCategory === 'import_error') {
      return 'critical';
    }
    
    // Syntax errors are critical
    if (errorCategory === 'syntax_error') {
      return 'critical';
    }
    
    // Some specific error codes are critical
    if (
      code === 'TS2307' || // Cannot find module
      code === 'TS2554' || // Expected n arguments but got m
      code === 'TS2322'    // Type assignment error
    ) {
      return 'critical';
    }
    
    // Default error severity is high
    return 'high';
  } else if (diagnosticCategory === ts.DiagnosticCategory.Warning) {
    // Default warning severity is medium
    return 'medium';
  } else if (diagnosticCategory === ts.DiagnosticCategory.Suggestion) {
    // Suggestions are low severity
    return 'low';
  } else {
    // Default to low severity
    return 'low';
  }
}

/**
 * Save an error to the database
 * 
 * @param error Error information
 */
async function saveErrorToDatabase(error: {
  errorCode: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  errorMessage: string;
  errorContext: string;
  category: string;
  severity: string;
  status: string;
}): Promise<void> {
  try {
    // Check if error already exists
    const existingErrors = await tsErrorStorage.getAllTypescriptErrors({
      errorCode: error.errorCode,
      filePath: error.filePath,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      limit: 1
    });
    
    if (existingErrors.length > 0) {
      // Update existing error
      await tsErrorStorage.updateTypescriptError(existingErrors[0].id, {
        errorMessage: error.errorMessage,
        errorContext: error.errorContext,
        occurrenceCount: existingErrors[0].occurrenceCount + 1,
        lastOccurrenceAt: new Date()
      });
    } else {
      // Create new error
      await tsErrorStorage.createTypescriptError({
        errorCode: error.errorCode,
        filePath: error.filePath,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber,
        errorMessage: error.errorMessage,
        errorContext: error.errorContext,
        category: error.category,
        severity: error.severity,
        status: error.status,
        detectedAt: new Date(),
        firstDetectedAt: new Date(),
        lastOccurrenceAt: new Date(),
        occurrenceCount: 1
      });
    }
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
}

export default {
  analyzeProject
};