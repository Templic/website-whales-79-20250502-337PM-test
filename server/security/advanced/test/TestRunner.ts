/**
 * Validation System Test Runner
 * 
 * This module provides a way to run the validation system tests programmatically,
 * and includes an API endpoint for triggering the tests remotely.
 */

import express from 'express';
import secureLogger from '../../utils/secureLogger';
import { runValidationSystemTest, testErrorCategorizationOnly, testFallbackMechanismOnly, testNotificationSystemOnly, testRuleVersioningOnly } from './ValidationSystemTest';

// Configure component name for logging
const logComponent = 'ValidationTestRunner';

// Test result storage
interface TestResult {
  id: string;
  timestamp: Date;
  success: boolean;
  component?: string;
  details: any;
}

const testResults: TestResult[] = [];

/**
 * Register validation test routes
 */
export function registerValidationTestRoutes(app: express.Application): void {
  // Endpoint to run all tests
  app.post('/api/validation/test/run-all', async (req, res) => {
    secureLogger('info', logComponent, 'Running all validation system tests');
    
    try {
      const results = await runValidationSystemTest();
      
      // Store test results
      const testId = `test-${Date.now()}`;
      testResults.push({
        id: testId,
        timestamp: new Date(),
        success: results.success,
        details: results
      });
      
      res.json({
        success: true,
        testId,
        results
      });
    } catch (error) {
      secureLogger('error', logComponent, 'Test runner encountered an error', {
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to run a specific component test
  app.post('/api/validation/test/run-component', async (req, res) => {
    const { component } = req.body;
    
    if (!component) {
      return res.status(400).json({
        success: false,
        error: 'Component name is required'
      });
    }
    
    secureLogger('info', logComponent, `Running validation test for component: ${component}`);
    
    try {
      let result = false;
      
      switch (component) {
        case 'errorCategorization':
          result = testErrorCategorizationOnly();
          break;
          
        case 'fallbackMechanism':
          result = testFallbackMechanismOnly();
          break;
          
        case 'notificationSystem':
          result = testNotificationSystemOnly();
          break;
          
        case 'ruleVersioning':
          result = testRuleVersioningOnly();
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: `Unknown component: ${component}`
          });
      }
      
      // Store test results
      const testId = `${component}-test-${Date.now()}`;
      testResults.push({
        id: testId,
        timestamp: new Date(),
        success: result,
        component,
        details: { success: result }
      });
      
      res.json({
        success: true,
        testId,
        component,
        result
      });
    } catch (error) {
      secureLogger('error', logComponent, `Test runner encountered an error for component: ${component}`, {
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      res.status(500).json({
        success: false,
        component,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to get test results
  app.get('/api/validation/test/results', (req, res) => {
    // Optional filter by component or success status
    const { component, status } = req.query;
    
    let filteredResults = [...testResults];
    
    if (component) {
      filteredResults = filteredResults.filter(r => r.component === component);
    }
    
    if (status !== undefined) {
      const successFilter = status === 'success';
      filteredResults = filteredResults.filter(r => r.success === successFilter);
    }
    
    res.json({
      success: true,
      count: filteredResults.length,
      results: filteredResults
    });
  });
  
  // Endpoint to get a specific test result
  app.get('/api/validation/test/results/:id', (req, res) => {
    const { id } = req.params;
    
    const result = testResults.find(r => r.id === id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Test result not found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      result
    });
  });
  
  // Endpoint to clear test results
  app.delete('/api/validation/test/results', (req, res) => {
    const count = testResults.length;
    testResults.length = 0;
    
    res.json({
      success: true,
      message: `Cleared ${count} test results`
    });
  });
  
  secureLogger('info', logComponent, 'Validation test routes registered');
}

/**
 * Run a standalone test of the validation system
 */
export async function runStandaloneTest(): Promise<void> {
  secureLogger('info', logComponent, 'Running standalone validation system test');
  
  try {
    const results = await runValidationSystemTest();
    
    if (results.success) {
      secureLogger('info', logComponent, 'Standalone test completed successfully', {
        metadata: {
          results
        }
      });
    } else {
      secureLogger('error', logComponent, 'Standalone test failed', {
        metadata: {
          results,
          errors: results.errors
        }
      });
    }
  } catch (error) {
    secureLogger('error', logComponent, 'Standalone test encountered an unexpected error', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}