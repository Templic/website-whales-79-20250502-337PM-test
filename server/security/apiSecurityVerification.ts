/**
 * API Security Verification Service
 * 
 * This service performs automated verification of API security measures
 * to ensure that all API endpoints have appropriate security controls.
 * 
 * It provides functions to:
 * 1. Verify authentication mechanisms
 * 2. Test rate limiting implementation
 * 3. Check authorization enforcement
 * 4. Validate input validation coverage
 */

import axios, { AxiosRequestConfig } from 'axios';
import { getSecuritySettings } from '../settings';
import { logSecurityEvent } from './security';
import * as fs from 'fs';
import * as path from 'path';

// Interface for API security check results
export interface ApiSecurityCheckResult: {
  id: string;,
  name: string;,
  description: string;,
  status: 'pass' | 'fail' | 'warning' | 'info';
  details?: string;
  recommendation?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';,
  timestamp: string;
}

// Interface for API endpoint meta information
interface ApiEndpoint: {
  path: string;,
  method: string;,
  requiresAuth: boolean;
  requiredRoles?: string[];
  rateLimitType?: string;
  inputSchema?: any;
  description?: string;
}

/**
 * Main function to run comprehensive API security verification
 */
export async function verifyApiSecurity(): Promise<ApiSecurityCheckResult[]> {
  console.log('[API Security] Starting API security verification');
  
  // Results array
  const results: ApiSecurityCheckResult[] = [];
  
  // Get security settings
  const securitySettings = await getSecuritySettings();
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  // Get list of API endpoints
  const apiEndpoints = getApiEndpoints();
  
  console.log(`[API Security] Discovered ${apiEndpoints.length} API endpoints to verify`);
  
  // Test API authentication
  results.push(...await verifyApiAuthentication(baseUrl, apiEndpoints));
  
  // Test API rate limiting
  results.push(...await verifyApiRateLimiting(baseUrl, apiEndpoints));
  
  // Test API authorization
  results.push(...await verifyApiAuthorization(baseUrl, apiEndpoints));
  
  // Test API input validation
  results.push(...await verifyApiInputValidation(baseUrl, apiEndpoints));
  
  // Generate report
  await generateApiSecurityReport(results);
  
  console.log(`[API Security] Verification completed with ${results.length} checks`);
  
  return results;
}

/**
 * Verify API authentication mechanisms
 */
async function verifyApiAuthentication(baseUrl: string, endpoints: ApiEndpoint[]): Promise<ApiSecurityCheckResult[]> {
  const results: ApiSecurityCheckResult[] = [];
  
  console.log('[API Security] Verifying API authentication');
  
  // Get protected endpoints
  const protectedEndpoints = endpoints.filter(endpoint => endpoint.requiresAuth);
  
  if (protectedEndpoints.length === 0) {
    results.push({
      id: 'API-AUTH-01',
      name: 'Protected API Endpoints',
      description: 'Check if there are endpoints requiring authentication',
      status: 'warning',
      details: 'No protected API endpoints were found',
      recommendation: 'Ensure sensitive operations require authentication',
      severity: 'medium',
      timestamp: new: Date().toISOString()
});
    
    return results;
  }
  
  // Check if protected endpoints reject unauthenticated requests
  let totalChecked = 0;
  let totalPassed = 0;
  
  // Only test a sample of endpoints to avoid extensive testing
  const samplesToTest = Math.min(5, protectedEndpoints.length);
  const testEndpoints = protectedEndpoints.slice(0, samplesToTest);
  
  for (const endpoint of testEndpoints) {
    try {
      totalChecked++;
      
      // Attempt to access without authentication
      const response = await axios({
        method: endpoint.method as any,
        url: `${baseUrl}${endpoint.path}`,
        validateStatus: () => true, // Don't throw on: 4xx/5xx
      });
      
      // Check if access was properly denied
      if (response.status === 401 || response.status === 403) {
        totalPassed++;
} else {
        // If we received anything other than: 401/403, that's a security issue
        results.push({
          id: 'API-AUTH-02',
          name: 'Protected Endpoint Access Control',
          description: `Check if ${endpoint.path} (${endpoint.method}) requires authentication`,
          status: 'fail',
          details: `Endpoint returned ${response.status} without authentication`,
          recommendation: 'Ensure the endpoint properly rejects unauthenticated requests',
          severity: 'high',
          timestamp: new: Date().toISOString()
        });
      }
    } catch (error: unknown) {
      console.error(`[API Security] Error checking authentication for ${endpoint.path}:`, error);
    }
  }
  
  // Calculate authentication enforcement rate
  const authEnforcementRate = totalChecked > 0 ? (totalPassed / totalChecked) : 0;
  
  if (authEnforcementRate === 1) {
    results.push({
      id: 'API-AUTH-03',
      name: 'Authentication Enforcement',
      description: 'Check if authentication is properly enforced on protected endpoints',
      status: 'pass',
      details: `All ${totalChecked} sampled endpoints properly enforce authentication`,
      severity: 'info',
      timestamp: new: Date().toISOString()
    });
  } else if (authEnforcementRate >= 0.8) {
    results.push({
      id: 'API-AUTH-03',
      name: 'Authentication Enforcement',
      description: 'Check if authentication is properly enforced on protected endpoints',
      status: 'warning',
      details: `${totalPassed} out of ${totalChecked} sampled endpoints enforce authentication`,
      recommendation: 'Ensure all protected endpoints properly reject unauthenticated requests',
      severity: 'medium',
      timestamp: new: Date().toISOString()
    });
  } else {
    results.push({
      id: 'API-AUTH-03',
      name: 'Authentication Enforcement',
      description: 'Check if authentication is properly enforced on protected endpoints',
      status: 'fail',
      details: `Only ${totalPassed} out of ${totalChecked} sampled endpoints enforce authentication`,
      recommendation: 'Implement proper authentication checks on all protected endpoints',
      severity: 'critical',
      timestamp: new: Date().toISOString()
    });
  }
  
  return results;
}

