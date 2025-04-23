/**
 * Fix Frequency Visualizer Component
 * 
 * This script fixes issues in the frequency-visualizer-3d.tsx component,
 * including malformed imports, string-to-number conversions, and missing props interface.
 * 
 * Usage: node fix-frequency-visualizer.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const COMPONENT_PATH = path.join(ROOT_DIR, 'client', 'src', 'components', 'features', 'audio', 'frequency-visualizer-3d.tsx');
const LOG_FILE = 'frequency-visualizer-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Frequency Visualizer Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Create a backup of a file
 */
function backupFile(filePath) {
  const backupPath = path.join(BACKUP_DIR, filePath.replace(/\//g, '_').replace(/\\/g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} to ${backupPath}`);
  }
}

/**
 * Fix the frequency visualizer component
 */
function fixFrequencyVisualizer() {
  if (!fs.existsSync(COMPONENT_PATH)) {
    log(`Error: Could not find component at ${COMPONENT_PATH}`);
    return false;
  }
  
  try {
    // Read the file
    let content = fs.readFileSync(COMPONENT_PATH, 'utf8');
    
    // Create a backup
    backupFile(COMPONENT_PATH);
    
    // Fix 1: Correct malformed imports
    content = content.replace(
      /nimport\s*{.+?}\s*from\s*.+?;/g,
      (match) => match.replace('nimport', 'import')
    );
    
    // Fix 2: Fix Switch import
    content = content.replace(
      /nimport\s*{\s*.*?Switch.*?\s*}\s*from\s*['"]@\/components\/ui\/switch['"];?/g,
      'import { Switch } from "@/components/ui/switch";'
    );
    
    // Fix 3: Add props interface if missing
    if (!content.includes('interface FrequencyVisualizer3DProps')) {
      const propsInterface = `
interface FrequencyVisualizer3DProps {
  audioSrc?: string;
  title?: string;
  frequency?: number;
  chakra?: boolean;
  chakraColor?: string;
}
`;
      // Add interface before the component
      content = content.replace(
        /export\s+function\s+FrequencyVisualizer3D/,
        `${propsInterface}\nexport function FrequencyVisualizer3D`
      );
    }
    
    // Fix 4: Fix string to number conversions in JSX
    content = content.replace(
      /(\w+)=\{["'](\d+(\.\d+)?)["']\}/g,
      '$1={$2}'
    );
    
    // Fix 5: Fix multiple imports of the same component/library
    const imports = {};
    
    // Extract each import statement
    const importLines = [];
    content.replace(/import\s+.*?;/g, match => {
      importLines.push(match);
      return match;
    });
    
    // Remove duplicate imports
    for (const line of importLines) {
      // Check if it's a duplicate import of THREE, TextGeometry, or FontLoader
      if ((line.includes('THREE') && imports.THREE) ||
          (line.includes('TextGeometry') && imports.TextGeometry) ||
          (line.includes('FontLoader') && imports.FontLoader)) {
        content = content.replace(line, '');
      } else {
        // Mark these imports as seen
        if (line.includes('THREE')) imports.THREE = true;
        if (line.includes('TextGeometry')) imports.TextGeometry = true;
        if (line.includes('FontLoader')) imports.FontLoader = true;
      }
    }
    
    // Ensure proper imports for THREE, TextGeometry and FontLoader
    if (!content.includes('import * as THREE from "three";')) {
      content = 'import * as THREE from "three";\n' + content;
    }
    
    // Fix 6: Add missing import for UI components if needed
    const neededImports = [
      { check: 'import { Label', import: 'import { Label } from "@/components/ui/label";' },
      { check: 'import { Select', import: 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";' },
      { check: 'import { Button', import: 'import { Button } from "@/components/ui/button";' },
      { check: 'import { Slider', import: 'import { Slider } from "@/components/ui/slider";' },
      { check: 'import { Tabs', import: 'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";' },
      { check: 'import { cn', import: 'import { cn } from "@/lib/utils";' }
    ];
    
    for (const importItem of neededImports) {
      if (!content.includes(importItem.check)) {
        // Add import after other imports
        content = content.replace(
          /(import.*?;\n)\n/,
          `$1${importItem.import}\n\n`
        );
      }
    }
    
    // Write back to file
    fs.writeFileSync(COMPONENT_PATH, content, 'utf8');
    log(`Fixed FrequencyVisualizer3D component at: ${COMPONENT_PATH}`);
    return true;
  } catch (error) {
    log(`Error fixing FrequencyVisualizer3D: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  log('Starting frequency visualizer fixes...');
  
  if (fixFrequencyVisualizer()) {
    log('Successfully fixed frequency visualizer component');
  } else {
    log('Failed to fix frequency visualizer component');
  }
}

// Run the main function
main();