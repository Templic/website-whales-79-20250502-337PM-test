/**
 * Merge Imported Components Script
 * 
 * This script merges components from the imported directory
 * into their appropriate feature-specific directories.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of component types to target directories
const componentMappings = {
  // Audio components
  'audio': 'features/audio',
  'BinauralBeatGenerator': 'features/audio',
  'BreathSyncPlayer': 'features/audio',
  'FrequencyVisualizer': 'features/audio',
  'MusicPlayer': 'features/audio',
  'SpatialAudio': 'features/audio',
  'VoiceControlled': 'features/audio',
  'Track': 'features/audio',
  
  // Cosmic components
  'Cosmic': 'features/cosmic',
  'SacredGeometry': 'features/cosmic',
  'Particle': 'features/cosmic',
  
  // Shop components
  'Merchandise': 'features/shop',
  'VirtualTryOn': 'features/shop',
  'SeasonalOffers': 'features/shop',
  'Collectible': 'features/shop',
  
  // Community components
  'Community': 'features/community',
  'Newsletter': 'features/community',
  'Feedback': 'features/community',
  'Donation': 'features/community',
  
  // UI components go to common or ui
  'ui/': 'ui',
  
  // Default for any other components
  'default': 'common'
};

// Source directory
const importedDir = path.join(process.cwd(), 'client/src/components/imported');
// Base components directory
const componentsDir = path.join(process.cwd(), 'client/src/components');

/**
 * Get the appropriate target directory for a component
 */
function getTargetDirectory(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(importedDir, filePath);
  const dirName = path.dirname(relativePath);
  
  // Check if the file is in a subdirectory that maps directly
  if (dirName !== '.' && componentMappings[dirName]) {
    return componentMappings[dirName];
  }
  
  // Try to match by name patterns
  for (const [pattern, targetDir] of Object.entries(componentMappings)) {
    if (pattern === 'default') continue;
    if (fileName.includes(pattern)) {
      return targetDir;
    }
  }
  
  // Default fallback
  return componentMappings.default;
}

/**
 * Merge a component from imported to target directory
 */
function mergeComponent(sourcePath, componentType) {
  try {
    const fileName = path.basename(sourcePath);
    const targetDir = path.join(componentsDir, componentType);
    const targetPath = path.join(targetDir, fileName);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
    }
    
    // Skip if the file already exists in the target directory
    if (fs.existsSync(targetPath)) {
      console.log(`File already exists, skipping: ${targetPath}`);
      return;
    }
    
    // Read the component file
    const content = fs.readFileSync(sourcePath, 'utf8');
    
    // Add a comment header
    const headerComment = `/**
 * ${fileName}
 * 
 * Component Type: ${componentType.replace('features/', '')}
 * Migrated from imported components.
 */
`;
    
    // Write the component to the target location with header
    fs.writeFileSync(targetPath, headerComment + content);
    console.log(`Merged: ${sourcePath} -> ${targetPath}`);
  } catch (error) {
    console.error(`Error merging component ${sourcePath}:`, error);
  }
}

/**
 * Process all imported components recursively
 */
function processImportedComponents(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Process subdirectories recursively
      processImportedComponents(fullPath);
    } else if (stat.isFile() && item.endsWith('.tsx') && !item.includes('.DS_Store')) {
      // Process .tsx files
      const targetDir = getTargetDirectory(fullPath);
      mergeComponent(fullPath, targetDir);
    }
  });
}

/**
 * Main function
 */
function main() {
  console.log('Starting to merge imported components...');
  
  if (!fs.existsSync(importedDir)) {
    console.error(`Imported components directory does not exist: ${importedDir}`);
    return;
  }
  
  processImportedComponents(importedDir);
  
  console.log('Finished merging imported components');
}

// Run the script
main();