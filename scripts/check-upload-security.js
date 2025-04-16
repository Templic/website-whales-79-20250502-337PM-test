#!/usr/bin/env node

/**
 * Upload Directory Security Checker
 * 
 * This script verifies the security of file upload directories by checking
 * permissions, ownership, and protections against common security vulnerabilities.
 * 
 * Usage:
 *   node scripts/check-upload-security.js
 * 
 * The script will check predefined directories for security issues.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec } from 'child_process';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Directories to check
const UPLOAD_DIRS = [
  './uploads',
  './uploads/images',
  './uploads/documents',
  './uploads/media',
  './tmp'
];

// Security check tracking
const results = {
  total: 0,
  passed: 0,
  warnings: 0,
  failed: 0
};

/**
 * Check if a directory exists
 * @param {string} dir Directory path
 * @returns {boolean} Whether the directory exists
 */
async function directoryExists(dir) {
  try {
    const stats = await fs.promises.stat(dir);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dir Directory path
 */
async function ensureDirectoryExists(dir) {
  if (!(await directoryExists(dir))) {
    await fs.promises.mkdir(dir, { recursive: true });
    console.log(`${colors.yellow}Created missing directory: ${dir}${colors.reset}`);
  }
}

/**
 * Check directory permissions
 * @param {string} dir Directory path
 * @returns {Object} Check results
 */
async function checkDirectoryPermissions(dir) {
  results.total++;
  
  try {
    const stats = await fs.promises.stat(dir);
    const mode = stats.mode;
    
    // Convert mode to octal permission string (e.g., 0755)
    const octalMode = (mode & 0o777).toString(8).padStart(4, '0');
    
    // Check if permissions are too permissive
    // Ideally should be 0755 (rwxr-xr-x) or more restrictive
    const isPermissive = (mode & 0o022) !== 0; // Check if world-writable
    
    if (isPermissive) {
      results.failed++;
      console.log(`${colors.red}✗ FAIL${colors.reset} Directory permissions for ${dir} are too permissive: ${octalMode}`);
      console.log(`  ${colors.yellow}Recommendation:${colors.reset} Change permissions to 0755 (rwxr-xr-x) or more restrictive`);
      return { success: false, message: `Permissions too permissive: ${octalMode}` };
    } else {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset} Directory permissions for ${dir} are secure: ${octalMode}`);
      return { success: true, message: `Secure permissions: ${octalMode}` };
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} Could not check permissions for ${dir}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Check for symbolic links in a directory
 * @param {string} dir Directory path
 * @returns {Object} Check results
 */
async function checkForSymlinks(dir) {
  results.total++;
  
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    const symlinks = entries.filter(entry => entry.isSymbolicLink());
    
    if (symlinks.length > 0) {
      results.warnings++;
      console.log(`${colors.yellow}⚠ WARNING${colors.reset} Symbolic links found in ${dir}: ${symlinks.map(s => s.name).join(', ')}`);
      console.log(`  ${colors.yellow}Recommendation:${colors.reset} Verify these symlinks are secure and expected`);
      return { 
        success: false, 
        warning: true, 
        message: `Found ${symlinks.length} symbolic link(s)` 
      };
    } else {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset} No symbolic links found in ${dir}`);
      return { success: true, message: 'No symbolic links found' };
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} Could not check for symbolic links in ${dir}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Check if a directory is secure against path traversal
 * @param {string} dir Directory path
 * @returns {Object} Check results
 */
async function checkPathTraversal(dir) {
  results.total++;
  
  try {
    // Normalize and resolve the path to check for issues
    const normalizedPath = path.normalize(dir);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Check for suspicious path patterns
    const suspiciousPatterns = [
      '..', // Path traversal attempt
      '~',  // Home directory reference
      '%',  // URL encoding
      '\0', // Null byte
      '\\', // Windows path separator (suspicious in Unix)
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => dir.includes(pattern));
    
    if (hasSuspiciousPattern) {
      results.warnings++;
      console.log(`${colors.yellow}⚠ WARNING${colors.reset} Directory path ${dir} contains suspicious path elements`);
      console.log(`  ${colors.yellow}Recommendation:${colors.reset} Use plain directory paths without special sequences`);
      return { 
        success: false, 
        warning: true, 
        message: `Path contains suspicious elements: ${dir}` 
      };
    } else {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset} Directory path ${dir} is well-formed`);
      return { success: true, message: 'Path is well-formed' };
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} Could not perform path traversal check on ${dir}: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Check if a directory is world-writable
 * @param {string} dir Directory path
 * @returns {Object} Check results
 */
async function checkWorldWritable(dir) {
  results.total++;
  
  try {
    const stats = await fs.promises.stat(dir);
    const mode = stats.mode;
    
    // Extract the "other" permissions (last 3 bits)
    const otherPerms = mode & 0o007;
    
    // Check if write permission bit is set for "other" (0o002)
    const worldWritable = (otherPerms & 0o002) !== 0;
    
    if (worldWritable) {
      results.failed++;
      console.log(`${colors.red}✗ FAIL${colors.reset} Directory ${dir} is world-writable`);
      console.log(`  ${colors.yellow}Recommendation:${colors.reset} Remove write permissions for 'others': chmod o-w "${dir}"`);
      return { success: false, message: 'Directory is world-writable' };
    } else {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset} Directory ${dir} is not world-writable`);
      return { success: true, message: 'Directory is not world-writable' };
    }
  } catch (error) {
    results.warnings++;
    console.log(`${colors.yellow}⚠ WARNING${colors.reset} Could not check if ${dir} is world-writable: ${error.message}`);
    return { 
      success: false, 
      warning: true, 
      message: error.message 
    };
  }
}

