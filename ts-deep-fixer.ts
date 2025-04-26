/**
 * TypeScript Deep Fixer
 * 
 * This script performs a deeper scan for TypeScript errors that might not be caught
 * by general pattern matching. It focuses on:
 * 
 * 1. Function parameter types with 'any'
 * 2. Arrow functions with 'any' return types
 * 3. Type definitions with 'any[]'
 * 4. Interface properties with 'any'
 * 5. Generic type parameters with 'any'
 * 
 * Usage: ts-node ts-deep-fixer.ts [options]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as ts from 'typescript';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Fix patterns for specific TypeScript errors
const fixPatterns = [
  {
    // Function parameters with 'any' type
    pattern: /function\s+(\w+)\s*\(\s*([^:)]*)\s*:\s*any\s*([^)]*)\)/g,
    replacement: 'function $1($2: unknown$3)',
    description: 'Replace function parameter type any with unknown',
  },
  {
    // Arrow function parameters with 'any' type
    pattern: /(\(\s*\w+\s*:\s*any\s*\))\s*=>/g,
    replacement: '($1: unknown) =>',
    description: 'Replace arrow function parameter type any with unknown',
  },
  {
    // Any array type
    pattern: /:\s*any\[\]/g,
    replacement: ': unknown[]',
    description: 'Replace any[] with unknown[]',
  },
  {
    // Interface properties with 'any' type
    pattern: /(\w+)\s*:\s*any\s*;/g,
    replacement: '$1: unknown;',
    description: 'Replace interface property type any with unknown',
  },
  {
    // Generic type parameters with 'any'
    pattern: /<\s*any\s*>/g,
    replacement: '<unknown>',
    description: 'Replace generic type parameter any with unknown',
  },
  {
    // Method parameters with 'any' type
    pattern: /(\w+)\s*\(\s*([^:)]*)\s*:\s*any\s*([^)]*)\)\s*{/g,
    replacement: '$1($2: unknown$3) {',
    description: 'Replace method parameter type any with unknown',
  },
  {
    // Type aliases with 'any'
    pattern: /type\s+(\w+)\s*=\s*any\s*;/g,
    replacement: 'type $1 = unknown;',
    description: 'Replace type alias unknown with unknown',
  },
  {
    // Type assertions with 'any'
    pattern: /as\s+any/g,
    replacement: 'as unknown',
    description: 'Replace type assertion any with unknown',
  }
];

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
    exclude: [] as string[],
    maxFiles: 1000,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--directory' && i + 1 < args.length) {
      options.directory = args[++i];
    } else if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = args[++i].split(',');
    } else if (arg === '--max-files' && i + 1 < args.length) {
      options.maxFiles = parseInt(args[++i], 10);
    }
  }
  
  return options;
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(directory: string, exclude: string[] = []): Promise<string[]> {
  const files: string[] = [];
  
  async function traverseDirectory(dir: string) {
    // Check if directory should be excluded
    if (exclude.some(pattern => dir.includes(pattern))) {
      return;
    }
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip excluded paths
        if (exclude.some(pattern => fullPath.includes(pattern))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await traverseDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      log(`Error reading directory ${dir}: ${(error as Error).message}`, 'error');
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
 * Fix TypeScript errors in a file
 */
async function fixTypeScriptErrorsInFile(filePath: string, apply: boolean): Promise<{
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
      
      // Skip if no matches found
      if (matches.length === 0) {
        continue;
      }
      
      // Apply the fix
      fixedContent = fixedContent.replace(fixPattern.pattern, fixPattern.replacement);
      
      changes.push({
        pattern: fixPattern.pattern,
        count: matches.length,
        description: fixPattern.description,
      });
    }
    
    // Only write the file if there are changes and we're in apply mode
    if (changes.length > 0 && apply) {
      // Write back the fixed content
      await writeFile(filePath, fixedContent, 'utf-8');
    }
    
    return { fixed: changes.length > 0, changes };
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
  
  log(`TypeScript Deep Fixer`, 'info');
  log(`Scanning directory: ${options.directory}`, 'info');
  log(`Apply mode: ${options.apply ? 'ON' : 'OFF (dry run)'}`, options.apply ? 'success' : 'warning');
  log(`Exclude paths: ${options.exclude.join(', ') || 'None'}`, 'info');
  log(`Max files: ${options.maxFiles}`, 'info');
  
  // Find all TypeScript files
  const files = await findTypeScriptFiles(options.directory, options.exclude);
  log(`Found ${files.length} TypeScript files`, 'info');
  
  // Limit the number of files to process
  const filesToProcess = files.slice(0, options.maxFiles);
  log(`Processing ${filesToProcess.length} files`, 'info');
  
  // Process each file
  let totalFixed = 0;
  let totalErrors = 0;
  let fixedFiles = 0;
  let totalChanges = 0;
  
  for (const file of filesToProcess) {
    try {
      const result = await fixTypeScriptErrorsInFile(file, options.apply);
      
      if (result.fixed) {
        fixedFiles++;
        
        let totalFileChanges = 0;
        for (const change of result.changes) {
          totalFileChanges += change.count;
        }
        
        totalChanges += totalFileChanges;
        
        log(`Fixed file: ${file} (${totalFileChanges} changes)`, 'success');
        for (const change of result.changes) {
          log(`  - ${change.description}: ${change.count} instances`, 'success');
        }
      }
    } catch (error) {
      log(`Error processing ${file}: ${(error as Error).message}`, 'error');
      totalErrors++;
    }
  }
  
  // Summary
  log(`====== Summary ======`, 'info');
  log(`Total files processed: ${filesToProcess.length}`, 'info');
  log(`Files with fixes: ${fixedFiles}`, 'success');
  log(`Total changes: ${totalChanges}`, 'success');
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