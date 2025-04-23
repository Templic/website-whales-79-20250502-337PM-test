/**
 * Fix @/lib/memory-leak-detector Imports
 * 
 * This script creates the memory-leak-detector module and fixes imports.
 * 
 * Usage: node fix-memory-leak-detector.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const ROOT_DIR = '.';
const BACKUP_DIR = './ts-fixes-backup';
const CLIENT_SRC_DIR = path.join(ROOT_DIR, 'client', 'src');
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.config', '.cache', '.vscode', BACKUP_DIR];
const DETECTOR_PATH = path.join(CLIENT_SRC_DIR, 'lib', 'memory-leak-detector.ts');
const LOG_FILE = 'memory-leak-detector-fixes.log';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `@/lib/memory-leak-detector Import Fixes - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and log file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTypeScriptFiles(dir) {
  const result = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    // Skip hidden files and directories
    if (file.startsWith('.') || EXCLUDED_DIRS.includes(file)) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      result.push(...findTypeScriptFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      result.push(filePath);
    }
  }
  
  return result;
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
 * Create the memory-leak-detector.ts file
 */
function createMemoryLeakDetector() {
  const libDir = path.join(CLIENT_SRC_DIR, 'lib');
  
  // Create the lib directory if it doesn't exist
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    log(`Created directory: ${libDir}`);
  }
  
  // Create the memory-leak-detector.ts file
  const content = `/**
 * Memory Leak Detector
 * 
 * A utility module for detecting and preventing memory leaks in React components.
 * This helps identify components that are not properly unmounted or cleaned up.
 */

// Map to track mounted components and their instances
const mountedComponents = new Map<string, Set<string>>();

/**
 * Register a component instance for leak detection
 * 
 * @param componentName The name of the component to track
 * @returns A cleanup function to call when the component unmounts
 */
export function registerComponent(componentName: string): () => void {
  // Generate a unique instance ID
  const instanceId = \`\${componentName}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  
  // Get or create the set of instances for this component
  if (!mountedComponents.has(componentName)) {
    mountedComponents.set(componentName, new Set());
  }
  
  // Add this instance
  mountedComponents.get(componentName)?.add(instanceId);
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(\`[MemoryLeakDetector] Registered component: \${componentName} (instance: \${instanceId})\`);
  }
  
  // Return a cleanup function
  return () => {
    // Remove this instance when the component unmounts
    mountedComponents.get(componentName)?.delete(instanceId);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(\`[MemoryLeakDetector] Unregistered component: \${componentName} (instance: \${instanceId})\`);
    }
  };
}

/**
 * Check for memory leaks in components
 * 
 * @param componentName Optional component name to check. If omitted, all components are checked.
 * @returns An object with leak information
 */
export function checkComponentLeaks(componentName?: string): { 
  leaks: { component: string, instanceCount: number }[],
  totalLeaks: number 
} {
  if (componentName) {
    // Check a specific component
    const instances = mountedComponents.get(componentName);
    const instanceCount = instances?.size || 0;
    
    return {
      leaks: instanceCount > 0 ? [{ component: componentName, instanceCount }] : [],
      totalLeaks: instanceCount
    };
  } else {
    // Check all components
    const leaks: { component: string, instanceCount: number }[] = [];
    let totalLeaks = 0;
    
    mountedComponents.forEach((instances, component) => {
      if (instances.size > 0) {
        leaks.push({ component, instanceCount: instances.size });
        totalLeaks += instances.size;
      }
    });
    
    return { leaks, totalLeaks };
  }
}

/**
 * Clear all registered component instances
 * Useful for tests or hot reloading
 */
export function clearAllRegistrations(): void {
  mountedComponents.clear();
  
  if (process.env.NODE_ENV === 'development') {
    console.debug('[MemoryLeakDetector] Cleared all registrations');
  }
}

/**
 * Hook for using the memory leak detector in a component
 * 
 * @param componentName The name of the component
 */
export function useMemoryLeakDetection(componentName: string): void {
  if (typeof window === 'undefined') return;
  
  // This only runs in development
  if (process.env.NODE_ENV !== 'development') return;
  
  // Import React hooks dynamically as they're frontend-only
  try {
    const React = require('react');
    const { useEffect } = React;
    
    useEffect(() => {
      // Register on mount
      const cleanup = registerComponent(componentName);
      // Clean up on unmount
      return cleanup;
    }, []);
  } catch (error) {
    console.warn('[MemoryLeakDetector] Could not import React for hooks:', error);
  }
}
`;
  
  fs.writeFileSync(DETECTOR_PATH, content, 'utf8');
  log(`Created memory leak detector module at: ${DETECTOR_PATH}`);
}

/**
 * Fix imports in files that use the memory leak detector
 */
function fixImports() {
  const tsFiles = findTypeScriptFiles(CLIENT_SRC_DIR);
  log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedCount = 0;
  
  for (const file of tsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file imports from memory-leak-detector
      if (content.includes('@/lib/memory-leak-detector')) {
        // Already has the correct import, skip
        continue;
      }
      
      // Check for usage of memory leak functions
      if (content.includes('registerComponent') || 
          content.includes('checkComponentLeaks') || 
          content.includes('clearAllRegistrations') ||
          content.includes('useMemoryLeakDetection')) {
        
        // Create backup
        backupFile(file);
        
        // Add import
        let newContent = content;
        
        if (content.includes('import React')) {
          // Add after React import
          newContent = newContent.replace(
            /import React.*?;(\r?\n|\r)/,
            (match) => `${match}import { registerComponent, checkComponentLeaks, clearAllRegistrations, useMemoryLeakDetection } from "@/lib/memory-leak-detector";\n`
          );
        } else {
          // Add at the top
          newContent = `import { registerComponent, checkComponentLeaks, clearAllRegistrations, useMemoryLeakDetection } from "@/lib/memory-leak-detector";\n${newContent}`;
        }
        
        fs.writeFileSync(file, newContent, 'utf8');
        log(`Added memory-leak-detector import to: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      log(`Error processing ${file}: ${error.message}`);
    }
  }
  
  log(`\nComplete! Added memory-leak-detector imports to ${fixedCount} files`);
}

/**
 * Main function
 */
function main() {
  log('Starting memory leak detector fixes...');
  
  // Create the memory leak detector module
  createMemoryLeakDetector();
  
  // Fix imports in files that use it
  fixImports();
}

// Run the main function
main();