/**
 * Check parent directory permissions
 * @param {string} dir Directory path
 * @returns {Object} Check results
 */
async function checkParentDirectories(dir) {
  results.total++;
  
  try {
    const parentDir = path.dirname(dir);
    
    // Don't check parent if we're at root or current directory
    if (parentDir === '.' || parentDir === '/' || parentDir === dir) {
      return { success: true, message: 'No parent directory to check' };
    }
    
    const stats = await fs.promises.stat(parentDir);
    const mode = stats.mode;
    
    // Check if parent is world-writable
    const isParentWritable = (mode & 0o002) !== 0;
    
    if (isParentWritable) {
      results.warnings++;
      console.log(`${colors.yellow}⚠ WARNING${colors.reset} Parent directory of ${dir} is world-writable`);
      console.log(`  ${colors.yellow}Recommendation:${colors.reset} Secure parent directory permissions: chmod o-w "${parentDir}"`);
      return { 
        success: false, 
        warning: true, 
        message: 'Parent directory is world-writable' 
      };
    } else {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset} Parent directory of ${dir} has secure permissions`);
      return { success: true, message: 'Parent directory has secure permissions' };
    }
  } catch (error) {
    results.warnings++;
    console.log(`${colors.yellow}⚠ WARNING${colors.reset} Could not check parent directory of ${dir}: ${error.message}`);
    return { 
      success: false, 
      warning: true, 
      message: error.message 
    };
  }
}

/**
 * Calculate security score for a directory
 * @param {Object} dirResults Results of all checks for a directory
 * @returns {number} Security score (0-100)
 */
function calculateSecurityScore(dirResults) {
  const totalChecks = Object.keys(dirResults).length;
  if (totalChecks === 0) return 0;
  
  let passedChecks = 0;
  let partialChecks = 0;
  
  for (const check of Object.values(dirResults)) {
    if (check.success) {
      passedChecks++;
    } else if (check.warning) {
      partialChecks += 0.5;
    }
  }
  
  return Math.floor((passedChecks + partialChecks) / totalChecks * 100);
}

/**
 * Run all security checks on a directory
 * @param {string} dir Directory path
 */
async function checkDirectorySecurity(dir) {
  console.log(`\n${colors.bgBlue}${colors.white} Checking security for: ${dir} ${colors.reset}`);
  
  try {
    await ensureDirectoryExists(dir);
    
    const dirResults = {
      permissions: await checkDirectoryPermissions(dir),
      symlinks: await checkForSymlinks(dir),
      pathTraversal: await checkPathTraversal(dir),
      worldWritable: await checkWorldWritable(dir),
      parentDirectory: await checkParentDirectories(dir)
    };
    
    const score = calculateSecurityScore(dirResults);
    
    if (score === 100) {
      console.log(`\n${colors.bgGreen}${colors.white} Security Score: ${score}/100 ${colors.reset}`);
    } else if (score >= 80) {
      console.log(`\n${colors.bgYellow}${colors.black} Security Score: ${score}/100 ${colors.reset}`);
    } else {
      console.log(`\n${colors.bgRed}${colors.white} Security Score: ${score}/100 ${colors.reset}`);
    }
    
    console.log('');
  } catch (error) {
    console.error(`${colors.red}Error checking ${dir}: ${error.message}${colors.reset}`);
  }
}

/**
 * Main function to run all checks
 */
async function main() {
  console.log(`\n${colors.bgBlue}${colors.white} UPLOAD DIRECTORY SECURITY CHECKER ${colors.reset}\n`);
  console.log(`${colors.cyan}Checking security of upload directories...${colors.reset}\n`);
  
  for (const dir of UPLOAD_DIRS) {
    await checkDirectorySecurity(dir);
  }
  
  // Print summary
  console.log(`\n${colors.cyan}Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.cyan}Total Checks: ${results.total}${colors.reset}`);
  
  const overallScore = Math.floor(((results.passed + (results.warnings * 0.5)) / results.total) * 100);
  
  if (overallScore === 100) {
    console.log(`\n${colors.bgGreen}${colors.white} Overall Security Score: ${overallScore}/100 ${colors.reset}`);
  } else if (overallScore >= 80) {
    console.log(`\n${colors.bgYellow}${colors.black} Overall Security Score: ${overallScore}/100 ${colors.reset}`);
  } else {
    console.log(`\n${colors.bgRed}${colors.white} Overall Security Score: ${overallScore}/100 ${colors.reset}`);
  }
  
  console.log('\nRecommendations:');
  if (results.failed > 0 || results.warnings > 0) {
    console.log(`${colors.yellow}• Address the issues highlighted above to improve security${colors.reset}`);
    console.log(`${colors.yellow}• Pay special attention to world-writable directories and symlinks${colors.reset}`);
    console.log(`${colors.yellow}• Ensure upload directories have appropriate permissions (e.g., 0755)${colors.reset}`);
  } else {
    console.log(`${colors.green}• All checks passed! Maintain current security practices${colors.reset}`);
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the main function
main().catch(error => {
  console.error(`\n${colors.bgRed}${colors.white} SCRIPT ERROR ${colors.reset}`);
  console.error(`${colors.red}${error.stack}${colors.reset}`);
  process.exit(1);
});