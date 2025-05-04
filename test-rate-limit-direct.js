/**
 * Direct Rate Limiting System Test
 * 
 * This script tests the core rate limiting functionality directly,
 * bypassing Express and CSRF middleware.
 */

import { rateLimitingSystem } from './server/security/advanced/threat/RateLimitingSystem.js';

// Test direct rate limiting functionality
async function testDirectRateLimiting() {
  console.log("=== Testing Direct Rate Limiting ===");
  
  // Mock client IP and user ID for testing
  const clientIp = '127.0.0.1';
  const userId = 'test-user';
  
  // Test consuming regular tokens
  console.log("\n--- Testing Token Consumption ---");
  for (let i = 0; i < 5; i++) {
    // Build context for a basic API request
    const context = {
      clientIp,
      userId,
      path: '/api/test',
      method: 'GET',
      isAuthenticated: true,
      resourceType: 'api'
    };
    
    // Consume tokens (default: 1 token)
    const result = rateLimitingSystem.consumeTokens(context);
    console.log(`Request ${i+1}: Consumed 1 token - Allowed: ${result.allowed}, Remaining: ${result.remaining}, Reset: ${result.resetTime}`);
  }
  
  // Test consuming high-cost tokens
  console.log("\n--- Testing High-Cost Token Consumption ---");
  for (let i = 0; i < 3; i++) {
    // Build context for a more expensive operation
    const context = {
      clientIp,
      userId,
      path: '/api/search',
      method: 'GET',
      isAuthenticated: true,
      resourceType: 'api',
      costMultiplier: 5  // 5x the cost of a regular request
    };
    
    // Consume tokens (5 tokens per request)
    const result = rateLimitingSystem.consumeTokens(context, 5);
    console.log(`Request ${i+1}: Consumed 5 tokens - Allowed: ${result.allowed}, Remaining: ${result.remaining}, Reset: ${result.resetTime}`);
  }
  
  // Test security impact
  console.log("\n--- Testing Security Events Impact ---");
  
  // Record a security failure
  console.log("Recording security failure...");
  rateLimitingSystem.recordFailedSecurityCheck({
    clientIp,
    userId,
    securityComponent: 'test',
    checkType: 'simulation',
    failureType: 'simulated_failure',
    path: '/api/test',
    failureValue: 10 // High penalty for testing
  });
  
  // Try a request after security failure
  const contextAfterFailure = {
    clientIp,
    userId,
    path: '/api/test',
    method: 'GET',
    isAuthenticated: true,
    resourceType: 'api'
  };
  
  const resultAfterFailure = rateLimitingSystem.consumeTokens(contextAfterFailure);
  console.log(`Request after security failure - Allowed: ${resultAfterFailure.allowed}, Remaining: ${resultAfterFailure.remaining}, Reset: ${resultAfterFailure.resetTime}`);
  
  // Record a security success
  console.log("\nRecording security success...");
  rateLimitingSystem.recordSuccessfulSecurityCheck({
    clientIp,
    userId, 
    securityComponent: 'test',
    checkType: 'simulation',
    successValue: 5 // Reward for testing
  });
  
  // Try a request after security success
  const contextAfterSuccess = {
    clientIp,
    userId,
    path: '/api/test',
    method: 'GET',
    isAuthenticated: true,
    resourceType: 'api'
  };
  
  const resultAfterSuccess = rateLimitingSystem.consumeTokens(contextAfterSuccess);
  console.log(`Request after security success - Allowed: ${resultAfterSuccess.allowed}, Remaining: ${resultAfterSuccess.remaining}, Reset: ${resultAfterSuccess.resetTime}`);
  
  // Generate report
  console.log("\n--- Rate Limiting System Report ---");
  const report = rateLimitingSystem.generateReport();
  console.log(JSON.stringify(report, null, 2));
  
  // Get adaptive adjustment metrics
  console.log("\n--- Adaptive Adjustment Metrics ---");
  const adaptiveMetrics = rateLimitingSystem.getAdaptiveAdjustmentMetrics();
  console.log(JSON.stringify(adaptiveMetrics, null, 2));
}

// Run the tests
testDirectRateLimiting().catch(error => {
  console.error("Error running direct rate limiting tests:", error);
});