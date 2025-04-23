#!/usr/bin/env node

/**
 * Fix TypeScript Errors
 * A simple focused script to fix malformed type annotations in TypeScript files
 */

import fs from 'fs';
import path from 'path';

// Configuration
const PATTERNS = [
  // Remove `: any` from function call arguments
  { 
    pattern: /(\w+): any([,)])/g, 
    replacement: '$1$2' 
  },
  // Fix method calls with `: any`
  { 
    pattern: /(res\.status\(\d+): any(\))/g, 
    replacement: '$1$2' 
  },
  // Fix error casting with `: any`
  { 
    pattern: /\((\w+) as (\w+): any\)/g, 
    replacement: '($1 as $2)' 
  },
  // Fix array access with `: any`
  { 
    pattern: /(\w+)\[(\w+): any\]/g, 
    replacement: '$1[$2]' 
  }
];

// Find all TypeScript files recursively
function findFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
      files.push(...findFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix TypeScript errors in a file
function fixFile(file) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Apply each pattern
    for (const { pattern, replacement } of PATTERNS) {
      content = content.replace(pattern, replacement);
    }
    
    // Write the file if content changed
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  console.log('Finding TypeScript files...');
  
  // Get target directories from command line or use default
  const targetDirs = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['./server'];
  
  let allFiles = [];
  for (const dir of targetDirs) {
    const files = findFiles(dir);
    console.log(`Found ${files.length} TypeScript files in ${dir}`);
    allFiles = allFiles.concat(files);
  }
  
  if (allFiles.length === 0) {
    console.log('No TypeScript files found.');
    return;
  }
  
  console.log(`\nFixing ${allFiles.length} files...`);
  
  let fixedCount = 0;
  for (const file of allFiles) {
    if (fixFile(file)) {
      console.log(`✓ Fixed: ${file}`);
      fixedCount++;
    }
  }
  
  console.log(`\nDone! Fixed ${fixedCount} files.`);
  
  // Create interface definitions file
  const typesDir = path.join(process.cwd(), 'server/types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const interfaceFile = path.join(typesDir, 'security-types.d.ts');
  const interfaceContent = `/**
 * Security type definitions
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
}`;
  
  fs.writeFileSync(interfaceFile, interfaceContent);
  console.log(`Created interface definitions at ${interfaceFile}`);
}

// Run the script
main();