/**
 * Simple Validation API Server
 * 
 * This is a minimal standalone server for API validation testing
 */

import http from 'http';
import { parse } from 'url';

// Configuration
const PORT = process.env.PORT || 4000;

// Basic validation schema
const validateBasic = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || data.name.length < 2) {
    errors.push({
      field: 'name',
      error: 'Name must be at least 2 characters'
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push({
      field: 'email',
      error: 'Invalid email format'
    });
  }
  
  // Age validation
  if (data.age !== undefined && (!Number.isInteger(data.age) || data.age <= 0)) {
    errors.push({
      field: 'age',
      error: 'Number must be greater than 0'
    });
  }
  
  return {
    passed: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data: errors.length === 0 ? data : undefined
  };
};

// Security validation
const validateSecurity = (data) => {
  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /\bOR\b.*?[=;]/i,
    /\bDROP\b.*?\bTABLE\b/i,
    /--/,
    /['"];/,
    /\bUNION\b.*?\bSELECT\b/i,
    /\bALTER\b.*?\bTABLE\b/i
  ];
  
  let securityScore = 0.9; // Default high score
  const warnings = [];
  
  if (data.query) {
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(data.query)) {
        securityScore = 0.2; // Low score for detected SQL injection
        warnings.push('Potential SQL injection detected');
        break;
      }
    }
  }
  
  return {
    passed: securityScore >= 0.5,
    securityScore,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

// Create the server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Parse the URL
  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set common headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Health check endpoint
  if (path === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Basic validation endpoint
  if (path === '/api/validate/basic' && req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const validation = validateBasic(data);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          validation
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON data'
        }));
      }
    });
    return;
  }
  
  // Security validation endpoint
  if (path === '/api/validate/security' && req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const validation = validateSecurity(data);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          validation
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON data'
        }));
      }
    });
    return;
  }
  
  // Handle 404
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found'
  }));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Simple API validation server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Basic validation: http://localhost:${PORT}/api/validate/basic`);
  console.log(`Security validation: http://localhost:${PORT}/api/validate/security`);
});