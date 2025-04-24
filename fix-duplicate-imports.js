/**
 * Fix Duplicate Imports
 * 
 * This script fixes duplicate import issues in components,
 * particularly focusing on the frequency-visualizer-3d.tsx component
 * where lucide-react icons are imported twice.
 * 
 * Usage: node fix-duplicate-imports.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const COMPONENTS_DIR = path.join(CLIENT_SRC_DIR, 'components');
const FREQUENCY_VISUALIZER_PATH = path.join(COMPONENTS_DIR, 'features', 'audio', 'frequency-visualizer-3d.tsx');
const BACKUP_DIR = './ts-fixes-backup';
const LOG_FILE = 'duplicate-imports-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Duplicate Imports Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Fix duplicate imports in the frequency visualizer
 */
function fixFrequencyVisualizer() {
  if (!fs.existsSync(FREQUENCY_VISUALIZER_PATH)) {
    log(`Error: Could not find frequency-visualizer-3d.tsx at ${FREQUENCY_VISUALIZER_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    const content = fs.readFileSync(FREQUENCY_VISUALIZER_PATH, 'utf8');
    
    // Create backup
    backupFile(FREQUENCY_VISUALIZER_PATH);
    
    // Fix duplicate imports - strategy: remove the second import of the same components
    const updatedContent = content
      // First, fix duplicate lucide-react imports
      .replace(
        /import\s*{\s*(?:[A-Za-z0-9]+\s*,\s*)*RefreshCw\s*,\s*Upload\s*,\s*Mic\s*,\s*Settings\s*,\s*ChevronDown(?:\s*,\s*[A-Za-z0-9]+\s*)*\s*}\s*from\s*["']lucide-react["']\s*\n/g,
        (match, index) => {
          // Only keep the first occurrence
          if (content.indexOf('import') < index && content.substring(0, index).includes('RefreshCw')) {
            return '// Removed duplicate lucide-react import\n';
          }
          return match;
        }
      )
      // Fix duplicate THREE imports
      .replace(
        /import\s*\*\s*as\s*THREE\s*from\s*["']three["']\s*\n/g,
        (match, index) => {
          // Only keep the first occurrence
          if (content.indexOf('import') < index && content.substring(0, index).includes('as THREE from')) {
            return '// Removed duplicate THREE import\n';
          }
          return match;
        }
      )
      // Fix duplicate TextGeometry imports
      .replace(
        /import\s*{\s*TextGeometry\s*}\s*from\s*['"]three\/examples\/jsm\/geometries\/TextGeometry['"]\s*\n/g,
        (match, index) => {
          // Only keep the first occurrence
          if (content.indexOf('import') < index && content.substring(0, index).includes('TextGeometry')) {
            return '// Removed duplicate TextGeometry import\n';
          }
          return match;
        }
      )
      // Fix duplicate FontLoader imports
      .replace(
        /import\s*{\s*FontLoader\s*}\s*from\s*['"]three\/examples\/jsm\/loaders\/FontLoader['"]\s*\n/g,
        (match, index) => {
          // Only keep the first occurrence
          if (content.indexOf('import') < index && content.substring(0, index).includes('FontLoader')) {
            return '// Removed duplicate FontLoader import\n';
          }
          return match;
        }
      );
    
    // Write the fixed content
    fs.writeFileSync(FREQUENCY_VISUALIZER_PATH, updatedContent, 'utf8');
    log(`Fixed duplicate imports in frequency-visualizer-3d.tsx at: ${FREQUENCY_VISUALIZER_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing duplicate imports in frequency-visualizer-3d.tsx: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting duplicate imports fixes...');
  
  if (fixFrequencyVisualizer()) {
    log('Successfully fixed duplicate imports in frequency visualizer');
  } else {
    log('Failed to fix duplicate imports in frequency visualizer');
  }
}

// Run the main function
main();