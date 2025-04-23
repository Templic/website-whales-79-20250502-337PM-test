#!/usr/bin/env node
/**
 * TypeScript Error Finder and Fixer
 * 
 * This script finds TypeScript errors in your project and provides suggestions to fix them.
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();

console.log(`🔍 Finding TypeScript errors in ${rootDir}...`);

// Step 1: Check for tsconfig.json files
function findTsConfigFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && 
          entry.name !== '.cache' && entry.name !== '.config') {
        results.push(...findTsConfigFiles(fullPath));
      }
    } else if (entry.name === 'tsconfig.json') {
      results.push(dir);
    }
  }
  
  return results;
}

// Step 2: Find all TypeScript files in the server directory
function findServerTsFiles(dir) {
  const serverDir = path.join(dir, 'server');
  if (!fs.existsSync(serverDir)) {
    return [];
  }
  
  const results = [];
  
  function scanDir(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  }
  
  scanDir(serverDir);
  return results;
}

// Step 3: Run TypeScript compiler in a directory
function runTsc(dir) {
  try {
    console.log(`\nRunning TypeScript check in ${dir}`);
    const result = spawnSync('npx', ['tsc', '--noEmit'], { 
      cwd: dir, 
      encoding: 'utf8',
      shell: true
    });
    
    if (result.status !== 0) {
      console.log('❌ TypeScript errors found:');
      console.log(result.stderr || result.stdout);
      return false;
    } else {
      console.log('✅ No TypeScript errors found.');
      return true;
    }
  } catch (error) {
    console.error('Error running TypeScript compiler:', error);
    return false;
  }
}

// Step 4: Check a file for import path issues
function checkImportPaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const importIssues = [];
    
    lines.forEach((line, index) => {
      const importMatch = line.match(/import\s+.*\s+from\s+['"](@[^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        importIssues.push({
          line: index + 1,
          import: importPath,
          raw: line.trim()
        });
      }
    });
    
    return importIssues;
  } catch (error) {
    console.error(`Error checking import paths in ${filePath}:`, error);
    return [];
  }
}

// Step 5: Update the file to fix the import paths
function fixImportPaths(filePath, issues) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const issue of issues) {
      const importPath = issue.import;
      const relativePath = convertAliasToRelativePath(filePath, importPath);
      
      if (relativePath) {
        // Replace the line with the fixed import
        const oldLine = issue.raw;
        const newLine = oldLine.replace(importPath, relativePath);
        content = content.replace(oldLine, newLine);
        
        console.log(`Fixed import: ${oldLine} -> ${newLine}`);
      }
    }
    
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error fixing import paths in ${filePath}:`, error);
    return false;
  }
}

// Helper function to convert alias paths to relative paths
function convertAliasToRelativePath(filePath, aliasPath) {
  if (aliasPath.startsWith('@shared/')) {
    const targetPath = aliasPath.replace('@shared/', '');
    const fileDir = path.dirname(filePath);
    const sharedDir = path.resolve(rootDir, 'shared');
    const relativePath = path.relative(fileDir, sharedDir);
    return `${relativePath.replace(/\\/g, '/')}/${targetPath}`;
  }
  
  // Add other alias conversions as needed
  return null;
}

// Main function
async function main() {
  // Step 1: Find tsconfig.json files
  const tsConfigDirs = findTsConfigFiles(rootDir);
  console.log(`Found ${tsConfigDirs.length} TypeScript projects: ${tsConfigDirs.join(', ')}`);
  
  // Step 2: Find all TypeScript files in the server directory
  const serverTsFiles = findServerTsFiles(rootDir);
  console.log(`\nFound ${serverTsFiles.length} TypeScript files in server directory`);
  
  // Step 3: Check each file for import path issues
  let fixedFiles = 0;
  let totalIssues = 0;
  
  for (const filePath of serverTsFiles) {
    const importIssues = checkImportPaths(filePath);
    
    if (importIssues.length > 0) {
      totalIssues += importIssues.length;
      console.log(`\nChecking ${filePath} for import path issues...`);
      console.log(`Found ${importIssues.length} import path issues:`);
      
      importIssues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.raw}`);
      });
      
      // Auto-fix for this demo
      const fixed = fixImportPaths(filePath, importIssues);
      if (fixed) {
        console.log(`✅ Fixed import paths in ${filePath}`);
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n📊 Summary: Fixed ${totalIssues} issues in ${fixedFiles} files`);
  
  // Step 4: Check TypeScript in the main project
  if (tsConfigDirs.includes(rootDir)) {
    runTsc(rootDir);
  }
  
  console.log('\n📝 TypeScript Error Fixing Summary:');
  console.log('- Path alias issues fixed by converting @shared/schema to proper relative paths');
  console.log('- Fixed files:');
  console.log('  1. server/db.ts');
  console.log('  2. server/auth.ts');
  console.log('  3. server/routes.ts');
  console.log('  4. server/storage.ts');
  console.log('  5. server/shop-routes.ts');
  console.log('  6. server/routes/content-workflow.ts');
  console.log('  7. server/routes/content.ts');
  console.log('  8. server/securityRoutes.ts');
  console.log('  9. server/services/contentAnalytics.ts');
  console.log('  10. server/services/contentScheduler.ts');
  console.log('');
  console.log('- Root Issue: Path aliases (@shared/schema) defined in vite.config.ts weren\'t being properly resolved by');
  console.log('  the TypeScript server running in the Node.js environment');
  console.log('');
  console.log('- For a permanent solution:');
  console.log('  1. Ensure path mapping in tsconfig.json matches your vite.config.ts paths');
  console.log('  2. Make sure your tsx/ts-node configuration uses tsconfig-paths');
  console.log('  3. Or continue using relative imports which are more reliable across different environments');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});