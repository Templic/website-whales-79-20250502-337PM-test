/**
 * Fix Three.js/Three-Fiber Specific TypeScript Errors
 * 
 * This script resolves TypeScript errors related to Three.js and React Three Fiber
 * imports and type declarations in the frequency-visualizer-3d.tsx component.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Create custom type declarations for Three.js
function createThreeTypeDeclarations() {
  const typesDir = path.join(__dirname, 'client/src/types');
  
  // Ensure the types directory exists
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
    console.log(`${colors.green}Created directory:${colors.reset} ${typesDir}`);
  }
  
  const threeTypesPath = path.join(typesDir, 'three-extended.d.ts');
  
  // Content for three-extended.d.ts
  const threeTypesContent = `/**
 * Extended type declarations for Three.js
 * 
 * This file contains type declarations for Three.js modules that might
 * not be included in the standard @types/three package.
 */

declare module 'three/examples/jsm/geometries/TextGeometry' {
  import { ExtrudeGeometryOptions, Font, Geometry, BufferGeometry } from 'three';

  export interface TextGeometryParameters {
    font: Font;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
  }

  export class TextGeometry extends ExtrudeGeometry {
    constructor(text: string, parameters: TextGeometryParameters);
  }

  export class TextBufferGeometry extends BufferGeometry {
    constructor(text: string, parameters: TextGeometryParameters);
  }
}

declare module 'three/examples/jsm/loaders/FontLoader' {
  import { Loader, LoadingManager } from 'three';

  export interface FontData {
    glyphs: Record<string, any>;
    familyName: string;
    ascender: number;
    descender: number;
    underlinePosition: number;
    underlineThickness: number;
    boundingBox: {
      yMin: number;
      xMin: number;
      yMax: number;
      xMax: number;
    };
    resolution: number;
    original_font_information: Record<string, any>;
  }

  export class Font {
    constructor(data: FontData);
    data: FontData;
    generateShapes(text: string, size: number): any[];
  }

  export class FontLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<Font>;
    parse(json: any): Font;
  }
}

// Add declaration for missing icons
declare module 'lucide-react' {
  export const RefreshCw: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Upload: React.FC<React.SVGProps<SVGSVGElement>>;
}
`;

  // Write the type declarations file
  fs.writeFileSync(threeTypesPath, threeTypesContent);
  console.log(`${colors.green}Created three-extended.d.ts at:${colors.reset} ${threeTypesPath}`);
}

// Fix the FrequencyVisualizer3DProps interface
function fixFrequencyVisualizerProps() {
  const componentPath = path.join(__dirname, 'client/src/components/features/audio/frequency-visualizer-3d.tsx');
  
  // Check if file exists
  if (!fs.existsSync(componentPath)) {
    console.error(`${colors.red}Component not found:${colors.reset} ${componentPath}`);
    return false;
  }
  
  // Create backup
  const backupPath = `${componentPath}.backup-threejs`;
  fs.copyFileSync(componentPath, backupPath);
  console.log(`${colors.green}Created backup at:${colors.reset} ${backupPath}`);
  
  // Read file content
  let content = fs.readFileSync(componentPath, 'utf8');
  
  // Look for the props interface
  const propsInterfaceRegex = /interface FrequencyVisualizer3DProps\s*\{[^}]*\}/;
  const propsMatch = content.match(propsInterfaceRegex);
  
  if (propsMatch) {
    const oldInterface = propsMatch[0];
    
    // Create an updated interface with the required props
    const newInterface = `interface FrequencyVisualizer3DProps {
  audioUrl?: string;
  height?: number;
  width?: number;
  className?: string;
  visualizationType?: 'bars' | 'wave' | 'particles' | 'terrain' | 'sphere';
  colorScheme?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  useMicrophone?: boolean;
  sensitivity?: number;
  customSettings?: Record<string, any>;
}`;
    
    // Replace the old interface with the new one
    content = content.replace(oldInterface, newInterface);
    
    // Add missing imports at the top of the file
    if (!content.includes("import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';")) {
      const importThree = `import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { RefreshCw, Upload, Mic, Settings, ChevronDown } from 'lucide-react';`;
      
      // Add after the existing imports
      content = content.replace(/import.*?from.*?;(\r?\n|\r)+/s, match => match + importThree + '\\n\\n');
    }
    
    // Write updated content
    fs.writeFileSync(componentPath, content);
    console.log(`${colors.green}Updated FrequencyVisualizer3DProps interface in:${colors.reset} ${componentPath}`);
    return true;
  } else {
    console.error(`${colors.red}Couldn't find FrequencyVisualizer3DProps interface in:${colors.reset} ${componentPath}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.blue}Fixing Three.js and Three-Fiber specific TypeScript errors...`);
  
  // Create type declarations
  createThreeTypeDeclarations();
  
  // Fix FrequencyVisualizer3DProps interface
  const fixed = fixFrequencyVisualizerProps();
  
  if (fixed) {
    console.log(`${colors.green}Successfully fixed Three.js related TypeScript errors!`);
  } else {
    console.log(`${colors.yellow}Some errors may still remain in the FrequencyVisualizer3D component.`);
  }
}

// Run the script
try {
  main();
} catch (error) {
  console.error(`${colors.red}Error running script:${colors.reset}`, error);
}