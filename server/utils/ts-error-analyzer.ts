/**
 * TypeScript Error Analyzer
 * 
 * This utility analyzes TypeScript errors by parsing compiler output and 
 * categorizing errors by type, severity, and related patterns. It provides
 * detailed information about each error and suggests potential fixes.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Error category types
export type ErrorCategory = 
  | 'TYPE_MISMATCH' 
  | 'MISSING_PROPERTY' 
  | 'IMPLICIT_ANY' 
  | 'UNUSED_VARIABLE'
  | 'NULL_UNDEFINED'
  | 'MODULE_NOT_FOUND'
  | 'SYNTAX_ERROR'
  | 'INTERFACE_ERROR'
  | 'TYPE_ARGUMENT'
  | 'CIRCULAR_REFERENCE'
  | 'OTHER';

// Error severity
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

// Structured error information
export interface TypeScriptError {
  // Error location
  filePath: string;
  line: number;
  column: number;
  
  // Error details
  code: string;
  message: string;
  
  // Analyzed information
  category: ErrorCategory;
  severity: ErrorSeverity;
  relatedTypes?: string[];
  suggestedFix?: string;
  
  // Context
  lineContent?: string;
  nearbyCode?: string[];
}

// Analysis results
export interface ErrorAnalysisResult {
  // Summary
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  
  // Groupings
  errorsByCategory: Record<ErrorCategory, TypeScriptError[]>;
  errorsByFile: Record<string, TypeScriptError[]>;
  errorsByCode: Record<string, TypeScriptError[]>;
  
  // All errors
  errors: TypeScriptError[];
  
  // Analysis metadata
  timestamp: number;
  projectRoot: string;
  tsConfigPath: string;
}

/**
 * Categorizes an error message into an error category
 */
function categorizeError(message: string): ErrorCategory {
  if (
    message.includes('is not assignable to type') ||
    message.includes('is not assignable to parameter') ||
    message.includes('has no properties in common with type')
  ) {
    return 'TYPE_MISMATCH';
  }
  
  if (
    message.includes('Property') && 
    (message.includes('does not exist on type') || 
     message.includes('is missing in type'))
  ) {
    return 'MISSING_PROPERTY';
  }
  
  if (message.includes('implicitly has an \'any\' type')) {
    return 'IMPLICIT_ANY';
  }
  
  if (message.includes('is declared but') && message.includes('never used')) {
    return 'UNUSED_VARIABLE';
  }
  
  if (
    message.includes('null') || 
    message.includes('undefined') || 
    message.includes('is possibly undefined')
  ) {
    return 'NULL_UNDEFINED';
  }
  
  if (message.includes('Cannot find module') || message.includes('Cannot find name')) {
    return 'MODULE_NOT_FOUND';
  }
  
  if (
    message.includes('expected') || 
    message.includes('Unexpected') || 
    message.includes('Declaration expected')
  ) {
    return 'SYNTAX_ERROR';
  }
  
  if (
    message.includes('interface') || 
    message.includes('type') && 
    message.includes('extends')
  ) {
    return 'INTERFACE_ERROR';
  }
  
  if (message.includes('Type argument')) {
    return 'TYPE_ARGUMENT';
  }
  
  if (message.includes('circular')) {
    return 'CIRCULAR_REFERENCE';
  }
  
  return 'OTHER';
}

/**
 * Determines the severity of an error based on its category and message
 */
function determineSeverity(category: ErrorCategory, message: string): ErrorSeverity {
  // Critical errors prevent compilation
  if (
    category === 'SYNTAX_ERROR' ||
    category === 'MODULE_NOT_FOUND' ||
    category === 'CIRCULAR_REFERENCE'
  ) {
    return 'critical';
  }
  
  // High severity errors likely cause runtime issues
  if (
    category === 'TYPE_MISMATCH' && 
    (message.includes('null') || message.includes('undefined')) ||
    category === 'NULL_UNDEFINED'
  ) {
    return 'high';
  }
  
  // Medium severity errors may cause issues or indicate code quality problems
  if (
    category === 'TYPE_MISMATCH' ||
    category === 'MISSING_PROPERTY' ||
    category === 'IMPLICIT_ANY'
  ) {
    return 'medium';
  }
  
  // Low severity errors are mostly style or optimization issues
  return 'low';
}

