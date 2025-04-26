/**
 * Advanced TypeScript Error Finder
 * 
 * A comprehensive utility for finding and categorizing TypeScript errors
 * with advanced filtering, ranking, and documentation capabilities.
 * 
 * This tool is part of the three-phase TypeScript error management system:
 * 1. Detection (this tool)
 * 2. Analysis
 * 3. Resolution
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { ErrorCategory, ErrorSeverity } from './shared/schema';
import chalk from 'chalk';

// Types
export interface AdvancedErrorFinderOptions {
  projectRoot: string;
  tsconfigPath?: string;
  includeNodeModules?: boolean;
  outputFormat?: 'json' | 'markdown' | 'console';
  outputPath?: string;
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

// Default options
const defaultOptions: AdvancedErrorFinderOptions = {
  projectRoot: '.',
  includeNodeModules: false,
  outputFormat: 'console',
  maxErrors: 1000,
  includeWarnings: true,
  sortBy: 'severity',
  concurrent: true,
  concurrencyLimit: 4,
  useColors: true,
  verbose: false
};

/**
 * Main function to find TypeScript errors in a project
 */
export async function findTypeScriptErrors(
  options: Partial<AdvancedErrorFinderOptions> = {}
): Promise<ErrorFindingResult> {
  const startTime = Date.now();
  const opts = { ...defaultOptions, ...options };
  
  console.log(chalk.cyan('Advanced TypeScript Error Finder'));
  console.log(chalk.cyan('==============================='));
  console.log(`Scanning project at: ${opts.projectRoot}`);
  
  // Resolve tsconfig path
  const tsconfigPath = opts.tsconfigPath || ts.findConfigFile(
    opts.projectRoot,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!tsconfigPath) {
    throw new Error(`Could not find tsconfig.json in ${opts.projectRoot}`);
  }
  
  console.log(`Using tsconfig: ${tsconfigPath}`);
  
  // Read and parse tsconfig
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
  let files: string[] = [];
  
  if (opts.filePatterns && opts.filePatterns.length > 0) {
    // Use file patterns if provided
    for (const pattern of opts.filePatterns) {
      const matches = await glob(pattern, { cwd: opts.projectRoot, absolute: true });
      files.push(...matches);
    }
  } else {
    // Default to all TypeScript files
    files = await findTypeScriptFiles(opts.projectRoot);
  }
  
  // Filter out node_modules if requested
  let filteredFiles = opts.includeNodeModules 
    ? files 
    : files.filter(file => !file.includes('node_modules'));
  
  // Apply exclude patterns if provided
  if (opts.excludePatterns && opts.excludePatterns.length > 0) {
    const excludeRegexes = opts.excludePatterns.map(pattern => new RegExp(pattern));
    filteredFiles = filteredFiles.filter(file => 
      !excludeRegexes.some(regex => regex.test(file))
    );
  }
  
  console.log(`Found ${filteredFiles.length} TypeScript files to analyze.`);
  
  // Create a program instance
  const program = ts.createProgram(filteredFiles, parsedConfig.options);
  const checker = program.getTypeChecker();
  
  // Get all diagnostics
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  const semanticDiagnostics = program.getSemanticDiagnostics();
  const declarationDiagnostics = program.getDeclarationDiagnostics();
  
  // Combine all diagnostics
  const allDiagnostics = [
    ...syntacticDiagnostics,
    ...semanticDiagnostics,
    ...declarationDiagnostics
  ];
  
  console.log(`Found ${allDiagnostics.length} TypeScript diagnostics.`);
  
  // Process the diagnostics
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
    summary: ""
  };
  
  // Count total lines scanned
  for (const file of filteredFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      result.scannedLineCount += content.split('\n').length;
    } catch (err) {
      console.warn(`Could not read file ${file} to count lines.`);
    }
  }
  
  // Process diagnostics
  for (const diagnostic of allDiagnostics) {
    if (!diagnostic.file) continue;
    
    const filePath = diagnostic.file.fileName;
    const isError = diagnostic.category === ts.DiagnosticCategory.Error;
    const isWarning = diagnostic.category === ts.DiagnosticCategory.Warning;
    
    // Skip warnings if not including them
    if (isWarning && !opts.includeWarnings) continue;
    
    // Count errors and warnings
    if (isError) {
      result.totalErrors++;
    } else if (isWarning) {
      result.totalWarnings++;
    }
    
    // Increment error count by file
    result.errorsByFile[filePath] = (result.errorsByFile[filePath] || 0) + 1;
    
    // Get line and character position
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    
    // Get the error message
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    
    // Get error code
    const code = `TS${diagnostic.code}`;
    
    // Increment error count by code
    result.errorsByCode[code] = (result.errorsByCode[code] || 0) + 1;
    
    // Get error context (lines around the error)
    const fileContent = diagnostic.file.text;
    const lineStart = getLineStart(fileContent, diagnostic.start!);
    const lineEnd = getLineEnd(fileContent, diagnostic.start!);
    const errorLine = fileContent.substring(lineStart, lineEnd);
    
    // Get a few lines before and after for context
    const contextStart = getPositionOfLineN(fileContent, Math.max(1, line - 2));
    const contextEnd = getPositionOfLineN(fileContent, line + 2);
    const context = fileContent.substring(contextStart, contextEnd);
    
    // Determine category and severity
    const category = categorizeError(diagnostic.code, message);
    const severity = determineSeverity(diagnostic.category, diagnostic.code, message);
    
    // Skip if severity is below minimum
    if (opts.minSeverity) {
      const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      const minSeverityLevel = severityOrder[opts.minSeverity] || 0;
      const currentSeverityLevel = severityOrder[severity] || 0;
      
      if (currentSeverityLevel < minSeverityLevel) continue;
    }
    
    // Skip if not in requested categories
    if (opts.categories && opts.categories.length > 0) {
      if (!opts.categories.includes(category)) continue;
    }
    
    // Increment error count by category
    result.errorsByCategory[category] = (result.errorsByCategory[category] || 0) + 1;
    
    // Add to errors array
    result.errors.push({
      code,
      message,
      file: filePath,
      line: line + 1, // convert to 1-based
      column: character + 1, // convert to 1-based
      severity,
      category,
      context,
      snippet: errorLine,
      suggestedFix: getSuggestedFix(code, message, category)
    });
    
    // Limit number of errors if maxErrors is set
    if (opts.maxErrors && result.errors.length >= opts.maxErrors) {
      break;
    }
  }
  
  // Sort errors based on sortBy option
  sortErrors(result.errors, opts.sortBy || 'severity');
  
  // Calculate processing time
  result.processingTimeMs = Date.now() - startTime;
  
  // Generate summary
  result.summary = generateSummary(result);
  
  // Output results if requested
  if (opts.outputPath) {
    await outputResults(result, opts);
  }
  
  return result;
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const tsFiles = await glob('**/*.{ts,tsx}', { cwd: dir, absolute: true });
  return tsFiles;
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
 * Categorize TypeScript errors
 */
