/**
 * TypeScript Type Assertion Fixer
 * 
 * This script fixes incorrect type assertions in TypeScript files.
 * It specifically targets the pattern: (value as Type: any) and replaces it with (value as Type)
 * 
 * Usage: ts-node fix-type-assertions.ts [directory]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Regular expressions for finding incorrect type assertions
const TYPE_ASSERTION_REGEX = /\(\s*(\w+)\s+as\s+(\w+)\s*:\s*any\s*\)/g;

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
  
  await traverseDirectory(directory);
  return files;
}

/**
 * Fix type assertions in a file
 */
async function fixTypeAssertionsInFile(filePath: string): Promise<{
  fixed: boolean;
  count: number;
}> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Check if the file contains any incorrect type assertions
    if (!TYPE_ASSERTION_REGEX.test(content)) {
      return { fixed: false, count: 0 };
    }
    
    // Reset regex lastIndex
    TYPE_ASSERTION_REGEX.lastIndex = 0;
    
    // Replace incorrect type assertions
    let fixedContent = content.replace(TYPE_ASSERTION_REGEX, (match, variable, type) => {
      return `(${variable} as ${type})`;
    });
    
    // Count replacements
    const count = (content.match(TYPE_ASSERTION_REGEX) || []).length;
    
    // Write back the fixed content
    await writeFile(filePath, fixedContent, 'utf-8');
    
    return { fixed: true, count };
  } catch (error) {
    log(`Error processing file ${filePath}: ${(error as Error).message}`, 'error');
    return { fixed: false, count: 0 };
  }
}

/**
 * Main function
 */
async function main() {
  const directory = process.argv[2] || '.';
  
  log(`Scanning directory: ${directory}`, 'info');
  
  // Find all TypeScript files
  const files = await findTypeScriptFiles(directory);
  log(`Found ${files.length} TypeScript files`, 'info');
  
  // Process each file
  let totalFixed = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    try {
      const result = await fixTypeAssertionsInFile(file);
      
      if (result.fixed) {
        log(`Fixed ${result.count} type assertions in ${file}`, 'success');
        totalFixed += result.count;
      }
    } catch (error) {
      log(`Error processing ${file}: ${(error as Error).message}`, 'error');
      totalErrors++;
    }
  }
  
  // Summary
  log(`====== Summary ======`, 'info');
  log(`Total files processed: ${files.length}`, 'info');
  log(`Total type assertions fixed: ${totalFixed}`, 'success');
  log(`Total errors encountered: ${totalErrors}`, 'warning');
}

// Execute the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});