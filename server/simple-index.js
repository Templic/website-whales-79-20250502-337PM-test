/**
 * Simple Express server for API validation testing
 * 
 * This is a simplified version of our main server that focuses only on:
 * 1. Serving static files from /public
 * 2. Providing a health check endpoint
 * 3. Providing basic API validation examples
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString() 
  });
});

// Basic validation example endpoint
app.get('/api/basic-validation', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Basic validation endpoint is working',
    validationScore: 0.9
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the test page`);
});

export default app;