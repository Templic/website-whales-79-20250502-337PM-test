/**
 * Flask App Starter
 * 
 * Utility to start the Flask app as a child process
 */

import { spawn, ChildProcess } from 'child_process';
import { log } from './logger';

let flaskProcess: ChildProcess | null = null;

/**
 * Start the Flask app as a child process
 * 
 * @returns Promise that resolves when Flask app is ready
 */
export function startFlaskApp(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      log('Starting Flask app on port 5001...', 'server');
      
      // Kill existing process if it exists
      if (flaskProcess) {
        log('Killing existing Flask process', 'server');
        flaskProcess.kill();
      }
      
      // Start Flask app as a child process
      flaskProcess = spawn('python', ['app.py'], {
        env: {
          ...process.env,
          PORT: '5001',
          FLASK_APP: 'app.py',
          FLASK_DEBUG: 'true'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Log output
      flaskProcess.stdout?.on('data', (data) => {
        log(`[Flask] ${data.toString().trim()}`, 'info');
      });
      
      flaskProcess.stderr?.on('data', (data) => {
        log(`[Flask Error] ${data.toString().trim()}`, 'error');
      });
      
      // Handle process exit
      flaskProcess.on('exit', (code) => {
        if (code !== 0) {
          log(`Flask app exited with code ${code}`, 'error');
        }
      });
      
      // Wait for the Flask app to start
      let startupTimeout: NodeJS.Timeout;
      
      flaskProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        
        // Check if Flask has started
        if (output.includes('Running on') || output.includes('running on') || output.includes('started successfully')) {
          clearTimeout(startupTimeout);
          log('Flask app started successfully on port 5001', 'server');
          resolve();
        }
      });
      
      // Set a timeout to resolve anyway after 5 seconds
      startupTimeout = setTimeout(() => {
        log('Flask app startup timeout - assuming it\'s running', 'warning');
        resolve();
      }, 5000);
    } catch (error) {
      log(`Error starting Flask app: ${error}`, 'error');
      reject(error);
    }
  });
}

/**
 * Stop the Flask app
 */
export function stopFlaskApp() {
  if (flaskProcess) {
    log('Stopping Flask app', 'server');
    flaskProcess.kill();
    flaskProcess = null;
  }
}

// Handle process exit to clean up Flask process
process.on('exit', stopFlaskApp);
process.on('SIGINT', () => {
  stopFlaskApp();
  process.exit();
});