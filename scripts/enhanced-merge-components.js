/**
 * Enhanced Merge Components Script
 * 
 * This script provides an improved system for merging components from imported directories
 * into their appropriate feature-specific directories with enhanced categorization
 * and component analysis.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Mapping of component types to target directories
const enhancedComponentMappings = {
  // Audio components (expanded)
  'audio': 'features/audio',
  'music': 'features/audio',
  'Binaural': 'features/audio',
  'Breath': 'features/audio',
  'Frequency': 'features/audio',
  'Player': 'features/audio',
  'Spatial': 'features/audio',
  'Voice': 'features/audio',
  'Track': 'features/audio',
  'Playlist': 'features/audio',
  'Visualizer': 'features/audio',
  'Journey': 'features/audio',
  'Lyrics': 'features/audio',
  'Album': 'features/audio',
  'Remix': 'features/audio',
  'Live': 'features/audio',
  'Session': 'features/audio',
  'Streaming': 'features/audio',
  'Genius': 'features/audio',
  'Attunement': 'features/audio',
  'Sound': 'features/audio',
  
  // Cosmic components (expanded)
  'Cosmic': 'features/cosmic',
  'Geometry': 'features/cosmic',
  'Sacred': 'features/cosmic',
  'Particle': 'features/cosmic',
  'Star': 'features/cosmic',
  'Background': 'features/cosmic',
  'Interactive': 'features/cosmic',
  'Effect': 'features/cosmic',
  'Animation': 'features/cosmic',
  'Shape': 'features/cosmic',
  'Reveal': 'features/cosmic',
  
  // Immersive components
  'Immersive': 'features/immersive',
  'Ceremony': 'features/immersive',
  'Synchronization': 'features/immersive',
  'Chamber': 'features/immersive',
  'Multidimensional': 'features/immersive',
  
  // Shop/Commerce components (expanded)
  'Shop': 'features/shop',
  'Merchandise': 'features/shop',
  'Product': 'features/shop',
  'Shopping': 'features/shop',
  'Cart': 'features/shop',
  'Checkout': 'features/shop',
  'Payment': 'features/shop',
  'TryOn': 'features/shop',
  'Filter': 'features/shop',
  'Offer': 'features/shop',
  'Collection': 'features/shop',
  'Collectible': 'features/shop',
  'Quick': 'features/shop',
  'Grid': 'features/shop',
  'Comparison': 'features/shop',
  
  // Community components (expanded)
  'Community': 'features/community',
  'Newsletter': 'features/community',
  'Feedback': 'features/community',
  'Donation': 'features/community',
  'Fan': 'features/community',
  'Engage': 'features/community',
  'Ceremony': 'features/community',
  'Featured': 'features/community',
  'Content': 'features/community',
  
  // Admin components
  'Admin': 'features/admin',
  'Management': 'features/admin',
  'User': 'features/admin',
  'Content': 'features/admin',
  'Database': 'features/admin',
  'ToDo': 'features/admin',
  'Review': 'features/admin',
  'Upload': 'features/admin',
  
  // UI components (organized by component type)
  'Accordion': 'ui',
  'Alert': 'ui',
  'Avatar': 'ui',
  'Badge': 'ui',
  'Button': 'ui',
  'Card': 'ui',
  'Carousel': 'ui',
  'Checkbox': 'ui',
  'Container': 'ui',
  'Drawer': 'ui',
  'Dropdown': 'ui',
  'Form': 'ui',
  'Heading': 'ui',
  'Input': 'ui',
  'Link': 'ui',
  'Markdown': 'ui',
  'Masonry': 'ui',
  'Media': 'ui',
  'Modal': 'ui',
  'Portal': 'ui',
  'Progress': 'ui',
  'Radio': 'ui',
  'Section': 'ui',
  'Select': 'ui',
  'Sidebar': 'ui',
  'Slider': 'ui',
  'Spinner': 'ui',
  'Stepper': 'ui',
  'Table': 'ui',
  'Tab': 'ui',
  'Text': 'ui',
  'Toast': 'ui',
  'Toggle': 'ui',
  'Tooltip': 'ui',
  'ui/': 'ui',
  
  // Layout components
  'Layout': 'layout',
  'Footer': 'layout',
  'Header': 'layout',
  'Navigation': 'layout',
  
  // Accessibility components
  'Accessibility': 'common/accessibility',
  'accessibility-': 'common/accessibility',
  
  // System components
  'Theme': 'common/system',
  'Font': 'common/system',
  'Performance': 'common/system',
  'Icon': 'common/system',
  
  // Default for any other components
  'default': 'common'
};

// Source directory
const importedDir = path.join(process.cwd(), 'client/src/components/imported');
// Base components directory
const componentsDir = path.join(process.cwd(), 'client/src/components');

/**
 * Enhanced target directory detection
 */
