#!/usr/bin/env node

/**
 * TypeScript Error Finder and Fixer
 * 
 * This script finds TypeScript errors in your project and provides suggestions to fix them.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_DIR = './server';
const BACKUP_DIR = './ts-fixes-backup';
const FIX_PATTERNS = [
  // Remove `: any` from function call arguments
  { pattern: /(\w+): any([,)])/g, replacement: '$1$2' },
  
  // Fix method calls with `: any`
  { pattern: /(res\.status\(\d+): any(\))/g, replacement: '$1$2' },
  
  // Fix error casting with `: any`
  { pattern: /\((\w+) as (\w+): any\)/g, replacement: '($1 as $2)' },
  
  // Fix array index access with `: any`
  { pattern: /(\w+)\[(\w+): any\]/g, replacement: '$1[$2]' }
];

// Create backup of files before modifying
function createBackup() {
  console.log('📂 Creating backup of files...');
  
  // Make backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Find TypeScript files
  const tsFiles = findServerTsFiles(SERVER_DIR);
  
  // Copy files to backup
  for (const file of tsFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    // Create directory structure
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(file, backupPath);
  }
  
  console.log(`✅ Backed up ${tsFiles.length} files to ${BACKUP_DIR}`);
}

// Find tsconfig.json files in project
function findTsConfigFiles(dir) {
  const tsconfig = path.join(dir, 'tsconfig.json');
  if (fs.existsSync(tsconfig)) {
    return [tsconfig];
  }
  
  // Look in parent directory
  const parentDir = path.dirname(dir);
  if (parentDir !== dir) {
    return findTsConfigFiles(parentDir);
  }
  
  return [];
}

// Find all TypeScript files in the server directory
function findServerTsFiles(dir) {
  let files = [];
  
  function scanDir(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // Skip node_modules and other non-source directories
      if (entry.isDirectory() && !['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
        files = files.concat(scanDir(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  return scanDir(dir);
}

// Run TypeScript compiler to check for errors
function runTsc(dir) {
  console.log('🔍 Running TypeScript compiler to find errors...');
  
  try {
    // Find tsconfig files
    const tsconfigFiles = findTsConfigFiles(dir);
    
    if (tsconfigFiles.length === 0) {
      console.error('❌ No tsconfig.json found');
      return [];
    }
    
    // Try to run tsc with each tsconfig
    for (const tsconfig of tsconfigFiles) {
      try {
        execSync(`npx tsc --noEmit --project ${tsconfig}`, { stdio: 'pipe' });
        console.log('✅ No TypeScript errors found!');
        return [];
      } catch (error) {
        // Parse the error output to find the files with errors
        const output = error.stdout?.toString() || error.stderr?.toString() || '';
        const fileErrors = [];
        
        // Extract file paths with errors
        const lines = output.split('\n');
        for (const line of lines) {
          const match = line.match(/^([^(]+)\(\d+,\d+\):/);
          if (match && match[1]) {
            const filePath = match[1].trim();
            if (!fileErrors.includes(filePath)) {
              fileErrors.push(filePath);
            }
          }
        }
        
        if (fileErrors.length > 0) {
          console.log(`Found errors in ${fileErrors.length} files.`);
          return fileErrors;
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error running TypeScript compiler:', error.message);
    return [];
  }
}

// Fix TypeScript errors in files
function fixTypeScriptErrors(files) {
  console.log(`🔧 Fixing TypeScript errors in ${files.length} files...`);
  let totalFixes = 0;
  
  for (const file of files) {
    try {
      // Skip if file doesn't exist
      if (!fs.existsSync(file)) {
        continue;
      }
      
      // Read file content
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply each fix pattern
      for (const fixPattern of FIX_PATTERNS) {
        content = content.replace(fixPattern.pattern, fixPattern.replacement);
      }
      
      // If content changed, write the file
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✓ Fixed errors in ${file}`);
        totalFixes++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  return totalFixes;
}

// Bulk fix server files
function bulkFixServerFiles() {
  console.log('🚀 Performing bulk fix on server files...');
  
  // Find all TypeScript files in server directory
  const tsFiles = findServerTsFiles(SERVER_DIR);
  console.log(`Found ${tsFiles.length} TypeScript files in server directory.`);
  
  // Fix each file
  let totalFixes = 0;
  
  for (const file of tsFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply each fix pattern
      for (const fixPattern of FIX_PATTERNS) {
        content = content.replace(fixPattern.pattern, fixPattern.replacement);
      }
      
      // If content changed, write the file
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✓ Fixed errors in ${file}`);
        totalFixes++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`✅ Fixed errors in ${totalFixes} files`);
  return totalFixes;
}

// Main function
async function main() {
  console.log('\n🔍 TypeScript Error Finder and Fixer\n');
  
  // Create backup
  createBackup();
  
  // Apply bulk fixes to server files
  const fixedCount = bulkFixServerFiles();
  
  if (fixedCount > 0) {
    console.log('\n✅ Successfully fixed TypeScript errors in server files!');
  } else {
    console.log('\n✅ No fixable TypeScript errors found in server files.');
  }
  
  // Create .d.ts file for ImmutableSecurityLogs
  const typesDir = path.join(process.cwd(), 'server/types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const interfaceFile = path.join(typesDir, 'security-types.d.ts');
  const interfaceContent = `/**
 * Type definitions for security-related interfaces
 */

interface SecurityEvent {
  type: string;
  message: string;
  timestamp: string | number;
  severity?: string;
  data?: any;
}

interface ImmutableSecurityLogs {
  addSecurityEvent(event: SecurityEvent): void;
  getEvents(): SecurityEvent[];
  clear(): void;
}
`;
  
  fs.writeFileSync(interfaceFile, interfaceContent);
  console.log(`\n✓ Created interface definitions file at ${interfaceFile}`);
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
});