/**
 * Extracts related types from an error message
 */
function extractRelatedTypes(message: string): string[] {
  const types = [];
  
  // Extract types from "X is not assignable to type Y" patterns
  const assignableMatch = message.match(/['"](.+)['"]\s+is not assignable to type\s+['"](.+)['"]/);
  if (assignableMatch) {
    types.push(assignableMatch[1], assignableMatch[2]);
  }
  
  // Extract property types
  const propertyMatch = message.match(/Property\s+['"](.+)['"]\s+does not exist on type\s+['"](.+)['"]/);
  if (propertyMatch) {
    types.push(propertyMatch[2]);
  }
  
  // Extract other type references
  const typeMatches = message.match(/type\s+['"]([^'"]+)['"]/g);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const type = match.replace(/type\s+['"]/, '').replace(/['"]$/, '');
      if (!types.includes(type)) {
        types.push(type);
      }
    });
  }
  
  return types;
}

/**
 * Suggests a fix based on the error category and message
 */
function suggestFix(error: Partial<TypeScriptError>): string | undefined {
  const { category, message } = error;
  
  if (!category || !message) return undefined;
  
  switch (category) {
    case 'TYPE_MISMATCH':
      if (message.includes('null') || message.includes('undefined')) {
        return 'Add null/undefined checks before using this value, or use optional chaining (obj?.prop) or nullish coalescing (value ?? defaultValue).';
      }
      return 'Ensure the types are compatible or add an explicit type cast if necessary.';
      
    case 'MISSING_PROPERTY':
      const propMatch = message.match(/Property\s+['"](.+)['"]/);
      if (propMatch) {
        return `Add the property '${propMatch[1]}' to the object type or check if you meant to use a different property name.`;
      }
      return 'Add the missing property to the type, or check for typos in the property name.';
      
    case 'IMPLICIT_ANY':
      return 'Add an explicit type annotation or initialize with a value that has a specific type.';
      
    case 'UNUSED_VARIABLE':
      return 'Remove the unused variable or prefix with an underscore (_) to indicate it\'s intentionally unused.';
      
    case 'MODULE_NOT_FOUND':
      if (message.includes('Cannot find module')) {
        const moduleMatch = message.match(/Cannot find module\s+['"](.+)['"]/);
        if (moduleMatch) {
          return `Check if the module '${moduleMatch[1]}' is installed, or fix the import path.`;
        }
      }
      return 'Check if the module is installed or if the import path is correct.';
      
    case 'SYNTAX_ERROR':
      return 'Fix the syntax error according to TypeScript syntax rules.';
      
    case 'INTERFACE_ERROR':
      return 'Check the interface definition and implementation for compatibility.';
      
    case 'TYPE_ARGUMENT':
      return 'Provide the correct type arguments for the generic type.';
      
    case 'CIRCULAR_REFERENCE':
      return 'Refactor the types to break the circular reference, possibly using interfaces or type intersections.';
      
    default:
      return undefined;
  }
}

/**
 * Runs the TypeScript compiler to get error output
 */
async function runTypeScriptCompiler(projectRoot: string, tsConfigPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use npx tsc to run TypeScript compiler
    const tsc = spawn('npx', ['tsc', '--noEmit', '--project', tsConfigPath], {
      cwd: projectRoot,
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    tsc.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    tsc.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    tsc.on('close', code => {
      // Code 0 means no errors, but we want errors
      if (code === 0) {
        resolve('');
      } else {
        resolve(stdout || stderr);
      }
    });
    
    tsc.on('error', error => {
      reject(error);
    });
  });
}

/**
 * Gets the content of a line from a file
 */
function getLineContent(filePath: string, lineNumber: number): string | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Line numbers are 1-based, but array indices are 0-based
    return lines[lineNumber - 1];
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Gets a few lines of context around a specific line
 */
function getNearbyCode(filePath: string, lineNumber: number, context = 2): string[] | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Calculate start and end lines with context
    const start = Math.max(0, lineNumber - 1 - context);
    const end = Math.min(lines.length - 1, lineNumber - 1 + context);
    
    return lines.slice(start, end + 1);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Parses TypeScript error output into structured error objects
 */
function parseErrorOutput(output: string, projectRoot: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];
  const errorRegex = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
  
  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    const [_, filePath, lineStr, columnStr, codeNum, message] = match;
    const line = parseInt(lineStr, 10);
    const column = parseInt(columnStr, 10);
    const code = `TS${codeNum}`;
    
    // Create structured error object
    const category = categorizeError(message);
    const severity = determineSeverity(category, message);
    const relatedTypes = extractRelatedTypes(message);
    
    const absoluteFilePath = path.isAbsolute(filePath) 
      ? filePath
      : path.join(projectRoot, filePath);
    
    const error: TypeScriptError = {
      filePath: absoluteFilePath,
      line,
      column,
      code,
      message,
      category,
      severity,
      relatedTypes,
      lineContent: getLineContent(absoluteFilePath, line),
      nearbyCode: getNearbyCode(absoluteFilePath, line)
    };
    
    // Add suggested fix
    error.suggestedFix = suggestFix(error);
    
    errors.push(error);
  }
  
  return errors;
}

/**
 * Analyzes TypeScript errors in a project
 */
export async function analyzeTypeScriptErrors(
  projectRoot: string = process.cwd(),
  tsConfigPath: string = 'tsconfig.json'
): Promise<ErrorAnalysisResult> {
  // Ensure paths are absolute
  projectRoot = path.resolve(projectRoot);
  tsConfigPath = path.isAbsolute(tsConfigPath)
    ? tsConfigPath
    : path.join(projectRoot, tsConfigPath);
  
  // Run TypeScript compiler to get error output
  const output = await runTypeScriptCompiler(projectRoot, tsConfigPath);
  
  // Parse the error output
  const errors = parseErrorOutput(output, projectRoot);
  
  // Group errors by category
  const errorsByCategory: Record<ErrorCategory, TypeScriptError[]> = {
    TYPE_MISMATCH: [],
    MISSING_PROPERTY: [],
    IMPLICIT_ANY: [],
    UNUSED_VARIABLE: [],
    NULL_UNDEFINED: [],
    MODULE_NOT_FOUND: [],
    SYNTAX_ERROR: [],
    INTERFACE_ERROR: [],
    TYPE_ARGUMENT: [],
    CIRCULAR_REFERENCE: [],
    OTHER: []
  };
  
  // Group errors by file
  const errorsByFile: Record<string, TypeScriptError[]> = {};
  
  // Group errors by code
  const errorsByCode: Record<string, TypeScriptError[]> = {};
  
  // Count errors by severity
  let criticalErrors = 0;
  let highSeverityErrors = 0;
  let mediumSeverityErrors = 0;
  let lowSeverityErrors = 0;
  
  // Process each error
  for (const error of errors) {
    // Group by category
    errorsByCategory[error.category].push(error);
    
    // Group by file
    if (!errorsByFile[error.filePath]) {
      errorsByFile[error.filePath] = [];
    }
    errorsByFile[error.filePath].push(error);
    
    // Group by code
    if (!errorsByCode[error.code]) {
      errorsByCode[error.code] = [];
    }
    errorsByCode[error.code].push(error);
    
    // Count by severity
    switch (error.severity) {
      case 'critical':
        criticalErrors++;
        break;
      case 'high':
        highSeverityErrors++;
        break;
      case 'medium':
        mediumSeverityErrors++;
        break;
      case 'low':
        lowSeverityErrors++;
        break;
    }
  }
  
  // Build result
  return {
    totalErrors: errors.length,
    criticalErrors,
    highSeverityErrors,
    mediumSeverityErrors,
    lowSeverityErrors,
    errorsByCategory,
    errorsByFile,
    errorsByCode,
    errors,
    timestamp: Date.now(),
    projectRoot,
    tsConfigPath
  };
}

export default {
  analyzeTypeScriptErrors,
  categorizeError,
  determineSeverity,
  extractRelatedTypes,
  suggestFix
};