function getEnhancedTargetDirectory(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(importedDir, filePath);
  const dirName = path.dirname(relativePath);
  
  // Check if the file is in a subdirectory that maps directly
  if (dirName !== '.' && enhancedComponentMappings[dirName]) {
    return enhancedComponentMappings[dirName];
  }
  
  // Split the filename into parts (by dash, underscore, and camelCase)
  const fileNameWithoutExt = fileName.replace(/\.\w+$/, '');
  const parts = fileNameWithoutExt
    // Split camelCase (e.g., CosmicButton -> Cosmic, Button)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // Replace dashes and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Split into words
    .split(' ');
  
  // Check each part against the mapping
  for (const part of parts) {
    for (const [pattern, targetDir] of Object.entries(enhancedComponentMappings)) {
      if (pattern === 'default') continue;
      
      // Exact match with pattern
      if (part === pattern) {
        return targetDir;
      }
      
      // Case-insensitive match
      if (part.toLowerCase() === pattern.toLowerCase()) {
        return targetDir;
      }
      
      // Partial match (if part contains pattern or vice versa)
      if (part.includes(pattern) || pattern.includes(part)) {
        return targetDir;
      }
    }
  }
  
  // As a fallback, check the whole filename against patterns
  for (const [pattern, targetDir] of Object.entries(enhancedComponentMappings)) {
    if (pattern === 'default') continue;
    if (fileName.includes(pattern)) {
      return targetDir;
    }
  }
  
  // Default fallback
  return enhancedComponentMappings.default;
}

/**
 * Analyze a component to identify its purpose and type
 */
function analyzeComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Initialize component metadata
    const metadata = {
      name: fileName,
      imports: [],
      type: 'unknown',
      dependencies: [],
      isLayout: false,
      isUI: false,
      isFeature: false,
    };
    
    // Extract imports
    const importLines = content.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
    metadata.imports = importLines.map(line => {
      const match = line.match(/from\s+['"](.+?)['"]/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Check for layout indicators
    if (content.includes('<header') || content.includes('<footer') || 
        content.includes('<nav') || content.includes('<Layout') ||
        content.includes('layout') || fileName.includes('Layout') ||
        fileName.includes('Header') || fileName.includes('Footer') ||
        fileName.includes('Navigation')) {
      metadata.isLayout = true;
    }
    
    // Check for UI component indicators
    if (content.includes('className=') && 
        (content.includes('<button') || content.includes('<input') || 
         content.includes('<form') || content.includes('<div') ||
         fileName.includes('Button') || fileName.includes('Input') ||
         fileName.includes('Form') || fileName.includes('Card') ||
         fileName.includes('Modal'))) {
      metadata.isUI = true;
    }
    
    // Check for feature-specific indicators
    if (content.includes('audio') || content.includes('sound') || 
        content.includes('music') || content.includes('play(') ||
        fileName.includes('Audio') || fileName.includes('Music') ||
        fileName.includes('Player') || fileName.includes('Sound')) {
      metadata.isFeature = true;
      metadata.type = 'audio';
    }
    else if (content.includes('cosmic') || content.includes('particle') || 
             content.includes('star') || content.includes('background') ||
             fileName.includes('Cosmic') || fileName.includes('Particle') ||
             fileName.includes('Star') || fileName.includes('Background')) {
      metadata.isFeature = true;
      metadata.type = 'cosmic';
    }
    else if (content.includes('shop') || content.includes('product') || 
             content.includes('cart') || content.includes('buy') ||
             fileName.includes('Shop') || fileName.includes('Product') ||
             fileName.includes('Cart') || fileName.includes('Checkout')) {
      metadata.isFeature = true;
      metadata.type = 'shop';
    }
    else if (content.includes('community') || content.includes('feedback') || 
             content.includes('newsletter') || content.includes('donation') ||
             fileName.includes('Community') || fileName.includes('Feedback') ||
             fileName.includes('Newsletter') || fileName.includes('Donation')) {
      metadata.isFeature = true;
      metadata.type = 'community';
    }
    
    return metadata;
  } catch (error) {
    console.error(`Error analyzing component ${filePath}:`, error);
    return { name: path.basename(filePath), type: 'unknown' };
  }
}

/**
 * Enhanced component merging with analysis
 */
function enhancedMergeComponent(sourcePath) {
  try {
    // Analyze the component
    const componentMetadata = analyzeComponent(sourcePath);
    
    // Determine target directory based on analysis
    let targetType;
    
    if (componentMetadata.isLayout) {
      targetType = 'layout';
    } else if (componentMetadata.isUI) {
      targetType = 'ui';
    } else if (componentMetadata.isFeature && componentMetadata.type !== 'unknown') {
      targetType = `features/${componentMetadata.type}`;
    } else {
      // Fallback to pattern-based directory assignment
      targetType = getEnhancedTargetDirectory(sourcePath);
    }
    
    const fileName = path.basename(sourcePath);
    const targetDir = path.join(componentsDir, targetType);
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
    
    // Add a comment header with enhanced metadata
    const headerComment = `/**
 * ${fileName}
 * 
 * Component Type: ${targetType.replace('features/', '').replace('common/', '')}
 * Purpose: ${componentMetadata.isUI ? 'UI Element' : componentMetadata.isLayout ? 'Layout Component' : 'Feature Component'}
 * Migrated from: ${sourceType} components
 * Migration Date: ${new Date().toISOString().split('T')[0]}
 * Dependencies: ${componentMetadata.imports.length > 0 ? componentMetadata.imports.join(', ') : 'None'}
 */
`;
    
    // Write the component to the target location with header
    fs.writeFileSync(targetPath, headerComment + content);
    console.log(`Merged: ${sourcePath} -> ${targetPath}`);
    
    return {
      sourcePath,
      targetPath,
      targetType,
      metadata: componentMetadata
    };
  } catch (error) {
    console.error(`Error merging component ${sourcePath}:`, error);
    return null;
  }
}

/**
 * Process all imported components recursively with enhanced analysis
 */
function processImportedComponentsEnhanced(directory) {
  const items = fs.readdirSync(directory);
  const mergedComponents = [];
  
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Process subdirectories recursively
      const subDirResults = processImportedComponentsEnhanced(fullPath);
      mergedComponents.push(...subDirResults);
    } else if (stat.isFile() && item.endsWith('.tsx') && !item.includes('.DS_Store')) {
      // Process .tsx files
      const result = enhancedMergeComponent(fullPath);
      if (result) {
        mergedComponents.push(result);
      }
    }
  });
  
  return mergedComponents;
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
 * Generate a merge summary and report
 */
