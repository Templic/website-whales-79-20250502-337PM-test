/**
 * Fix Cosmic Component Imports
 * 
 * This script updates import paths for utils in cosmic components
 * that are incorrectly pointing to the old path structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing cosmic components
const cosmicDir = path.join('client', 'src', 'components', 'features', 'cosmic');

// Get all .tsx files in the cosmic directory
const files = fs.readdirSync(cosmicDir)
  .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

console.log(`Processing ${files.length} files in the cosmic directory...`);

let updatedCount = 0;

// Process each file
files.forEach(file => {
  const filePath = path.join(cosmicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already fixed (like the one we manually fixed)
  if (content.includes('import { cn } from "../../../lib/utils"')) {
    console.log(`  Skipping ${file} (already fixed)`);
    return;
  }

  // Handle single quote and double quote variations
  if (content.includes("import { cn } from '../../lib/utils'")) {
    content = content.replace("import { cn } from '../../lib/utils'", "import { cn } from '../../../lib/utils'");
    fs.writeFileSync(filePath, content);
    updatedCount++;
    console.log(`  Updated imports in: ${filePath}`);
  } else if (content.includes('import { cn } from "../../lib/utils"')) {
    content = content.replace('import { cn } from "../../lib/utils"', 'import { cn } from "../../../lib/utils"');
    fs.writeFileSync(filePath, content);
    updatedCount++;
    console.log(`  Updated imports in: ${filePath}`);
  }
});

console.log(`Finished updating import paths in ${updatedCount} files`);