#!/usr/bin/env node

/**
 * WebSocket Health Check Test Script
 * 
 * This script tests the health and security of WebSocket connections.
 * It performs the following checks:
 * 1. Connection establishment
 * 2. Authentication
 * 3. Ping/Pong latency
 * 4. Automatic reconnection
 * 5. Security features (CSRF tokens, etc.)
 * 
 * Usage:
 * node scripts/test-websocket-health.js [--url=wss://example.com/ws] [--token=auth_token] [--verbose]
 */

const WebSocket = require('ws');
const readline = require('readline');
const colors = require('colors');

// Default configuration
const DEFAULT_CONFIG = {
  url: 'ws://localhost:3000/ws',
  token: 'test_token',
  pingInterval: 5000,
  timeout: 5000,
  tests: ['connection', 'auth', 'ping', 'reconnect', 'security'],
  verbose: false
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
  highlight: 'cyan',
  muted: 'gray'
});

// Help menu
function showHelp() {
  console.log(colors.bold('\nWebSocket Health Check Tool\n'));
  console.log('This script tests the health and security of WebSocket connections.');
  console.log('\nUsage:');
  console.log('  node scripts/test-websocket-health.js [options]\n');
  console.log('Options:');
  console.log('  --url=URL           WebSocket server URL (default: ws://localhost:3000/ws)');
  console.log('  --token=TOKEN       Authentication token (default: test_token)');
  console.log('  --verbose, -v       Enable verbose output');
  console.log('  --help, -h          Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/test-websocket-health.js --url=wss://example.com/ws --token=my_auth_token');
  console.log('  node scripts/test-websocket-health.js --verbose\n');
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

// Test WebSocket connection
async function testConnection() {
  log('Testing WebSocket connection to ' + colors.highlight(config.url));
  
  try {
    const startTime = Date.now();
    const ws = await createConnection();
    const endTime = Date.now();
    
    log(`Connection established in ${endTime - startTime}ms`, 'success');
    log('Connection details:', 'muted');
    log(`URL: ${config.url}`, 'muted', 1);
    log(`Protocol: ${ws.protocol || 'none'}`, 'muted', 1);
    
    ws.close();
    return true;
  } catch (error) {
    log(`Failed to connect: ${error.message}`, 'error');
    log('Please check the following:', 'error', 1);
    log('- Server is running', 'error', 1);
    log('- URL is correct', 'error', 1);
    log('- Network connectivity', 'error', 1);
    return false;
  }
}

// Test WebSocket authentication
async function testAuthentication() {
  log('Testing WebSocket authentication');
  
  try {
    const ws = await createConnection();
    
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
      
      ws.on('message', data => {
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
    
    if (authResult.success) {
      log('Authentication successful', 'success');
      
      if (authResult.message.payload && authResult.message.payload.csrfToken) {
        log('CSRF token received', 'success', 1);
      } else {
        log('No CSRF token in authentication response', 'warning', 1);
      }
      
      ws.close();
      return true;
    } else {
      log('Authentication failed', 'error');
      if (authResult.message.payload && authResult.message.payload.reason) {
        log(`Reason: ${authResult.message.payload.reason}`, 'error', 1);
      }
      ws.close();
      return false;
    }
  } catch (error) {
    log(`Authentication test failed: ${error.message}`, 'error');
    return false;
  }
}

// Test WebSocket ping/pong latency
async function testPingLatency() {
  log('Testing ping/pong latency');
  
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
    
    ws.send(JSON.stringify(authMessage));
    
    // Wait for a moment to authenticate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Perform multiple ping tests
    const pingCount = 5;
    const latencies = [];
    
    for (let i = 0; i < pingCount; i++) {
      const pingResult = await new Promise((resolve, reject) => {
        const pingMessage = {
          type: 'health-check',
          payload: {
            clientTimestamp: Date.now()
          }
        };
        
        const sentTime = Date.now();
        let timeoutId = setTimeout(() => {
          reject(new Error('Ping timeout'));
        }, config.timeout);
        
        function onMessage(data) {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'health-check-response' || 
                (message.type === 'ack' && message.payload.originalType === 'health-check')) {
              clearTimeout(timeoutId);
              ws.removeListener('message', onMessage);
              resolve({
                latency: Date.now() - sentTime,
                message
              });
            }
          } catch (error) {
            log(`Error parsing message: ${error.message}`, 'muted');
          }
        }
        
        ws.on('message', onMessage);
        ws.send(JSON.stringify(pingMessage));
      });
      
      latencies.push(pingResult.latency);
      log(`Ping ${i + 1}: ${pingResult.latency}ms`, 'muted');
      
      // Small delay between pings
      if (i < pingCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Calculate statistics
    const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    
    log(`Ping statistics:`, 'success');
    log(`Min: ${minLatency}ms, Avg: ${Math.round(avgLatency)}ms, Max: ${maxLatency}ms`, 'success', 1);
    
    if (avgLatency > 500) {
      log('Average latency is high (>500ms)', 'warning', 1);
    }
    
    ws.close();
    return true;
  } catch (error) {
    log(`Ping test failed: ${error.message}`, 'error');
    return false;
  }
}

// Test WebSocket reconnection
async function testReconnection() {
  log('Testing automatic reconnection');
  
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
    
    ws.send(JSON.stringify(authMessage));
    
    // Close the connection
    log('Closing connection to test reconnection', 'muted');
    ws.close();
    
    // Ask user to check server logs for reconnection attempts
    console.log();
    const answer = await prompt(colors.yellow('? ') + 
      'Please check server logs for reconnection attempts.\n  ' +
      'Did you see reconnection attempts in the logs? (y/n): ');
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      log('Automatic reconnection verified', 'success');
      return true;
    } else {
      log('Automatic reconnection not detected in logs', 'warning');
      log('If using the SecureWebSocket client, verify reconnect option is enabled', 'warning', 1);
      return false;
    }
  } catch (error) {
    log(`Reconnection test failed: ${error.message}`, 'error');
    return false;
  }
}

