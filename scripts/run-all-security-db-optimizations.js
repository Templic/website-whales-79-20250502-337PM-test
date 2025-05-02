// Main script to run all security database optimizations in the correct order
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * This script orchestrates the execution of all security database optimization scripts
 * in the correct order:
 * 
 * 1. Add indexes to security tables
 * 2. Implement partitioning for security_threats
 * 3. Create materialized views
 * 4. Run maintenance tasks
 */

const scripts = [
  {
    name: 'optimize-security-tables.js',
    description: 'Adding indexes to security tables'
  },
  {
    name: 'implement-partitioning.js',
    description: 'Implementing partitioning for security_threats table'
  },
  {
    name: 'create-security-materialized-views.js',
    description: 'Creating materialized views for security analytics'
  },
  {
    name: 'security-db-maintenance.js',
    description: 'Running maintenance tasks'
  }
];

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file for the run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `security-db-optimization-run-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Run a script and return a promise
function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    log(`\n========== STARTING: ${description} ==========`);
    
    const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      env: process.env
    });
    
    // Capture output
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(`[${scriptName}] ${output}`);
      }
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(`[${scriptName}] ERROR: ${output}`);
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`\n========== COMPLETED: ${description} ==========`);
        resolve();
      } else {
        log(`\n========== FAILED: ${description} with code ${code} ==========`);
        reject(new Error(`Script ${scriptName} failed with exit code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      log(`\n========== ERROR: ${description} ==========`);
      log(err.toString());
      reject(err);
    });
  });
}

// Run all scripts in sequence
async function runAllScripts() {
  log(`Starting security database optimization run at ${new Date().toISOString()}`);
  log(`Results will be logged to ${logFile}`);
  
  try {
    // Run each script in sequence
    for (const script of scripts) {
      await runScript(script.name, script.description);
    }
    
    log('\n========== ALL OPTIMIZATIONS COMPLETED SUCCESSFULLY ==========');
    log(`Total execution time: ${((new Date() - startTime) / 1000).toFixed(2)} seconds`);
    
    return 0;
  } catch (error) {
    log('\n========== OPTIMIZATION RUN FAILED ==========');
    log(`Error: ${error.message}`);
    log(`Total execution time: ${((new Date() - startTime) / 1000).toFixed(2)} seconds`);
    
    return 1;
  } finally {
    // Close log stream
    logStream.end();
  }
}

// Record start time
const startTime = new Date();

// Execute the script
runAllScripts().then((exitCode) => {
  process.exit(exitCode);
}).catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

// Add ESM export
export { };