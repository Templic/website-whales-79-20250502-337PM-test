/**
 * Component Migration Helper Script
 * 
 * This script assists in migrating components from their current locations
 * to the new structure according to the repository reorganization plan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Component migration mapping
// Format: [source path, destination path, component type]
const componentMigrations = [
  // Examples (these would need to be filled with actual component paths)
  // Common components
  ['client/src/components/Button.tsx', 'client/src/components/common/Button.tsx', 'common'],
  ['client/src/components/Card.tsx', 'client/src/components/common/Card.tsx', 'common'],
  
  // Layout components
  ['client/src/components/Header.tsx', 'client/src/components/layout/Header.tsx', 'layout'],
  ['client/src/components/Footer.tsx', 'client/src/components/layout/Footer.tsx', 'layout'],
  
  // Feature components - Shop
  ['client/src/components/ProductCard.tsx', 'client/src/components/features/shop/ProductCard.tsx', 'feature'],
  ['client/src/components/CartItem.tsx', 'client/src/components/features/shop/CartItem.tsx', 'feature'],
  
  // Feature components - Music
  ['client/src/components/MusicPlayer.tsx', 'client/src/components/features/music/MusicPlayer.tsx', 'feature'],
  ['client/src/components/TrackList.tsx', 'client/src/components/features/music/TrackList.tsx', 'feature'],
  
  // Imported components - v0
  ['v0_extract/components/harmonic-journeys-grid.tsx', 'client/src/components/imported/v0/HarmonicJourneysGrid.tsx', 'imported'],
  
  // Imported components - lovable
  ['tmp_import/components/journey/harmonic-journeys-grid.tsx', 'client/src/components/imported/lovable/HarmonicJourneysGrid.tsx', 'imported'],
];

/**
 * Adds a comment header to imported components
 */
function addComponentHeader(filePath, componentType, source) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  let header = '';
  if (componentType === 'imported') {
    header = `/**
 * ${path.basename(filePath)}
 * 
 * IMPORTED COMPONENT
 * Source: ${source}
 * 
 * This component was imported from an external source and may need refactoring
 * to align with the current codebase standards.
 */
`;
  } else {
    header = `/**
 * ${path.basename(filePath)}
 * 
 * ${componentType.toUpperCase()} COMPONENT
 * 
 * Migrated as part of the repository reorganization.
 */
`;
  }
  
  // Add the header if it doesn't already have one
  if (!content.startsWith('/**')) {
    fs.writeFileSync(filePath, header + content);
  }
}

/**
 * Migrates a component from source to destination path
 */
function migrateComponent(source, destination, componentType) {
  // Create the destination directory if it doesn't exist
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Check if the source exists
  if (!fs.existsSync(source)) {
    console.error(`Source file does not exist: ${source}`);
    return false;
  }
  
  try {
    // Copy the component to the new location
    fs.copyFileSync(source, destination);
    
    // Add a header comment to the file indicating its source and purpose
    const sourceInfo = componentType === 'imported' 
      ? (source.includes('v0') ? 'v0' : 'lovable.dev') 
      : 'original codebase';
    
    addComponentHeader(destination, componentType, sourceInfo);
    
    console.log(`Migrated: ${source} → ${destination}`);
    return true;
  } catch (error) {
    console.error(`Error migrating ${source}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  console.log('Starting component migration...');
  
  if (testMode) {
    console.log('Running in test mode - will only show what would be migrated');
    componentMigrations.forEach(([source, destination, type]) => {
      console.log(`Would migrate: ${source} → ${destination} (${type})`);
    });
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  componentMigrations.forEach(([source, destination, type]) => {
    if (migrateComponent(source, destination, type)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log(`Migration completed. Success: ${successCount}, Failed: ${failCount}`);
}

// Run the script
main();