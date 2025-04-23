/**
 * Fix Sacred Geometry Component Type Annotations
 * 
 * This script fixes all malformed TypeScript type annotations in the
 * sacred-geometry.tsx file component parameters.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File to fix
const filePath = path.join(__dirname, 'client/src/components/ui/cosmic/sacred-geometry.tsx');

// We need to manually fix each component with malformed type annotations
function fixSacredGeometryComponents() {
  console.log('\x1b[36m%s\x1b[0m', 'Fixing TypeScript errors in sacred-geometry.tsx...');
  
  // Create backup
  const backupPath = `${filePath}.backup-full`;
  fs.copyFileSync(filePath, backupPath);
  console.log('\x1b[32m%s\x1b[0m', `Backup created at ${backupPath}`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Define component names to fix
  const components = [
    'OctagonContainer',
    'PentagonContainer',
    'TriangleInterlockContainer',
    'TriangleContainer',
    'InvertedTriangleContainer',
    'CircleContainer',
    'StarburstContainer',
    'FlowerOfLifeContainer',
    'MeditationCircleContainer',
    'MerkabaStar'
  ];
  
  // Fix each component
  let fixCount = 0;
  
  for (const component of components) {
    // Find pattern for component
    const componentRegex = new RegExp(`export function ${component}\\(\\{[\\s\\S]*?\\}: GeometryContainerProps[^)]*\\) {`);
    const match = content.match(componentRegex);
    
    if (match) {
      // Extract the matched component declaration
      const oldComponentDecl = match[0];
      
      // Extract the props section
      const propsRegex = /\(\{[\s\S]*?\}:/;
      const propsMatch = oldComponentDecl.match(propsRegex);
      
      if (propsMatch) {
        const oldProps = propsMatch[0];
        
        // Check if there are malformed type annotations with : any
        if (oldProps.includes(': any')) {
          // Fix the props section - remove all : any annotations
          let newProps = oldProps
            .replace(/children: any/g, 'children')
            .replace(/className: any/g, 'className')
            .replace(/glowColor = "rgba\((\d+): any, (\d+): any, (\d+): any, ([\d\.]+): any\)"/g, 
                     'glowColor = "rgba($1, $2, $3, $4)"');
          
          // Construct the new component declaration
          const newComponentDecl = oldComponentDecl.replace(oldProps, newProps);
          
          // Replace the old declaration with the new one
          content = content.replace(oldComponentDecl, newComponentDecl);
          fixCount++;
        }
      }
    }
  }
  
  // Write fixed content back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('\x1b[32m%s\x1b[0m', `Fixed ${fixCount} component declarations in sacred-geometry.tsx`);
  
  return fixCount;
}

// Run the script
try {
  const fixCount = fixSacredGeometryComponents();
  console.log('\x1b[32m%s\x1b[0m', 'Completed successfully!');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error fixing sacred geometry components:', error);
}