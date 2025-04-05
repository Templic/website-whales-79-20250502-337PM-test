/**
 * Fix Broken Imports Script
 * 
 * This script fixes the broken imports identified after component consolidation
 * by mapping old import paths to their new locations.
 */

import fs from 'fs';
import path from 'path';

// Load the broken imports report
const brokenImportsPath = path.join(process.cwd(), 'reports/broken-imports.json');
const brokenImports = JSON.parse(fs.readFileSync(brokenImportsPath, 'utf8'));

// Define mappings for the broken imports
const importMappings = {
  '@/components/cosmic-card': '@/components/features/cosmic/CosmicCard',
  '@/components/cosmic-button': '@/components/features/cosmic/CosmicButton',
  '@/components/cosmic-heading': '@/components/features/cosmic/CosmicHeading',
  '@/components/cosmic-icons': '@/components/features/cosmic/CosmicIcon',
  '@/components/cosmic-interactive-effects': '@/components/features/cosmic/CosmicInteractiveEffects',
  '@/components/cosmic-text': '@/components/features/cosmic/CosmicText',
  '@/components/ui/cosmic/sacred-geometry': '@/components/features/cosmic/sacred-geometry',
  '@/components/AudioPlayer': '@/components/features/audio/AudioPlayer'
};

// Process each file with broken imports
Object.entries(brokenImports).forEach(([filePath, brokenImportList]) => {
  console.log(`Processing file: ${filePath}`);
  
  // Read the file content
  const relativePath = filePath.replace('/home/runner/workspace/', '');
  let fileContent = fs.readFileSync(relativePath, 'utf8');
  let modified = false;
  
  // Replace each broken import
  brokenImportList.forEach(({ statement, path: importPath }) => {
    if (importMappings[importPath]) {
      const newImportPath = importMappings[importPath];
      const newStatement = statement.replace(importPath, newImportPath);
      fileContent = fileContent.replace(statement, newStatement);
      console.log(`  Fixed import: ${importPath} -> ${newImportPath}`);
      modified = true;
    } else {
      console.log(`  No mapping found for: ${importPath}`);
    }
  });
  
  // Write back the file if modified
  if (modified) {
    fs.writeFileSync(relativePath, fileContent);
    console.log(`  Updated file saved`);
  }
});

console.log('Import fix completed');