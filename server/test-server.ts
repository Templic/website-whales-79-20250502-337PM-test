/**
 * Test API Server
 * 
 * This is a completely separate Express server for test API endpoints
 * that does NOT use CSRF protection. This is for testing purposes only!
 * 
 * WARNING: This should never be used in production environments.
 */

import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import testApiRoutes from './routes/test-api';

// Create a separate Express app for test endpoints
const testApp = express();

// Basic middleware
testApp.use(bodyParser.json());
testApp.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for easier testing
testApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Add warning header to all responses
testApp.use((req, res, next) => {
  res.header('X-Warning', 'This is a test-only endpoint with no CSRF protection. DO NOT USE IN PRODUCTION.');
  next();
});

// Mount test routes
testApp.use('/api/test-only', testApiRoutes);

// Root route with warning
testApp.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>TEST API SERVER - SECURITY WARNING</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .warning { background-color: #ffdddd; border-left: 6px solid #f44336; padding: 10px; margin-bottom: 20px; }
          h1 { color: #f44336; }
          code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="warning">
          <h1>⚠️ SECURITY WARNING ⚠️</h1>
          <p>This is a test-only API server with <strong>NO CSRF PROTECTION</strong>.</p>
          <p>These endpoints are for testing purposes only and should <strong>NEVER</strong> be used in production.</p>
        </div>
        
        <h2>Available Test Endpoints:</h2>
        <ul>
          <li><code>POST /api/test-only/quantum/generate-keys</code> - Generate quantum-resistant key pair</li>
          <li><code>POST /api/test-only/quantum/encrypt</code> - Encrypt data with quantum-resistant algorithm</li>
          <li><code>POST /api/test-only/quantum/decrypt</code> - Decrypt data with quantum-resistant algorithm</li>
        </ul>
        
        <h2>Testing Example:</h2>
        <pre>
curl -X POST http://localhost:5001/api/test-only/quantum/generate-keys \\
  -H "Content-Type: application/json" \\
  -d '{"algorithm": "kyber", "strength": "high"}'
        </pre>
      </body>
    </html>
  `);
});

// Error handler
testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Test API Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong in the test API server',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Create HTTP server
const testServer = createServer(testApp);

// Start server on a different port
const TEST_PORT = process.env.TEST_PORT || 5001;

// Only start if this file is executed directly (not imported)
if (require.main === module) {
  testServer.listen(TEST_PORT, () => {
    console.log(`
⚠️  TEST API SERVER RUNNING ON PORT ${TEST_PORT} ⚠️
WARNING: This server has NO CSRF protection and is for TESTING ONLY!
Available at: http://localhost:${TEST_PORT}/api/test-only/*
    `);
  });
}

// Export for programmatic usage
export { testApp, testServer };