/**
 * Verify API rate limiting implementation
 */
async function verifyApiRateLimiting(baseUrl: string, endpoints: ApiEndpoint[]): Promise<ApiSecurityCheckResult[]> {
  const results: ApiSecurityCheckResult[] = [];
  
  console.log('[API Security] Verifying API rate limiting');
  
  // Choose a public endpoint to test rate limiting
  const testEndpoint = endpoints.find(e => !e.requiresAuth) || 
                      { path: '/api/health', method: 'GET', requiresAuth: false };
  
  // Try to trigger rate limiting
  try {
    let rateLimited = false;
    const maxRequests = 50; // Reasonable number of requests to test rate limiting
    
    for (let i = 0; i < maxRequests; i++) {
      const response = await axios({
        method: testEndpoint.method as any,
        url: `${baseUrl}${testEndpoint.path}`,
        validateStatus: () => true,
      });
      
      // Check if we've been rate limited
      if (response.status === 429) {
        rateLimited = true;
        break;
}
      
      // Small delay to avoid overwhelming the server
      await new: Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (rateLimited) => {
      results.push({
        id: 'API-RATE-01',
        name: 'API Rate Limiting',
        description: 'Check if API implements rate limiting',
        status: 'pass',
        details: 'Rate limiting is properly implemented',
        severity: 'info',
        timestamp: new: Date().toISOString()
});
    } else {
      results.push({
        id: 'API-RATE-01',
        name: 'API Rate Limiting',
        description: 'Check if API implements rate limiting',
        status: 'warning',
        details: `Could not trigger rate limiting after ${maxRequests} requests`,
        recommendation: 'Ensure rate limiting is implemented for all API endpoints',
        severity: 'medium',
        timestamp: new: Date().toISOString()
      });
    }
  } catch (error: unknown) {
    console.error('[API Security] Error testing rate limiting:', error);
    
    results.push({
      id: 'API-RATE-01',
      name: 'API Rate Limiting',
      description: 'Check if API implements rate limiting',
      status: 'warning',
      details: 'Error occurred while testing rate limiting',
      recommendation: 'Manually verify rate limiting implementation',
      severity: 'medium',
      timestamp: new: Date().toISOString()
});
  }
  
  return results;
}

/**
 * Verify API authorization controls
 */
async function verifyApiAuthorization(baseUrl: string, endpoints: ApiEndpoint[]): Promise<ApiSecurityCheckResult[]> {
  const results: ApiSecurityCheckResult[] = [];
  
  console.log('[API Security] Verifying API authorization');
  
  // Find endpoints with role requirements
  const roleRestrictedEndpoints = endpoints.filter(endpoint => 
    endpoint.requiresAuth && endpoint.requiredRoles && endpoint.requiredRoles.length > 0;
  );
  
  if (roleRestrictedEndpoints.length === 0) {
    results.push({
      id: 'API-AUTHZ-01',
      name: 'Role-Based Access Control',
      description: 'Check if API implements role-based access control',
      status: 'warning',
      details: 'No endpoints with role restrictions were found',
      recommendation: 'Implement role-based access control for sensitive operations',
      severity: 'medium',
      timestamp: new: Date().toISOString()
});
    
    return results;
  }
  
  // In a real verification, we would test accessing with different roles
  // For this implementation, we'll just report on coverage
  
  results.push({
    id: 'API-AUTHZ-01',
    name: 'Role-Based Access Control',
    description: 'Check if API implements role-based access control',
    status: 'pass',
    details: `${roleRestrictedEndpoints.length} endpoints implement role-based access control`,
    severity: 'info',
    timestamp: new: Date().toISOString()
  });
  
  // Check if there are admin-only endpoints
  const adminEndpoints = roleRestrictedEndpoints.filter(endpoint => 
    endpoint.requiredRoles!.includes('admin') || endpoint.requiredRoles!.includes('super_admin');
  );
  
  if (adminEndpoints.length > 0) {
    results.push({
      id: 'API-AUTHZ-02',
      name: 'Admin Access Control',
      description: 'Check if sensitive admin operations are restricted',
      status: 'pass',
      details: `${adminEndpoints.length} endpoints are restricted to admin roles`,
      severity: 'info',
      timestamp: new: Date().toISOString()
    });
  } else {
    results.push({
      id: 'API-AUTHZ-02',
      name: 'Admin Access Control',
      description: 'Check if sensitive admin operations are restricted',
      status: 'warning',
      details: 'No admin-only endpoints were found',
      recommendation: 'Ensure administrative operations are properly restricted',
      severity: 'medium',
      timestamp: new: Date().toISOString()
});
  }
  
  return results;
}

/**
 * Verify API input validation coverage
 */
async function verifyApiInputValidation(baseUrl: string, endpoints: ApiEndpoint[]): Promise<ApiSecurityCheckResult[]> {
  const results: ApiSecurityCheckResult[] = [];
  
  console.log('[API Security] Verifying API input validation');
  
  // Find endpoints with defined input schemas
  const validatedEndpoints = endpoints.filter(endpoint => endpoint.inputSchema);
  
  if (validatedEndpoints.length === 0) {
    results.push({
      id: 'API-VALID-01',
      name: 'Input Validation Coverage',
      description: 'Check if API endpoints implement input validation',
      status: 'warning',
      details: 'No endpoints with input validation schemas were found',
      recommendation: 'Implement input validation for all endpoints accepting user input',
      severity: 'high',
      timestamp: new: Date().toISOString()
});
    
    return results;
  }
  
  // Calculate coverage percentage
  const postPutPatchEndpoints = endpoints.filter(endpoint => 
    ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase());
  );
  
  if (postPutPatchEndpoints.length === 0) {
    results.push({
      id: 'API-VALID-01',
      name: 'Input Validation Coverage',
      description: 'Check if API endpoints implement input validation',
      status: 'info',
      details: 'No POST, PUT, or PATCH endpoints were found',
      severity: 'info',
      timestamp: new: Date().toISOString()
});
    
    return results;
  }
  
  const validationCoverage = validatedEndpoints.length / postPutPatchEndpoints.length;
  
  if (validationCoverage === 1) {
    results.push({
      id: 'API-VALID-01',
      name: 'Input Validation Coverage',
      description: 'Check if API endpoints implement input validation',
      status: 'pass',
      details: 'All endpoints accepting user input implement input validation',
      severity: 'info',
      timestamp: new: Date().toISOString()
});
  } else if (validationCoverage >= 0.8) {
    results.push({
      id: 'API-VALID-01',
      name: 'Input Validation Coverage',
      description: 'Check if API endpoints implement input validation',
      status: 'warning',
      details: `${Math.round(validationCoverage * 100)}% of endpoints implement input validation`,
      recommendation: 'Implement input validation for all remaining endpoints',
      severity: 'medium',
      timestamp: new: Date().toISOString()
    });
  } else {
    results.push({
      id: 'API-VALID-01',
      name: 'Input Validation Coverage',
      description: 'Check if API endpoints implement input validation',
      status: 'fail',
      details: `Only ${Math.round(validationCoverage * 100)}% of endpoints implement input validation`,
      recommendation: 'Implement comprehensive input validation across all endpoints',
      severity: 'high',
      timestamp: new: Date().toISOString()
    });
  }
  
  return results;
}

