#!/usr/bin/env node

/**
 * Type Definition Fetcher
 * 
 * This script analyzes the project's dependencies and fetches appropriate type 
 * definitions from DefinitelyTyped if they're missing.
 * 
 * Usage:
 *   node fetch-type-definitions.js [options]
 * 
 * Options:
 *   --install, -i     Automatically install missing type definitions (default: false)
 *   --package, -p     Path to package.json (default: ./package.json)
 *   --force, -f       Force check and install even for packages that might have built-in types
 *   --verbose, -v     Show detailed output
 *   --help, -h        Show help information
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Parse command line arguments
const args = process.argv.slice(2);
let autoInstall = false;
let packagePath = './package.json';
let force = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--install' || arg === '-i') {
    autoInstall = true;
  } else if (arg === '--package' || arg === '-p') {
    packagePath = args[++i];
  } else if (arg === '--force' || arg === '-f') {
    force = true;
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Show help information
function showHelp() {
  console.log(`
Type Definition Fetcher
======================

Analyzes the project's dependencies and fetches appropriate type 
definitions from DefinitelyTyped if they're missing.

Usage:
  node fetch-type-definitions.js [options]

Options:
  --install, -i     Automatically install missing type definitions (default: false)
  --package, -p     Path to package.json (default: ./package.json)
  --force, -f       Force check and install even for packages that might have built-in types
  --verbose, -v     Show detailed output
  --help, -h        Show help information

Examples:
  node fetch-type-definitions.js --install
  node fetch-type-definitions.js --package ./apps/web/package.json
  node fetch-type-definitions.js --force --verbose
  `);
}

// Check if a package has its own type definitions
function hasBuiltInTypes(packageName) {
  try {
    // First check if the package has a types field in its package.json
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', packageName);
    if (!fs.existsSync(nodeModulesPath)) {
      return false;
    }
    
    const packageJsonPath = path.join(nodeModulesPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for typescript definition fields
    if (packageJson.types || packageJson.typings) {
      return true;
    }
    
    // Check for .d.ts files in the package
    const indexDtsPath = path.join(nodeModulesPath, 'index.d.ts');
    const srcDtsPath = path.join(nodeModulesPath, 'src', 'index.d.ts');
    const distDtsPath = path.join(nodeModulesPath, 'dist', 'index.d.ts');
    const libDtsPath = path.join(nodeModulesPath, 'lib', 'index.d.ts');
    
    return fs.existsSync(indexDtsPath) || 
           fs.existsSync(srcDtsPath) || 
           fs.existsSync(distDtsPath) || 
           fs.existsSync(libDtsPath);
  } catch (error) {
    if (verbose) {
      console.error(`Error checking for built-in types for ${packageName}:`, error);
    }
    return false;
  }
}

// Check if types package is already installed
function hasTypesPackage(packageName) {
  try {
    const typesPackageName = `@types/${packageName.replace(/^@.+\//, '')}`;
    const typesPath = path.join(process.cwd(), 'node_modules', typesPackageName);
    return fs.existsSync(typesPath);
  } catch (error) {
    return false;
  }
}

// Check if package exists in DefinitelyTyped
function checkDefinitelyTyped(packageName) {
  try {
    const simplifiedName = packageName.replace(/^@.+\//, '');
    const typesPackageName = `@types/${simplifiedName}`;
    
    // Use npm to check if the package exists
    const result = execSync(`npm view ${typesPackageName} name --json`, { stdio: 'pipe' }).toString();
    return result.includes(typesPackageName);
  } catch (error) {
    return false;
  }
}

// Install types for a package
function installTypesPackage(packageName) {
  const simplifiedName = packageName.replace(/^@.+\//, '');
  const typesPackageName = `@types/${simplifiedName}`;
  
  try {
    console.log(`📦 Installing ${typesPackageName}...`);
    execSync(`npm install --save-dev ${typesPackageName}`, { stdio: 'pipe' });
    console.log(`✅ Successfully installed ${typesPackageName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install ${typesPackageName}:`, error.message);
    return false;
  }
}

// Analyze the package.json and find packages needing type definitions
function analyzePackageDependencies() {
  // Read package.json
  if (!fs.existsSync(packagePath)) {
    console.error(`❌ Could not find package.json at ${packagePath}`);
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Get all dependencies
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };
  
  const packages = Object.keys(dependencies);
  console.log(`Found ${packages.length} dependencies in package.json`);
  
  // Check each package
  const results = {
    hasBuiltInTypes: [],
    hasTypesPackage: [],
    needsTypes: [],
    noTypesAvailable: []
  };
  
  packages.forEach(packageName => {
    // Skip @types packages
    if (packageName.startsWith('@types/')) {
      return;
    }
    
    // Check if it already has types
    if (!force && hasBuiltInTypes(packageName)) {
      results.hasBuiltInTypes.push(packageName);
      if (verbose) {
        console.log(`📑 ${packageName} has built-in TypeScript definitions`);
      }
      return;
    }
    
    // Check if types are already installed
    if (hasTypesPackage(packageName)) {
      results.hasTypesPackage.push(packageName);
      if (verbose) {
        console.log(`📑 ${packageName} already has @types package installed`);
      }
      return;
    }
    
    // Check if types are available in DefinitelyTyped
    if (checkDefinitelyTyped(packageName)) {
      results.needsTypes.push(packageName);
      if (verbose) {
        console.log(`🔍 ${packageName} needs TypeScript definitions from DefinitelyTyped`);
      }
    } else {
      results.noTypesAvailable.push(packageName);
      if (verbose) {
        console.log(`❓ ${packageName} has no TypeScript definitions available in DefinitelyTyped`);
      }
    }
  });
  
  return results;
}

// Main function
async function main() {
  console.log('Type Definition Fetcher');
  console.log('======================\n');
  
  console.log(`Analyzing dependencies in ${packagePath}...`);
  const results = analyzePackageDependencies();
  
  console.log('\n--- Analysis Results ---');
  console.log(`✅ ${results.hasBuiltInTypes.length} packages have built-in TypeScript definitions`);
  console.log(`✅ ${results.hasTypesPackage.length} packages already have @types installed`);
  console.log(`⚠️  ${results.needsTypes.length} packages need TypeScript definitions from DefinitelyTyped`);
  console.log(`❌ ${results.noTypesAvailable.length} packages have no TypeScript definitions available`);
  
  if (results.needsTypes.length > 0) {
    console.log('\n--- Packages Needing Type Definitions ---');
    results.needsTypes.forEach(packageName => {
      console.log(`- ${packageName} (@types/${packageName.replace(/^@.+\//, '')})`);
    });
    
    if (autoInstall) {
      console.log('\n--- Installing Missing Type Definitions ---');
      
      const installResults = {
        success: 0,
        failed: 0
      };
      
      for (const packageName of results.needsTypes) {
        const success = installTypesPackage(packageName);
        if (success) {
          installResults.success++;
        } else {
          installResults.failed++;
        }
      }
      
      console.log('\n--- Installation Summary ---');
      console.log(`✅ Successfully installed ${installResults.success} type definition packages`);
      if (installResults.failed > 0) {
        console.log(`❌ Failed to install ${installResults.failed} type definition packages`);
      }
    } else {
      console.log('\nTo install missing type definitions, run:');
      console.log(`node fetch-type-definitions.js --install\n`);
      
      // Provide individual install commands
      console.log('Or install them individually:');
      results.needsTypes.forEach(packageName => {
        const typesPackage = `@types/${packageName.replace(/^@.+\//, '')}`;
        console.log(`npm install --save-dev ${typesPackage}`);
      });
    }
  }
  
  if (results.noTypesAvailable.length > 0 && verbose) {
    console.log('\n--- Packages Without Available Type Definitions ---');
    results.noTypesAvailable.forEach(packageName => {
      console.log(`- ${packageName}`);
    });
    
    console.log('\nFor packages without available type definitions, consider:');
    console.log('1. Creating your own type definitions in a "types" directory');
    console.log('2. Contributing type definitions to DefinitelyTyped');
    console.log('3. Using "// @ts-ignore" comments where necessary');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});