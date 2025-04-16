/**
 * Import Path Updater
 * 
 * This script updates import paths in codebase files after component migration.
 * It maps old import paths to new ones based on the component migration mapping.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file extensions to process
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

// Import path mapping
// Format: [old import path, new import path]
const importMapping = [
  // Admin components
  ['@/components/admin/ContentReview', '@/components/features/admin/ContentReview'],
  ['@/components/admin/DatabaseMonitor', '@/components/features/admin/DatabaseMonitor'],
  ['@/components/admin/NewsletterManagement', '@/components/features/admin/NewsletterManagement'],
  ['@/components/admin/ToDoList', '@/components/features/admin/ToDoList'],
  ['@/components/admin/UserManagement', '@/components/features/admin/UserManagement'],
  
  // Audio components
  ['@/components/audio/BinauralBeatGenerator', '@/components/features/audio/BinauralBeatGenerator'],
  ['@/components/audio/BreathSyncPlayer', '@/components/features/audio/BreathSyncPlayer'],
  ['@/components/audio/FrequencyVisualizer3D', '@/components/features/audio/FrequencyVisualizer3D'],
  ['@/components/audio/MoodBasedPlayer', '@/components/features/audio/MoodBasedPlayer'],
  ['@/components/audio/SpatialAudioExperience', '@/components/features/audio/SpatialAudioExperience'],
  ['@/components/audio/VoiceControlledPlayer', '@/components/features/audio/VoiceControlledPlayer'],
  
  // Cosmic components
  ['@/components/cosmic/CosmicBackground', '@/components/features/cosmic/CosmicBackground'],
  ['@/components/cosmic/CosmicButton', '@/components/features/cosmic/CosmicButton'],
  ['@/components/cosmic/CosmicReveal', '@/components/features/cosmic/CosmicReveal'],
  ['@/components/cosmic/CosmicSection', '@/components/features/cosmic/CosmicSection'],
  ['@/components/cosmic/CosmicTransition', '@/components/features/cosmic/CosmicTransition'],
  
  // UI Cosmic components
  ['@/components/ui/cosmic-button', '@/components/features/cosmic/cosmic-button'],
  ['@/components/ui/cosmic-card', '@/components/features/cosmic/cosmic-card'],
  ['@/components/ui/cosmic-form', '@/components/features/cosmic/cosmic-form'],
  ['@/components/ui/cosmic-slider', '@/components/features/cosmic/cosmic-slider'],
  ['@/components/ui/cosmic-input', '@/components/features/cosmic/cosmic-input'],
  ['@/components/ui/cosmic-badge', '@/components/features/cosmic/cosmic-badge'],
  
  // Layout components
  ['@/components/Header', '@/components/layout/Header'],
  ['@/components/Footer', '@/components/layout/Footer'],
  ['@/components/Navigation', '@/components/layout/Navigation'],
  ['@/components/MainLayout', '@/components/layout/MainLayout'],
  ['@/components/SiteLayout', '@/components/layout/SiteLayout'],
  ['@/components/Sidebar', '@/components/layout/Sidebar'],
  
  // Common components
  ['@/components/Button', '@/components/common/Button'],
  ['@/components/Card', '@/components/common/Card'],
  ['@/components/Modal', '@/components/common/Modal'],
  ['@/components/Toast', '@/components/common/Toast'],
  ['@/components/Tooltip', '@/components/common/Tooltip'],
  
  // Shop components - general pattern
  ['@/components/shop/', '@/components/features/shop/'],
  
  // Page rerouting
  ['@/pages/ShopPage', '@/pages/shop/ShopPage'],
  ['@/pages/ProductPage', '@/pages/shop/ProductPage'],
  ['@/pages/CartPage', '@/pages/shop/CartPage'],
  ['@/pages/CheckoutPage', '@/pages/shop/CheckoutPage'],
  ['@/pages/CollaborativeShoppingPage', '@/pages/shop/CollaborativeShoppingPage'],
  ['@/pages/CosmicMerchandisePage', '@/pages/shop/CosmicMerchandisePage'],
  ['@/pages/MusicReleasePage', '@/pages/music/MusicReleasePage'],
  ['@/pages/ArchivedMusic', '@/pages/music/ArchivedMusic'],
  ['@/pages/BlogPage', '@/pages/blog/BlogPage'],
  ['@/pages/BlogPostPage', '@/pages/blog/BlogPostPage'],
  ['@/pages/CommunityPage', '@/pages/community/CommunityPage'],
  ['@/pages/EnhancedCommunityPage', '@/pages/community/EnhancedCommunityPage'],
  ['@/pages/ImmersivePage', '@/pages/experience/ImmersivePage'],
  ['@/pages/CosmicConnectivityPage', '@/pages/experience/CosmicConnectivityPage'],
  ['@/pages/CosmicExperiencePage', '@/pages/experience/CosmicExperiencePage'],
  ['@/pages/AdminPortalPage', '@/pages/admin/AdminPortalPage'],
  ['@/pages/AnalyticsPage', '@/pages/admin/AnalyticsPage'],
  
  // Imported components - provide clear imports with prefixes
  ['v0_extract/components/album-showcase', '@/components/imported/v0/AlbumShowcase'],
  ['v0_extract/components/newsletter', '@/components/imported/v0/Newsletter'],
  ['v0_extract/components/particle-background', '@/components/imported/v0/ParticleBackground'],
  ['v0_extract/components/streaming-links', '@/components/imported/v0/StreamingLinks'],
  ['v0_extract/components/lyrics-section', '@/components/imported/v0/LyricsSection'],
  ['v0_extract/components/release-engagement', '@/components/imported/v0/ReleaseEngagement'],
  ['v0_extract/components/live-session', '@/components/imported/v0/LiveSession'],
];

/**
 * Gets all files with specified extensions in a directory (recursive)
 */
