/**
 * Advanced TypeScript Error Fixer
 * 
 * A comprehensive utility for identifying and resolving TypeScript errors across a codebase.
 * This enhanced version supports multi-phase error fixing, logging, backup policies,
 * and handles a wider range of TypeScript error patterns.
 * 
 * Industry best practices:
 * - Follows Google TypeScript Style Guide
 * - Uses Microsoft recommended TypeScript configurations
 * - Implements defensive coding patterns
 * - Creates detailed logs for auditability
 * - Maintains code backups for safety
 * 
 * @version 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// Setup logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `ts-error-fix-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const errorLogFile = path.join(logDir, `ts-error-fix-errors-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

/**
 * Logger utility with file logging and console output
 */
class Logger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Log to console with color
    let consoleColor = colors.white;
    switch (level) {
      case 'ERROR': consoleColor = colors.red; break;
      case 'WARNING': consoleColor = colors.yellow; break;
      case 'SUCCESS': consoleColor = colors.green; break;
      case 'INFO': consoleColor = colors.blue; break;
      case 'DEBUG': consoleColor = colors.magenta; break;
    }
    
    console.log(`${consoleColor}${logMessage}${colors.reset}`);
    
    // Log to file
    try {
      fs.appendFileSync(logFile, logMessage + '\n');
      if (level === 'ERROR') {
        fs.appendFileSync(errorLogFile, logMessage + '\n');
      }
    } catch (error) {
      console.error(`${colors.red}Failed to write to log file: ${error.message}${colors.reset}`);
    }
  }
  
  static info(message) {
    this.log(message, 'INFO');
  }
  
  static success(message) {
    this.log(message, 'SUCCESS');
  }
  
  static warning(message) {
    this.log(message, 'WARNING');
  }
  
  static error(message) {
    this.log(message, 'ERROR');
  }
  
  static debug(message) {
    this.log(message, 'DEBUG');
  }
}

/**
 * Configuration settings for the fixer
 */
