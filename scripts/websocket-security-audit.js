#!/usr/bin/env node

/**
 * WebSocket Security Audit Script
 * 
 * This script performs a comprehensive security audit of WebSocket implementations.
 * It checks for common security vulnerabilities and best practices.
 * 
 * Usage:
 * node scripts/websocket-security-audit.js [--url=wss://example.com/ws] [--token=auth_token] [--verbose] [--full]
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const readline = require('readline');
const colors = require('colors');

// Default configuration
const DEFAULT_CONFIG = {
  url: 'ws://localhost:3000/ws',
  token: 'test_token',
  timeout: 5000,
  reportPath: './reports/websocket-security',
  tests: {
    configuration: true,
    authentication: true,
    csrf: true,
    input_validation: true,
    rate_limiting: true,
    origin_validation: true,
    transport_security: true,
    session_management: true,
    error_handling: true,
    monitoring: true
  },
  verbose: false,
  full: false
};

// Severity levels for findings
const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

// Parse command line arguments
const args = process.argv.slice(2);
let config = { ...DEFAULT_CONFIG };

args.forEach(arg => {
  if (arg.startsWith('--url=')) {
    config.url = arg.substring(6);
  } else if (arg.startsWith('--token=')) {
    config.token = arg.substring(8);
  } else if (arg === '--verbose' || arg === '-v') {
    config.verbose = true;
  } else if (arg === '--full' || arg === '-f') {
    config.full = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
});

// Set up colors for output
colors.setTheme({
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  critical: 'red',
  highlight: 'cyan',
  muted: 'gray'
});

// Global variables
const findings = [];
const securityScore = {
  total: 0,
  passed: 0,
  failed: 0,
  criticalIssues: 0,
  highIssues: 0,
  mediumIssues: 0,
  lowIssues: 0
};

// Help menu
function showHelp() {
  console.log(colors.bold('\nWebSocket Security Audit Tool\n'));
  console.log('This script performs a comprehensive security audit of WebSocket implementations.');
  console.log('\nUsage:');
  console.log('  node scripts/websocket-security-audit.js [options]\n');
  console.log('Options:');
  console.log('  --url=URL           WebSocket server URL (default: ws://localhost:3000/ws)');
  console.log('  --token=TOKEN       Authentication token (default: test_token)');
  console.log('  --verbose, -v       Enable verbose output');
  console.log('  --full, -f          Perform full audit including performance and stress tests');
  console.log('  --help, -h          Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/websocket-security-audit.js --url=wss://example.com/ws --token=my_auth_token');
  console.log('  node scripts/websocket-security-audit.js --verbose --full\n');
}

// Utility for logging
function log(message, type = 'info', indent = 0) {
  const prefix = '  '.repeat(indent);
  
  switch (type) {
    case 'success':
      console.log(`${prefix}${colors.success('✓')} ${message}`);
      break;
    case 'error':
      console.log(`${prefix}${colors.error('✗')} ${message}`);
      break;
    case 'warning':
      console.log(`${prefix}${colors.warning('!')} ${message}`);
      break;
    case 'critical':
      console.log(`${prefix}${colors.critical('!!!')} ${colors.critical(message)}`);
      break;
    case 'info':
      console.log(`${prefix}${colors.info('i')} ${message}`);
      break;
    case 'muted':
      if (config.verbose) {
        console.log(`${prefix}${colors.muted('>')} ${colors.muted(message)}`);
      }
      break;
    default:
      console.log(`${prefix}${message}`);
  }
}

// Add a finding to the report
function addFinding(id, name, description, severity, status, details = null, recommendation = null) {
  findings.push({
    id,
    name,
    description,
    severity,
    status,
    details,
    recommendation,
    timestamp: new Date().toISOString()
  });
  
  securityScore.total++;
  
  if (status === 'PASS') {
    securityScore.passed++;
  } else {
    securityScore.failed++;
    
    switch (severity) {
      case SEVERITY.CRITICAL:
        securityScore.criticalIssues++;
        break;
      case SEVERITY.HIGH:
        securityScore.highIssues++;
        break;
      case SEVERITY.MEDIUM:
        securityScore.mediumIssues++;
        break;
      case SEVERITY.LOW:
        securityScore.lowIssues++;
        break;
    }
  }
  
  // Log the finding
  if (status === 'PASS') {
    log(`${name}: Passed`, 'success');
  } else {
    const logType = severity === SEVERITY.CRITICAL ? 'critical' : 
                    severity === SEVERITY.HIGH ? 'error' : 
                    severity === SEVERITY.MEDIUM ? 'warning' : 'info';
    
    log(`${name}: Failed (${severity})`, logType);
    
    if (details && config.verbose) {
      log(`Details: ${details}`, 'muted', 1);
    }
    
    if (recommendation) {
      log(`Recommendation: ${recommendation}`, 'muted', 1);
    }
  }
}

// Prompt for user input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Create a WebSocket connection
function createConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(config.url);
    let timeoutId;
    
    // Set connection timeout
    timeoutId = setTimeout(() => {
      reject(new Error('Connection timeout'));
      ws.terminate();
    }, config.timeout);
    
    ws.on('open', () => {
      clearTimeout(timeoutId);
      resolve(ws);
    });
    
    ws.on('error', err => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

// Check transport security
async function checkTransportSecurity() {
  log('Checking transport security...');
  
  // Check if using secure WebSocket
  if (config.url.startsWith('wss://')) {
    addFinding(
      'SEC-TRANS-01',
      'Secure WebSocket Protocol',
      'Check if the application uses secure WebSocket protocol (WSS)',
      SEVERITY.HIGH,
      'PASS',
      'Using secure WebSocket protocol (WSS)'
    );
  } else {
    addFinding(
      'SEC-TRANS-01',
      'Secure WebSocket Protocol',
      'Check if the application uses secure WebSocket protocol (WSS)',
      SEVERITY.HIGH,
      'FAIL',
      'Using insecure WebSocket protocol (WS)',
      'Use secure WebSocket protocol (WSS) in production environments'
    );
  }
  
  // Check for secure headers if using HTTPS
  if (config.url.startsWith('wss://')) {
    const urlObj = new URL(config.url);
    const hostname = urlObj.hostname;
    const port = urlObj.port || 443;
    
    try {
      const headers = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname,
          port,
          path: '/',
          method: 'HEAD'
        }, (res) => {
          resolve(res.headers);
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
      
      // Check for HSTS header
      if (headers['strict-transport-security']) {
        addFinding(
          'SEC-TRANS-02',
          'HTTP Strict Transport Security',
          'Check if the server enforces HTTPS using HSTS header',
          SEVERITY.MEDIUM,
          'PASS',
          `HSTS header: ${headers['strict-transport-security']}`
        );
      } else {
        addFinding(
          'SEC-TRANS-02',
          'HTTP Strict Transport Security',
          'Check if the server enforces HTTPS using HSTS header',
          SEVERITY.MEDIUM,
          'FAIL',
          'HSTS header not found',
          'Add Strict-Transport-Security header to enforce HTTPS'
        );
      }
      
      // Check for X-Content-Type-Options header
      if (headers['x-content-type-options'] === 'nosniff') {
        addFinding(
          'SEC-TRANS-03',
          'Content Type Options',
          'Check if the server prevents MIME type sniffing',
          SEVERITY.LOW,
          'PASS'
        );
      } else {
        addFinding(
          'SEC-TRANS-03',
          'Content Type Options',
          'Check if the server prevents MIME type sniffing',
          SEVERITY.LOW,
          'FAIL',
          'X-Content-Type-Options: nosniff header not found',
          'Add X-Content-Type-Options: nosniff header to prevent MIME type sniffing'
        );
      }
    } catch (error) {
      log(`Error checking HTTPS headers: ${error.message}`, 'muted');
    }
  }
}

// Check authentication mechanisms
async function checkAuthentication() {
  log('Checking authentication mechanisms...');
  
  try {
    const ws = await createConnection();
    
    // Send initial message without authentication
    const initialMessage = {
      type: 'test_message',
      payload: {
        data: 'test_data'
      },
      timestamp: Date.now()
    };
    
    // Check if server requires authentication
    const authRequiredResult = await new Promise((resolve) => {
      let receivedMessage = false;
      let timeoutId = setTimeout(() => {
        if (!receivedMessage) {
          resolve({ required: true });
        }
      }, 2000);
      
      ws.on('message', (data) => {
        receivedMessage = true;
        clearTimeout(timeoutId);
        
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'error' && 
              message.payload && 
              (message.payload.code === 'authentication_required' || 
               message.payload.reason === 'authentication_required')) {
            resolve({ required: true, explicit: true });
          } else {
            resolve({ required: false });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
          resolve({ required: false });
        }
      });
      
      ws.send(JSON.stringify(initialMessage));
    });
    
    if (authRequiredResult.required) {
      if (authRequiredResult.explicit) {
        addFinding(
          'SEC-AUTH-01',
          'Authentication Required',
          'Check if the server requires authentication',
          SEVERITY.CRITICAL,
          'PASS',
          'Server explicitly requires authentication'
        );
      } else {
        addFinding(
          'SEC-AUTH-01',
          'Authentication Required',
          'Check if the server requires authentication',
          SEVERITY.CRITICAL,
          'PASS',
          'Server appears to require authentication (no response to unauthenticated message)'
        );
      }
    } else {
      addFinding(
        'SEC-AUTH-01',
        'Authentication Required',
        'Check if the server requires authentication',
        SEVERITY.CRITICAL,
        'FAIL',
        'Server does not require authentication',
        'Implement mandatory authentication for all WebSocket connections'
      );
    }
    
    // Send authentication message
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication response
    const authResult = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    // Test token expiration
    if (authResult.success && authResult.message.payload && authResult.message.payload.tokenExpires) {
      addFinding(
        'SEC-AUTH-02',
        'Token Expiration',
        'Check if authentication tokens have an expiration time',
        SEVERITY.HIGH,
        'PASS',
        'Authentication tokens have expiration times'
      );
    } else {
      addFinding(
        'SEC-AUTH-02',
        'Token Expiration',
        'Check if authentication tokens have an expiration time',
        SEVERITY.HIGH,
        'FAIL',
        'No token expiration found in authentication response',
        'Implement token expiration for all authentication tokens'
      );
    }
    
    // Test token refresh mechanism
    if (authResult.success) {
      // Send token refresh message
      const refreshMessage = {
        type: 'token_refresh',
        payload: {
          currentToken: config.token
        },
        timestamp: Date.now()
      };
      
      // Wait for token refresh response
      const refreshResult = await new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          resolve({ supported: false });
        }, config.timeout);
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'token_refresh_success') {
              clearTimeout(timeoutId);
              resolve({ supported: true, message });
            } else if (message.type === 'token_refresh_failure') {
              clearTimeout(timeoutId);
              resolve({ supported: true, success: false, message });
            }
          } catch (error) {
            log(`Error parsing message: ${error.message}`, 'muted');
          }
        });
        
        ws.send(JSON.stringify(refreshMessage));
      });
      
      if (refreshResult.supported) {
        addFinding(
          'SEC-AUTH-03',
          'Token Refresh Mechanism',
          'Check if the server supports token refresh',
          SEVERITY.MEDIUM,
          'PASS',
          'Server supports token refresh mechanism'
        );
      } else {
        addFinding(
          'SEC-AUTH-03',
          'Token Refresh Mechanism',
          'Check if the server supports token refresh',
          SEVERITY.MEDIUM,
          'FAIL',
          'No token refresh mechanism detected',
          'Implement token refresh mechanism to maintain authentication without disconnection'
        );
      }
    }
    
    ws.close();
  } catch (error) {
    log(`Error checking authentication: ${error.message}`, 'error');
    
    addFinding(
      'SEC-AUTH-01',
      'Authentication Required',
      'Check if the server requires authentication',
      SEVERITY.CRITICAL,
      'UNKNOWN',
      `Could not test: ${error.message}`,
      'Ensure the WebSocket server is running and accessible'
    );
  }
}

// Check CSRF protection
async function checkCSRFProtection() {
  log('Checking CSRF protection...');
  
  try {
    const ws = await createConnection();
    
    // Send authentication message first
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication response to get CSRF token
    const authResult = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    // Check if CSRF token is included in authentication response
    if (authResult.success && authResult.message.payload && authResult.message.payload.csrfToken) {
      addFinding(
        'SEC-CSRF-01',
        'CSRF Token in Authentication',
        'Check if the server provides CSRF token during authentication',
        SEVERITY.HIGH,
        'PASS',
        'Server provides CSRF token during authentication'
      );
      
      // Test sending message with invalid CSRF token
      const testMessage = {
        type: 'test_message',
        payload: { test: 'data' },
        timestamp: Date.now(),
        csrfToken: 'invalid_token'
      };
      
      // Wait for response to invalid CSRF token
      const csrfResult = await new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          resolve({ rejected: false });
        }, config.timeout);
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'error' && 
                message.payload && 
                (message.payload.code === 'csrf_validation_failed' || 
                 message.payload.reason === 'csrf_validation_failed')) {
              clearTimeout(timeoutId);
              resolve({ rejected: true, message });
            }
          } catch (error) {
            log(`Error parsing message: ${error.message}`, 'muted');
          }
        });
        
        ws.send(JSON.stringify(testMessage));
      });
      
      if (csrfResult.rejected) {
        addFinding(
          'SEC-CSRF-02',
          'CSRF Token Validation',
          'Check if the server validates CSRF tokens',
          SEVERITY.HIGH,
          'PASS',
          'Server rejects messages with invalid CSRF tokens'
        );
      } else {
        addFinding(
          'SEC-CSRF-02',
          'CSRF Token Validation',
          'Check if the server validates CSRF tokens',
          SEVERITY.HIGH,
          'FAIL',
          'Server accepts messages with invalid CSRF tokens',
          'Implement proper CSRF token validation for all messages'
        );
      }
      
      // Test if certain message types are exempt from CSRF protection
      const healthCheckMessage = {
        type: 'health-check',
        payload: {
          clientTimestamp: Date.now()
        }
      };
      
      // Send health check without CSRF token
      const exemptionResult = await new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          resolve({ accepted: false });
        }, config.timeout);
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if ((message.type === 'health-check-response' || 
                message.type === 'ack') && 
                message.payload) {
              clearTimeout(timeoutId);
              resolve({ accepted: true, message });
            } else if (message.type === 'error' && 
                      message.payload && 
                      message.payload.code === 'csrf_validation_failed') {
              clearTimeout(timeoutId);
              resolve({ accepted: false, rejected: true, message });
            }
          } catch (error) {
            log(`Error parsing message: ${error.message}`, 'muted');
          }
        });
        
        ws.send(JSON.stringify(healthCheckMessage));
      });
      
      if (exemptionResult.accepted) {
        addFinding(
          'SEC-CSRF-03',
          'CSRF Token Exemptions',
          'Check if certain message types are exempt from CSRF protection',
          SEVERITY.LOW,
          'PASS',
          'Server correctly exempts special message types from CSRF validation'
        );
      } else if (exemptionResult.rejected) {
        addFinding(
          'SEC-CSRF-03',
          'CSRF Token Exemptions',
          'Check if certain message types are exempt from CSRF protection',
          SEVERITY.LOW,
          'FAIL',
          'Server does not exempt special message types from CSRF validation',
          'Implement CSRF exemptions for special message types like health checks'
        );
      } else {
        log('Could not determine CSRF exemption behavior', 'muted');
      }
    } else {
      addFinding(
        'SEC-CSRF-01',
        'CSRF Token in Authentication',
        'Check if the server provides CSRF token during authentication',
        SEVERITY.HIGH,
        'FAIL',
        'No CSRF token in authentication response',
        'Implement CSRF token generation and validation for WebSocket messages'
      );
      
      addFinding(
        'SEC-CSRF-02',
        'CSRF Token Validation',
        'Check if the server validates CSRF tokens',
        SEVERITY.HIGH,
        'FAIL',
        'Could not test without CSRF token',
        'Implement CSRF token validation for all messages'
      );
    }
    
    ws.close();
  } catch (error) {
    log(`Error checking CSRF protection: ${error.message}`, 'error');
  }
}

// Check rate limiting
async function checkRateLimiting() {
  log('Checking rate limiting...');
  
  try {
    const ws = await createConnection();
    
    // Send authentication message first
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication response
    const authResult = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    if (!authResult.success) {
      log('Authentication failed, skipping rate limiting tests', 'warning');
      ws.close();
      return;
    }
    
    // Get CSRF token if available
    const csrfToken = authResult.message.payload && authResult.message.payload.csrfToken;
    
    // Test message rate limiting by sending many messages quickly
    log('Testing message rate limiting...', 'muted');
    
    const messageCount = 50;
    let rateLimitDetected = false;
    let retryAfterHeaderPresent = false;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'error' && 
            message.payload && 
            (message.payload.code === 'rate_limit_exceeded' || 
             message.payload.reason === 'rate_limit_exceeded')) {
          rateLimitDetected = true;
          
          if (message.payload.retryAfter) {
            retryAfterHeaderPresent = true;
          }
        }
      } catch (error) {
        log(`Error parsing message: ${error.message}`, 'muted');
      }
    });
    
    // Send many messages quickly
    for (let i = 0; i < messageCount; i++) {
      const floodMessage = {
        type: 'flood_test',
        payload: {
          iteration: i,
          data: 'test'.repeat(100) // Some data to increase message size
        },
        timestamp: Date.now(),
        csrfToken
      };
      
      ws.send(JSON.stringify(floodMessage));
      
      // Small delay to avoid overwhelming the client-side
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Wait a moment for rate limiting to kick in
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (rateLimitDetected) {
      addFinding(
        'SEC-RATE-01',
        'Message Rate Limiting',
        'Check if the server limits the message rate',
        SEVERITY.HIGH,
        'PASS',
        'Server implements message rate limiting'
      );
      
      if (retryAfterHeaderPresent) {
        addFinding(
          'SEC-RATE-02',
          'Retry-After Header',
          'Check if rate limit errors include retry-after information',
          SEVERITY.MEDIUM,
          'PASS',
          'Rate limit errors include retry-after information'
        );
      } else {
        addFinding(
          'SEC-RATE-02',
          'Retry-After Header',
          'Check if rate limit errors include retry-after information',
          SEVERITY.MEDIUM,
          'FAIL',
          'Rate limit errors do not include retry-after information',
          'Add retry-after information to rate limit error responses'
        );
      }
    } else {
      addFinding(
        'SEC-RATE-01',
        'Message Rate Limiting',
        'Check if the server limits the message rate',
        SEVERITY.HIGH,
        'FAIL',
        'No message rate limiting detected',
        'Implement message rate limiting to prevent abuse'
      );
      
      addFinding(
        'SEC-RATE-02',
        'Retry-After Header',
        'Check if rate limit errors include retry-after information',
        SEVERITY.MEDIUM,
        'FAIL',
        'Could not test without rate limiting',
        'Add retry-after information to rate limit error responses'
      );
    }
    
    // Close the connection
    ws.close();
    
    // Test connection rate limiting by creating many connections
    if (config.full) {
      log('Testing connection rate limiting...', 'muted');
      
      const connectionCount = 10;
      const connections = [];
      let connectionLimitDetected = false;
      
      for (let i = 0; i < connectionCount; i++) {
        try {
          const ws = await createConnection();
          connections.push(ws);
        } catch (error) {
          if (error.message.includes('limit') || 
              error.message.includes('exceeded') || 
              error.message.includes('too many')) {
            connectionLimitDetected = true;
            break;
          }
        }
        
        // Small delay between connection attempts
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Close all connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      if (connectionLimitDetected) {
        addFinding(
          'SEC-RATE-03',
          'Connection Rate Limiting',
          'Check if the server limits the connection rate',
          SEVERITY.HIGH,
          'PASS',
          'Server implements connection rate limiting'
        );
      } else {
        addFinding(
          'SEC-RATE-03',
          'Connection Rate Limiting',
          'Check if the server limits the connection rate',
          SEVERITY.HIGH,
          'FAIL',
          'No connection rate limiting detected',
          'Implement connection rate limiting to prevent abuse'
        );
      }
    }
  } catch (error) {
    log(`Error checking rate limiting: ${error.message}`, 'error');
  }
}

// Check input validation
async function checkInputValidation() {
  log('Checking input validation...');
  
  try {
    const ws = await createConnection();
    
    // Send authentication message first
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication response
    const authResult = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    if (!authResult.success) {
      log('Authentication failed, skipping input validation tests', 'warning');
      ws.close();
      return;
    }
    
    // Get CSRF token if available
    const csrfToken = authResult.message.payload && authResult.message.payload.csrfToken;
    
    const testCases = [
      {
        name: 'Invalid message type',
        message: {
          type: 'not_a_valid_type',
          payload: { test: 'data' },
          timestamp: Date.now(),
          csrfToken
        },
        expectError: true,
        errorCode: 'invalid_message_type'
      },
      {
        name: 'Missing required field',
        message: {
          // type is missing
          payload: { test: 'data' },
          timestamp: Date.now(),
          csrfToken
        },
        expectError: true,
        errorCode: 'validation_error'
      },
      {
        name: 'Invalid timestamp',
        message: {
          type: 'test_message',
          payload: { test: 'data' },
          timestamp: 'not_a_number',
          csrfToken
        },
        expectError: true,
        errorCode: 'validation_error'
      },
      {
        name: 'Oversized message',
        message: {
          type: 'test_message',
          payload: { 
            test: 'data'.repeat(100000) // Very large payload
          },
          timestamp: Date.now(),
          csrfToken
        },
        expectError: true,
        errorCode: 'message_too_large'
      },
      {
        name: 'Prototype pollution attempt',
        message: {
          type: 'test_message',
          payload: {
            __proto__: { polluted: true }
          },
          timestamp: Date.now(),
          csrfToken
        },
        expectError: true,
        errorCode: 'validation_error'
      }
    ];
    
    let validationResults = {
      totalTests: testCases.length,
      passed: 0,
      failed: 0
    };
    
    for (const testCase of testCases) {
      log(`Testing ${testCase.name}...`, 'muted');
      
      const result = await new Promise((resolve) => {
        let timeoutId = setTimeout(() => {
          resolve({ error: false, timedOut: true });
        }, config.timeout);
        
        function onMessage(data) {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'error') {
              clearTimeout(timeoutId);
              ws.removeListener('message', onMessage);
              resolve({ error: true, message });
            } else {
              clearTimeout(timeoutId);
              ws.removeListener('message', onMessage);
              resolve({ error: false, message });
            }
          } catch (error) {
            log(`Error parsing message: ${error.message}`, 'muted');
          }
        }
        
        ws.on('message', onMessage);
        ws.send(JSON.stringify(testCase.message));
      });
      
      if (testCase.expectError && result.error) {
        log(`${testCase.name}: Properly rejected`, 'muted', 1);
        validationResults.passed++;
      } else if (!testCase.expectError && !result.error) {
        log(`${testCase.name}: Properly accepted`, 'muted', 1);
        validationResults.passed++;
      } else {
        if (testCase.expectError) {
          log(`${testCase.name}: Not rejected as expected`, 'muted', 1);
        } else {
          log(`${testCase.name}: Rejected unexpectedly`, 'muted', 1);
        }
        validationResults.failed++;
      }
    }
    
    const validationScore = validationResults.passed / validationResults.totalTests;
    
    if (validationScore === 1) {
      addFinding(
        'SEC-INPUT-01',
        'Message Validation',
        'Check if the server validates message format and content',
        SEVERITY.CRITICAL,
        'PASS',
        'Server properly validates all message types'
      );
    } else if (validationScore >= 0.7) {
      addFinding(
        'SEC-INPUT-01',
        'Message Validation',
        'Check if the server validates message format and content',
        SEVERITY.CRITICAL,
        'PARTIAL',
        `Server validates ${validationResults.passed}/${validationResults.totalTests} message types`,
        'Improve message validation to cover all edge cases'
      );
    } else {
      addFinding(
        'SEC-INPUT-01',
        'Message Validation',
        'Check if the server validates message format and content',
        SEVERITY.CRITICAL,
        'FAIL',
        `Server only validates ${validationResults.passed}/${validationResults.totalTests} message types`,
        'Implement comprehensive message validation using a schema validation library'
      );
    }
    
    ws.close();
  } catch (error) {
    log(`Error checking input validation: ${error.message}`, 'error');
  }
}

// Check error handling
async function checkErrorHandling() {
  log('Checking error handling...');
  
  try {
    const ws = await createConnection();
    
    // Send malformed JSON
    const malformedJSON = 'not valid json{';
    
    const malformedResult = await new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve({ handled: false });
      }, config.timeout);
      
      function onMessage(data) {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'error' && 
              message.payload && 
              (message.payload.code === 'invalid_json' || 
               message.payload.reason === 'invalid_json')) {
            clearTimeout(timeoutId);
            ws.removeListener('message', onMessage);
            resolve({ handled: true, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      }
      
      ws.on('message', onMessage);
      ws.send(malformedJSON);
    });
    
    if (malformedResult.handled) {
      addFinding(
        'SEC-ERROR-01',
        'Malformed JSON Handling',
        'Check if the server properly handles malformed JSON',
        SEVERITY.MEDIUM,
        'PASS',
        'Server properly handles malformed JSON'
      );
      
      // Check if error contains minimal information
      if (malformedResult.message && 
          malformedResult.message.payload &&
          !malformedResult.message.payload.exception && 
          !malformedResult.message.payload.stack) {
        addFinding(
          'SEC-ERROR-02',
          'Error Information Disclosure',
          'Check if errors contain minimal information',
          SEVERITY.MEDIUM,
          'PASS',
          'Errors contain minimal information without stack traces'
        );
      } else {
        addFinding(
          'SEC-ERROR-02',
          'Error Information Disclosure',
          'Check if errors contain minimal information',
          SEVERITY.MEDIUM,
          'FAIL',
          'Errors contain sensitive information such as stack traces',
          'Sanitize error responses to remove sensitive information'
        );
      }
    } else {
      addFinding(
        'SEC-ERROR-01',
        'Malformed JSON Handling',
        'Check if the server properly handles malformed JSON',
        SEVERITY.MEDIUM,
        'FAIL',
        'Server does not handle malformed JSON properly',
        'Implement proper error handling for malformed JSON'
      );
    }
    
    // Test structured error codes
    // Send authentication message to get CSRF token
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    await new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve();
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success' || 
              message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    // Send invalid message to check for structured error
    const invalidMessage = {
      type: 'invalid_type',
      timestamp: Date.now()
    };
    
    const structuredErrorResult = await new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve({ structured: false });
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'error' && 
              message.payload && 
              message.payload.code && 
              typeof message.payload.code === 'string') {
            clearTimeout(timeoutId);
            resolve({ structured: true, message });
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws.send(JSON.stringify(invalidMessage));
    });
    
    if (structuredErrorResult.structured) {
      addFinding(
        'SEC-ERROR-03',
        'Structured Error Codes',
        'Check if errors contain structured error codes',
        SEVERITY.LOW,
        'PASS',
        'Errors contain structured error codes'
      );
    } else {
      addFinding(
        'SEC-ERROR-03',
        'Structured Error Codes',
        'Check if errors contain structured error codes',
        SEVERITY.LOW,
        'FAIL',
        'Errors do not contain structured error codes',
        'Implement structured error codes for better error handling'
      );
    }
    
    ws.close();
  } catch (error) {
    log(`Error checking error handling: ${error.message}`, 'error');
  }
}

// Check monitoring and health checks
async function checkMonitoring() {
  log('Checking monitoring and health checks...');
  
  try {
    const ws = await createConnection();
    
    // Send authentication message first if needed
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication response
    await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        resolve(); // Continue even if authentication times out
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success' || 
              message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws.send(JSON.stringify(authMessage));
    });
    
    // Send health check message
    const healthCheckMessage = {
      type: 'health-check',
      payload: {
        clientTimestamp: Date.now()
      }
    };
    
    const healthCheckResult = await new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve({ supported: false });
      }, config.timeout);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if ((message.type === 'health-check-response' || 
              (message.type === 'ack' && 
               message.payload && 
               message.payload.originalType === 'health-check')) && 
              message.payload) {
            clearTimeout(timeoutId);
            resolve({ supported: true, message });
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws.send(JSON.stringify(healthCheckMessage));
    });
    
    if (healthCheckResult.supported) {
      addFinding(
        'SEC-MON-01',
        'Health Check Support',
        'Check if the server supports health check messages',
        SEVERITY.MEDIUM,
        'PASS',
        'Server supports health check messages'
      );
      
      // Check if health check response includes server timestamp
      if (healthCheckResult.message && 
          healthCheckResult.message.payload && 
          healthCheckResult.message.payload.serverTimestamp) {
        addFinding(
          'SEC-MON-02',
          'Health Check Timestamp',
          'Check if health check responses include server timestamp',
          SEVERITY.LOW,
          'PASS',
          'Health check responses include server timestamp'
        );
      } else {
        addFinding(
          'SEC-MON-02',
          'Health Check Timestamp',
          'Check if health check responses include server timestamp',
          SEVERITY.LOW,
          'FAIL',
          'Health check responses do not include server timestamp',
          'Add server timestamp to health check responses for latency calculation'
        );
      }
    } else {
      addFinding(
        'SEC-MON-01',
        'Health Check Support',
        'Check if the server supports health check messages',
        SEVERITY.MEDIUM,
        'FAIL',
        'Server does not support health check messages',
        'Implement health check message support for monitoring'
      );
      
      addFinding(
        'SEC-MON-02',
        'Health Check Timestamp',
        'Check if health check responses include server timestamp',
        SEVERITY.LOW,
        'FAIL',
        'Could not test without health check support',
        'Add server timestamp to health check responses for latency calculation'
      );
    }
    
    ws.close();
    
    // Check if a health check endpoint exists
    try {
      const url = new URL(config.url);
      const healthEndpoint = `${url.protocol}//${url.host}/health`;
      
      const healthEndpointResult = await new Promise((resolve) => {
        const req = (url.protocol === 'wss:' ? https : http).request(healthEndpoint, { method: 'GET' }, (res) => {
          resolve({
            exists: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode
          });
        });
        
        req.on('error', () => {
          resolve({ exists: false });
        });
        
        req.end();
      });
      
      if (healthEndpointResult.exists) {
        addFinding(
          'SEC-MON-03',
          'Health Check Endpoint',
          'Check if a health check HTTP endpoint exists',
          SEVERITY.LOW,
          'PASS',
          `Health check endpoint exists (${healthEndpointResult.statusCode})`
        );
      } else {
        addFinding(
          'SEC-MON-03',
          'Health Check Endpoint',
          'Check if a health check HTTP endpoint exists',
          SEVERITY.LOW,
          'FAIL',
          'No health check HTTP endpoint found',
          'Implement a health check HTTP endpoint for monitoring'
        );
      }
    } catch (error) {
      log(`Error checking health endpoint: ${error.message}`, 'muted');
    }
  } catch (error) {
    log(`Error checking monitoring: ${error.message}`, 'error');
  }
}

// Check session management
async function checkSessionManagement() {
  log('Checking session management...');
  
  try {
    // Create multiple connections to check session tracking
    const ws1 = await createConnection();
    const ws2 = await createConnection();
    
    // Send authentication messages
    const authMessage = {
      type: 'authentication',
      payload: {
        token: config.token
      },
      timestamp: Date.now()
    };
    
    // Wait for authentication responses
    const auth1 = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws1.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws1.send(JSON.stringify(authMessage));
    });
    
    const auth2 = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws2.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws2.send(JSON.stringify(authMessage));
    });
    
    // Check if session IDs are different for different connections
    if (auth1.success && auth2.success && 
        auth1.message.payload && auth2.message.payload && 
        auth1.message.payload.sessionId && auth2.message.payload.sessionId) {
      if (auth1.message.payload.sessionId !== auth2.message.payload.sessionId) {
        addFinding(
          'SEC-SESS-01',
          'Unique Session IDs',
          'Check if each connection gets a unique session ID',
          SEVERITY.MEDIUM,
          'PASS',
          'Each connection gets a unique session ID'
        );
      } else {
        addFinding(
          'SEC-SESS-01',
          'Unique Session IDs',
          'Check if each connection gets a unique session ID',
          SEVERITY.MEDIUM,
          'FAIL',
          'Multiple connections get the same session ID',
          'Implement unique session IDs for each connection'
        );
      }
    } else {
      addFinding(
        'SEC-SESS-01',
        'Unique Session IDs',
        'Check if each connection gets a unique session ID',
        SEVERITY.MEDIUM,
        'UNKNOWN',
        'Session IDs not present in authentication response',
        'Include session IDs in authentication responses'
      );
    }
    
    // Close one connection and create a new one to test session revival prevention
    ws1.close();
    
    // Wait a moment for the session to be cleaned up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send authentication with the same token to a new connection
    const ws3 = await createConnection();
    
    const auth3 = await new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, config.timeout);
      
      ws3.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'authentication_success') {
            clearTimeout(timeoutId);
            resolve({ success: true, message });
          } else if (message.type === 'authentication_failure') {
            clearTimeout(timeoutId);
            resolve({ success: false, message });
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws3.send(JSON.stringify(authMessage));
    });
    
    // Check if new session ID is different from old one
    if (auth1.success && auth3.success && 
        auth1.message.payload && auth3.message.payload && 
        auth1.message.payload.sessionId && auth3.message.payload.sessionId) {
      if (auth1.message.payload.sessionId !== auth3.message.payload.sessionId) {
        addFinding(
          'SEC-SESS-02',
          'Session Revival Prevention',
          'Check if closed sessions cannot be revived',
          SEVERITY.MEDIUM,
          'PASS',
          'Closed sessions cannot be revived'
        );
      } else {
        addFinding(
          'SEC-SESS-02',
          'Session Revival Prevention',
          'Check if closed sessions cannot be revived',
          SEVERITY.MEDIUM,
          'FAIL',
          'Closed sessions can be revived',
          'Implement session revival prevention'
        );
      }
    } else {
      addFinding(
        'SEC-SESS-02',
        'Session Revival Prevention',
        'Check if closed sessions cannot be revived',
        SEVERITY.MEDIUM,
        'UNKNOWN',
        'Session IDs not present in authentication response',
        'Implement session revival prevention'
      );
    }
    
    // Close remaining connections
    ws2.close();
    ws3.close();
  } catch (error) {
    log(`Error checking session management: ${error.message}`, 'error');
  }
}

// Generate and save the report
function generateReport() {
  const reportData = {
    title: 'WebSocket Security Audit Report',
    date: new Date().toISOString(),
    url: config.url,
    securityScore,
    findings,
    config
  };
  
  // Create reports directory if it doesn't exist
  try {
    if (!fs.existsSync(path.dirname(config.reportPath))) {
      fs.mkdirSync(path.dirname(config.reportPath), { recursive: true });
    }
    
    // Generate report filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const reportFile = `${config.reportPath}-${timestamp}.json`;
    
    // Save the report
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    log(`Report saved to ${reportFile}`, 'success');
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport(reportData);
    const markdownFile = `${config.reportPath}-${timestamp}.md`;
    
    fs.writeFileSync(markdownFile, markdownReport);
    
    log(`Markdown report saved to ${markdownFile}`, 'success');
  } catch (error) {
    log(`Error saving report: ${error.message}`, 'error');
  }
}

// Generate markdown report
function generateMarkdownReport(reportData) {
  const { title, date, url, securityScore, findings } = reportData;
  
  // Format date
  const formattedDate = new Date(date).toLocaleString();
  
  let markdown = `# ${title}\n\n`;
  markdown += `**Date:** ${formattedDate}\n`;
  markdown += `**URL:** ${url}\n\n`;
  
  // Security score
  markdown += `## Security Score\n\n`;
  markdown += `- **Overall:** ${Math.round((securityScore.passed / securityScore.total) * 100)}% (${securityScore.passed}/${securityScore.total} checks passed)\n`;
  markdown += `- **Critical Issues:** ${securityScore.criticalIssues}\n`;
  markdown += `- **High Issues:** ${securityScore.highIssues}\n`;
  markdown += `- **Medium Issues:** ${securityScore.mediumIssues}\n`;
  markdown += `- **Low Issues:** ${securityScore.lowIssues}\n\n`;
  
  // Executive summary
  markdown += `## Executive Summary\n\n`;
  
  if (securityScore.criticalIssues > 0) {
    markdown += `⚠️ **Critical issues found!** Immediate action required.\n\n`;
  } else if (securityScore.highIssues > 0) {
    markdown += `⚠️ **High severity issues found!** Prompt action recommended.\n\n`;
  } else if (securityScore.passed === securityScore.total) {
    markdown += `✅ **No issues found.** The WebSocket implementation passed all security checks.\n\n`;
  } else {
    markdown += `⚠️ **Some issues found.** The WebSocket implementation needs improvement.\n\n`;
  }
  
  // Findings
  markdown += `## Findings\n\n`;
  
  // Group findings by severity
  const findingsBySeverity = {
    [SEVERITY.CRITICAL]: [],
    [SEVERITY.HIGH]: [],
    [SEVERITY.MEDIUM]: [],
    [SEVERITY.LOW]: [],
    [SEVERITY.INFO]: []
  };
  
  findings.forEach(finding => {
    findingsBySeverity[finding.severity].push(finding);
  });
  
  // Add critical findings
  if (findingsBySeverity[SEVERITY.CRITICAL].length > 0) {
    markdown += `### Critical Findings\n\n`;
    
    findingsBySeverity[SEVERITY.CRITICAL].forEach(finding => {
      markdown += `#### ${finding.id}: ${finding.name}\n\n`;
      markdown += `**Status:** ${finding.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
      markdown += `**Description:** ${finding.description}\n\n`;
      
      if (finding.details) {
        markdown += `**Details:** ${finding.details}\n\n`;
      }
      
      if (finding.recommendation) {
        markdown += `**Recommendation:** ${finding.recommendation}\n\n`;
      }
    });
  }
  
  // Add high findings
  if (findingsBySeverity[SEVERITY.HIGH].length > 0) {
    markdown += `### High Severity Findings\n\n`;
    
    findingsBySeverity[SEVERITY.HIGH].forEach(finding => {
      markdown += `#### ${finding.id}: ${finding.name}\n\n`;
      markdown += `**Status:** ${finding.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
      markdown += `**Description:** ${finding.description}\n\n`;
      
      if (finding.details) {
        markdown += `**Details:** ${finding.details}\n\n`;
      }
      
      if (finding.recommendation) {
        markdown += `**Recommendation:** ${finding.recommendation}\n\n`;
      }
    });
  }
  
  // Add medium findings
  if (findingsBySeverity[SEVERITY.MEDIUM].length > 0) {
    markdown += `### Medium Severity Findings\n\n`;
    
    findingsBySeverity[SEVERITY.MEDIUM].forEach(finding => {
      markdown += `#### ${finding.id}: ${finding.name}\n\n`;
      markdown += `**Status:** ${finding.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
      markdown += `**Description:** ${finding.description}\n\n`;
      
      if (finding.details) {
        markdown += `**Details:** ${finding.details}\n\n`;
      }
      
      if (finding.recommendation) {
        markdown += `**Recommendation:** ${finding.recommendation}\n\n`;
      }
    });
  }
  
  // Add low findings
  if (findingsBySeverity[SEVERITY.LOW].length > 0) {
    markdown += `### Low Severity Findings\n\n`;
    
    findingsBySeverity[SEVERITY.LOW].forEach(finding => {
      markdown += `#### ${finding.id}: ${finding.name}\n\n`;
      markdown += `**Status:** ${finding.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
      markdown += `**Description:** ${finding.description}\n\n`;
      
      if (finding.details) {
        markdown += `**Details:** ${finding.details}\n\n`;
      }
      
      if (finding.recommendation) {
        markdown += `**Recommendation:** ${finding.recommendation}\n\n`;
      }
    });
  }
  
  // Recommendations
  markdown += `## Recommendations\n\n`;
  
  const failedFindings = findings.filter(finding => finding.status !== 'PASS');
  
  if (failedFindings.length === 0) {
    markdown += `No recommendations needed. The WebSocket implementation passed all security checks.\n\n`;
  } else {
    markdown += `Based on the findings, the following recommendations are provided:\n\n`;
    
    // Group recommendations by severity
    const criticalRecs = failedFindings
      .filter(f => f.severity === SEVERITY.CRITICAL && f.recommendation)
      .map(f => f.recommendation);
    
    const highRecs = failedFindings
      .filter(f => f.severity === SEVERITY.HIGH && f.recommendation)
      .map(f => f.recommendation);
    
    const mediumRecs = failedFindings
      .filter(f => f.severity === SEVERITY.MEDIUM && f.recommendation)
      .map(f => f.recommendation);
    
    const lowRecs = failedFindings
      .filter(f => f.severity === SEVERITY.LOW && f.recommendation)
      .map(f => f.recommendation);
    
    // Add critical recommendations
    if (criticalRecs.length > 0) {
      markdown += `### Critical Recommendations\n\n`;
      criticalRecs.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }
    
    // Add high recommendations
    if (highRecs.length > 0) {
      markdown += `### High Priority Recommendations\n\n`;
      highRecs.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }
    
    // Add medium recommendations
    if (mediumRecs.length > 0) {
      markdown += `### Medium Priority Recommendations\n\n`;
      mediumRecs.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }
    
    // Add low recommendations
    if (lowRecs.length > 0) {
      markdown += `### Low Priority Recommendations\n\n`;
      lowRecs.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }
  }
  
  // References
  markdown += `## References\n\n`;
  markdown += `- [OWASP WebSocket Security Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)\n`;
  markdown += `- [NIST Special Publication 800-95: Guide to Secure Web Services](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-95.pdf)\n`;
  markdown += `- [RFC 6455: The WebSocket Protocol](https://tools.ietf.org/html/rfc6455)\n`;
  markdown += `- [Socket.IO Documentation: Security Considerations](https://socket.io/docs/v4/security/)\n`;
  
  return markdown;
}

// Display the summary
function displaySummary() {
  console.log(colors.bold('\nAudit Summary:'));
  console.log();
  
  // Calculate security score percentage
  const scorePercent = Math.round((securityScore.passed / securityScore.total) * 100);
  
  // Determine status color based on score
  let statusColor;
  let statusText;
  
  if (securityScore.criticalIssues > 0) {
    statusColor = colors.critical;
    statusText = 'CRITICAL';
  } else if (securityScore.highIssues > 0) {
    statusColor = colors.error;
    statusText = 'FAIL';
  } else if (scorePercent < 70) {
    statusColor = colors.error;
    statusText = 'FAIL';
  } else if (scorePercent < 90) {
    statusColor = colors.warning;
    statusText = 'PARTIAL';
  } else {
    statusColor = colors.success;
    statusText = 'PASS';
  }
  
  console.log(`  Overall Status: ${statusColor(statusText)}`);
  console.log(`  Security Score: ${statusColor(`${scorePercent}%`)} (${securityScore.passed}/${securityScore.total} checks passed)`);
  console.log();
  
  // Display issues by severity
  console.log(`  Critical Issues: ${securityScore.criticalIssues > 0 ? colors.critical(securityScore.criticalIssues) : colors.success(securityScore.criticalIssues)}`);
  console.log(`  High Issues: ${securityScore.highIssues > 0 ? colors.error(securityScore.highIssues) : colors.success(securityScore.highIssues)}`);
  console.log(`  Medium Issues: ${securityScore.mediumIssues > 0 ? colors.warning(securityScore.mediumIssues) : colors.success(securityScore.mediumIssues)}`);
  console.log(`  Low Issues: ${securityScore.lowIssues > 0 ? colors.info(securityScore.lowIssues) : colors.success(securityScore.lowIssues)}`);
  
  console.log();
  
  // Display failed checks
  const failedChecks = findings.filter(f => f.status !== 'PASS');
  
  if (failedChecks.length > 0) {
    console.log(colors.bold('  Failed Checks:'));
    
    // Group by severity
    const criticalFails = failedChecks.filter(f => f.severity === SEVERITY.CRITICAL);
    const highFails = failedChecks.filter(f => f.severity === SEVERITY.HIGH);
    const mediumFails = failedChecks.filter(f => f.severity === SEVERITY.MEDIUM);
    const lowFails = failedChecks.filter(f => f.severity === SEVERITY.LOW);
    
    // Critical failures
    if (criticalFails.length > 0) {
      console.log(colors.critical('\n  CRITICAL:'));
      criticalFails.forEach(f => {
        console.log(`    - ${f.name}`);
      });
    }
    
    // High failures
    if (highFails.length > 0) {
      console.log(colors.error('\n  HIGH:'));
      highFails.forEach(f => {
        console.log(`    - ${f.name}`);
      });
    }
    
    // Medium failures
    if (mediumFails.length > 0) {
      console.log(colors.warning('\n  MEDIUM:'));
      mediumFails.forEach(f => {
        console.log(`    - ${f.name}`);
      });
    }
    
    // Low failures
    if (lowFails.length > 0) {
      console.log(colors.info('\n  LOW:'));
      lowFails.forEach(f => {
        console.log(`    - ${f.name}`);
      });
    }
    
    console.log();
  }
  
  // Display next steps
  console.log(colors.bold('  Next Steps:'));
  
  if (securityScore.criticalIssues > 0) {
    console.log(colors.critical('  - Urgent: Address critical security issues before deployment'));
  }
  
  if (securityScore.highIssues > 0) {
    console.log(colors.error('  - High Priority: Fix high severity issues as soon as possible'));
  }
  
  if (securityScore.mediumIssues > 0) {
    console.log(colors.warning('  - Medium Priority: Address medium severity issues in the next development cycle'));
  }
  
  if (securityScore.lowIssues > 0) {
    console.log(colors.info('  - Low Priority: Fix low severity issues when time permits'));
  }
  
  if (securityScore.criticalIssues === 0 && 
      securityScore.highIssues === 0 && 
      securityScore.mediumIssues === 0 && 
      securityScore.lowIssues === 0) {
    console.log(colors.success('  - All checks passed! Keep up with security updates and regular audits'));
  }
  
  console.log(colors.muted('\n  For detailed recommendations, see the generated report.'));
  console.log();
}

// Main function
async function main() {
  console.log(colors.bold('\nWebSocket Security Audit\n'));
  
  log(`Using WebSocket URL: ${colors.highlight(config.url)}`);
  log(`Using auth token: ${colors.highlight(config.token.substring(0, 3) + '...')}`);
  
  console.log();
  
  // Run security checks
  if (config.tests.transport_security) {
    await checkTransportSecurity();
    console.log();
  }
  
  if (config.tests.authentication) {
    await checkAuthentication();
    console.log();
  }
  
  if (config.tests.csrf) {
    await checkCSRFProtection();
    console.log();
  }
  
  if (config.tests.rate_limiting) {
    await checkRateLimiting();
    console.log();
  }
  
  if (config.tests.input_validation) {
    await checkInputValidation();
    console.log();
  }
  
  if (config.tests.error_handling) {
    await checkErrorHandling();
    console.log();
  }
  
  if (config.tests.monitoring) {
    await checkMonitoring();
    console.log();
  }
  
  if (config.tests.session_management) {
    await checkSessionManagement();
    console.log();
  }
  
  // Generate and display report
  generateReport();
  displaySummary();
}

// Run the main function
main().catch(error => {
  console.error(colors.error(`\nUnexpected error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});