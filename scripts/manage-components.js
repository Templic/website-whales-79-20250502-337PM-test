/**
 * Component Management Tools
 * 
 * This script serves as an entry point for the various component management tools.
 * It provides options to run the different component analysis, merging, and consolidation scripts.
 */

import { execSync } from 'child_process';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the available tools
const tools = [
  {
    name: 'Enhanced Component Merge',
    description: 'Analyze components and place them in appropriate feature directories',
    path: 'scripts/component-merge-tools/enhanced-merge-components.js'
  },
  {
    name: 'Component Similarity Analysis',
    description: 'Analyze components to identify similar or duplicate components',
    path: 'scripts/component-merge-tools/analyze-similar-components.js'
  },
  {
    name: 'Component Consolidation',
    description: 'Consolidate similar components based on analysis',
    path: 'scripts/component-merge-tools/consolidate-components.js'
  },
  {
    name: 'Update Import Paths',
    description: 'Update import paths for moved or renamed components',
    path: 'scripts/component-merge-tools/enhanced-update-imports.js'
  },
  {
    name: 'Run All Processes',
    description: 'Run the entire component management workflow with guided prompts',
    path: 'scripts/component-merge-tools/run-component-merge.js'
  },
  {
    name: 'Legacy: Merge Imported Components',
    description: 'Run the original component merge script',
    path: 'scripts/merge-imported-components.js'
  },
  {
    name: 'Legacy: Finalize Imported Merge',
    description: 'Run the original finalize import script',
    path: 'scripts/finalize-imported-merge.js'
  }
];

/**
 * Display the main menu
 */
function displayMenu() {
  console.log('\n=== Component Management Tools ===\n');
  
  tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}`);
    console.log(`   ${tool.description}`);
  });
  
  console.log('\n0. Exit\n');
}

/**
 * Run a tool
 */
function runTool(toolIndex) {
  if (toolIndex < 0 || toolIndex >= tools.length) {
    console.log('Invalid tool selection');
    return;
  }
  
  const tool = tools[toolIndex];
  console.log(`\nRunning: ${tool.name}`);
  console.log(`\n=== ${tool.description} ===\n`);
  
  try {
    execSync(`node ${tool.path}`, { stdio: 'inherit' });
    console.log(`\n✅ Successfully completed: ${tool.name}`);
  } catch (error) {
    console.error(`\n❌ Error executing ${tool.path}:`, error.message);
  }
}

/**
 * Display documentation
 */
function displayDocumentation() {
  console.log('\n=== Component Management Documentation ===\n');
  console.log('For detailed documentation, please see:');
  console.log('scripts/component-merge-tools/README.md\n');
  
  console.log('Quick Overview:');
  console.log('1. Use "Enhanced Component Merge" to organize components by feature');
  console.log('2. Use "Component Similarity Analysis" to identify duplicate components');
  console.log('3. Use "Component Consolidation" to merge similar components');
  console.log('4. Use "Update Import Paths" to fix import statements after reorganization');
  console.log('5. Or use "Run All Processes" for a guided workflow through all steps\n');
  
  console.log('Best Practices:');
  console.log('- Always create backups before running these tools');
  console.log('- Run in test mode first to see what changes would be made');
  console.log('- Review the reports before consolidating components');
  console.log('- Test your application after each step');
}

/**
 * Main function
 */
async function main() {
  console.clear();
  console.log('Welcome to the Component Management Tools\n');
  console.log('These tools help you analyze, organize, and consolidate React components.\n');
  
  let running = true;
  
  while (running) {
    displayMenu();
    
    const answer = await new Promise(resolve => {
      rl.question('Select an option: ', resolve);
    });
    
    const selection = parseInt(answer, 10);
    
    if (isNaN(selection)) {
      console.log('Please enter a number');
      continue;
    }
    
    if (selection === 0) {
      running = false;
      console.log('\nExiting Component Management Tools');
    } else if (selection === 99) {
      displayDocumentation();
    } else if (selection > 0 && selection <= tools.length) {
      runTool(selection - 1);
      
      await new Promise(resolve => {
        rl.question('\nPress Enter to return to menu...', resolve);
      });
    } else {
      console.log('Invalid selection');
    }
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
});