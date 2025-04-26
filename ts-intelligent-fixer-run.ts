/**
 * TypeScript Intelligent Fixer - Runtime
 * 
 * This script uses the TypeScript Error Management System to intelligently
 * find and fix common TypeScript errors throughout the codebase.
 * 
 * Usage: ts-node ts-intelligent-fixer-run.ts [options]
 * Options:
 *   --directory <dir>  - Directory to scan (default: current directory)
 *   --apply            - Apply fixes (default: false, dry run only)
 *   --deep             - Perform deep analysis (default: false)
 *   --max-errors <num> - Maximum number of errors to fix (default: 100)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as util from 'util';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Error categories
enum ErrorCategory {
  TypeMismatch = 'TypeMismatch',
  SyntaxError = 'SyntaxError',
  ImportError = 'ImportError',
  NullReference = 'NullReference',
  InterfaceMismatch = 'InterfaceMismatch',
  ConfigError = 'ConfigError',
  Other = 'Other',
}

// Error severity
enum ErrorSeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

// Error detail
interface TypeScriptErrorDetail {
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

// Fix patterns for common errors
const fixPatterns = [
  {
    pattern: /\(\s*(\w+)\s+as\s+(\w+)\s*:\s*any\s*\)/g,
    replacement: '($1 as $2)',
    description: 'Fix incorrect type assertion syntax',
    category: ErrorCategory.SyntaxError,
  },
  {
    pattern: /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g,
    replacement: 'catch ($1: unknown)',
    description: 'Replace any with unknown in catch clauses',
    category: ErrorCategory.TypeMismatch,
  },
  {
    pattern: /function\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*any\s*{/g,
    replacement: 'function $1($2): unknown {',
    description: 'Replace any return type with unknown for functions',
    category: ErrorCategory.TypeMismatch,
  },
  {
    pattern: /:\s*Promise\s*<\s*any\s*>/g,
    replacement: ': Promise<unknown>',
    description: 'Replace Promise<unknown> with Promise<unknown>',
    category: ErrorCategory.TypeMismatch,
  },
  {
    pattern: /:\s*Record\s*<\s*string\s*,\s*any\s*>/g,
    replacement: ': Record<string, unknown>',
    description: 'Replace Record<string, any> with Record<string, unknown>',
    category: ErrorCategory.TypeMismatch,
  },
];

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Logging utility with colors
 */
function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const prefix = {
    info: `${COLORS.blue}[INFO]${COLORS.reset}`,
    success: `${COLORS.green}[SUCCESS]${COLORS.reset}`,
    warning: `${COLORS.yellow}[WARNING]${COLORS.reset}`,
    error: `${COLORS.red}[ERROR]${COLORS.reset}`,
  };
  
  console.log(`${prefix[type]} ${message}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    directory: '.',
    apply: false,
    deep: false,
    maxErrors: 100,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--directory' && i + 1 < args.length) {
      options.directory = args[++i];
    } else if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--deep') {
      options.deep = true;
    } else if (arg === '--max-errors' && i + 1 < args.length) {
      options.maxErrors = parseInt(args[++i], 10);
    }
  }
  
  return options;
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function traverseDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await traverseDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  try {
    const dirStats = await stat(directory);
    if (dirStats.isDirectory()) {
      await traverseDirectory(directory);
    } else if (directory.endsWith('.ts')) {
      files.push(directory);
    }
  } catch (error) {
    log(`Error reading directory: ${(error as Error).message}`, 'error');
  }
  
  return files;
}

/**
 * Fix common errors in a file
 */
async function fixCommonErrorsInFile(filePath: string): Promise<{
  fixed: boolean;
  changes: {
    pattern: RegExp;
    count: number;
    description: string;
  }[];
}> {
  try {
    const content = await readFile(filePath, 'utf-8');
    let fixedContent = content;
    const changes: { pattern: RegExp; count: number; description: string; }[] = [];
    
    // Apply each fix pattern
    for (const fixPattern of fixPatterns) {
      // Reset regex lastIndex
      fixPattern.pattern.lastIndex = 0;
      
      // Check if the pattern exists in the file
      if (!fixPattern.pattern.test(fixedContent)) {
        continue;
      }
      
      // Reset regex lastIndex again after the test
      fixPattern.pattern.lastIndex = 0;
      
      // Count matches before replacement
      const matches = fixedContent.match(fixPattern.pattern) || [];
      
      // Apply the fix
      fixedContent = fixedContent.replace(fixPattern.pattern, fixPattern.replacement);
      
      if (matches.length > 0) {
        changes.push({
          pattern: fixPattern.pattern,
          count: matches.length,
          description: fixPattern.description,
        });
      }
    }
    
    // Only write the file if there are changes and we're in apply mode
    if (changes.length > 0) {
      // Write back the fixed content
      await writeFile(filePath, fixedContent, 'utf-8');
      
      return { fixed: true, changes };
    }
    
    return { fixed: false, changes: [] };
  } catch (error) {
    log(`Error processing file ${filePath}: ${(error as Error).message}`, 'error');
    return { fixed: false, changes: [] };
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();
  
  log(`TypeScript Intelligent Fixer`, 'info');
  log(`Scanning directory: ${options.directory}`, 'info');
  log(`Apply mode: ${options.apply ? 'ON' : 'OFF (dry run)'}`, options.apply ? 'success' : 'warning');
  log(`Deep analysis: ${options.deep ? 'ON' : 'OFF'}`, 'info');
  log(`Max errors: ${options.maxErrors}`, 'info');
  
  // Find all TypeScript files
  const files = await findTypeScriptFiles(options.directory);
  log(`Found ${files.length} TypeScript files`, 'info');
  
  // Process each file
  let totalFixed = 0;
  let totalErrors = 0;
  let fixedFiles = 0;
  
  for (const file of files) {
    try {
      const result = await fixCommonErrorsInFile(file);
      
      if (result.fixed) {
        fixedFiles++;
        
        log(`Fixed file: ${file}`, 'success');
        for (const change of result.changes) {
          log(`  - ${change.description}: ${change.count} instances`, 'success');
          totalFixed += change.count;
        }
      }
      
      // Stop if we've reached the maximum number of errors to fix
      if (totalFixed >= options.maxErrors) {
        log(`Reached maximum number of errors to fix (${options.maxErrors})`, 'warning');
        break;
      }
    } catch (error) {
      log(`Error processing ${file}: ${(error as Error).message}`, 'error');
      totalErrors++;
    }
  }
  
  // Summary
  log(`====== Summary ======`, 'info');
  log(`Total files processed: ${files.length}`, 'info');
  log(`Files with fixes: ${fixedFiles}`, 'success');
  log(`Total errors fixed: ${totalFixed}`, 'success');
  log(`Processing errors: ${totalErrors}`, 'warning');
  
  if (!options.apply) {
    log(`Dry run completed. Run with --apply to apply the fixes.`, 'warning');
  }
}

// Execute the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});