/**
 * TypeScript Error Analyzer
 * 
 * This utility provides advanced analysis of TypeScript errors including:
 * - Pattern recognition for common error types
 * - Dependency tracking to identify related errors
 * - Context-aware analysis for better error understanding
 * - Integration with security validation
 */

import { TypeScriptErrorDetail } from './ts-error-finder';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { errorPatterns, typeScriptErrors } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Error context size (lines before and after)
const DEFAULT_CONTEXT_LINES = 5;

// Common error patterns
const ERROR_PATTERNS = {
  TYPE_MISMATCH: /Type '(.+)' is not assignable to type '(.+)'/,
  NULL_UNDEFINED: /Object is possibly '(null|undefined)'/,
  NO_SUCH_PROPERTY: /Property '(.+)' does not exist on type '(.+)'/,
  NO_SUCH_MODULE: /Cannot find module '(.+)' or its corresponding type declarations/,
  MISSING_TYPE: /Parameter '(.+)' implicitly has an '(.+)' type/,
  MISSING_RETURN: /A function whose declared type is neither 'void' nor 'any' must return a value/,
  NOT_EXPORTED: /Module '(.+)' has no exported member '(.+)'/,
  PRIVATE_MEMBER: /Property '(.+)' is private and only accessible within class '(.+)'/,
  UNEXPECTED_TOKEN: /Unexpected token/,
  CIRCULAR_REFERENCE: /Circular reference detected/,
  INTERFACE_MISMATCH: /Property '(.+)' is missing in type '(.+)' but required in type '(.+)'/,
  GENERIC_CONSTRAINT: /Type '(.+)' does not satisfy the constraint '(.+)'/,
  DUPLICATE_IDENTIFIER: /Duplicate identifier '(.+)'/,
  REST_PARAMETER: /A rest parameter must be of an array type/,
  NO_INDEX_SIGNATURE: /Element implicitly has an 'any' type because expression of type '(.+)' can't be used to index type '(.+)'/,
  INHERITANCE_CONFLICT: /Types of property '(.+)' are incompatible/,
  NAMESPACE_CONFLICT: /Namespace '(.+)' has no exported member '(.+)'/
};

// Module import regex
const IMPORT_REGEX = /import\s+(?:{[^}]+}|\*\s+as\s+[^\s;]+|[^\s;,]+)?\s*(?:,\s*(?:{[^}]+}|[^\s;,]+))?\s*from\s+['"]([^'"]+)['"]/g;

// Type dependency regex
const TYPE_DEPENDENCY_REGEX = /(?:extends|implements|:)\s+([A-Za-z0-9_.$]+)(?:<.*>)?/g;

export interface ErrorAnalysisResult {
  errorDetail: TypeScriptErrorDetail;
  category: string;
  rootCause: string;
  suggestedFix: string;
  dependentFiles: string[];
  relatedErrors: number[];
  patterns: {
    id: number;
    name: string;
    description: string;
    frequency: number;
  }[];
  context: {
    before: string[];
    error: string;
    after: string[];
  };
  securityImplications: {
    level: 'none' | 'low' | 'medium' | 'high';
    details: string;
  };
  autoFixable: boolean;
}

/**
 * Analyze a single TypeScript error in depth
 */