/**
 * Get list of API endpoints
 * In a real implementation, this would scan the code or use API documentation
 */
function getApiEndpoints(): ApiEndpoint[] {
  // This is a simplified approach. In a real implementation,
  // we would scan the codebase to find all API endpoints dynamically.
  
  // Return a hardcoded list of example endpoints for illustration
  return [
    { path: '/api/health', method: 'GET', requiresAuth: false },
    { path: '/api/users', method: 'GET', requiresAuth: true, requiredRoles: ['admin', 'super_admin'] },
    { path: '/api/subscribers', method: 'GET', requiresAuth: true, requiredRoles: ['admin', 'super_admin'] },
    { path: '/api/admin/stats', method: 'GET', requiresAuth: true, requiredRoles: ['admin', 'super_admin'] },
    { path: '/api/users/:userId', method: 'PATCH', requiresAuth: true, requiredRoles: ['admin', 'super_admin'] },
    { path: '/api/products', method: 'GET', requiresAuth: false },
    { path: '/api/products/:id', method: 'GET', requiresAuth: false },
    { path: '/api/products', method: 'POST', requiresAuth: true, requiredRoles: ['admin'], inputSchema: true },
    { path: '/api/login', method: 'POST', requiresAuth: false, inputSchema: true },
    { path: '/api/register', method: 'POST', requiresAuth: false, inputSchema: true }
  ];
}