const config = {
  rootDir: path.join(__dirname),
  clientDir: path.join(__dirname, 'client'),
  serverDir: path.join(__dirname, 'server'),
  sharedDir: path.join(__dirname, 'shared'),
  
  backupDir: path.join(__dirname, 'backups', `ts-fixes-${new Date().toISOString().replace(/[:.]/g, '-')}`),
  
  // TypeScript error patterns to fix
  patterns: [
    // Pattern 1: Fix duplicate React imports
    {
      name: 'duplicateReactImports',
      find: /^\s*import\s+React\s+from\s+["']react["'];?\s*\n+\s*import\s+\*\s+as\s+React\s+from\s+["']react["'];?/gm,
      replace: 'import * as React from "react";',
      description: 'Fixing duplicate React imports'
    },
    // Pattern 2: Fix regular import after namespace import
    {
      name: 'overlappingReactImports',
      find: /^\s*import\s+\*\s+as\s+React\s+from\s+["']react["'];?\s*\n+\s*import\s+React\s+from\s+["']react["'];?/gm,
      replace: 'import * as React from "react";',
      description: 'Fixing overlapping React imports'
    },
    // Pattern 3: Fix catch clause errors
    {
      name: 'catchClauseErrors',
      find: /catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*Error\s*\)/g,
      replace: 'catch ($1: unknown)',
      description: 'Fixing catch clause type annotations'
    },
    // Pattern 4: Fix malformed type annotations in parameters
    {
      name: 'malformedParameterTypes',
      find: /(\w+)\s*:\s*any\s*(?:,|\))/g,
      replace: '$1$2',
      description: 'Fixing malformed parameter type annotations'
    },
    // Pattern 5: Fix string to number type errors in assignments
    {
      name: 'stringToNumberConversion',
      find: /(width|height|top|left|right|bottom|fontSize|lineHeight|margin|padding|border|radius)\s*=\s*["'](\d+)["']/g,
      replace: '$1={$2}',
      description: 'Converting string values to numbers for numeric properties'
    },
    // Pattern 6: Fix string number values in style object
    {
      name: 'styleObjectStringValues',
      find: /style\s*=\s*\{\s*\{[^}]*?(width|height|top|left|right|bottom|fontSize|lineHeight|margin|padding|border|radius)\s*:\s*["'](\d+)["'][^}]*\}\s*\}/g,
      replace: (match, prop, value) => {
        return match.replace(`${prop}: "${value}"`, `${prop}: ${value}`).replace(`${prop}: '${value}'`, `${prop}: ${value}`);
      },
      description: 'Fixing string numeric values in style objects'
    },
    // Pattern 7: Fix import path alias issues
    {
      name: 'importPathAliases',
      find: /from\s+["']\.\.\/\.\.\/\.\.\/components\/(.*?)["']/g,
      replace: 'from "@/components/$1"',
      description: 'Standardizing import path aliases'
    },
    // Pattern 8: Fix incorrect type declarations in interface extensions
    {
      name: 'incorrectInterfaceExtensions',
      find: /interface\s+(\w+)\s+extends\s+(\w+)\s*\{\s*(\w+)\s*:\s*any\s*;\s*\}/g,
      replace: 'interface $1 extends $2 { $3?: any; }',
      description: 'Fixing incorrect interface extensions'
    }
  ]
};

/**
 * Create backup of files before making changes
 */
function createBackup(filePath, content) {
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }
  
  // Create relative path to maintain directory structure
  const relativePath = path.relative(config.rootDir, filePath);
  const backupFilePath = path.join(config.backupDir, relativePath);
  
  // Create directories if they don't exist
  const backupDir = path.dirname(backupFilePath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Write backup file
  try {
    fs.writeFileSync(backupFilePath, content);
    return true;
  } catch (error) {
    Logger.error(`Failed to create backup for ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    Logger.warning(`Directory does not exist: ${dir}`);
    return results;
  }
  
  try {
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      // Skip node_modules, .git directories and other non-source files
      if (file === 'node_modules' || file === '.git' || file.startsWith('.') || 
          file === 'dist' || file === 'build' || file === 'coverage') {
        continue;
      }
      
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        results = results.concat(findTypeScriptFiles(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Add TypeScript files
        results.push(fullPath);
      }
    }
  } catch (error) {
    Logger.error(`Error reading directory ${dir}: ${error.message}`);
  }
  
  return results;
}

/**
 * Fix TypeScript errors in a file
 */
function fixTypeScriptErrors(filePath) {
  // Read file content
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    Logger.error(`Error reading file ${filePath}: ${error.message}`);
    return { file: filePath, fixed: false, patterns: [] };
  }
  
  // Create backup of original file
  createBackup(filePath, content);
  
  const originalContent = content;
  const fixedPatterns = [];
  
  // Apply each pattern
  for (const pattern of config.patterns) {
    const beforeApply = content;
    
    try {
      if (pattern.replace instanceof Function) {
        content = content.replace(pattern.find, (...args) => {
          return pattern.replace(...args);
        });
      } else {
        content = content.replace(pattern.find, pattern.replace);
      }
      
      if (content !== beforeApply) {
        fixedPatterns.push(pattern.name);
        Logger.info(`Applied pattern '${pattern.name}' to ${filePath}`);
      }
    } catch (error) {
      Logger.error(`Error applying pattern '${pattern.name}' to ${filePath}: ${error.message}`);
    }
  }
  
  // Write changes back if content changed
  if (content !== originalContent) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      Logger.success(`Fixed ${fixedPatterns.length} pattern(s) in ${filePath}: ${fixedPatterns.join(', ')}`);
      return { file: filePath, fixed: true, patterns: fixedPatterns };
    } catch (error) {
      Logger.error(`Error writing file ${filePath}: ${error.message}`);
      return { file: filePath, fixed: false, patterns: [] };
    }
  }
  
  return { file: filePath, fixed: false, patterns: [] };
}

/**
 * Ensure tsconfig.json has correct paths for aliases
 */
function updateTsConfigPaths() {
  const tsconfigPath = path.join(config.rootDir, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    Logger.warning(`tsconfig.json not found at ${tsconfigPath}`);
    return false;
  }
  
  try {
    let tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Create backup
    createBackup(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    
    // Ensure paths are properly configured
    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {};
    
    const paths = tsconfig.compilerOptions.paths;
    
    // Add or update common paths
    paths['@/*'] = paths['@/*'] || ['./client/src/*'];
    paths['@/components/*'] = paths['@/components/*'] || ['./client/src/components/*'];
    paths['@/lib/*'] = paths['@/lib/*'] || ['./client/src/lib/*'];
    paths['@/utils/*'] = paths['@/utils/*'] || ['./client/src/utils/*'];
    paths['@/types/*'] = paths['@/types/*'] || ['./client/src/types/*'];
    paths['@/styles/*'] = paths['@/styles/*'] || ['./client/src/styles/*'];
    paths['@shared/*'] = paths['@shared/*'] || ['./shared/*'];
    
    // Write updated tsconfig
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    Logger.success('Updated tsconfig.json with proper module path aliases');
    
    return true;
  } catch (error) {
    Logger.error(`Error updating tsconfig.json: ${error.message}`);
    return false;
  }
}

/**
 * Try to run TypeScript compiler to find remaining errors
 */
function findRemainingErrors() {
  Logger.info('Running TypeScript compiler to find remaining errors...');
  
  try {
    // Run tsc in dry-run mode
    const tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    Logger.info('TypeScript compilation completed successfully');
    return [];
  } catch (error) {
    // Parse errors from the output
    const output = error.stdout || '';
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));
    
    // Extract error information
    const errors = errorLines.map(line => {
      const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: `TS${match[4]}`,
          message: match[5]
        };
      }
      return null;
    }).filter(error => error !== null);
    
    return errors;
  }
}

/**
 * Apply custom fixes for specific error codes
 */
function applyCustomFixes(errors) {
  // Group errors by file
  const errorsByFile = {};
  
  for (const error of errors) {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  }
  
  const fixedFiles = [];
  
  // Process each file with errors
  for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
    try {
      // Skip if file doesn't exist
      if (!fs.existsSync(filePath)) {
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Create backup
      createBackup(filePath, content);
      
      // Apply fixes based on error codes
      let fixed = false;
      
      for (const error of fileErrors) {
        switch (error.code) {
          // Error: Cannot find module '@/lib/utils'
          case 'TS2307': 
            if (error.message.includes("Cannot find module '@/lib/utils'")) {
              const importLine = "import { cn } from '@/lib/utils';";
              if (!content.includes(importLine) && !content.includes("import { cn }")) {
                // Add import at the top after other imports
                const importMatch = /import .+ from ['"][^'"]+['"];?\n(?!import)/i;
                if (importMatch.test(content)) {
                  content = content.replace(importMatch, match => match + importLine + '\n');
                  fixed = true;
                  Logger.info(`Added missing import for @/lib/utils in ${filePath}`);
                }
              }
            }
            break;
            
          // Error: Type 'string' is not assignable to type 'number'
          case 'TS2322':
            if (error.message.includes("Type 'string' is not assignable to type 'number'")) {
              // Extract line with error
              const lines = content.split('\n');
              const errorLine = lines[error.line - 1];
              
              // Check for string in numeric context
              const stringValueMatch = errorLine.match(/(['"])(\d+)(['"])/);
              if (stringValueMatch) {
                const updatedLine = errorLine.replace(stringValueMatch[0], stringValueMatch[2]);
                lines[error.line - 1] = updatedLine;
                content = lines.join('\n');
                fixed = true;
                Logger.info(`Converted string to number in ${filePath}:${error.line}`);
              }
            }
            break;
            
          // Other error cases can be added here
        }
      }
      
      // Write changes back if content changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedFiles.push(filePath);
      }
    } catch (error) {
      Logger.error(`Error applying custom fixes to ${filePath}: ${error.message}`);
    }
  }
  
  return fixedFiles;
}

/**
 * Display summary of fixes
 */
function displaySummary(results) {
  const totalFiles = results.length;
  const fixedFiles = results.filter(result => result.fixed).length;
  const uniquePatterns = new Set();
  
  results.forEach(result => {
    result.patterns.forEach(pattern => uniquePatterns.add(pattern));
  });
  
  const uniquePatternsCount = uniquePatterns.size;
  
  Logger.info('----------------------------------------');
  Logger.success(`TypeScript Error Fixing Summary:`);
  Logger.info('----------------------------------------');
  Logger.info(`Total files processed: ${totalFiles}`);
  Logger.info(`Files with fixes applied: ${fixedFiles}`);
  Logger.info(`Unique fix patterns applied: ${uniquePatternsCount}`);
  Logger.info('----------------------------------------');
  
  // Display fixes by pattern
  const patternCounts = {};
  
  results.forEach(result => {
    result.patterns.forEach(pattern => {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });
  });
  
  if (Object.keys(patternCounts).length > 0) {
    Logger.info('Fixes by pattern:');
    
    for (const [pattern, count] of Object.entries(patternCounts)) {
      Logger.info(`  - ${pattern}: ${count} occurrences`);
    }
    
    Logger.info('----------------------------------------');
  }
}

/**
 * Run additional custom actions
 */
function runAdditionalActions() {
  // Update tsconfig paths
  updateTsConfigPaths();
  
  // Any other custom setup actions can be added here
}

/**
 * Main function
 */
async function main() {
  Logger.info('Starting Advanced TypeScript Error Fixer');
  Logger.info('----------------------------------------');
  
  // Create backup directories
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    Logger.info(`Created backup directory: ${config.backupDir}`);
  }
  
  // Find all TypeScript files
  Logger.info('Scanning for TypeScript files...');
  
  const clientFiles = findTypeScriptFiles(config.clientDir);
  const serverFiles = findTypeScriptFiles(config.serverDir);
  const sharedFiles = findTypeScriptFiles(config.sharedDir);
  const rootFiles = findTypeScriptFiles(config.rootDir).filter(file => {
    return !file.startsWith(config.clientDir) && 
           !file.startsWith(config.serverDir) && 
           !file.startsWith(config.sharedDir);
  });
  
  const allFiles = [...clientFiles, ...serverFiles, ...sharedFiles, ...rootFiles];
  
  Logger.info(`Found ${allFiles.length} TypeScript files (${clientFiles.length} client, ${serverFiles.length} server, ${sharedFiles.length} shared, ${rootFiles.length} root)`);
  
  // Fix errors in all files
  Logger.info('Fixing TypeScript errors...');
  
  const results = [];
  
  // Process each file
  for (const file of allFiles) {
    const result = fixTypeScriptErrors(file);
    results.push(result);
  }
  
  // Run additional actions
  runAdditionalActions();
  
  // Try to find remaining errors
  const remainingErrors = findRemainingErrors();
  
  if (remainingErrors.length > 0) {
    Logger.info(`Found ${remainingErrors.length} remaining TypeScript errors`);
    
    // Group errors by type
    const errorsByCode = {};
    
    remainingErrors.forEach(error => {
      if (!errorsByCode[error.code]) {
        errorsByCode[error.code] = [];
      }
      errorsByCode[error.code].push(error);
    });
    
    // Log error summary
    for (const [code, errors] of Object.entries(errorsByCode)) {
      Logger.info(`  - ${code}: ${errors.length} errors`);
    }
    
    // Apply custom fixes for specific errors
    const fixedFiles = applyCustomFixes(remainingErrors);
    
    if (fixedFiles.length > 0) {
      Logger.success(`Applied additional fixes to ${fixedFiles.length} files`);
    }
  } else {
    Logger.success('No remaining TypeScript errors detected!');
  }
  
  // Display summary
  displaySummary(results);
  
  Logger.success('TypeScript Error Fixer completed successfully!');
}

// Run the main function
try {
  main();
} catch (error) {
  Logger.error(`Unhandled error in main function: ${error.message}`);
  Logger.error(error.stack);
}