export async function analyzeTypeScriptError(
  error: TypeScriptErrorDetail,
  options: {
    includeFileContext?: boolean;
    contextLines?: number;
    includeRelatedErrors?: boolean;
    includeDependencies?: boolean;
    includeSecurityAnalysis?: boolean;
  } = {}
): Promise<ErrorAnalysisResult> {
  const contextLines = options.contextLines || DEFAULT_CONTEXT_LINES;
  
  // Default analysis result
  const analysisResult: ErrorAnalysisResult = {
    errorDetail: error,
    category: error.category,
    rootCause: "Unknown error cause",
    suggestedFix: "No fix suggestion available",
    dependentFiles: [],
    relatedErrors: [],
    patterns: [],
    context: {
      before: [],
      error: "",
      after: []
    },
    securityImplications: {
      level: 'none',
      details: 'No security implications detected'
    },
    autoFixable: false
  };
  
  // Get file context if requested
  if (options.includeFileContext) {
    try {
      const fileContext = await getFileContext(error.file, error.line, contextLines);
      analysisResult.context = fileContext;
    } catch (err) {
      console.error(`Failed to get file context for ${error.file}:`, err);
    }
  }
  
  // Match error to known patterns
  analysisResult.patterns = await matchErrorPatterns(error);
  
  if (analysisResult.patterns.length > 0) {
    // Use most frequent pattern for root cause and fix suggestion
    const topPattern = analysisResult.patterns[0];
    analysisResult.rootCause = topPattern.description;
    
    // Determine if auto-fixable based on pattern
    analysisResult.autoFixable = await isAutoFixable(topPattern.id);
  } else {
    // Generic analysis if no patterns matched
    analysisResult.rootCause = analyzeErrorMessage(error.message);
  }
  
  // Get suggested fix
  analysisResult.suggestedFix = generateFixSuggestion(error);
  
  // Get dependent files
  if (options.includeDependencies) {
    analysisResult.dependentFiles = await findDependentFiles(error.file);
  }
  
  // Get related errors
  if (options.includeRelatedErrors) {
    analysisResult.relatedErrors = await findRelatedErrors(error);
  }
  
  // Perform security analysis if requested
  if (options.includeSecurityAnalysis) {
    analysisResult.securityImplications = analyzeSecurityImplications(error, analysisResult.context);
  }
  
  return analysisResult;
}

/**
 * Analyze multiple TypeScript errors
 */
export async function analyzeTypeScriptErrors(
  errors: TypeScriptErrorDetail[],
  options: {
    includeFileContext?: boolean;
    contextLines?: number;
    includeRelatedErrors?: boolean;
    includeDependencies?: boolean;
    includeSecurityAnalysis?: boolean;
    batchSize?: number;
  } = {}
): Promise<ErrorAnalysisResult[]> {
  const batchSize = options.batchSize || 10;
  const results: ErrorAnalysisResult[] = [];
  
  // Process errors in batches to avoid overwhelming system resources
  for (let i = 0; i < errors.length; i += batchSize) {
    const batch = errors.slice(i, i + batchSize);
    const batchPromises = batch.map(error => analyzeTypeScriptError(error, options));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Get context from file for an error
 */
async function getFileContext(
  filePath: string,
  lineNumber: number,
  contextLines: number
): Promise<{ before: string[], error: string, after: string[] }> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Adjust for 0-based array indexing vs 1-based line numbers
    const errorLineIndex = lineNumber - 1;
    
    // Get lines before error
    const startLineIndex = Math.max(0, errorLineIndex - contextLines);
    const before = lines.slice(startLineIndex, errorLineIndex);
    
    // Get error line
    const error = lines[errorLineIndex] || '';
    
    // Get lines after error
    const endLineIndex = Math.min(lines.length, errorLineIndex + contextLines + 1);
    const after = lines.slice(errorLineIndex + 1, endLineIndex);
    
    return { before, error, after };
  } catch (err) {
    console.error(`Failed to read file ${filePath}:`, err);
    return { before: [], error: '', after: [] };
  }
}

/**
 * Match an error to known patterns in the database
 */
async function matchErrorPatterns(error: TypeScriptErrorDetail): Promise<Array<{
  id: number;
  name: string;
  description: string;
  frequency: number;
}>> {
  try {
    // Find patterns that match this error code
    const patterns = await db.select({
      id: errorPatterns.id,
      name: errorPatterns.name,
      description: errorPatterns.description,
      created_at: errorPatterns.created_at,
    })
    .from(errorPatterns)
    .where(eq(errorPatterns.category, error.category));
    
    // Sort by creation date (most recent first)
    return patterns.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      frequency: 0 // We'll update this later when we have frequency data
    })).sort((a, b) => b.frequency - a.frequency);
  } catch (err) {
    console.error('Failed to match error patterns:', err);
    return [];
  }
}

/**
 * Determine if a pattern has auto-fixable solutions
 */