// Test WebSocket security features
async function testSecurityFeatures() {
  log('Testing WebSocket security features');
  
  const results = {
    csrfProtection: false,
    rateLimiting: false,
    messageValidation: false
  };
  
  try {
    // Test 1: CSRF Protection
    log('Testing CSRF token protection', 'muted');
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
      
      ws.on('message', data => {
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
    
    if (authResult.success && authResult.message.payload && authResult.message.payload.csrfToken) {
      results.csrfProtection = true;
      log('CSRF token received in authentication response', 'success', 1);
      
      // Test sending message with invalid CSRF token
      const testMessage = {
        type: 'test_message',
        payload: { test: 'data' },
        timestamp: Date.now(),
        csrfToken: 'invalid_token'
      };
      
      // Wait for response to invalid CSRF token
      const csrfResult = await new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
          resolve({ rejected: false });
        }, config.timeout);
        
        ws.on('message', data => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'error' && 
                message.payload && 
                message.payload.code === 'csrf_validation_failed') {
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
        log('Invalid CSRF token correctly rejected', 'success', 1);
      } else {
        log('Invalid CSRF token was not rejected', 'warning', 1);
        results.csrfProtection = false;
      }
    } else {
      log('No CSRF token in authentication response', 'warning', 1);
    }
    
    // Test 2: Rate Limiting
    log('Testing rate limiting', 'muted');
    
    // Send multiple messages quickly to trigger rate limiting
    const messageCount = 20;
    let limitReached = false;
    
    for (let i = 0; i < messageCount; i++) {
      const message = {
        type: 'flood_test',
        payload: { iteration: i },
        timestamp: Date.now(),
        csrfToken: authResult.success ? authResult.message.payload.csrfToken : undefined
      };
      
      ws.send(JSON.stringify(message));
      
      // Check for rate limit error after each send
      if (i === messageCount - 1) {
        // Wait for rate limit error
        const rateLimitResult = await new Promise((resolve) => {
          let timeoutId = setTimeout(() => {
            resolve({ limited: false });
          }, 2000);
          
          ws.on('message', data => {
            try {
              const message = JSON.parse(data.toString());
              
              if (message.type === 'error' && 
                  message.payload && 
                  (message.payload.code === 'rate_limit_exceeded' || 
                   message.payload.reason === 'rate_limit_exceeded')) {
                clearTimeout(timeoutId);
                limitReached = true;
                resolve({ limited: true, message });
              }
            } catch (error) {
              log(`Error parsing message: ${error.message}`, 'muted');
            }
          });
        });
        
        if (rateLimitResult.limited || limitReached) {
          results.rateLimiting = true;
          log('Rate limiting correctly enforced', 'success', 1);
        } else {
          log('No rate limiting detected after sending multiple messages quickly', 'warning', 1);
        }
      }
    }
    
    // Test 3: Message Validation
    log('Testing message validation', 'muted');
    
    // Send an invalid message
    const invalidMessage = {
      type: 'not_a_valid_type',
      malformed: true,
      timestamp: 'not_a_number',
      csrfToken: authResult.success ? authResult.message.payload.csrfToken : undefined
    };
    
    // Wait for validation error
    const validationResult = await new Promise((resolve) => {
      let timeoutId = setTimeout(() => {
        resolve({ rejected: false });
      }, config.timeout);
      
      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'error' && 
              message.payload && 
              (message.payload.code === 'validation_error' || 
               message.payload.reason === 'validation_error' ||
               message.payload.code === 'invalid_message')) {
            clearTimeout(timeoutId);
            resolve({ rejected: true, message });
          }
        } catch (error) {
          log(`Error parsing message: ${error.message}`, 'muted');
        }
      });
      
      ws.send(JSON.stringify(invalidMessage));
    });
    
    if (validationResult.rejected) {
      results.messageValidation = true;
      log('Invalid message correctly rejected', 'success', 1);
    } else {
      log('Invalid message was not rejected', 'warning', 1);
    }
    
    // Close connection
    ws.close();
    
    // Summarize security features
    let securityScore = 0;
    securityScore += results.csrfProtection ? 1 : 0;
    securityScore += results.rateLimiting ? 1 : 0;
    securityScore += results.messageValidation ? 1 : 0;
    
    if (securityScore === 3) {
      log('All security features are implemented correctly', 'success');
    } else if (securityScore >= 1) {
      log(`Some security features detected (${securityScore}/3)`, 'warning');
    } else {
      log('No security features detected', 'error');
    }
    
    return securityScore > 0;
  } catch (error) {
    log(`Security test failed: ${error.message}`, 'error');
    return false;
  }
}

