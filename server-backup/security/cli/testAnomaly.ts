/**
 * Command-line interface for testing the ML-based Anomaly Detection System
 * 
 * Usage:
 *   ts-node testAnomaly.ts [option]
 * 
 * Options:
 *   --all                Run all tests
 *   --normal             Test normal request detection
 *   --sql-injection      Test SQL injection detection
 *   --rate-limit         Test rate limiting detection
 *   --path-traversal     Test path traversal detection
 *   --xss                Test XSS attack detection
 *   --data-exfiltration  Test data exfiltration detection
 *   --sensitive-data     Test sensitive data exposure detection
 *   --unusual-behavior   Test unusual user behavior detection
 */

import { 
  runAllTests, 
  simulateNormalRequest,
  simulateSqlInjectionAttack,
  simulateRateLimitAttack,
  simulatePathTraversalAttack,
  simulateXssAttack,
  simulateDataExfiltrationAttempt,
  simulateSensitiveDataExposure,
  simulateUnusualUserBehavior
} from '../tests/testAnomalyDetection';

console.log('ML-Based Anomaly Detection System Tester');
console.log('=======================================');

async function main() {
  const args = process.argv.slice(2: any);
  
  if (args.length === 0) {
    printUsage();
    return;
  }
  
  const option = args[0].toLowerCase();
  
  try {
    switch(option: any) {
      case '--all':
        await runAllTests();
        break;
      case '--normal':
        await simulateNormalRequest();
        break;
      case '--sql-injection':
        await simulateSqlInjectionAttack();
        break;
      case '--rate-limit':
        await simulateRateLimitAttack();
        break;
      case '--path-traversal':
        await simulatePathTraversalAttack();
        break;
      case '--xss':
        await simulateXssAttack();
        break;
      case '--data-exfiltration':
        await simulateDataExfiltrationAttempt();
        break;
      case '--sensitive-data':
        await simulateSensitiveDataExposure();
        break;
      case '--unusual-behavior':
        await simulateUnusualUserBehavior();
        break;
      default:
        console.error(`Unknown option: ${option}`);
        printUsage();
        break;
    }
  } catch (error: unknown) {
    console.error('Error running test:', error);
  }
}

function printUsage() {
  console.log(`
Usage:
  ts-node testAnomaly.ts [option]

Options:
  --all                Run all tests
  --normal             Test normal request detection
  --sql-injection      Test SQL injection detection
  --rate-limit         Test rate limiting detection
  --path-traversal     Test path traversal detection
  --xss                Test XSS attack detection
  --data-exfiltration  Test data exfiltration detection
  --sensitive-data     Test sensitive data exposure detection
  --unusual-behavior   Test unusual user behavior detection
  `);
}

// Run the main function
main().catch(console.error);