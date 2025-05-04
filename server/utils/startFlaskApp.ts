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
      
      // Start Flask app as a child process with detailed logging
      log(`Starting Flask app with command: python app.py`, 'info');
      log(`Current working directory: ${process.cwd()}`, 'info');
      
      // Try to use python or python3 with fallback options
      let pythonCmds = ['python3', 'python'];
      
      // First, verify if Python has required packages
      log(`Checking Python environment for Flask dependencies...`, 'info');
      
      try {
        // Verify Python and required dependencies are installed
        const checkCmd = spawn('pip', ['list'], { shell: true });
        let pipOutput = '';
        
        checkCmd.stdout.on('data', (data) => {
          pipOutput += data.toString();
        });
        
        checkCmd.on('close', (code) => {
          const hasFlask = pipOutput.includes('Flask');
          const hasWTF = pipOutput.includes('Flask-WTF');
          const hasTalisman = pipOutput.includes('flask-talisman');
          
          log(`Python dependency check complete:`, 'info');
          log(`- Flask: ${hasFlask ? 'Installed' : 'Missing'}`, hasFlask ? 'info' : 'warning');
          log(`- Flask-WTF: ${hasWTF ? 'Installed' : 'Missing'}`, hasWTF ? 'info' : 'warning');
          log(`- Flask-Talisman: ${hasTalisman ? 'Installed' : 'Missing'}`, hasTalisman ? 'info' : 'warning');
          
          if (!hasFlask || !hasWTF || !hasTalisman) {
            log(`Missing required Flask dependencies. Attempting to install...`, 'warning');
            const installCmd = spawn('pip', ['install', 'flask', 'flask-wtf', 'flask-talisman', 'python-dotenv'], { shell: true });
            
            installCmd.stdout.on('data', (data) => {
              log(`[PIP Install] ${data.toString().trim()}`, 'info');
            });
            
            installCmd.stderr.on('data', (data) => {
              log(`[PIP Install Error] ${data.toString().trim()}`, 'error');
            });
            
            installCmd.on('close', (code) => {
              log(`Flask dependencies installation ${code === 0 ? 'completed successfully' : 'failed'}`, code === 0 ? 'info' : 'error');
            });
          }
        });
      } catch (error) {
        log(`Error checking Python dependencies: ${error}`, 'error');
      }
      
      // Use absolute path for app.py to ensure correct file is found
      const appPath = `${process.cwd()}/app.py`;
      log(`Using app path: ${appPath}`, 'info');
      
      // Check if app.py exists
      try {
        const fs = require('fs');
        if (!fs.existsSync(appPath)) {
          log(`Flask app file not found at path: ${appPath}`, 'error');
          reject(new Error('Flask app file not found'));
          return;
        } else {
          log(`Found Flask app file at: ${appPath}`, 'info');
        }
      } catch (err) {
        log(`Error checking app.py existence: ${err}`, 'error');
      }
      
      // Attempt to start with any available Python command
      let pythonCmdIndex = 0;
      const tryStartFlask = () => {
        if (pythonCmdIndex >= pythonCmds.length) {
          log(`Failed to start Flask app with all Python commands`, 'error');
          reject(new Error('Failed to start Flask app with available Python commands'));
          return;
        }
        
        const pythonCmd = pythonCmds[pythonCmdIndex];
        log(`Attempting to start Flask with interpreter: ${pythonCmd}`, 'info');
        
        // Run a test command first to verify Python and Flask
        const testCmd = spawn(pythonCmd, ['-c', 'import flask; print(f"Flask version: {flask.__version__}")'], { shell: true });
        
        let testOutput = '';
        testCmd.stdout.on('data', (data) => {
          testOutput += data.toString();
        });
        
        testCmd.stderr.on('data', (data) => {
          log(`[Flask Test Error] ${data.toString().trim()}`, 'error');
        });
        
        testCmd.on('close', (code) => {
          if (code === 0) {
            log(`Python Flask verification successful: ${testOutput.trim()}`, 'info');
            
            // Now start the actual Flask app
            flaskProcess = spawn(pythonCmd, [appPath], {
              env: {
                ...process.env,
                PORT: '5001',
                FLASK_APP: 'app.py',
                FLASK_ENV: 'development',
                FLASK_DEBUG: 'true',
                SECRET_KEY: process.env.FLASK_SECRET_KEY || crypto.randomBytes(24).toString('hex')
              },
              stdio: ['ignore', 'pipe', 'pipe'],
              cwd: process.cwd(), // Explicitly set working directory
              shell: true  // Use shell to ensure proper environment
            });
            
            log(`Flask process spawned with PID: ${flaskProcess?.pid || 'unknown'}`, 'info');
            
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
            
            flaskProcess.on('error', (err) => {
              log(`Error in Flask process: ${err.message}`, 'error');
              flaskProcess = null;
              pythonCmdIndex++;
              tryStartFlask();
            });
          } else {
            log(`Python Flask verification failed with code ${code}`, 'error');
            pythonCmdIndex++;
            tryStartFlask();
          }
        });
      };
      
      // Initialize startup verification
      let startupTimeout: NodeJS.Timeout;
      
      // Call tryStartFlask to begin the startup process
      tryStartFlask();
      
      // Set a timeout to resolve anyway after a reasonable time
      // We increase this timeout to give Flask more time to start
      startupTimeout = setTimeout(() => {
        log('Flask app startup timeout - assuming it\'s running or using fallback', 'warn');
        log('The Flask proxy middleware will provide fallback content if needed', 'info');
        resolve();
      }, 20000); // Extended to 20 seconds
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
    log('Stopping Flask app', 'info');
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