// Main function
async function main() {
  console.log(colors.bold('\nWebSocket Health Check Tool\n'));
  
  log(`Using WebSocket URL: ${colors.highlight(config.url)}`);
  log(`Using auth token: ${colors.highlight(config.token.substring(0, 3) + '...')}`);
  console.log();
  
  let results = {};
  
  // Run tests
  if (config.tests.includes('connection')) {
    results.connection = await testConnection();
    console.log();
    
    // Skip other tests if connection failed
    if (!results.connection) {
      log('Skipping remaining tests due to connection failure', 'warning');
      summarizeResults(results);
      return;
    }
  }
  
  if (config.tests.includes('auth')) {
    results.auth = await testAuthentication();
    console.log();
    
    // Skip other tests if authentication failed
    if (!results.auth) {
      log('Skipping remaining tests due to authentication failure', 'warning');
      summarizeResults(results);
      return;
    }
  }
  
  if (config.tests.includes('ping')) {
    results.ping = await testPingLatency();
    console.log();
  }
  
  if (config.tests.includes('reconnect')) {
    results.reconnect = await testReconnection();
    console.log();
  }
  
  if (config.tests.includes('security')) {
    results.security = await testSecurityFeatures();
    console.log();
  }
  
  // Summarize test results
  summarizeResults(results);
}

// Summarize test results
function summarizeResults(results) {
  console.log(colors.bold('\nTest Results Summary:\n'));
  
  let passedCount = 0;
  let totalCount = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    totalCount++;
    if (passed) passedCount++;
    
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    const status = passed ? colors.success('PASS') : colors.error('FAIL');
    console.log(`  ${testName.padEnd(20)} ${status}`);
  }
  
  console.log();
  const overallStatus = passedCount === totalCount ? 
    colors.success('PASSED') : 
    (passedCount > 0 ? colors.warning('PARTIAL') : colors.error('FAILED'));
  
  console.log(`  Overall: ${overallStatus} (${passedCount}/${totalCount} tests passed)`);
  console.log();
  
  // Show recommendations
  if (passedCount < totalCount) {
    console.log(colors.bold('Recommendations:'));
    
    if (!results.connection) {
      console.log('  - Check if the WebSocket server is running');
      console.log('  - Verify the WebSocket URL is correct');
      console.log('  - Check network connectivity and firewall settings');
    }
    
    if (!results.auth) {
      console.log('  - Verify the authentication token is valid');
      console.log('  - Check server-side authentication implementation');
    }
    
    if (!results.ping) {
      console.log('  - Implement health check handling on the server');
      console.log('  - Verify the server responds to ping messages');
    }
    
    if (!results.reconnect) {
      console.log('  - Implement automatic reconnection in the client');
      console.log('  - Verify the server allows reconnection');
    }
    
    if (!results.security) {
      console.log('  - Implement CSRF protection for WebSocket messages');
      console.log('  - Add rate limiting to prevent abuse');
      console.log('  - Implement strict message validation');
    }
    
    console.log();
  }
}

// Run the main function
main().catch(error => {
  console.error(colors.error(`\nUnexpected error: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});