async function isAutoFixable(patternId: number): Promise<boolean> {
  try {
    const [pattern] = await db.select({
      auto_fixable: errorPatterns.auto_fixable
    })
    .from(errorPatterns)
    .where(eq(errorPatterns.id, patternId));
    
    return pattern?.auto_fixable || false;
  } catch (err) {
    console.error('Failed to determine if pattern is auto-fixable:', err);
    return false;
  }
}

/**
 * Analyze error message to determine root cause
 */
function analyzeErrorMessage(message: string): string {
  // Check against known error patterns
  for (const [type, regex] of Object.entries(ERROR_PATTERNS)) {
    const match = message.match(regex);
    if (match) {
      switch (type) {
        case 'TYPE_MISMATCH':
          return `Type mismatch: Type '${match[1]}' is not compatible with type '${match[2]}'`;
        case 'NO_SUCH_PROPERTY':
          return `Property '${match[1]}' doesn't exist on the type '${match[2]}'`;
        case 'NULL_UNDEFINED':
          return `Null safety issue: Object could be '${match[1]}'`;
        case 'NO_SUCH_MODULE':
          return `Missing module: Could not find module '${match[1]}'`;
        case 'MISSING_TYPE':
          return `Missing type annotation: Parameter '${match[1]}' has an implicit '${match[2]}' type`;
        case 'NOT_EXPORTED':
          return `Import error: Module '${match[1]}' does not export '${match[2]}'`;
        case 'PRIVATE_MEMBER':
          return `Access control issue: Property '${match[1]}' is private in class '${match[2]}'`;
        case 'INTERFACE_MISMATCH':
          return `Interface implementation issue: Property '${match[1]}' is required`;
        case 'GENERIC_CONSTRAINT':
          return `Generic constraint violation: Type '${match[1]}' does not satisfy constraint '${match[2]}'`;
        case 'DUPLICATE_IDENTIFIER':
          return `Naming conflict: Duplicate identifier '${match[1]}'`;
        case 'NO_INDEX_SIGNATURE':
          return `Index signature issue: Cannot use '${match[1]}' to index '${match[2]}'`;
        default:
          return message;
      }
    }
  }
  
  // Generic fallback if no patterns match
  return message;
}

/**
 * Generate a fix suggestion based on error type
 */
function generateFixSuggestion(error: TypeScriptErrorDetail): string {
  const message = error.message;
  
  // Type mismatch errors
  if (message.includes('Type') && message.includes('is not assignable to type')) {
    return "Check the type definitions and use type assertion if appropriate, or modify the value to match the expected type.";
  }
  
  // Null/undefined errors
  if (message.includes('null') || message.includes('undefined')) {
    return "Add a null check before accessing this property or use optional chaining with '?' operator.";
  }
  
  // Missing property errors
  if (message.includes('Property') && message.includes('does not exist on type')) {
    return "Verify the property name or add the property to the type definition.";
  }
  
  // Missing module errors
  if (message.includes('Cannot find module')) {
    return "Install the missing package or check the import path.";
  }
  
  // Missing type annotations
  if (message.includes('implicitly has an ')) {
    return "Add an explicit type annotation to avoid implicit 'any' type.";
  }
  
  // Missing return value
  if (message.includes('must return a value')) {
    return "Add a return statement with the appropriate type, or change the function return type to 'void'.";
  }
  
  // Generic fallback
  return "Review the error message and fix the code accordingly.";
}

/**
 * Find files that depend on the file with the error
 */
