/**
 * Repository Reorganization Script
 * 
 * This script handles the creation of the new directory structure
 * for the repository reorganization plan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories to create
const directoryStructure = {
  'client/src/assets': 'Static assets (images, fonts, etc.)',
  'client/src/components/common': 'Common UI components (buttons, cards, etc.)',
  'client/src/components/layout': 'Layout components (Header, Footer, etc.)',
  'client/src/components/features': 'Feature-specific components',
  'client/src/components/features/shop': 'Shop-related components',
  'client/src/components/features/music': 'Music-related components',
  'client/src/components/features/audio': 'Audio-related components',
  'client/src/components/features/cosmic': 'Cosmic experience components',
  'client/src/components/features/admin': 'Admin-related components',
  'client/src/components/features/community': 'Community-related components',
  'client/src/components/features/immersive': 'Immersive experience components',
  'client/src/components/imported': 'Clearly marked components from other sources',
  'client/src/components/imported/v0': 'Components imported from v0',
  'client/src/components/imported/lovable': 'Components imported from lovable.dev',
  'client/src/hooks': 'Custom hooks',
  'client/src/lib': 'Utility functions and helpers',
  'client/src/pages/shop': 'Shop-related pages',
  'client/src/pages/admin': 'Admin portal pages',
  'client/src/pages/music': 'Music-related pages',
  'client/src/pages/blog': 'Blog-related pages',
  'client/src/pages/community': 'Community-related pages',
  'client/src/pages/experience': 'Experience-related pages',
  'client/src/pages/archived': 'Archived versions of pages (not in production)',
  'client/src/pages/archived/test': 'Archived test pages',
  'client/src/store': 'State management',
  'client/src/types': 'TypeScript type definitions',
};

/**
 * Creates the directory structure
 */
function createDirectoryStructure() {
  console.log('Creating directory structure...');
  
  Object.keys(directoryStructure).forEach(dir => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created: ${dir}`);
      
      // Create a README.md in each directory explaining its purpose
      const readmePath = path.join(fullPath, 'README.md');
      const description = directoryStructure[dir];
      fs.writeFileSync(readmePath, `# ${path.basename(dir)}\n\n${description}\n`);
    } else {
      console.log(`Already exists: ${dir}`);
    }
  });
  
  console.log('Directory structure created successfully!');
}

/**
 * Main function
 */
function main() {
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  if (testMode) {
    console.log('Running in test mode - will only show what would be created');
    console.log('Directories that would be created:');
    Object.keys(directoryStructure).forEach(dir => {
      console.log(`- ${dir}`);
    });
    return;
  }
  
  console.log('Starting repository reorganization...');
  createDirectoryStructure();
  console.log('Done!');
}

// Run the script
main();