/**
 * Error Handler Tests
 * 
 * This file contains tests for the error handler utility.
 */

import {
  handleError,
  handleSecurityError,
  handleValidationError,
  handleDatabaseError,
  handleApiError,
  handleAuthError,
  createErrorResponse,
  withErrorHandling
} from '../utils/error-handler';

/**
 * Test handleError function
 */
async function testHandleError() {
  console.log('\n--- Testing handleError ---');
  
  // Test with Error object
  const error1 = new Error('Test error');
  const baseError1 = handleError(error1);
  console.log('Error object test:', {
    message: baseError1.message === 'Test error',
    hasCode: 'code' in baseError1,
    hasTimestamp: 'timestamp' in baseError1
  });
  
  // Test with string
  const baseError2 = handleError('String error');
  console.log('String error test:', {
    message: baseError2.message === 'String error',
    hasCode: 'code' in baseError2,
    hasTimestamp: 'timestamp' in baseError2
  });
  
  // Test with null
  const baseError3 = handleError(null, 'Default message');
  console.log('Null error test:', {
    message: baseError3.message === 'Default message',
    hasCode: 'code' in baseError3,
    hasTimestamp: 'timestamp' in baseError3
  });
  
  console.log('handleError test completed');
}

/**
 * Test handleSecurityError function
 */
async function testHandleSecurityError() {
  console.log('\n--- Testing handleSecurityError ---');
  
  // Test with Error object
  const error = new Error('Security breach');
  const securityError = handleSecurityError(error, 'high', { 
    userId: 'user123', 
    ipAddress: '192.168.1.1' 
  });
  
  console.log('Security error test:', {
    message: securityError.message === 'Security breach',
    severity: securityError.severity === 'high',
    name: securityError.name === 'SecurityError',
    hasContext: securityError.context && securityError.context.userId === 'user123'
  });
  
  console.log('handleSecurityError test completed');
}

/**
 * Test handleValidationError function
 */
async function testHandleValidationError() {
  console.log('\n--- Testing handleValidationError ---');
  
  // Test with fieldErrors
  const error = new Error('Validation failed');
  const fieldErrors = { 
    username: 'Username is required', 
    email: 'Invalid email format' 
  };
  
  const validationError = handleValidationError(error, fieldErrors);
  
  console.log('Validation error test:', {
    message: validationError.message === 'Validation failed',
    name: validationError.name === 'ValidationError',
    statusCode: validationError.statusCode === 400,
    hasFieldErrors: validationError.fieldErrors && 
      validationError.fieldErrors.username === 'Username is required'
  });
  
  console.log('handleValidationError test completed');
}

/**
 * Test handleDatabaseError function
 */
async function testHandleDatabaseError() {
  console.log('\n--- Testing handleDatabaseError ---');
  
  // Test with database error
  const error = new Error('Database connection failed');
  (error as any).code = 'ECONNREFUSED';
  
  const dbError = handleDatabaseError(error, 'query', 'SELECT * FROM users');
  
  console.log('Database error test:', {
    message: dbError.message === 'Database connection failed',
    name: dbError.name === 'DatabaseError',
    operation: dbError.operation === 'query',
    hasQuery: !!dbError.query,
    dbErrorCode: dbError.dbErrorCode === 'ECONNREFUSED'
  });
  
  console.log('handleDatabaseError test completed');
}

/**
 * Test handleApiError function
 */
async function testHandleApiError() {
  console.log('\n--- Testing handleApiError ---');
  
  // Test with API error
  const error = new Error('API request failed');
  
  const apiError = handleApiError(error, '/api/users', 'GET', { id: '123' });
  
  console.log('API error test:', {
    message: apiError.message === 'API request failed',
    name: apiError.name === 'ApiError',
    endpoint: apiError.endpoint === '/api/users',
    method: apiError.method === 'GET',
    hasRequestData: apiError.requestData && (apiError.requestData as any).id === '123'
  });
  
  console.log('handleApiError test completed');
}

/**
 * Test handleAuthError function
 */
async function testHandleAuthError() {
  console.log('\n--- Testing handleAuthError ---');
  
  // Test with auth error
  const error = new Error('Authentication failed');
  
  const authError = handleAuthError(error, 'unauthorized', { 
    userId: 'user123',
    requiredPermission: 'admin:read' 
  });
  
  console.log('Auth error test:', {
    message: authError.message === 'Authentication failed',
    name: authError.name === 'AuthError',
    authErrorType: authError.authErrorType === 'unauthorized',
    statusCode: authError.statusCode === 401,
    severity: authError.severity === 'high',
    requiredPermission: authError.requiredPermission === 'admin:read'
  });
  
  console.log('handleAuthError test completed');
}

/**
 * Test createErrorResponse function
 */
async function testCreateErrorResponse() {
  console.log('\n--- Testing createErrorResponse ---');
  
  // Test creating error response
  const errorResponse = createErrorResponse(
    'Operation failed',
    400,
    'INVALID_INPUT',
    { details: 'Missing required fields' }
  );
  
  console.log('Error response test:', {
    success: errorResponse.success === false,
    message: errorResponse.error.message === 'Operation failed',
    code: errorResponse.error.code === 'INVALID_INPUT',
    statusCode: errorResponse.error.statusCode === 400,
    hasData: errorResponse.data && (errorResponse.data as any).details === 'Missing required fields',
    hasTimestamp: !!errorResponse.timestamp
  });
  
  console.log('createErrorResponse test completed');
}

/**
 * Test withErrorHandling function
 */
async function testWithErrorHandling() {
  console.log('\n--- Testing withErrorHandling ---');
  
  // Test successful operation
  try {
    const result = await withErrorHandling(async () => {
      return 'Success';
    });
    
    console.log('Success scenario test:', {
      result: result === 'Success'
    });
  } catch (error) {
    console.error('Success scenario test failed:', error);
  }
  
  // Test failed operation
  try {
    await withErrorHandling(async () => {
      throw new Error('Operation failed');
    });
    
    console.error('Error scenario test failed: Expected error was not thrown');
  } catch (error: unknown) {
    console.log('Error scenario test:', {
      isBaseError: 'code' in error,
      message: error.message === 'Operation failed'
    });
  }
  
  // Test with custom error handler
  try {
    await withErrorHandling(
      async () => {
        throw new Error('Custom handled error');
      },
      (error) => {
        return {
          ...error,
          code: 'CUSTOM_ERROR',
          handled: true
        } as any;
      }
    );
    
    console.error('Custom handler test failed: Expected error was not thrown');
  } catch (error: unknown) {
    console.log('Custom handler test:', {
      isBaseError: 'code' in error,
      message: error.message === 'Custom handled error',
      code: error.code === 'CUSTOM_ERROR',
      handled: error.handled === true
    });
  }
  
  console.log('withErrorHandling test completed');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Running Error Handler Tests ===');
  
  await testHandleError();
  await testHandleSecurityError();
  await testHandleValidationError();
  await testHandleDatabaseError();
  await testHandleApiError();
  await testHandleAuthError();
  await testCreateErrorResponse();
  await testWithErrorHandling();
  
  console.log('\n=== All Error Handler Tests Completed ===');
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});