function getFilesRecursive(dir, extFilter = extensions) {
  let results = [];
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git directories
        if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
          traverse(fullPath);
        }
      } else if (extFilter.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return results;
}

/**
 * Updates imports in a file based on the mapping
 */
function updateFileImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changesMade = false;
  
  // Process each mapping
  for (const [oldPath, newPath] of importMapping) {
    // Match import statements with this path
    // Support different import formats:
    // - import X from 'path'
    // - import { X } from 'path'
    // - import * as X from 'path'
    const importRegex = new RegExp(`import\\s+(?:.+?)\\s+from\\s+['"](${oldPath}(?:\\.\\w+)?)['"](;?)`, 'g');
    
    // Replace the imports
    content = content.replace(importRegex, (match, importPath, semicolon) => {
      changesMade = true;
      // Preserve any file extensions in the import path
      const ext = path.extname(importPath);
      const newImportPath = ext ? `${newPath}${ext}` : newPath;
      return match.replace(importPath, newImportPath);
    });
  }
  
  // Only write to file if changes were made
  if (changesMade && content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

/**
 * Main function
 */
function main() {
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  console.log('Starting import path updates...');
  
  // Directories to process
  const directories = ['client/src'];
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory does not exist: ${dir}, skipping`);
      continue;
    }
    
    console.log(`Processing directory: ${dir}`);
    const files = getFilesRecursive(dir);
    totalFiles += files.length;
    
    for (const file of files) {
      if (testMode) {
        console.log(`Would process: ${file}`);
      } else {
        const updated = updateFileImports(file);
        if (updated) {
          console.log(`Updated imports in: ${file}`);
          updatedFiles++;
        }
      }
    }
  }
  
  if (testMode) {
    console.log(`Would process ${totalFiles} files`);
  } else {
    console.log(`Processed ${totalFiles} files, updated ${updatedFiles} files`);
  }
  
  console.log('Import path updates completed!');
}

// Run the script
main();