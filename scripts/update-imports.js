/**
 * Import Path Updater
 * 
 * This script updates import paths in codebase files after component migration.
 * It maps old import paths to new ones based on the component migration mapping.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import path mapping (old path -> new path)
// This mapping should correspond to the migrations in component-migration.js
const importMapping = {
  // Common components
  '@/components/Button': '@/components/common/Button',
  '@/components/Card': '@/components/common/Card',
  
  // Layout components
  '@/components/Header': '@/components/layout/Header',
  '@/components/Footer': '@/components/layout/Footer',
  
  // Feature components - Shop
  '@/components/ProductCard': '@/components/features/shop/ProductCard',
  '@/components/CartItem': '@/components/features/shop/CartItem',
  
  // Feature components - Music
  '@/components/MusicPlayer': '@/components/features/music/MusicPlayer',
  '@/components/TrackList': '@/components/features/music/TrackList',
  
  // Add more mappings as needed
};

// Extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Gets all files with specified extensions in a directory (recursive)
 */
function getFilesRecursive(dir, extFilter = extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other special directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile() && extFilter.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Updates imports in a file based on the mapping
 */
function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Check for each import mapping
    Object.entries(importMapping).forEach(([oldImport, newImport]) => {
      // Match import statements with the old path
      const importRegex = new RegExp(`import\\s+(.*)\\s+from\\s+(['"])${oldImport}(\\.\\w+)?\\2`, 'g');
      
      // Replace with the new path
      const newContent = content.replace(importRegex, (match, imports, quote, extension = '') => {
        hasChanges = true;
        return `import ${imports} from ${quote}${newImport}${extension}${quote}`;
      });
      
      if (content !== newContent) {
        content = newContent;
      }
    });
    
    // Save the file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  console.log('Starting import path updates...');
  
  if (testMode) {
    console.log('Running in test mode - will only show import paths that would be updated');
    console.log('Import mappings:');
    Object.entries(importMapping).forEach(([oldPath, newPath]) => {
      console.log(`  ${oldPath} -> ${newPath}`);
    });
    return;
  }
  
  // Get all relevant files
  const srcDir = path.resolve('client/src');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    return;
  }
  
  const files = getFilesRecursive(srcDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let updatedCount = 0;
  
  // Process each file
  files.forEach(file => {
    if (updateFileImports(file)) {
      updatedCount++;
    }
  });
  
  console.log(`Import paths updated in ${updatedCount} files`);
}

// Run the script
main();