async function findDependentFiles(filePath: string): Promise<string[]> {
  const projectRoot = process.cwd();
  const dependentFiles: string[] = [];
  const fileExtension = path.extname(filePath);
  
  // Only look for files with the same extension
  const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  if (!possibleExtensions.includes(fileExtension)) {
    return dependentFiles;
  }
  
  // Get the module name from the file path
  const moduleName = path.basename(filePath, fileExtension);
  const moduleDir = path.dirname(filePath);
  
  // Search for files that import this module
  try {
    // Find source files in the project
    const files = await findSourceFiles(projectRoot, possibleExtensions);
    
    // Check each file for imports
    for (const file of files) {
      if (file === filePath) continue; // Skip self
      
      const content = await fs.readFile(file, 'utf-8');
      
      // Find all imports in the file
      const imports: string[] = [];
      let match;
      
      while ((match = IMPORT_REGEX.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // Check if any import matches our module
      for (const importPath of imports) {
        // Handle different import path formats
        const normalizedImport = importPath.replace(/['"]/g, '');
        
        const isRelativeImport = normalizedImport.startsWith('./') || normalizedImport.startsWith('../');
        
        if (isRelativeImport) {
          const importFilePath = path.resolve(path.dirname(file), normalizedImport);
          const resolvedPath = path.resolve(moduleDir, moduleName);
          
          // Compare resolved paths
          if (importFilePath === resolvedPath || importFilePath.startsWith(resolvedPath + '/')) {
            dependentFiles.push(file);
            break;
          }
        } else {
          // Non-relative (package) import
          const moduleNameRegex = new RegExp(`/${moduleName}(/|$)`);
          if (moduleNameRegex.test(normalizedImport)) {
            dependentFiles.push(file);
            break;
          }
        }
      }
    }
    
    return dependentFiles;
  } catch (err) {
    console.error('Failed to find dependent files:', err);
    return [];
  }
}

/**
 * Find all source files in the project with given extensions
 */
async function findSourceFiles(dir: string, extensions: string[]): Promise<string[]> {
  // Skip node_modules, .git, and other common non-source directories
  const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  
  try {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          const subDirFiles = await findSourceFiles(fullPath, extensions);
          files.push(...subDirFiles);
        }
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
    
    return files;
  } catch (err) {
    console.error(`Failed to read directory ${dir}:`, err);
    return [];
  }
}

/**
 * Find errors related to the current error
 */
async function findRelatedErrors(error: TypeScriptErrorDetail): Promise<number[]> {
  try {
    // Find errors in the same file
    const relatedErrors = await db.select({
      id: typeScriptErrors.id
    })
    .from(typeScriptErrors)
    .where(sql`${typeScriptErrors.file_path} = ${error.file} AND ${typeScriptErrors.id} != ${error.code}`);
    
    return relatedErrors.map(err => err.id);
  } catch (err) {
    console.error('Failed to find related errors:', err);
    return [];
  }
}

/**
 * Analyze potential security implications of the error
 */
function analyzeSecurityImplications(
  error: TypeScriptErrorDetail,
  context: { before: string[], error: string, after: string[] }
): { level: 'none' | 'low' | 'medium' | 'high'; details: string } {
  // Default response
  const defaultResponse = { level: 'none' as const, details: 'No security implications detected' };
  
  // Get all relevant code context
  const allCode = [...context.before, context.error, ...context.after].join('\n');
  
  // Security-sensitive functions and patterns
  const securityPatterns = [
    { pattern: /eval\s*\(/, level: 'high', description: 'Use of eval() can lead to code injection' },
    { pattern: /document\.write\s*\(/, level: 'medium', description: 'document.write can lead to XSS vulnerabilities' },
    { pattern: /innerHTML\s*=/, level: 'medium', description: 'innerHTML can lead to XSS if unvalidated input is used' },
    { pattern: /dangerouslySetInnerHTML/, level: 'medium', description: 'dangerouslySetInnerHTML can lead to XSS if unvalidated' },
    { pattern: /localStorage\.setItem/, level: 'low', description: 'Storing sensitive data in localStorage is insecure' },
    { pattern: /sessionStorage\.setItem/, level: 'low', description: 'Storing sensitive data in sessionStorage is insecure' },
    { pattern: /new\s+Function\s*\(/, level: 'high', description: 'Dynamic function creation can lead to code injection' },
    { pattern: /https?:\/\//, level: 'low', description: 'Hardcoded URLs may lead to data leakage or insecure connections' },
    { pattern: /password|token|secret|key|credentials/i, level: 'medium', description: 'Potentially sensitive data in code' },
    { pattern: /setTimeout\s*\(\s*["'`]/, level: 'medium', description: 'setTimeout with string argument can lead to code injection' },
    { pattern: /setInterval\s*\(\s*["'`]/, level: 'medium', description: 'setInterval with string argument can lead to code injection' },
    { pattern: /Object\.assign\s*\(/, level: 'low', description: 'Object.assign can lead to prototype pollution if not careful' },
    { pattern: /cors|CORS/, level: 'low', description: 'CORS configuration may affect application security' },
    { pattern: /jwt|JWT/, level: 'low', description: 'JWT usage should be reviewed for secure implementation' }
  ];
  
  // Check for security patterns
  for (const { pattern, level, description } of securityPatterns) {
    if (pattern.test(allCode)) {
      return { level: level as 'low' | 'medium' | 'high', details: description };
    }
  }
  
  // Check for error-specific security concerns
  if (error.message.includes('any') || error.message.includes('unknown')) {
    return { 
      level: 'low', 
      details: 'Using "any" or "unknown" types can bypass type checking and lead to security issues' 
    };
  }
  
  if (error.message.includes('noImplicitAny') || error.message.includes('strictNullChecks')) {
    return { 
      level: 'low', 
      details: 'Disabling TypeScript strict flags can lead to runtime errors and potential security issues' 
    };
  }
  
  return defaultResponse;
}

/**
 * Generate a detailed error report with context, pattern analysis and security implications
 */
export async function generateErrorReport(
  errors: TypeScriptErrorDetail[],
  options: {
    includeFileContext?: boolean;
    contextLines?: number;
    includeRelatedErrors?: boolean;
    includeDependencies?: boolean;
    includeSecurityAnalysis?: boolean;
    format?: 'json' | 'markdown' | 'html';
  } = {}
): Promise<string> {
  const analysisResults = await analyzeTypeScriptErrors(errors, options);
  const format = options.format || 'markdown';
  
  switch (format) {
    case 'json':
      return JSON.stringify(analysisResults, null, 2);
      
    case 'html':
      return generateHtmlReport(analysisResults);
      
    case 'markdown':
    default:
      return generateMarkdownReport(analysisResults);
  }
}

/**
 * Generate a Markdown report from analysis results
 */
function generateMarkdownReport(results: ErrorAnalysisResult[]): string {
  let report = `# TypeScript Error Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total Errors Analyzed: ${results.length}\n\n`;
  
  for (const [index, result] of results.entries()) {
    report += `## Error ${index + 1}: ${result.errorDetail.code}\n\n`;
    report += `**Message:** ${result.errorDetail.message}\n\n`;
    report += `**File:** ${result.errorDetail.file}:${result.errorDetail.line}:${result.errorDetail.column}\n\n`;
    report += `**Category:** ${result.category}\n\n`;
    report += `**Root Cause:** ${result.rootCause}\n\n`;
    
    if (result.patterns.length > 0) {
      report += `**Matching Patterns:**\n\n`;
      for (const pattern of result.patterns) {
        report += `- ${pattern.name}: ${pattern.description}\n`;
      }
      report += `\n`;
    }
    
    if (result.context.error) {
      report += `**Code Context:**\n\n\`\`\`typescript\n`;
      
      // Line numbers and context
      const startLine = result.errorDetail.line - result.context.before.length;
      for (let i = 0; i < result.context.before.length; i++) {
        report += `${startLine + i}: ${result.context.before[i]}\n`;
      }
      
      // Error line (marked)
      report += `${result.errorDetail.line}: ${result.context.error} <-- ERROR\n`;
      
      // After context
      for (let i = 0; i < result.context.after.length; i++) {
        report += `${result.errorDetail.line + i + 1}: ${result.context.after[i]}\n`;
      }
      
      report += `\`\`\`\n\n`;
    }
    
    report += `**Fix Suggestion:** ${result.suggestedFix}\n\n`;
    
    if (result.securityImplications.level !== 'none') {
      report += `**Security Implications:** ${result.securityImplications.level.toUpperCase()} - ${result.securityImplications.details}\n\n`;
    }
    
    if (result.dependentFiles.length > 0) {
      report += `**Dependent Files:**\n\n`;
      for (const file of result.dependentFiles) {
        report += `- ${file}\n`;
      }
      report += `\n`;
    }
    
    report += `---\n\n`;
  }
  
  return report;
}

/**
 * Generate an HTML report from analysis results
 */
function generateHtmlReport(results: ErrorAnalysisResult[]): string {
  let report = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TypeScript Error Analysis Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #2563eb; }
    h2 { color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .error-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
    .error-message { font-weight: bold; color: #ef4444; }
    .error-location { font-family: monospace; color: #6b7280; }
    .error-category { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 14px; background: #e5e7eb; }
    .code-block { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; overflow: auto; font-family: monospace; line-height: 1.4; }
    .error-line { background: rgba(239, 68, 68, 0.3); }
    .error-indicator { color: #ef4444; font-weight: bold; }
    .security-high { background: #fee2e2; color: #b91c1c; padding: 8px; border-radius: 4px; }
    .security-medium { background: #fef3c7; color: #92400e; padding: 8px; border-radius: 4px; }
    .security-low { background: #f3f4f6; color: #4b5563; padding: 8px; border-radius: 4px; }
    .fix-suggestion { background: #ecfdf5; border-left: 4px solid #10b981; padding: 10px; }
    .meta-info { font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>TypeScript Error Analysis Report</h1>
    <p class="meta-info">Generated: ${new Date().toISOString()}</p>
    <p>Total Errors Analyzed: ${results.length}</p>
`;

  for (const [index, result] of results.entries()) {
    // Security level styling
    const securityClass = result.securityImplications.level === 'high' 
      ? 'security-high' 
      : result.securityImplications.level === 'medium'
        ? 'security-medium'
        : 'security-low';
    
    report += `
    <div class="error-card">
      <h2>Error ${index + 1}: ${result.errorDetail.code}</h2>
      <p class="error-message">${escapeHtml(result.errorDetail.message)}</p>
      <p class="error-location">File: ${escapeHtml(result.errorDetail.file)}:${result.errorDetail.line}:${result.errorDetail.column}</p>
      <p>Category: <span class="error-category">${result.category}</span></p>
      <p><strong>Root Cause:</strong> ${escapeHtml(result.rootCause)}</p>
`;

    if (result.patterns.length > 0) {
      report += `      <div>
        <p><strong>Matching Patterns:</strong></p>
        <ul>`;
      for (const pattern of result.patterns) {
        report += `
          <li>${escapeHtml(pattern.name)}: ${escapeHtml(pattern.description)}</li>`;
      }
      report += `
        </ul>
      </div>`;
    }

    if (result.context.error) {
      report += `
      <p><strong>Code Context:</strong></p>
      <div class="code-block">`;
      
      // Line numbers and context
      const startLine = result.errorDetail.line - result.context.before.length;
      for (let i = 0; i < result.context.before.length; i++) {
        report += `
        <div>${startLine + i}: ${escapeHtml(result.context.before[i])}</div>`;
      }
      
      // Error line (marked)
      report += `
        <div class="error-line">${result.errorDetail.line}: ${escapeHtml(result.context.error)} <span class="error-indicator">&lt;-- ERROR</span></div>`;
      
      // After context
      for (let i = 0; i < result.context.after.length; i++) {
        report += `
        <div>${result.errorDetail.line + i + 1}: ${escapeHtml(result.context.after[i])}</div>`;
      }
      
      report += `
      </div>`;
    }

    report += `
      <div class="fix-suggestion">
        <p><strong>Fix Suggestion:</strong> ${escapeHtml(result.suggestedFix)}</p>
      </div>`;

    if (result.securityImplications.level !== 'none') {
      report += `
      <div class="${securityClass}">
        <p><strong>Security Implications:</strong> ${result.securityImplications.level.toUpperCase()} - ${escapeHtml(result.securityImplications.details)}</p>
      </div>`;
    }

    if (result.dependentFiles.length > 0) {
      report += `
      <div>
        <p><strong>Dependent Files:</strong></p>
        <ul>`;
      for (const file of result.dependentFiles) {
        report += `
          <li>${escapeHtml(file)}</li>`;
      }
      report += `
        </ul>
      </div>`;
    }

    report += `
    </div>`;
  }

  report += `
  </div>
</body>
</html>`;

  return report;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}