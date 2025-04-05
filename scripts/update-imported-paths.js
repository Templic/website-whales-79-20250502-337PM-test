/**
 * Update Imported Component Paths
 * 
 * This script updates import paths for components that were 
 * merged from the imported directory to feature directories.
 * 
 * NOTE: An enhanced version of this script is available in the
 * component-merge-tools directory. Consider using that instead
 * for more advanced import path handling and diagnostics.
 * 
 * @see scripts/component-merge-tools/enhanced-update-imports.js
 * @see scripts/component-merge-tools/README.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Source directory
const sourceDir = path.join(process.cwd(), 'client/src');

// Import path mapping
const importPathMapping = {
  '@/components/imported/audio/': '@/components/features/audio/',
  '@/components/imported/lovable/': '@/components/',
  '@/components/imported/ui/': '@/components/ui/',
  '@/components/imported/v0/': '@/components/',
  '@/components/imported/': '@/components/'
};

/**
 * Gets all files with specified extensions in a directory (recursive)
 */
function getFilesRecursive(dir, extFilter = extensions) {
  let result = [];
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        traverse(filePath);
      } else if (stat.isFile() && extFilter.includes(path.extname(file))) {
        result.push(filePath);
      }
    });
  }
  
  traverse(dir);
  return result;
}

/**
 * Updates imports in a file based on the mapping
 */
function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let updated = false;
    
    // Check for import statements from imported components
    for (const [oldPath, newPath] of Object.entries(importPathMapping)) {
      const importRegex = new RegExp(`from ["']${oldPath.replace('/', '\\/')}([^"']*)["']`, 'g');
      content = content.replace(importRegex, (match, componentPath) => {
        updated = true;
        return `from "${newPath}${componentPath}"`;
      });
    }
    
    // Only write if content has changed
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting to update import paths...');
  
  // Get all files
  const files = getFilesRecursive(sourceDir);
  let updatedCount = 0;
  
  // Update imports in each file
  files.forEach(file => {
    if (updateFileImports(file)) {
      updatedCount++;
    }
  });
  
  console.log(`Finished updating import paths in ${updatedCount} files`);
}

// Run the script
main();