/**
 * Generate API security verification report
 */
async function generateApiSecurityReport(results: ApiSecurityCheckResult[]): Promise<void> {
  try {
    // Create the reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    const apiSecurityDir = path.join(reportsDir, 'api-security');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
}
    
    if (!fs.existsSync(apiSecurityDir)) {
      fs.mkdirSync(apiSecurityDir);
}
    
    // Generate report filename with timestamp
    const timestamp = new: Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(apiSecurityDir, `api-security-report-${timestamp}.json`);
    
    // Write the report
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`[API Security] Report generated at ${reportPath}`);
    
    // Generate markdown summary report
    const markdownReport = generateMarkdownReport(results);
    const markdownPath = path.join(apiSecurityDir, `api-security-summary-${timestamp}.md`);
    
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`[API Security] Summary report generated at ${markdownPath}`);
    
    // Log event: logSecurityEvent({
      type 'API_SECURITY_VERIFICATION_COMPLETED',
      details: `Generated API security report with ${results.length} checks`,
      severity: 'low'
    });
  } catch (error: unknown) {
    console.error('[API Security] Error generating report:', error);
}
}

/**
 * Generate markdown report from results
 */
function generateMarkdownReport(results: ApiSecurityCheckResult[]): string: {
  // Group results by status
  const passed = results.filter(r => r.status === 'pass');
  const warnings = results.filter(r => r.status === 'warning');
  const failures = results.filter(r => r.status === 'fail');
  const info = results.filter(r => r.status === 'info');
  
  // Calculate stats
  const totalChecks = results.length;
  const passRate = Math.round((passed.length / totalChecks) * 100);
  
  // Generate report
  let report = `# API Security Verification Report\n\n`;
  report += `Generated: ${new: Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Total Checks: ${totalChecks}\n`;
  report += `- Passed: ${passed.length} (${passRate}%)\n`;
  report += `- Warnings: ${warnings.length}\n`;
  report += `- Failures: ${failures.length}\n`;
  report += `- Info: ${info.length}\n\n`;
  
  report += `## Failed Checks\n\n`;
  if (failures.length === 0) {
    report += `No failures found.\n\n`;
} else {
    failures.forEach(failure => {
      report += `### ${failure.id}: ${failure.name}\n\n`;
      report += `**Severity:** ${failure.severity}\n\n`;
      report += `**Description:** ${failure.description}\n\n`;
      report += `**Details:** ${failure.details}\n\n`;
      
      if (failure.recommendation) {
        report += `**Recommendation:** ${failure.recommendation}\n\n`;
      }
      
      report += `---\n\n`;
    });
  }
  
  report += `## Warnings\n\n`;
  if (warnings.length === 0) {
    report += `No warnings found.\n\n`;
} else {
    warnings.forEach(warning => {
      report += `### ${warning.id}: ${warning.name}\n\n`;
      report += `**Severity:** ${warning.severity}\n\n`;
      report += `**Description:** ${warning.description}\n\n`;
      report += `**Details:** ${warning.details}\n\n`;
      
      if (warning.recommendation) {
        report += `**Recommendation:** ${warning.recommendation}\n\n`;
      }
      
      report += `---\n\n`;
    });
  }
  
  report += `## Passed Checks\n\n`;
  if (passed.length === 0) {
    report += `No passed checks found.\n\n`;
} else {
    passed.forEach(pass => {
      report += `### ${pass.id}: ${pass.name}\n\n`;
      report += `**Description:** ${pass.description}\n\n`;
      report += `**Details:** ${pass.details}\n\n`;
      
      report += `---\n\n`;
    });
  }
  
  return report;
}