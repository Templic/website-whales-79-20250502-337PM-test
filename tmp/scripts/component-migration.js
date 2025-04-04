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
// component type can be 'common', 'layout', 'feature', or 'imported'
const componentMigrations = [
  // Existing UI components stay in place
  ['client/src/components/ui/*.tsx', 'client/src/components/ui/', 'common'],
  
  // Move admin components to features/admin
  ['client/src/components/admin/ContentReview.tsx', 'client/src/components/features/admin/ContentReview.tsx', 'feature'],
  ['client/src/components/admin/DatabaseMonitor.tsx', 'client/src/components/features/admin/DatabaseMonitor.tsx', 'feature'],
  ['client/src/components/admin/NewsletterManagement.tsx', 'client/src/components/features/admin/NewsletterManagement.tsx', 'feature'],
  ['client/src/components/admin/ToDoList.tsx', 'client/src/components/features/admin/ToDoList.tsx', 'feature'],
  ['client/src/components/admin/UserManagement.tsx', 'client/src/components/features/admin/UserManagement.tsx', 'feature'],
  
  // Move audio components to features/audio
  ['client/src/components/audio/BinauralBeatGenerator.tsx', 'client/src/components/features/audio/BinauralBeatGenerator.tsx', 'feature'],
  ['client/src/components/audio/BreathSyncPlayer.tsx', 'client/src/components/features/audio/BreathSyncPlayer.tsx', 'feature'],
  ['client/src/components/audio/FrequencyVisualizer3D.tsx', 'client/src/components/features/audio/FrequencyVisualizer3D.tsx', 'feature'],
  ['client/src/components/audio/MoodBasedPlayer.tsx', 'client/src/components/features/audio/MoodBasedPlayer.tsx', 'feature'],
  ['client/src/components/audio/SpatialAudioExperience.tsx', 'client/src/components/features/audio/SpatialAudioExperience.tsx', 'feature'],
  ['client/src/components/audio/VoiceControlledPlayer.tsx', 'client/src/components/features/audio/VoiceControlledPlayer.tsx', 'feature'],
  
  // Move shop components to features/shop
  ['client/src/components/shop/*.tsx', 'client/src/components/features/shop/', 'feature'],
  ['client/src/components/shop/enhanced/*.tsx', 'client/src/components/features/shop/', 'feature'],
  
  // Move cosmic components to features/cosmic
  ['client/src/components/cosmic/CosmicBackground.tsx', 'client/src/components/features/cosmic/CosmicBackground.tsx', 'feature'],
  ['client/src/components/cosmic/CosmicButton.tsx', 'client/src/components/features/cosmic/CosmicButton.tsx', 'feature'],
  ['client/src/components/cosmic/CosmicReveal.tsx', 'client/src/components/features/cosmic/CosmicReveal.tsx', 'feature'],
  ['client/src/components/cosmic/CosmicSection.tsx', 'client/src/components/features/cosmic/CosmicSection.tsx', 'feature'],
  ['client/src/components/cosmic/CosmicTransition.tsx', 'client/src/components/features/cosmic/CosmicTransition.tsx', 'feature'],
  ['client/src/components/cosmic/cosmic-animations.css', 'client/src/components/features/cosmic/cosmic-animations.css', 'feature'],
  ['client/src/components/ui/cosmic-*.tsx', 'client/src/components/features/cosmic/', 'feature'],
  
  // Move common layout components to layout folder
  ['client/src/components/Header.tsx', 'client/src/components/layout/Header.tsx', 'layout'],
  ['client/src/components/Footer.tsx', 'client/src/components/layout/Footer.tsx', 'layout'],
  ['client/src/components/Navigation.tsx', 'client/src/components/layout/Navigation.tsx', 'layout'],
  ['client/src/components/MainLayout.tsx', 'client/src/components/layout/MainLayout.tsx', 'layout'],
  ['client/src/components/SiteLayout.tsx', 'client/src/components/layout/SiteLayout.tsx', 'layout'],
  ['client/src/components/Sidebar.tsx', 'client/src/components/layout/Sidebar.tsx', 'layout'],
  
  // Common components
  ['client/src/components/Button.tsx', 'client/src/components/common/Button.tsx', 'common'],
  ['client/src/components/Card.tsx', 'client/src/components/common/Card.tsx', 'common'],
  ['client/src/components/Modal.tsx', 'client/src/components/common/Modal.tsx', 'common'],
  ['client/src/components/Toast.tsx', 'client/src/components/common/Toast.tsx', 'common'],
  ['client/src/components/Tooltip.tsx', 'client/src/components/common/Tooltip.tsx', 'common'],
  
  // Import components from v0_extract
  ['v0_extract/components/album-showcase.tsx', 'client/src/components/imported/v0/AlbumShowcase.tsx', 'imported'],
  ['v0_extract/components/newsletter.tsx', 'client/src/components/imported/v0/Newsletter.tsx', 'imported'],
  ['v0_extract/components/particle-background.tsx', 'client/src/components/imported/v0/ParticleBackground.tsx', 'imported'],
  ['v0_extract/components/streaming-links.tsx', 'client/src/components/imported/v0/StreamingLinks.tsx', 'imported'],
  ['v0_extract/components/lyrics-section.tsx', 'client/src/components/imported/v0/LyricsSection.tsx', 'imported'],
  ['v0_extract/components/release-engagement.tsx', 'client/src/components/imported/v0/ReleaseEngagement.tsx', 'imported'],
  ['v0_extract/components/live-session.tsx', 'client/src/components/imported/v0/LiveSession.tsx', 'imported'],
  ['v0_extract/components/track-segmentation-viewer.tsx', 'client/src/components/imported/v0/TrackSegmentationViewer.tsx', 'imported'],
  ['v0_extract/components/fan-remix-contest.tsx', 'client/src/components/imported/v0/FanRemixContest.tsx', 'imported'],
  
  // Import components from tmp_import
  ['tmp_import/components/*.tsx', 'client/src/components/imported/lovable/', 'imported'],
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
 * Originally from: ${source}
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
`;
  } else {
    header = `/**
 * ${path.basename(filePath)}
 * 
 * Component Type: ${componentType}
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
  // Check if source has wildcard
  if (source.includes('*')) {
    const basePath = path.dirname(source);
    const pattern = path.basename(source);
    const fileRegex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    
    if (!fs.existsSync(basePath)) {
      console.error(`Source directory does not exist: ${basePath}`);
      return false;
    }
    
    // Get all files in the directory
    const files = fs.readdirSync(basePath);
    
    // Filter files by pattern
    const matchingFiles = files.filter(file => fileRegex.test(file));
    
    if (matchingFiles.length === 0) {
      console.warn(`No files matching pattern: ${source}`);
      return false;
    }
    
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    // Copy each matching file
    for (const file of matchingFiles) {
      const sourcePath = path.join(basePath, file);
      const destPath = path.join(destination, file);
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        continue;
      }
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        addComponentHeader(destPath, componentType, basePath);
        console.log(`Migrated: ${sourcePath} → ${destPath}`);
      } catch (error) {
        console.error(`Failed to copy ${sourcePath}: ${error.message}`);
      }
    }
    
    return true;
  } else {
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
      
      // Add a header comment to the file
      addComponentHeader(destination, componentType, source);
      
      console.log(`Migrated: ${source} → ${destination}`);
      return true;
    } catch (error) {
      console.error(`Error migrating ${source}: ${error.message}`);
      return false;
    }
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
  
  console.log(`Component migration completed. Success: ${successCount}, Failed: ${failCount}`);
}

// Run the script
main();