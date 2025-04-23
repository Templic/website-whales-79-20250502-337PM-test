/**
 * Fix String-to-Number Type Conversion Errors
 * 
 * This script automatically fixes TypeScript errors where string values are used
 * in places where numeric values are expected, such as in style properties.
 * 
 * It follows industry best practices for maintaining type safety and implements
 * defensive coding patterns to avoid introducing new issues.
 * 
 * Usage: node fix-string-to-number-conversions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`${colors.yellow}Directory does not exist: ${dir}${colors.reset}`);
    return results;
  }
  
  try {
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      // Skip node_modules, .git directories and other non-source files
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
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
    console.error(`${colors.red}Error reading directory ${dir}: ${error.message}${colors.reset}`);
  }
  
  return results;
}

/**
 * Create a backup of a file before modifying
 */
function createBackup(filePath, content) {
  try {
    fs.writeFileSync(`${filePath}.bak`, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`${colors.red}Error creating backup for ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Fix string-to-number conversion issues in a file
 */
function fixStringToNumberIssues(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    createBackup(filePath, content);
    
    let updatedContent = content;
    let matchCount = 0;
    
    // Pattern 1: Fix numeric values in JSX attributes that should be numbers
    // Example: <div width="100"> -> <div width={100}>
    const numericProps = [
      'width', 'height', 'top', 'left', 'right', 'bottom', 'fontSize', 
      'lineHeight', 'margin', 'padding', 'border', 'borderWidth', 
      'borderRadius', 'radius', 'x', 'y', 'z', 'opacity', 'zIndex',
      'flex', 'flexGrow', 'flexShrink', 'order'
    ];
    
    const propRegex = new RegExp(
      `(${numericProps.join('|')})\\s*=\\s*["'](-?\\d+(?:\\.\\d+)?)["']`, 
      'g'
    );
    
    updatedContent = updatedContent.replace(propRegex, (match, prop, value) => {
      matchCount++;
      return `${prop}={${value}}`;
    });
    
    // Pattern 2: Fix numeric values in style objects
    // Example: style={{ width: "100" }} -> style={{ width: 100 }}
    const styleRegex = /style\s*=\s*\{\s*\{([^{}]*)\}\s*\}/g;
    
    updatedContent = updatedContent.replace(styleRegex, (fullMatch, styleContent) => {
      // Process each style property
      let updatedStyle = styleContent.replace(
        new RegExp(`(${numericProps.join('|')})\\s*:\\s*["'](-?\\d+(?:\\.\\d+)?)["']`, 'g'),
        (match, prop, value) => {
          matchCount++;
          return `${prop}: ${value}`;
        }
      );
      
      return `style={{ ${updatedStyle} }}`;
    });
    
    // Pattern 3: Fix direct property assignments
    // Example: element.width = "100"; -> element.width = 100;
    const assignmentRegex = new RegExp(
      `\\.(${numericProps.join('|')})\\s*=\\s*["'](-?\\d+(?:\\.\\d+)?)["']`, 
      'g'
    );
    
    updatedContent = updatedContent.replace(assignmentRegex, (match, prop, value) => {
      matchCount++;
      return `.${prop} = ${value}`;
    });
    
    // Pattern 4: Fix numeric values in inline styles
    // Example: fontSize: "16px" -> fontSize: 16
    // But we need to be careful with units
    const styleWithUnitsRegex = new RegExp(
      `(${numericProps.join('|')})\\s*:\\s*["'](-?\\d+)(?:px|rem|em|vh|vw|%)["']`, 
      'g'
    );
    
    updatedContent = updatedContent.replace(styleWithUnitsRegex, (match, prop, value, unit) => {
      // Only replace when it's px and we're sure it should be a number
      if (prop === 'fontSize' || prop === 'width' || prop === 'height') {
        matchCount++;
        return `${prop}: ${value}`; // Remove the unit and quotes
      }
      return match; // Leave other units alone
    });
    
    // Save changes if any
    if (matchCount > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`${colors.green}Fixed ${matchCount} string-to-number issues in ${filePath}${colors.reset}`);
      return matchCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`${colors.red}Error processing file ${filePath}: ${error.message}${colors.reset}`);
    return 0;
  }
}

/**
 * Fix specific files known to have string-to-number issues
 */
function fixSpecificFiles() {
  // List of files that we know have string-to-number issues
  const filesToFix = [
    path.join(__dirname, 'client', 'src', 'components', 'features', 'audio', 'frequency-visualizer-3d.tsx')
  ];
  
  let totalFixed = 0;
  
  for (const file of filesToFix) {
    if (fs.existsSync(file)) {
      const fixed = fixStringToNumberIssues(file);
      totalFixed += fixed;
    } else {
      console.log(`${colors.yellow}File not found: ${file}${colors.reset}`);
    }
  }
  
  return totalFixed;
}

/**
 * Fix string-to-number issues across all TypeScript files
 */
function fixAllFiles() {
  // Get all TypeScript files
  const clientDir = path.join(__dirname, 'client');
  const files = findTypeScriptFiles(clientDir);
  
  console.log(`${colors.blue}Found ${files.length} TypeScript files in client directory${colors.reset}`);
  
  let totalFixed = 0;
  
  for (const file of files) {
    const fixed = fixStringToNumberIssues(file);
    totalFixed += fixed;
  }
  
  console.log(`${colors.green}Fixed ${totalFixed} string-to-number issues across all files${colors.reset}`);
  return totalFixed;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.blue}Starting String-to-Number Conversion Fix...${colors.reset}`);
  
  // First, fix specific known files
  const fixedInSpecific = fixSpecificFiles();
  console.log(`${colors.blue}Fixed ${fixedInSpecific} issues in specific files${colors.reset}`);
  
  // Then, run on all files to catch any missed issues
  const fixedInAll = fixAllFiles();
  console.log(`${colors.blue}Total fixed issues: ${fixedInSpecific + fixedInAll}${colors.reset}`);
  
  console.log(`${colors.green}String-to-Number Conversion Fix completed!${colors.reset}`);
}

// Run the main function
main();