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
  'binaural-beat-generator': 'features/audio',
  'breath-sync-player': 'features/audio',
  'dynamic-playlists': 'features/audio',
  'frequency-visualizer-3d': 'features/audio',
  'harmonic-journeys-grid': 'features/audio',
  'interactive-discography-map': 'features/audio',
  'lyrics-section': 'features/audio',
  'mood-based-player': 'features/audio',
  'music-player': 'features/audio',
  'musical-journey-timeline': 'features/audio',
  'spatial-audio-experience': 'features/audio',
  'streaming-links': 'features/audio',
  'track-segmentation-viewer': 'features/audio',
  'voice-controlled-player': 'features/audio',
  'AlbumShowcase': 'features/audio',
  'FanRemixContest': 'features/audio',
  'LiveSession': 'features/audio',
  'LyricsSection': 'features/audio',
  'ReleaseEngagement': 'features/audio',
  'StreamingLinks': 'features/audio',
  'TrackSegmentationViewer': 'features/audio',
  'genius-lyrics-integration': 'features/audio',
  
  // Cosmic components
  'Cosmic': 'features/cosmic',
  'SacredGeometry': 'features/cosmic',
  'Particle': 'features/cosmic',
  'CosmicBackground': 'features/cosmic',
  'CosmicInteractiveEffects': 'features/cosmic',
  'ParticleBackground': 'features/cosmic',
  'cosmic-background': 'features/cosmic',
  'cosmic-interactive-effects': 'features/cosmic',
  'cosmic-particles': 'features/cosmic',
  'particle-background': 'features/cosmic',
  'sacred-geometry-demo': 'features/cosmic',
  
  // Shop components
  'Merchandise': 'features/shop',
  'VirtualTryOn': 'features/shop',
  'SeasonalOffers': 'features/shop',
  'Collectible': 'features/shop',
  'CosmicCollectible': 'features/shop',
  'merchandise-storytelling': 'features/shop',
  'seasonal-offers': 'features/shop',
  'virtual-try-on': 'features/shop',
  
  // Community components
  'Community': 'features/community',
  'Newsletter': 'features/community',
  'Feedback': 'features/community',
  'Donation': 'features/community',
  'community-feedback': 'features/community',
  'community-feedback-loop': 'features/community',
  'donation-module': 'features/community',
  'fan-remix-contest': 'features/community',
  'newsletter': 'features/community',
  'Newsletter': 'features/community',
  'release-engagement': 'features/community',
  'upcoming-ceremonies-grid': 'features/community',
  
  // UI components
  'ui/': 'ui',
  'CosmicButton': 'ui',
  'CosmicCard': 'ui',
  'CosmicHeading': 'ui',
  'CosmicPortal': 'ui',
  'CosmicSection': 'ui',
  'CosmicText': 'ui',
  'cosmic-button': 'ui',
  'cosmic-card': 'ui',
  'cosmic-heading': 'ui',
  'cosmic-portal': 'ui',
  'cosmic-section': 'ui',
  'cosmic-text': 'ui',
  
  // Layout components
  'cosmic-footer': 'layout',
  'cosmic-navigation': 'layout',
  'site-header': 'layout',
  
  // Accessibility components
  'accessibility-controls': 'common/accessibility',
  'AccessibilityControls': 'common/accessibility',
  
  // System components
  'theme-provider': 'common/system',
  'cosmic-fonts': 'common/system',
  'performance-optimizations': 'common/system',
  'CosmicIcons': 'common/system',
  'cosmic-icons': 'common/system',
  
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
    
    // Determine the source (v0, lovable, etc.)
    let sourceType = 'imported';
    if (sourcePath.includes('/v0/')) {
      sourceType = 'v0';
    } else if (sourcePath.includes('/lovable/')) {
      sourceType = 'lovable';
    } else if (sourcePath.includes('/ui/')) {
      sourceType = 'ui lib';
    } else if (sourcePath.includes('/audio/')) {
      sourceType = 'audio lib';
    }
    
    // Add a comment header
    const headerComment = `/**
 * ${fileName}
 * 
 * Component Type: ${componentType.replace('features/', '').replace('common/', '')}
 * Migrated from: ${sourceType} components
 * Migration Date: ${new Date().toISOString().split('T')[0]}
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
 * Copies components from backup to imported directory
 */
function copyFromBackup() {
  const backupDir = path.join(process.cwd(), 'backups/imported-components-1743795416675');
  
  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory does not exist: ${backupDir}`);
    return false;
  }
  
  // Create imported directory if it doesn't exist
  if (!fs.existsSync(importedDir)) {
    fs.mkdirSync(importedDir, { recursive: true });
    console.log(`Created imported directory: ${importedDir}`);
  }
  
  // Create subdirectories in imported
  const subdirs = ['v0', 'lovable', 'ui', 'audio'];
  subdirs.forEach(subdir => {
    const subdirPath = path.join(importedDir, subdir);
    if (!fs.existsSync(subdirPath)) {
      fs.mkdirSync(subdirPath, { recursive: true });
      console.log(`Created subdirectory: ${subdirPath}`);
    }
  });
  
  // Copy files from backup to imported dir
  function copyFilesRecursively(source, destination) {
    const items = fs.readdirSync(source);
    
    items.forEach(item => {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);
      const stat = fs.statSync(sourcePath);
      
      if (stat.isDirectory()) {
        // Create directory if it doesn't exist
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
          console.log(`Created directory: ${destPath}`);
        }
        
        // Copy files in subdirectory
        copyFilesRecursively(sourcePath, destPath);
      } else if (stat.isFile() && item.endsWith('.tsx') && !item.includes('.DS_Store')) {
        // Copy file if it doesn't exist
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copied file: ${sourcePath} -> ${destPath}`);
        }
      }
    });
  }
  
  // Start copying files
  copyFilesRecursively(backupDir, importedDir);
  return true;
}

/**
 * Main function
 */
function main() {
  console.log('Starting to merge imported components...');
  
  // First copy files from backup to imported directory
  const copySuccess = copyFromBackup();
  
  if (!copySuccess) {
    console.error('Failed to copy files from backup.');
    return;
  }
  
  if (!fs.existsSync(importedDir)) {
    console.error(`Imported components directory does not exist: ${importedDir}`);
    return;
  }
  
  // Then process and merge the components
  processImportedComponents(importedDir);
  
  console.log('Finished merging imported components');
}

// Run the script
main();