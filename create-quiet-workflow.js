/**
 * Create Quiet Mode Workflow
 * 
 * This script will create a new workflow configuration that starts the application
 * with reduced logging. This is a one-time setup script.
 */

const fs = require('fs');
const path = require('path');

// Define the workflow file
const workflowFile = '.replit';

// Create new workflow configuration
const quietModeWorkflow = `
[[workflows.workflow]]
name = "Quiet Mode (Reduced Logging)"
author = "agent"
mode = "sequential"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "NODE_ENV=development PORT=5000 NODE_OPTIONS='--max-old-space-size=2048' DEBUG=express:error npm run dev"
`;

try {
  // Check if file exists
  if (!fs.existsSync(workflowFile)) {
    console.error(`Error: ${workflowFile} file not found. You might need to create it manually.`);
    process.exit(1);
  }

  // Read the content of the workflow file
  const content = fs.readFileSync(workflowFile, 'utf8');
  
  // Check if our workflow already exists
  if (content.includes('Quiet Mode (Reduced Logging)')) {
    console.log('Quiet Mode workflow already exists in .replit file.');
  } else {
    // Try to append our workflow to the file
    console.log('This script cannot modify .replit directly but here is what you would add:');
    console.log(quietModeWorkflow);
    console.log('\nPlease use the start-with-reduced-logging.js script instead:');
    console.log('  node start-with-reduced-logging.js');
  }
} catch (error) {
  console.error('Error:', error.message);
}