/**
 * Enhanced Update Import Paths
 * 
 * This script updates import paths for components that were moved or renamed
 * during the component reorganization and merging process.
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

// Enhanced import path mapping
// Maps old import paths to new ones
const enhancedImportPathMapping = {
  // From imported to features mapping
  '@/components/imported/audio/': '@/components/features/audio/',
  '@/components/imported/cosmic/': '@/components/features/cosmic/',
  '@/components/imported/shop/': '@/components/features/shop/',
  '@/components/imported/community/': '@/components/features/community/',
  
  // From common directory to features
  '@/components/common/binaural-beat-generator': '@/components/features/audio/binaural-beat-generator',
  '@/components/common/breath-sync-player': '@/components/features/audio/breath-sync-player',
  '@/components/common/music-player': '@/components/features/audio/music-player',
  '@/components/common/voice-controlled-player': '@/components/features/audio/voice-controlled-player',
  '@/components/common/frequency-visualizer-3d': '@/components/features/audio/frequency-visualizer-3d',
  '@/components/common/harmonic-journeys-grid': '@/components/features/audio/harmonic-journeys-grid',
  '@/components/common/interactive-discography-map': '@/components/features/audio/interactive-discography-map',
  '@/components/common/lyrics-section': '@/components/features/audio/lyrics-section',
  '@/components/common/mood-based-player': '@/components/features/audio/mood-based-player',
  '@/components/common/musical-journey-timeline': '@/components/features/audio/musical-journey-timeline',
  '@/components/common/streaming-links': '@/components/features/audio/streaming-links',
  '@/components/common/track-segmentation-viewer': '@/components/features/audio/track-segmentation-viewer',
  '@/components/common/genius-lyrics-integration': '@/components/features/audio/genius-lyrics-integration',
  '@/components/common/dynamic-playlists': '@/components/features/audio/dynamic-playlists',
  '@/components/common/album-showcase': '@/components/features/audio/album-showcase',
  
  // Cosmic components
  '@/components/common/cosmic-background': '@/components/features/cosmic/cosmic-background',
  '@/components/common/cosmic-interactive-effects': '@/components/features/cosmic/cosmic-interactive-effects',
  '@/components/common/cosmic-particles': '@/components/features/cosmic/cosmic-particles',
  '@/components/common/particle-background': '@/components/features/cosmic/particle-background',
  '@/components/common/sacred-geometry-demo': '@/components/features/cosmic/sacred-geometry-demo',
  
  // Community components
  '@/components/common/community-feedback': '@/components/features/community/community-feedback',
  '@/components/common/community-feedback-loop': '@/components/features/community/community-feedback-loop',
  '@/components/common/donation-module': '@/components/features/community/donation-module',
  '@/components/common/fan-remix-contest': '@/components/features/community/fan-remix-contest',
  '@/components/common/release-engagement': '@/components/features/community/release-engagement',
  '@/components/common/upcoming-ceremonies-grid': '@/components/features/community/upcoming-ceremonies-grid',
  '@/components/common/newsletter': '@/components/features/community/newsletter',
  
  // Shop components
  '@/components/common/merchandise-storytelling': '@/components/features/shop/merchandise-storytelling',
  '@/components/common/seasonal-offers': '@/components/features/shop/seasonal-offers',
  '@/components/common/virtual-try-on': '@/components/features/shop/virtual-try-on',
  '@/components/common/cosmic-collectible': '@/components/features/shop/cosmic-collectible',
  
  // UI components
  '@/components/common/cosmic-button': '@/components/ui/cosmic-button',
  '@/components/common/cosmic-card': '@/components/ui/cosmic-card',
  '@/components/common/cosmic-heading': '@/components/ui/cosmic-heading',
  '@/components/common/cosmic-portal': '@/components/ui/cosmic-portal',
  '@/components/common/cosmic-section': '@/components/ui/cosmic-section',
  '@/components/common/cosmic-text': '@/components/ui/cosmic-text',
  
  // Layout components
  '@/components/common/cosmic-footer': '@/components/layout/cosmic-footer',
  '@/components/common/cosmic-navigation': '@/components/layout/cosmic-navigation',
  '@/components/common/site-header': '@/components/layout/site-header',
  
  // System components
  '@/components/common/theme-provider': '@/components/common/system/theme-provider',
  '@/components/common/cosmic-fonts': '@/components/common/system/cosmic-fonts',
  '@/components/common/performance-optimizations': '@/components/common/system/performance-optimizations',
  '@/components/common/cosmic-icons': '@/components/common/system/cosmic-icons',
  
  // Legacy paths
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
    try {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.')) {
            traverse(filePath);
          } else if (stat.isFile() && extFilter.includes(path.extname(file))) {
            result.push(filePath);
          }
        } catch (error) {
          console.error(`Error accessing path: ${filePath}`, error);
        }
      });
    } catch (error) {
      console.error(`Error reading directory: ${currentDir}`, error);
    }
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
    for (const [oldPath, newPath] of Object.entries(enhancedImportPathMapping)) {
      // Escape special regex characters in the oldPath
      const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex for imports with this path as prefix
      const importRegex = new RegExp(`from ["']${escapedOldPath}([^"']*)["']`, 'g');
      
      content = content.replace(importRegex, (match, componentPath) => {
        updated = true;
        return `from "${newPath}${componentPath}"`;
      });
      
      // Also handle exact path matches for components (without trailing /)
      if (!oldPath.endsWith('/')) {
        const exactPathRegex = new RegExp(`from ["']${escapedOldPath}["']`, 'g');
        content = content.replace(exactPathRegex, (match) => {
          updated = true;
          return `from "${newPath}"`;
        });
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
 * Analyze a file to find potentially broken imports
 */
function analyzeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const brokenImports = [];
    
    // Simple regex to find imports
    const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check if the import is a relative import to components
      if (importPath.includes('@/components/')) {
        // Resolve the import path
        const resolvedPath = importPath
          .replace('@/components/', path.join(process.cwd(), 'client/src/components/'))
          .replace(/\/index$/, '')
          + '.tsx';
        
        // Check if the file exists
        if (!fs.existsSync(resolvedPath)) {
          brokenImports.push({
            statement: match[0],
            path: importPath
          });
        }
      }
    }
    
    return brokenImports.length > 0 ? brokenImports : null;
  } catch (error) {
    console.error(`Error analyzing imports in ${filePath}:`, error);
    return null;
  }
}

/**
 * Generate a report of files with potentially broken imports
 */
function generateBrokenImportReport(files) {
  const brokenImportMap = {};
  
  files.forEach(file => {
    const brokenImports = analyzeImports(file);
    if (brokenImports && brokenImports.length > 0) {
      brokenImportMap[file] = brokenImports;
    }
  });
  
  const reportPath = path.join(process.cwd(), 'reports/broken-imports.json');
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(brokenImportMap, null, 2));
  console.log(`Broken import report written to: ${reportPath}`);
  
  return Object.keys(brokenImportMap).length;
}

/**
 * Main function
 */
function main() {
  console.log('Starting to update import paths with enhanced mappings...');
  
  // Get all files
  const files = getFilesRecursive(sourceDir);
  let updatedCount = 0;
  
  // Update imports in each file
  files.forEach(file => {
    if (updateFileImports(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\nFinished updating import paths in ${updatedCount} files`);
  
  // Generate report of potentially broken imports
  console.log('\nAnalyzing for potentially broken imports...');
  const brokenImportCount = generateBrokenImportReport(files);
  console.log(`Found ${brokenImportCount} files with potentially broken imports`);
}

// Run the script
main();