/**
 * Fix Remaining Imports
 * 
 * This script finds and updates any remaining import paths that reference
 * the old 'imported' directory that has now been merged into feature directories.
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

// Import path mapping from old paths to new paths
const importPathMapping = {
  // Map UI components
  '../../components/imported/ui/CosmicButton': '../../components/features/cosmic/CosmicButton',
  '../../components/imported/ui/CosmicHeading': '../../components/features/cosmic/CosmicHeading',
  '../../components/imported/ui/CosmicText': '../../components/features/cosmic/CosmicText',
  '../../components/imported/ui/CosmicCard': '../../components/features/cosmic/CosmicCard',
  '../../components/imported/ui/CosmicSection': '../../components/features/cosmic/CosmicSection',
  '../../components/imported/ui/CosmicPortal': '../../components/features/cosmic/CosmicPortal',
  
  // Map with different levels of paths for demo components
  '../../../components/imported/ui/CosmicButton': '../../../components/features/cosmic/CosmicButton',
  '../../../components/imported/ui/CosmicHeading': '../../../components/features/cosmic/CosmicHeading',
  '../../../components/imported/ui/CosmicText': '../../../components/features/cosmic/CosmicText',
  '../../../components/imported/ui/CosmicCard': '../../../components/features/cosmic/CosmicCard',
  '../../../components/imported/ui/CosmicSection': '../../../components/features/cosmic/CosmicSection',
  '../../../components/imported/ui/CosmicPortal': '../../../components/features/cosmic/CosmicPortal',
  
  // Audio components
  '../../components/imported/audio/BinauralBeatGenerator': '../../components/features/audio/BinauralBeatGenerator',
  '../../components/imported/audio/BreathSyncPlayer': '../../components/features/audio/BreathSyncPlayer',
  '../../../components/imported/audio/BinauralBeatGenerator': '../../../components/features/audio/BinauralBeatGenerator',
  '../../../components/imported/audio/BreathSyncPlayer': '../../../components/features/audio/BreathSyncPlayer',
  
  // Other imported components
  '../../components/imported/AccessibilityControls': '../../components/common/AccessibilityControls',
  '../../components/imported/AlbumShowcase': '../../components/common/AlbumShowcase',
  '../../components/imported/CosmicCollectible': '../../components/features/cosmic/CosmicCollectible',
  '../../components/imported/CosmicBackground': '../../components/features/cosmic/CosmicBackground',
  '../../components/imported/CosmicIcons': '../../components/features/cosmic/CosmicIcons',
  '../../components/imported/CosmicInteractiveEffects': '../../components/features/cosmic/CosmicInteractiveEffects',
  '../../components/imported/ParticleBackground': '../../components/features/cosmic/ParticleBackground',
  '../../components/imported/SacredGeometry': '../../components/features/cosmic/SacredGeometry',
  
  // Three-level imports
  '../../../components/imported/AccessibilityControls': '../../../components/common/AccessibilityControls',
  '../../../components/imported/AlbumShowcase': '../../../components/common/AlbumShowcase',
  '../../../components/imported/CosmicCollectible': '../../../components/features/cosmic/CosmicCollectible',
  '../../../components/imported/CosmicBackground': '../../../components/features/cosmic/CosmicBackground',
  '../../../components/imported/CosmicIcons': '../../../components/features/cosmic/CosmicIcons',
  '../../../components/imported/CosmicInteractiveEffects': '../../../components/features/cosmic/CosmicInteractiveEffects',
  '../../../components/imported/ParticleBackground': '../../../components/features/cosmic/ParticleBackground',
  '../../../components/imported/SacredGeometry': '../../../components/features/cosmic/SacredGeometry'
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
      
      if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
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
      const importRegex = new RegExp(`from ["']${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from "${newPath}"`);
        updated = true;
      }
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
  console.log('Starting to fix remaining import paths...');
  
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