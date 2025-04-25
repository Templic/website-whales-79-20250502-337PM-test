/**
 * TypeScript Error Management API Diagnostic Tool
 * 
 * A simple tool to check if the TypeScript error management API endpoints
 * are accessible and properly registered.
 */

import fs from 'fs';
import path from 'path';

console.log('=== TypeScript Error Management API Diagnostic ===\n');

// Check if the typescript-error-routes.ts file exists
const routesFile = path.join(process.cwd(), 'routes', 'typescript-error-routes.ts');
console.log(`Checking for routes file: ${routesFile}`);
console.log(`File exists: ${fs.existsSync(routesFile) ? 'Yes ✓' : 'No ✗'}`);

// Check if ts-error-finder.ts exists and is readable
const errorFinderFile = path.join(process.cwd(), 'utils', 'ts-error-finder.ts');
console.log(`\nChecking for ts-error-finder.ts: ${errorFinderFile}`);
console.log(`File exists: ${fs.existsSync(errorFinderFile) ? 'Yes ✓' : 'No ✗'}`);

if (fs.existsSync(errorFinderFile)) {
  try {
    const content = fs.readFileSync(errorFinderFile, 'utf8');
    console.log(`File is readable: Yes ✓`);
    console.log(`File size: ${content.length} bytes`);
    
    // Check for key function exports
    console.log('\nChecking for key function exports:');
    const hasErrorFinder = content.includes('export async function findTypeScriptErrors');
    console.log(`- findTypeScriptErrors: ${hasErrorFinder ? 'Present ✓' : 'Missing ✗'}`);
    
    const hasFileError = content.includes('export async function findErrorsInFile');
    console.log(`- findErrorsInFile: ${hasFileError ? 'Present ✓' : 'Missing ✗'}`);
    
    const hasProjectStatus = content.includes('export async function getProjectCompilationStatus');
    console.log(`- getProjectCompilationStatus: ${hasProjectStatus ? 'Present ✓' : 'Missing ✗'}`);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
}

// Check if the TypeScript error storage file exists and is readable
const errorStorageFile = path.join(process.cwd(), 'tsErrorStorage.ts');
console.log(`\nChecking for tsErrorStorage.ts: ${errorStorageFile}`);
console.log(`File exists: ${fs.existsSync(errorStorageFile) ? 'Yes ✓' : 'No ✗'}`);

if (fs.existsSync(errorStorageFile)) {
  try {
    const content = fs.readFileSync(errorStorageFile, 'utf8');
    console.log(`File is readable: Yes ✓`);
    console.log(`File size: ${content.length} bytes`);
    
    // Check for key function exports
    console.log('\nChecking for key function exports:');
    const hasGetErrors = content.includes('export async function getTypescriptErrors');
    console.log(`- getTypescriptErrors: ${hasGetErrors ? 'Present ✓' : 'Missing ✗'}`);
    
    const hasGetError = content.includes('export async function getTypescriptError');
    console.log(`- getTypescriptError: ${hasGetError ? 'Present ✓' : 'Missing ✗'}`);
    
    const hasUpdateError = content.includes('export async function updateTypescriptError');
    console.log(`- updateTypescriptError: ${hasUpdateError ? 'Present ✓' : 'Missing ✗'}`);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
}

// Examine route registration in server/routes.ts
const mainRoutesFile = path.join(process.cwd(), 'routes.ts');
console.log(`\nChecking for route registration in main routes file: ${mainRoutesFile}`);
console.log(`File exists: ${fs.existsSync(mainRoutesFile) ? 'Yes ✓' : 'No ✗'}`);

if (fs.existsSync(mainRoutesFile)) {
  try {
    const content = fs.readFileSync(mainRoutesFile, 'utf8');
    const importLine = content.includes('import typescriptErrorRoutes from');
    console.log(`Routes import: ${importLine ? 'Present ✓' : 'Missing ✗'}`);
    
    const adminRouteRegistration = content.includes("app.use('/api/typescript/admin', isAuthenticated, typescriptErrorRoutes)");
    console.log(`Admin route registration: ${adminRouteRegistration ? 'Present ✓' : 'Missing ✗'}`);
    
    const publicRouteRegistration = content.includes("app.use('/api/typescript/public', typescriptErrorRoutes)");
    console.log(`Public route registration: ${publicRouteRegistration ? 'Present ✓' : 'Missing ✗'}`);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
}

console.log('\n=== Diagnostic Complete ===');
console.log('Next step: Check for implementation issues in the utility modules');