function generateMergeSummary(mergedComponents) {
  const summary = {
    total: mergedComponents.length,
    byType: {},
    duplicates: [],
    potentialDuplicates: []
  };
  
  // Count components by target type
  mergedComponents.forEach(component => {
    const type = component.targetType;
    if (!summary.byType[type]) {
      summary.byType[type] = 0;
    }
    summary.byType[type]++;
  });
  
  // Check for exactly named duplicates
  const fileNames = {};
  mergedComponents.forEach(component => {
    const fileName = path.basename(component.targetPath);
    if (!fileNames[fileName]) {
      fileNames[fileName] = [];
    }
    fileNames[fileName].push(component);
  });
  
  // Find exact duplicates
  Object.entries(fileNames).forEach(([name, components]) => {
    if (components.length > 1) {
      summary.duplicates.push({
        name,
        count: components.length,
        paths: components.map(c => c.targetPath)
      });
    }
  });
  
  // Find potential semantic duplicates (based on similarity in names)
  const sanitizedNames = {};
  mergedComponents.forEach(component => {
    const name = path.basename(component.targetPath, '.tsx')
      .toLowerCase()
      .replace(/[-_]/g, '') // Remove dashes and underscores
      .replace(/component$/, '') // Remove 'component' suffix
      .replace(/container$/, ''); // Remove 'container' suffix
    
    if (!sanitizedNames[name]) {
      sanitizedNames[name] = [];
    }
    sanitizedNames[name].push(component);
  });
  
  // Find potential duplicates
  Object.entries(sanitizedNames).forEach(([name, components]) => {
    if (components.length > 1) {
      summary.potentialDuplicates.push({
        baseName: name,
        count: components.length,
        components: components.map(c => ({
          name: path.basename(c.targetPath),
          path: c.targetPath
        }))
      });
    }
  });
  
  // Write summary to file
  const summaryPath = path.join(process.cwd(), 'merge-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nMerge summary written to: ${summaryPath}`);
  
  // Print summary to console
  console.log('\n==== Merge Summary ====');
  console.log(`Total components merged: ${summary.total}`);
  console.log('\nComponents by type:');
  Object.entries(summary.byType).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  console.log(`\nExact duplicates found: ${summary.duplicates.length}`);
  summary.duplicates.forEach(dup => {
    console.log(`- ${dup.name} (${dup.count} instances)`);
  });
  
  console.log(`\nPotential duplicates found: ${summary.potentialDuplicates.length}`);
  summary.potentialDuplicates.slice(0, 5).forEach(dup => {
    console.log(`- Base name "${dup.baseName}" has ${dup.count} similar components`);
    dup.components.forEach(c => console.log(`  - ${c.name}`));
  });
  if (summary.potentialDuplicates.length > 5) {
    console.log(`  ... and ${summary.potentialDuplicates.length - 5} more groups`);
  }
  
  return summary;
}

/**
 * Main function
 */
function main() {
  console.log('Starting enhanced component merge process...');
  
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
  
  // Then process and merge the components with enhanced analysis
  console.log('\nAnalyzing and merging components...');
  const mergedComponents = processImportedComponentsEnhanced(importedDir);
  
  // Generate a summary report
  console.log('\nGenerating merge summary...');
  generateMergeSummary(mergedComponents);
  
  console.log('\nEnhanced component merge process completed successfully!');
}

// Run the script
main();