/**
 * Link Checker Server
 * 
 * This is a standalone server that provides API endpoints for the link checker UI
 * and serves the UI and related files.
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Store scan state
let scanState = {
  status: 'idle', // idle, running, completed, failed
  progress: {
    checked: 0,
    total: 0
  },
  startTime: null,
  endTime: null,
  targetUrl: null,
  config: null,
  error: null,
  childProcess: null
};

// Serve the link checker UI
app.get('/', async (req, res) => {
  try {
    const html = await fs.readFile(path.join(__dirname, 'link-checker-ui.html'), 'utf8');
    res.send(html);
  } catch (error) {
    console.error('Error reading UI file:', error);
    res.status(500).send('Error loading UI');
  }
});

// Start a new scan
app.post('/api/link-checker/start', async (req, res) => {
  try {
    // Check if a scan is already running
    if (scanState.status === 'running') {
      return res.status(409).json({
        error: 'A scan is already in progress'
      });
    }
    
    // Reset scan state
    scanState = {
      status: 'running',
      progress: {
        checked: 0,
        total: 1 // Start with 1 to show some initial progress
      },
      startTime: new Date().toISOString(),
      endTime: null,
      targetUrl: req.body.url,
      config: req.body,
      error: null,
      childProcess: null
    };
    
    console.log(`Starting scan of ${scanState.targetUrl}`);
    
    // Start the scan in a child process
    const args = [
      'check-links.js',
      scanState.targetUrl,
      '--max-depth', req.body.maxDepth || 2,
      '--max-requests', req.body.maxRequests || 100
    ];
    
    if (req.body.checkExternal) args.push('--check-external');
    if (!req.body.checkAnchors) args.push('--skip-anchors');
    if (!req.body.includeButtons) args.push('--skip-buttons');
    if (!req.body.checkAPIEndpoints) args.push('--skip-apis');
    
    const child = spawn('node', args);
    scanState.childProcess = child;
    
    // Handle output
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Scan output: ${output}`);
      
      // Update progress
      const checkedMatch = output.match(/Checked (\d+) of (\d+)/);
      if (checkedMatch) {
        scanState.progress.checked = parseInt(checkedMatch[1]);
        scanState.progress.total = parseInt(checkedMatch[2]);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Scan error: ${data}`);
      scanState.error = data.toString();
    });
    
    child.on('close', (code) => {
      console.log(`Scan process exited with code ${code}`);
      scanState.status = code === 0 ? 'completed' : 'failed';
      scanState.endTime = new Date().toISOString();
      scanState.childProcess = null;
    });
    
    res.json({
      status: 'started',
      targetUrl: scanState.targetUrl
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    scanState.status = 'failed';
    scanState.error = error.message;
    res.status(500).json({
      error: error.message
    });
  }
});

// Stop a running scan
app.post('/api/link-checker/stop', (req, res) => {
  try {
    if (scanState.status !== 'running' || !scanState.childProcess) {
      return res.status(400).json({
        error: 'No scan is currently running'
      });
    }
    
    // Kill the child process
    scanState.childProcess.kill();
    scanState.status = 'failed';
    scanState.error = 'Scan stopped by user';
    scanState.endTime = new Date().toISOString();
    scanState.childProcess = null;
    
    res.json({
      status: 'stopped'
    });
  } catch (error) {
    console.error('Error stopping scan:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get scan status
app.get('/api/link-checker/status', (req, res) => {
  res.json({
    status: scanState.status,
    targetUrl: scanState.targetUrl,
    startTime: scanState.startTime,
    endTime: scanState.endTime,
    error: scanState.error
  });
});

// Get scan progress
app.get('/api/link-checker/progress', (req, res) => {
  res.json(scanState.progress);
});

// Get scan results
app.get('/api/link-checker/results', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'deadlinks-report.json');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return res.status(404).json({
        error: 'No results available'
      });
    }
    
    const data = await fs.readFile(filePath, 'utf8');
    const results = JSON.parse(data);
    
    res.json(results);
  } catch (error) {
    console.error('Error reading results:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Simulate link checker API for testing
app.post('/api/link-checker/test-api', (req, res) => {
  // Simulate a successful API response
  res.json({
    status: 'success',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Link Checker Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to access the link checker UI`);
});