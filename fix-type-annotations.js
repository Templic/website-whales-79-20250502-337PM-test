#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pattern to find and replace
const PATTERN_TO_FIND = /\([^)]*: string: string[^)]*\)/g;
const MAP_PATTERN = /(\w+): string: string => /g;

// Directory to scan
const rootDir = './server';

// Find all TypeScript files
const findTypeScriptFiles = (dir) => {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTypeScriptFiles(filePath));
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  
  return results;
};

// Fix a specific pattern in a file
const fixPatternInFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // First fix pattern `: string: string` in callback functions
  let updatedContent = content.replace(MAP_PATTERN, '$1 => ');
  
  // Save the file if there were changes
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✓ Fixed string: string pattern in ${filePath}`);
    return true;
  }
  
  return false;
};

// Process all files
const processFiles = () => {
  const files = findTypeScriptFiles(rootDir);
  let totalFixed = 0;
  
  console.log(`Found ${files.length} TypeScript files to scan`);
  
  for (const file of files) {
    try {
      const fixed = fixPatternInFile(file);
      if (fixed) {
        totalFixed++;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\nFixed ${totalFixed} files with TypeScript errors`);
};

// Run the script
processFiles();