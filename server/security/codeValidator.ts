/**
 * Code Validator for TypeScript Error Fixes
 * 
 * This module validates proposed code fixes for security concerns
 * and ensures they meet quality standards before being applied.
 */

import { logSecurityEvent } from '../security';

// Security risk patterns to check for
const SECURITY_RISK_PATTERNS = [
  {
    pattern: /eval\s*\(/,
    description: 'Use of eval() can lead to code injection vulnerabilities',
    severity: 'high',
    category: 'injection'
  },
  {
    pattern: /new\s+Function\s*\(/,
    description: 'Dynamic function creation can lead to code injection vulnerabilities',
    severity: 'high',
    category: 'injection'
  },
  {
    pattern: /document\.write\s*\(/,
    description: 'document.write can lead to XSS vulnerabilities',
    severity: 'medium',
    category: 'xss'
  },
  {
    pattern: /innerHTML\s*=/,
    description: 'innerHTML can lead to XSS if unvalidated input is used',
    severity: 'medium',
    category: 'xss'
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    description: 'dangerouslySetInnerHTML can lead to XSS if unvalidated input is used',
    severity: 'medium',
    category: 'xss'
  },
  {
    pattern: /setTimeout\s*\(\s*["'`]/,
    description: 'setTimeout with string argument can lead to code injection',
    severity: 'medium',
    category: 'injection'
  },
  {
    pattern: /setInterval\s*\(\s*["'`]/,
    description: 'setInterval with string argument can lead to code injection',
    severity: 'medium',
    category: 'injection'
  },
  {
    pattern: /(?:localStorage|sessionStorage)\.setItem/,
    description: 'Storing sensitive data in browser storage is insecure',
    severity: 'low',
    category: 'data_security'
  },
  {
    pattern: /Object\.(?:assign|defineProperty)\s*\(/,
    description: 'Can lead to prototype pollution if not used carefully',
    severity: 'low',
    category: 'prototype_pollution'
  },
  {
    pattern: /constructor\.constructor/,
    description: 'Accessing constructor.constructor can be used for prototype pollution',
    severity: 'high',
    category: 'prototype_pollution'
  },
  {
    pattern: /__proto__/,
    description: 'Direct manipulation of __proto__ can lead to prototype pollution',
    severity: 'high',
    category: 'prototype_pollution'
  },
  {
    pattern: /crypto\.subtle/,
    description: 'Use of cryptographic APIs should be reviewed for proper implementation',
    severity: 'medium',
    category: 'crypto'
  },
  {
    pattern: /window\.open\s*\(/,
    description: 'window.open can lead to phishing if not used properly',
    severity: 'low',
    category: 'navigation'
  },
  {
    pattern: /navigator\.sendBeacon\s*\(/,
    description: 'sendBeacon should not send sensitive data',
    severity: 'low',
    category: 'data_leakage'
  },
  {
    pattern: /(?:password|token|secret|key|credentials)/i,
    description: 'Potential hardcoded credentials in code',
    severity: 'high',
    category: 'credentials'
  },
  {
    pattern: /https?:\/\/([^/]*)/,
    description: 'Hardcoded URLs can lead to data leakage or insecure connections',
    severity: 'low',
    category: 'url'
  }
];

// Code quality patterns to check for
const CODE_QUALITY_PATTERNS = [
  {
    pattern: /console\.(log|debug|info)/,
    description: 'Console statements should be removed in production code',
    severity: 'low',
    category: 'logging'
  },
  {
    pattern: /debugger;/,
    description: 'Debugger statements should be removed in production code',
    severity: 'medium',
    category: 'debugging'
  },
  {
    pattern: /\/\/ ?TODO:/i,
    description: 'TODO comments should be addressed',
    severity: 'low',
    category: 'comments'
  },
  {
    pattern: /as any/,
    description: 'Using "as any" bypasses type checking',
    severity: 'medium',
    category: 'typing'
  },
  {
    pattern: /@ts-ignore|@ts-nocheck/,
    description: 'TypeScript error suppressions should be avoided',
    severity: 'medium',
    category: 'typing'
  }
];

export interface ValidationResult {
  isValid: boolean;
  issues: Array<{
    type: 'security' | 'quality';
    severity: 'low' | 'medium' | 'high';
    description: string;
    category: string;
    line?: number;
    column?: number;
  }>;
  score: number; // 0 to 100
  autoApprovable: boolean;
  requiresHumanReview: boolean;
}

/**
 * Validate a code fix for security and quality issues
 */
export function validateCodeFix(
  fixedCode: string,
  originalCode: string,
  userId: string,
  options: {
    strictMode?: boolean;
    allowConsoleInDevelopment?: boolean;
    allowDevPatterns?: boolean;
    securityOnly?: boolean;
  } = {}
): ValidationResult {
  const strictMode = options.strictMode || false;
  const allowConsoleInDevelopment = options.allowConsoleInDevelopment || false;
  const allowDevPatterns = options.allowDevPatterns || false;
  const securityOnly = options.securityOnly || false;

  const issues: ValidationResult['issues'] = [];
  
  // Check for security issues
  for (const pattern of SECURITY_RISK_PATTERNS) {
    if (pattern.pattern.test(fixedCode)) {
      // If the pattern was already in the original code, it's less concerning
      const wasInOriginal = pattern.pattern.test(originalCode);
      
      // Only add as an issue if it's new or we're in strict mode
      if (!wasInOriginal || strictMode) {
        issues.push({
          type: 'security',
          severity: pattern.severity as 'low' | 'medium' | 'high',
          description: `${wasInOriginal ? '[EXISTING] ' : ''}${pattern.description}`,
          category: pattern.category
        });
        
        // Log security event for high severity issues
        if (pattern.severity === 'high') {
          logSecurityEvent('CODE_VALIDATION_ISSUE', 'warning', {
            source: 'typescript-error-fix-validator',
            message: `Detected ${pattern.severity} security issue in code fix: ${pattern.description}`,
            pattern: pattern.pattern.toString(),
            wasInOriginal: String(wasInOriginal),
            userId
          });
        }
      }
    }
  }
  
  // Check for code quality issues (if not security only mode)
  if (!securityOnly) {
    for (const pattern of CODE_QUALITY_PATTERNS) {
      // Skip console checks if allowed in development
      if (allowConsoleInDevelopment && pattern.pattern.toString().includes('console')) {
        continue;
      }
      
      // Skip dev patterns if allowed
      if (allowDevPatterns && (
        pattern.pattern.toString().includes('TODO') ||
        pattern.pattern.toString().includes('ts-ignore')
      )) {
        continue;
      }
      
      if (pattern.pattern.test(fixedCode)) {
        const wasInOriginal = pattern.pattern.test(originalCode);
        
        // Only add as an issue if it's new or we're in strict mode
        if (!wasInOriginal || strictMode) {
          issues.push({
            type: 'quality',
            severity: pattern.severity as 'low' | 'medium' | 'high',
            description: `${wasInOriginal ? '[EXISTING] ' : ''}${pattern.description}`,
            category: pattern.category
          });
        }
      }
    }
  }
  
  // Calculate a score based on issues (lower score for more severe issues)
  let score = 100;
  for (const issue of issues) {
    if (issue.type === 'security') {
      if (issue.severity === 'high') score -= 40;
      else if (issue.severity === 'medium') score -= 20;
      else score -= 5;
    } else {
      if (issue.severity === 'high') score -= 15;
      else if (issue.severity === 'medium') score -= 10;
      else score -= 2;
    }
  }
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  // Determine if the fix requires human review
  // Any security issue above low severity requires review
  const securityIssues = issues.filter(i => i.type === 'security');
  const highSecurityIssues = securityIssues.filter(i => i.severity === 'high');
  const mediumSecurityIssues = securityIssues.filter(i => i.severity === 'medium');
  
  // Auto-approvable if the score is above 70 and there are no security issues
  const autoApprovable = score >= 70 && highSecurityIssues.length === 0 && mediumSecurityIssues.length === 0;
  
  // Requires human review if not auto-approvable or in strict mode
  const requiresHumanReview = !autoApprovable || strictMode;
  
  return {
    isValid: score >= 50, // Valid if score is at least 50
    issues,
    score,
    autoApprovable,
    requiresHumanReview
  };
}

/**
 * Check if code changes introduce significant structural differences
 * that might indicate the fix is not just fixing a TypeScript error
 */
export function checkStructuralChanges(
  fixedCode: string,
  originalCode: string
): { 
  hasSignificantChanges: boolean;
  changePercentage: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
} {
  // Split code into lines
  const fixedLines = fixedCode.split('\n');
  const originalLines = originalCode.split('\n');
  
  // Count added, removed and modified lines
  let addedLines = 0;
  let removedLines = 0;
  let modifiedLines = 0;
  
  // Simple diff algorithm
  if (fixedLines.length > originalLines.length) {
    addedLines = fixedLines.length - originalLines.length;
    
    // Check for modified lines
    for (let i = 0; i < originalLines.length; i++) {
      if (fixedLines[i] !== originalLines[i]) {
        modifiedLines++;
      }
    }
  } else if (originalLines.length > fixedLines.length) {
    removedLines = originalLines.length - fixedLines.length;
    
    // Check for modified lines
    for (let i = 0; i < fixedLines.length; i++) {
      if (fixedLines[i] !== originalLines[i]) {
        modifiedLines++;
      }
    }
  } else {
    // Same number of lines, check for modifications
    for (let i = 0; i < fixedLines.length; i++) {
      if (fixedLines[i] !== originalLines[i]) {
        modifiedLines++;
      }
    }
  }
  
  // Calculate change percentage relative to original
  const totalChanges = addedLines + removedLines + modifiedLines;
  const changePercentage = (totalChanges / originalLines.length) * 100;
  
  // Significant changes threshold: >20% change or >5 added/removed lines
  const hasSignificantChanges = changePercentage > 20 || (addedLines + removedLines) > 5;
  
  return {
    hasSignificantChanges,
    changePercentage,
    addedLines,
    removedLines,
    modifiedLines
  };
}

/**
 * Full validation of a TypeScript error fix
 */
export function validateTypescriptErrorFix(
  fixedCode: string,
  originalCode: string,
  userId: string,
  options: {
    strictMode?: boolean;
    allowConsoleInDevelopment?: boolean;
    allowDevPatterns?: boolean;
    securityOnly?: boolean;
    checkStructure?: boolean;
  } = {}
): {
  validation: ValidationResult;
  structure?: ReturnType<typeof checkStructuralChanges>;
} {
  // Validate code for security and quality issues
  const validation = validateCodeFix(fixedCode, originalCode, userId, options);
  
  // Check for structural changes if requested
  let structure;
  if (options.checkStructure) {
    structure = checkStructuralChanges(fixedCode, originalCode);
    
    // If there are significant changes, make sure it requires human review
    if (structure.hasSignificantChanges) {
      validation.requiresHumanReview = true;
      validation.autoApprovable = false;
      validation.issues.push({
        type: 'quality',
        severity: 'medium',
        description: `Significant code structure changes detected: ${structure.changePercentage.toFixed(1)}% changed`,
        category: 'structure'
      });
    }
  }
  
  return {
    validation,
    structure
  };
}