function categorizeError(code: number, message: string): ErrorCategory {
  // Type mismatch errors
  if (message.includes('is not assignable to') || message.includes('argument of type')) {
    return 'type_mismatch';
  }
  
  // Property or method access errors
  if (message.includes('does not exist on type') || message.includes('has no properties in common with')) {
    return 'property_access';
  }
  
  // Import errors
  if (message.includes('Cannot find module') || message.includes('has no exported member')) {
    return 'import_error';
  }
  
  // Null errors
  if (message.includes('null') || message.includes('undefined')) {
    return 'null_reference';
  }
  
  // Interface implementation errors
  if (message.includes('implements') || message.includes('interface')) {
    return 'interface_mismatch';
  }
  
  // Generic constraint errors
  if (message.includes('constraint') || message.includes('not assignable to parameter of type')) {
    return 'generic_constraint';
  }
  
  // Declaration errors
  if (message.includes('cannot redeclare') || message.includes('duplicate')) {
    return 'declaration_error';
  }
  
  // Syntax errors
  if (code < 2000 || message.includes('expected') || message.includes('syntax')) {
    return 'syntax_error';
  }
  
  // Default
  return 'other';
}

/**
 * Determine error severity
 */
function determineSeverity(category: ts.DiagnosticCategory, code: number, message: string): ErrorSeverity {
  if (category === ts.DiagnosticCategory.Error) {
    // Critical errors
    if (
      message.includes('Cannot find module') ||
      message.includes('Syntax error') ||
      message.includes('Expected') ||
      code < 2000
    ) {
      return 'critical';
    }
    
    // High severity errors
    if (
      message.includes('Object is possibly null') ||
      message.includes('Object is possibly undefined') ||
      message.includes('has no properties')
    ) {
      return 'high';
    }
    
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get a suggested fix based on error type
 */
function getSuggestedFix(code: string, message: string, category: ErrorCategory): string | undefined {
  // Extract suggestions from error message
  if (message.includes('Did you mean')) {
    const match = message.match(/Did you mean ['"]([^'"]+)['"]/);
    if (match) {
      return `Use '${match[1]}' instead`;
    }
  }
  
  // Property does not exist
  if (message.includes('Property') && message.includes('does not exist on type')) {
    const propMatch = message.match(/Property ['"]([^'"]+)['"]/);
    const typeMatch = message.match(/type ['"]([^'"]+)['"]/);
    
    if (propMatch && typeMatch) {
      return `Add property '${propMatch[1]}' to type '${typeMatch[1]}'`;
    }
  }
  
  // Type mismatch
  if (message.includes('is not assignable to type')) {
    const typeMatch = message.match(/type ['"]([^'"]+)['"]/);
    
    if (typeMatch) {
      return `Ensure value matches type '${typeMatch[1]}'`;
    }
  }
  
  // General suggestions based on category
  switch (category) {
    case 'import_error':
      return 'Check module path and spelling';
    case 'null_reference':
      return 'Add null check before accessing property';
    case 'syntax_error':
      return 'Fix syntax according to TypeScript rules';
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
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      errors.sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      break;
    case 'file':
      errors.sort((a, b) => {
        if (a.file === b.file) {
          return a.line - b.line;
        }
        return a.file.localeCompare(b.file);
      });
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
  const summary = [
    `Total errors: ${result.totalErrors}`,
    `Total warnings: ${result.totalWarnings}`,
    `Files analyzed: ${result.fileCount}`,
    `Lines scanned: ${result.scannedLineCount}`,
    `Processing time: ${result.processingTimeMs}ms`,
    '\nErrors by category:',
  ];
  
  for (const category in result.errorsByCategory) {
    summary.push(`  ${category}: ${result.errorsByCategory[category]}`);
  }
  
  summary.push('\nTop 5 error codes:');
  const topCodes = Object.entries(result.errorsByCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  for (const [code, count] of topCodes) {
    summary.push(`  ${code}: ${count}`);
  }
  
  summary.push('\nTop 5 files with errors:');
  const topFiles = Object.entries(result.errorsByFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  for (const [file, count] of topFiles) {
    const relativePath = path.relative('.', file);
    summary.push(`  ${relativePath}: ${count}`);
  }
  
  return summary.join('\n');
}

/**
 * Output the results to a file
 */
async function outputResults(
  result: ErrorFindingResult, 
  options: Partial<AdvancedErrorFinderOptions>
): Promise<void> {
  if (!options.outputPath) return;
  
  const format = options.outputFormat || 'json';
  let output: string;
  
  switch (format) {
    case 'json':
      output = JSON.stringify(result, null, 2);
      break;
    case 'markdown':
      output = generateMarkdownReport(result);
      break;
    default:
      output = result.summary;
      break;
  }
  
  try {
    await fs.promises.writeFile(options.outputPath, output, 'utf8');
    console.log(`Results written to ${options.outputPath}`);
  } catch (error) {
    console.error(`Failed to write results: ${error}`);
  }
}

/**
 * Generate a markdown report
 */
function generateMarkdownReport(result: ErrorFindingResult): string {
  const report = [
    '# TypeScript Error Analysis Report',
    '',
    `Generated on: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- **Total Errors**: ${result.totalErrors}`,
    `- **Total Warnings**: ${result.totalWarnings}`,
    `- **Files Analyzed**: ${result.fileCount}`,
    `- **Lines Scanned**: ${result.scannedLineCount}`,
    `- **Processing Time**: ${result.processingTimeMs}ms`,
    '',
    '## Errors by Category',
    '',
  ];
  
  for (const category in result.errorsByCategory) {
    report.push(`- **${category}**: ${result.errorsByCategory[category]}`);
  }
  
  report.push('', '## Top Error Codes', '');
  
  const topCodes = Object.entries(result.errorsByCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [code, count] of topCodes) {
    report.push(`- **${code}**: ${count}`);
  }
  
  report.push('', '## Top Files with Errors', '');
  
  const topFiles = Object.entries(result.errorsByFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [file, count] of topFiles) {
    const relativePath = path.relative('.', file);
    report.push(`- **${relativePath}**: ${count}`);
  }
  
  report.push('', '## Detailed Error List', '');
  
  for (let i = 0; i < Math.min(100, result.errors.length); i++) {
    const error = result.errors[i];
    report.push(`### Error ${i+1}: ${error.code}`, '');
    report.push(`- **File**: ${path.relative('.', error.file)}`);
    report.push(`- **Location**: Line ${error.line}, Column ${error.column}`);
    report.push(`- **Severity**: ${error.severity}`);
    report.push(`- **Category**: ${error.category}`);
    report.push(`- **Message**: ${error.message}`);
    
    if (error.suggestedFix) {
      report.push(`- **Suggested Fix**: ${error.suggestedFix}`);
    }
    
    if (error.context) {
      report.push('', '```typescript');
      report.push(error.context);
      report.push('```', '');
    }
    
    report.push('---', '');
  }
  
  if (result.errors.length > 100) {
    report.push(`Note: Only showing the first 100 of ${result.errors.length} errors.`);
  }
  
  return report.join('\n');
}

// If this script is run directly, execute the finder
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: Partial<AdvancedErrorFinderOptions> = {
    projectRoot: '.'
  };
  
  // Very basic arg parsing (would use a proper arg parser in production)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tsconfig' && i + 1 < args.length) {
      options.tsconfigPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      options.outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--format' && i + 1 < args.length) {
      options.outputFormat = args[i + 1] as any;
      i++;
    } else if (args[i] === '--max-errors' && i + 1 < args.length) {
      options.maxErrors = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--sort-by' && i + 1 < args.length) {
      options.sortBy = args[i + 1] as any;
      i++;
    } else if (args[i] === '--no-warnings') {
      options.includeWarnings = false;
    } else if (args[i] === '--verbose') {
      options.verbose = true;
    } else if (!args[i].startsWith('--') && !options.projectRoot) {
      options.projectRoot = args[i];
    }
  }
  
  // Run the error finder
  findTypeScriptErrors(options)
    .then(result => {
      console.log(result.summary);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

export default findTypeScriptErrors;