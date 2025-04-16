/**
 * Upload Directory Security Check
 * 
 * This script performs various security checks on the upload directories
 * to ensure they are configured securely, have proper permissions,
 * and follow best practices for file storage security.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - paths are relative to project root
const UPLOAD_DIRS = [
  { path: path.join(path.dirname(__dirname), 'uploads'), required: true },
  { path: path.join(path.dirname(__dirname), 'uploads/media'), required: true },
  { path: path.join(path.dirname(__dirname), 'tmp'), required: true }
];

// Security checks
const securityChecks = {
  async directoryExists(dirPath) {
    try {
      const stats = await statAsync(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  },

  async checkPermissions(dirPath) {
    try {
      const stats = await statAsync(dirPath);
      const mode = stats.mode;
      
      // Convert mode to octal string for easier permission checks
      const octalMode = (mode & 0o777).toString(8);
      
      // Check if directory has world-writeable permissions (last digit is 6 or 7)
      const lastDigit = octalMode.charAt(octalMode.length - 1);
      const isWorldWritable = lastDigit === '6' || lastDigit === '7';
      
      return {
        permissions: octalMode,
        secure: !isWorldWritable,
        message: isWorldWritable ? 
          `Warning: Directory ${dirPath} has world-writeable permissions (${octalMode})` : 
          `Directory ${dirPath} has secure permissions (${octalMode})`
      };
    } catch (error) {
      return {
        permissions: 'unknown',
        secure: false,
        message: `Error checking permissions for ${dirPath}: ${error.message}`
      };
    }
  },

  async checkSymlinks(dirPath) {
    try {
      const files = await readdirAsync(dirPath);
      const symlinks = [];
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        try {
          const stats = await statAsync(fullPath);
          if (stats.isSymbolicLink()) {
            symlinks.push(file);
          }
        } catch (error) {
          // Skip files with permission issues
        }
      }
      
      return {
        hasSymlinks: symlinks.length > 0,
        symlinks,
        secure: symlinks.length === 0,
        message: symlinks.length > 0 ? 
          `Warning: Directory ${dirPath} contains symbolic links: ${symlinks.join(', ')}` : 
          `Directory ${dirPath} does not contain symbolic links`
      };
    } catch (error) {
      return {
        hasSymlinks: false,
        symlinks: [],
        secure: false,
        message: `Error checking for symlinks in ${dirPath}: ${error.message}`
      };
    }
  },

  async checkParentPermissions(dirPath) {
    try {
      const parentDir = path.dirname(dirPath);
      return await this.checkPermissions(parentDir);
    } catch (error) {
      return {
        permissions: 'unknown',
        secure: false,
        message: `Error checking parent permissions for ${dirPath}: ${error.message}`
      };
    }
  },

  async checkDirectoryTraversal(dirPath) {
    // Check for suspicious directory names that might indicate directory traversal
    const suspiciousPatterns = ['./', '../', '..\\', '.\\'];
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => dirPath.includes(pattern));
    
    return {
      secure: !hasSuspiciousPattern,
      message: hasSuspiciousPattern ? 
        `Warning: Directory ${dirPath} contains suspicious path patterns` : 
        `Directory ${dirPath} has a safe path`
    };
  }
};

async function checkDirectory(dirPath, required) {
  console.log(`\n🔍 Checking directory: ${dirPath}`);
  
  // Check if directory exists
  const exists = await securityChecks.directoryExists(dirPath);
  if (!exists) {
    console.log(`  ❌ Directory ${dirPath} does not exist${required ? ' (REQUIRED)' : ''}`);
    return {
      directory: dirPath,
      exists: false,
      required,
      checks: {}
    };
  }
  
  console.log(`  ✅ Directory ${dirPath} exists`);
  
  // Run all security checks
  const permissionsCheck = await securityChecks.checkPermissions(dirPath);
  const symlinkCheck = await securityChecks.checkSymlinks(dirPath);
  const parentPermissionsCheck = await securityChecks.checkParentPermissions(dirPath);
  const traversalCheck = await securityChecks.checkDirectoryTraversal(dirPath);
  
  // Log results
  console.log(`  ${permissionsCheck.secure ? '✅' : '❌'} ${permissionsCheck.message}`);
  console.log(`  ${symlinkCheck.secure ? '✅' : '❌'} ${symlinkCheck.message}`);
  console.log(`  ${parentPermissionsCheck.secure ? '✅' : '❌'} Parent: ${parentPermissionsCheck.message}`);
  console.log(`  ${traversalCheck.secure ? '✅' : '❌'} ${traversalCheck.message}`);
  
  // Calculate overall security score
  const allChecks = [permissionsCheck, symlinkCheck, parentPermissionsCheck, traversalCheck];
  const secureChecks = allChecks.filter(check => check.secure).length;
  const score = Math.round((secureChecks / allChecks.length) * 100);
  
  console.log(`  Security Score: ${score}% (${secureChecks}/${allChecks.length} checks passed)`);
  
  return {
    directory: dirPath,
    exists,
    required,
    score,
    checks: {
      permissions: permissionsCheck,
      symlinks: symlinkCheck,
      parentPermissions: parentPermissionsCheck,
      traversal: traversalCheck
    }
  };
}

async function runSecurityChecks() {
  console.log('🔒 Starting Upload Directory Security Checks 🔒');
  
  const results = [];
  for (const dir of UPLOAD_DIRS) {
    const result = await checkDirectory(dir.path, dir.required);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Security Check Summary:');
  
  let overallScore = 0;
  let totalChecks = 0;
  
  for (const result of results) {
    if (result.exists) {
      console.log(`  ${result.directory}: ${result.score}% secure`);
      overallScore += result.score;
      totalChecks++;
    } else {
      console.log(`  ${result.directory}: Not found${result.required ? ' (REQUIRED)' : ''}`);
    }
  }
  
  if (totalChecks > 0) {
    const averageScore = Math.round(overallScore / totalChecks);
    console.log(`\n  Overall upload directory security: ${averageScore}%`);
    
    if (averageScore >= 90) {
      console.log('  ✅ Upload directories are well-secured');
    } else if (averageScore >= 70) {
      console.log('  ⚠️ Upload directories have some security concerns that should be addressed');
    } else {
      console.log('  ❌ Upload directories have significant security issues that must be fixed');
    }
  } else {
    console.log('\n  ❌ No upload directories found or accessible');
  }
  
  console.log('\n🔒 Security Check Complete 🔒');
}

// Run the checks
runSecurityChecks().catch(error => {
  console.error('Error running security checks:', error);
});