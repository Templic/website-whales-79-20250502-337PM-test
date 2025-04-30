#!/usr/bin/env node

/**
 * Theme Database Initialization Script
 * 
 * This script initializes the theme database by running migrations and 
 * setting up default data for the Harmonize Theme System.
 * 
 * Usage: node scripts/initialize-theme-db.js
 */

// Suppress ts-node warning about using JavaScript files
process.env.TS_NODE_TRANSPILE_ONLY = true;

// Import migration script
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Harmonize Theme System - Database Initialization');
console.log('================================================');

// Path to migration script
const migrationScriptPath = path.join(__dirname, 'migrate-theme-database.ts');

// Check if migration script exists
if (!fs.existsSync(migrationScriptPath)) {
  console.error(`Error: Migration script not found at ${migrationScriptPath}`);
  process.exit(1);
}

// Function to run migration script
function runMigration() {
  return new Promise((resolve, reject) => {
    console.log('Running theme database migrations...');
    
    // Execute the TypeScript migration script using ts-node
    exec(`npx ts-node ${migrationScriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Migration error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Migration stderr: ${stderr}`);
      }
      
      console.log(stdout);
      resolve();
    });
  });
}

// Add a script to package.json if needed
function addMigrationScript() {
  return new Promise((resolve, reject) => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      console.warn('package.json not found. Skipping script addition.');
      resolve();
      return;
    }
    
    try {
      // Read package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check if scripts section exists
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      // Add migration script if it doesn't exist
      if (!packageJson.scripts['db:migrate:theme']) {
        packageJson.scripts['db:migrate:theme'] = 'ts-node scripts/migrate-theme-database.ts';
        
        // Write updated package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Added db:migrate:theme script to package.json');
      }
      
      resolve();
    } catch (error) {
      console.error(`Error updating package.json: ${error.message}`);
      reject(error);
    }
  });
}

// Main function
async function main() {
  try {
    // Add migration script to package.json
    await addMigrationScript();
    
    // Run migrations
    await runMigration();
    
    console.log('\nTheme database initialization completed successfully.');
    console.log('You can now use the theme system with database persistence.');
    console.log('\nTo run migrations manually in the future, use:');
    console.log('npm run db:migrate:theme');
  } catch (error) {
    console.error('Theme database initialization failed:', error);
    process.exit(1);
  }
}

// Execute main function
main();