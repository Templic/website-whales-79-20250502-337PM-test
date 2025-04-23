/**
 * Test file for Anomaly Detection System
 * 
 * This file contains a set of functions to test and benchmark the ML-based anomaly detection system.
 * It simulates various types of requests and attacks to verify the detection capabilities.
 */

import * as express from 'express';
import { detectAnomaly, createAnomalyDetectionMiddleware } from '../advanced/ml/AnomalyDetection';
import { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';

/**
 * Simulates a normal API request
 */
async function simulateNormalRequest() {
  const req = {
    ip: '192.168.1.100',
    path: '/api/products',
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '0'
    },
    body: {},
    query: { category: 'electronics', page: '1' },
    securityContext: {
      requestId: 'test-req-id-1',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing normal API request ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates a SQL injection attack
 */
async function simulateSqlInjectionAttack() {
  const req = {
    ip: '192.168.1.101',
    path: '/api/users',
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '250'
    },
    body: {},
    query: { id: "1'; DROP TABLE users; --" },
    securityContext: {
      requestId: 'test-req-id-2',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing SQL injection attack ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates a rate limit attack (rapid requests from same IP)
 */
async function simulateRateLimitAttack() {
  const ip = '192.168.1.102';
  const results = [];
  
  console.log('\n--- Testing rate limit attack (sending 50 requests rapidly from same IP) ---');
  
  // Send 50 requests in rapid succession from the same IP
  for (let i = 0; i < 50; i++) {
    const req = {
      ip,
      path: '/api/login',
      method: 'POST',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'content-length': '100'
      },
      body: { username: 'test', password: 'password' + i },
      securityContext: {
        requestId: `test-req-id-3-${i}`,
        timestamp: new Date(),
        securityChecks: {}
      }
    } as any;
    
    const result = await detectAnomaly(req);
    results.push(result);
    
    // Small delay to simulate realistic timing
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Get the last result, which should have the highest anomaly score
  const lastResult = results[results.length - 1];
  console.log('Anomaly detected:', lastResult.isAnomaly);
  console.log('Score:', lastResult.score);
  console.log('Reason:', lastResult.reason || 'N/A');
  console.log('Type:', lastResult.anomalyType || 'N/A');
  
  return results;
}

/**
 * Simulates a path traversal attack
 */
async function simulatePathTraversalAttack() {
  const req = {
    ip: '192.168.1.103',
    path: '/api/files',
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '50'
    },
    body: {},
    query: { filename: '../../../etc/passwd' },
    securityContext: {
      requestId: 'test-req-id-4',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing path traversal attack ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates an XSS attack
 */
async function simulateXssAttack() {
  const req = {
    ip: '192.168.1.104',
    path: '/api/comments',
    method: 'POST',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '200'
    },
    body: {
      comment: '<script>alert("XSS Attack");</script>',
      postId: 123
    },
    securityContext: {
      requestId: 'test-req-id-5',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing XSS attack ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates data exfiltration attempt
 */
async function simulateDataExfiltrationAttempt() {
  const req = {
    ip: '192.168.1.105',
    path: '/api/query',
    method: 'POST',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '300'
    },
    body: {
      query: "SELECT * FROM users WHERE email LIKE '%@company.com'",
      format: 'csv'
    },
    securityContext: {
      requestId: 'test-req-id-6',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing data exfiltration attempt ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates sensitive data in request
 */
async function simulateSensitiveDataExposure() {
  const req = {
    ip: '192.168.1.106',
    path: '/api/payment',
    method: 'POST',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'content-length': '500'
    },
    body: {
      cardNumber: '4111-1111-1111-1111',
      cvv: '123',
      expiryDate: '12/25',
      name: 'John Doe',
      amount: 99.99
    },
    securityContext: {
      requestId: 'test-req-id-7',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  console.log('\n--- Testing sensitive data exposure ---');
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Simulates unusual behavior from a known user
 */
async function simulateUnusualUserBehavior() {
  // First, establish normal behavior for this user
  const userId = 'user-12345';
  const ip = '192.168.1.107';
  
  console.log('\n--- Establishing normal behavior for user ---');
  
  // Send 10 normal requests
  for (let i = 0; i < 10; i++) {
    const req = {
      ip,
      path: '/api/dashboard',
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'content-length': '0'
      },
      user: { id: userId, username: 'testuser' },
      query: { view: 'summary' },
      securityContext: {
        requestId: `test-req-id-8-normal-${i}`,
        timestamp: new Date(),
        securityChecks: {}
      }
    } as any;
    
    await detectAnomaly(req);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('--- Now simulating unusual behavior for same user ---');
  
  // Now, sudden unusual behavior
  const req = {
    ip: '203.0.113.42', // Different IP address
    path: '/api/admin/users',
    method: 'DELETE', // Unusual method
    headers: {
      'user-agent': 'curl/7.68.0', // Different user agent
      'content-length': '0'
    },
    user: { id: userId, username: 'testuser' },
    securityContext: {
      requestId: 'test-req-id-8-unusual',
      timestamp: new Date(),
      securityChecks: {}
    }
  } as any;
  
  const result = await detectAnomaly(req);
  console.log('Anomaly detected:', result.isAnomaly);
  console.log('Score:', result.score);
  console.log('Reason:', result.reason || 'N/A');
  console.log('Type:', result.anomalyType || 'N/A');
  
  return result;
}

/**
 * Run all tests sequentially
 */
async function runAllTests() {
  console.log('=== STARTING ANOMALY DETECTION TESTS ===');
  
  try {
    // First, run normal requests to establish baseline
    for (let i = 0; i < 20; i++) {
      const req = {
        ip: `192.168.1.${10 + i}`,
        path: ['/api/products', '/api/categories', '/api/users/profile', '/api/orders'][i % 4],
        method: ['GET', 'GET', 'GET', 'POST'][i % 4],
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-length': i % 4 === 3 ? '150' : '0' // POST requests have content
        },
        body: i % 4 === 3 ? { item: 'product-' + i, quantity: i } : {},
        query: i % 4 === 0 ? { category: 'electronics', page: String(Math.floor(i / 4) + 1) } : {},
        securityContext: {
          requestId: `test-req-id-baseline-${i}`,
          timestamp: new Date(),
          securityChecks: {}
        }
      } as any;
      
      await detectAnomaly(req);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n=== BASELINE ESTABLISHED, STARTING ATTACK TESTS ===');
    
    // Run all test scenarios
    await simulateNormalRequest();
    await simulateSqlInjectionAttack();
    await simulatePathTraversalAttack();
    await simulateXssAttack();
    await simulateDataExfiltrationAttempt();
    await simulateSensitiveDataExposure();
    await simulateUnusualUserBehavior();
    
    // Rate attack test is last as it generates many events
    await simulateRateLimitAttack();
    
    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error: unknown) {
    console.error('Error during anomaly detection tests:', error);
  }
}

// Export the test functions
export {
  simulateNormalRequest,
  simulateSqlInjectionAttack,
  simulateRateLimitAttack,
  simulatePathTraversalAttack,
  simulateXssAttack,
  simulateDataExfiltrationAttempt,
  simulateSensitiveDataExposure,
  simulateUnusualUserBehavior,
  runAllTests
};

// For direct execution from command line
if (require.main === module) {
  runAllTests();
}