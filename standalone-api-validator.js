/**
 * Standalone API Validation Server
 * 
 * This is a minimal Express server that serves the API validation test page
 * and provides simplified validation endpoints for testing without any security
 * or CSRF issues.
 * 
 * Usage: node standalone-api-validator.js [port]
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.argv[2] || 3000;

// Basic middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Serve the API validation test page
app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'api-validation-test.html'), 'utf8', (err, content) => {
    if (err) {
      console.error('Error reading API validation test page:', err);
      return res.status(500).send('Error loading API validation test page');
    }
    res.send(content);
  });
});

// API Validation Test Endpoints
app.post('/api/validation-test/schema', (req, res) => {
  try {
    const { schemaType, data } = req.body;
    
    // Simulate schema validation
    let isValid = true;
    let errors = [];
    
    // Simple validation logic based on schema type
    switch (schemaType) {
      case 'user':
        if (!data.name) errors.push('Name is required');
        if (!data.email) errors.push('Email is required');
        if (data.email && !data.email.includes('@')) errors.push('Invalid email format');
        break;
      
      case 'product':
        if (!data.name) errors.push('Product name is required');
        if (data.price === undefined) errors.push('Price is required');
        if (typeof data.price !== 'number') errors.push('Price must be a number');
        break;
      
      case 'order':
        if (!data.orderId) errors.push('Order ID is required');
        if (!data.userId) errors.push('User ID is required');
        if (!Array.isArray(data.products)) errors.push('Products must be an array');
        break;
      
      case 'comment':
        if (!data.text) errors.push('Comment text is required');
        if (!data.userId) errors.push('User ID is required');
        break;
      
      default:
        // Custom schema - no validation
        break;
    }
    
    isValid = errors.length === 0;
    
    res.json({
      valid: isValid,
      errors: errors,
      schemaType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Schema validation error:', error);
    res.status(400).json({
      valid: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/validation-test/security', (req, res) => {
  try {
    const { input, context } = req.body;
    
    // Simple security validation based on context
    let securityScore = 0.9; // Default to high security score
    let issues = [];
    
    // Check for common security issues
    if (context === 'sql') {
      if (input.toLowerCase().includes('drop table')) {
        securityScore = 0.1;
        issues.push({
          type: 'SQL Injection',
          description: 'Possible DROP TABLE statement detected'
        });
      } else if (input.includes(';') && (input.includes('--') || input.includes('#'))) {
        securityScore = 0.2;
        issues.push({
          type: 'SQL Injection',
          description: 'Multiple statements with comment syntax detected'
        });
      } else if (input.includes('1=1') || input.includes('1 = 1')) {
        securityScore = 0.3;
        issues.push({
          type: 'SQL Injection',
          description: 'Possible tautology detected'
        });
      }
    } else if (context === 'html') {
      if (input.toLowerCase().includes('<script>')) {
        securityScore = 0.2;
        issues.push({
          type: 'XSS',
          description: 'Script tag detected in input'
        });
      } else if (input.toLowerCase().includes('javascript:')) {
        securityScore = 0.3;
        issues.push({
          type: 'XSS',
          description: 'JavaScript URI scheme detected'
        });
      } else if (input.toLowerCase().includes('onerror=') || input.toLowerCase().includes('onclick=')) {
        securityScore = 0.4;
        issues.push({
          type: 'XSS',
          description: 'Event handler detected in input'
        });
      }
    } else if (context === 'javascript') {
      if (input.includes('eval(')) {
        securityScore = 0.2;
        issues.push({
          type: 'Unsafe JavaScript',
          description: 'Eval function detected'
        });
      } else if (input.includes('document.cookie')) {
        securityScore = 0.5;
        issues.push({
          type: 'Cookie Access',
          description: 'Cookie access detected'
        });
      }
    } else if (context === 'general') {
      if (input.includes('../')) {
        securityScore = 0.4;
        issues.push({
          type: 'Path Traversal',
          description: 'Directory traversal pattern detected'
        });
      } else if (input.includes('/etc/passwd')) {
        securityScore = 0.2;
        issues.push({
          type: 'Path Disclosure',
          description: 'Attempted access to system files'
        });
      }
    }
    
    // Generate recommendations based on issues
    let recommendations = [];
    if (issues.length > 0) {
      recommendations.push('Sanitize and validate all user input');
      recommendations.push('Use prepared statements for SQL queries');
      recommendations.push('Apply context-appropriate encoding');
      
      if (context === 'sql') {
        recommendations.push('Implement parameterized queries');
      } else if (context === 'html') {
        recommendations.push('Use a library like DOMPurify for HTML sanitization');
      }
    }
    
    res.json({
      input,
      context,
      score: securityScore,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Security validation error:', error);
    res.status(400).json({
      score: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoints
app.get('/api/validation-test/status', (req, res) => {
  res.json({
    status: 'active',
    mode: 'standalone',
    csrfProtection: false,
    validationEnabled: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/validation-test/rules', (req, res) => {
  res.json({
    rules: [
      { id: 'user:create', name: 'User Create Validation', endpoint: '/api/users' },
      { id: 'user:update', name: 'User Update Validation', endpoint: '/api/users/:id' },
      { id: 'product:create', name: 'Product Create Validation', endpoint: '/api/products' },
      { id: 'product:update', name: 'Product Update Validation', endpoint: '/api/products/:id' },
      { id: 'order:create', name: 'Order Create Validation', endpoint: '/api/orders' },
      { id: 'comment:create', name: 'Comment Create Validation', endpoint: '/api/comments' }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/validation-test/mappings', (req, res) => {
  res.json({
    mappings: [
      { endpoint: '/api/users', method: 'POST', rules: ['user:create'] },
      { endpoint: '/api/users/:id', method: 'PUT', rules: ['user:update'] },
      { endpoint: '/api/products', method: 'POST', rules: ['product:create'] },
      { endpoint: '/api/products/:id', method: 'PUT', rules: ['product:update'] },
      { endpoint: '/api/orders', method: 'POST', rules: ['order:create'] },
      { endpoint: '/api/comments', method: 'POST', rules: ['comment:create'] }
    ],
    timestamp: new Date().toISOString()
  });
});

// Security settings endpoints
app.get('/api/no-security-test/status', (req, res) => {
  res.json({
    noSecurityEnabled: false,
    csrfProtection: false,
    validationEnabled: true,
    bypassModes: ['SCHEMA_ONLY', 'SECURITY_ONLY', 'COMPLETELY_BYPASSED'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/validation-bypass-test/status', (req, res) => {
  res.json({
    bypassEnabled: true,
    bypassMode: 'STANDALONE_MODE',
    csrfProtection: false,
    securityEnabled: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/validation-bypass-test/rules', (req, res) => {
  res.json({
    bypassRules: [
      { id: 'bypass:schema', name: 'Schema Validation Bypass', endpoint: '/api/bypass/schema' },
      { id: 'bypass:security', name: 'Security Validation Bypass', endpoint: '/api/bypass/security' },
      { id: 'bypass:all', name: 'Complete Validation Bypass', endpoint: '/api/bypass/all' }
    ],
    timestamp: new Date().toISOString()
  });
});

// CSRF token endpoint (simplified for standalone mode)
app.get('/api/csrf-token', (req, res) => {
  res.json({
    csrfToken: 'standalone-mode-no-csrf-required',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Standalone API Validation Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to access the API validation test interface`);
});