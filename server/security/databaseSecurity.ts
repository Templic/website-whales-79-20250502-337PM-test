// Database Security Module
import { pool, db } from '../db';
import logger from '../logger';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { logSecurityEvent } from '../security';

/**
 * Database Security Interface
 * Implements comprehensive security checks for database operations
 */
export interface DatabaseSecurityInterface {
  // Connection security
  verifyConnectionSecurity(): Promise<SecurityCheckResult>;
  
  // Query security
  validateQuery(query: string): ValidationResult;
  sanitizeParameter(param: any): any;
  
  // Access control
  verifyUserAccess(userId: number, resource: string, action: string): Promise<boolean>;
  
  // Configuration assessment
  assessSecurityConfiguration(): Promise<SecurityAssessment>;
  
  // Monitoring and audit
  logDatabaseActivity(action: string, userId?: number, details?: any): void;
  getSecurityAuditLog(days?: number): Promise<AuditLogEntry[]>;
}

// Type definitions
export interface SecurityCheckResult {
  secure: boolean;
  issues: SecurityIssue[];
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  remediation?: string;
}

export interface ValidationResult {
  valid: boolean;
  risks: SecurityRisk[];
}

export interface SecurityRisk {
  type: string;
  description: string;
}

export interface SecurityAssessment {
  overallScore: number; // 0-100
  categories: {
    connectionSecurity: CategoryAssessment;
    accessControl: CategoryAssessment;
    queryProtection: CategoryAssessment;
    dataEncryption: CategoryAssessment;
    auditLogging: CategoryAssessment;
  };
  recommendations: string[];
}

export interface CategoryAssessment {
  score: number; // 0-100
  issues: SecurityIssue[];
}

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: number;
  details?: any;
}

/**
 * Database Security implementation
 */
export class DatabaseSecurity implements DatabaseSecurityInterface {
  private readonly securityLogDir: string;
  private readonly securityLogFile: string;
  
  constructor() {
    // Set up logging directories
    this.securityLogDir = path.join(process.cwd(), 'logs', 'security');
    if (!fs.existsSync(this.securityLogDir)) {
      fs.mkdirSync(this.securityLogDir, { recursive: true });
    }
    
    this.securityLogFile = path.join(this.securityLogDir, 'database-security.log');
    
    // Initialize security logging
    this.logDatabaseActivity('DatabaseSecurity initialized');
  }
  
  /**
   * Verify database connection security (SSL/TLS, etc.)
   */
  async verifyConnectionSecurity(): Promise<SecurityCheckResult> {
    const issues: SecurityIssue[] = [];
    let secure = true;
    
    try {
      const client = await pool.connect();
      try {
        // Check if SSL is enabled
        const sslResult = await client.query("SHOW ssl");
        const sslEnabled = sslResult.rows[0].ssl === 'on';
        
        if (!sslEnabled) {
          secure = false;
          issues.push({
            severity: 'high',
            message: 'Database connection is not using SSL/TLS encryption',
            remediation: 'Enable SSL in PostgreSQL configuration and use SSL mode in connection string'
          });
        }
        
        // Check database version for security patches
        const versionResult = await client.query("SHOW server_version");
        const serverVersion = versionResult.rows[0].server_version;
        
        // Log the version information
        this.logDatabaseActivity('Database version check', undefined, { version: serverVersion });
        
        // Check connection timeout settings
        const timeoutResult = await client.query("SHOW statement_timeout");
        const statementTimeout = timeoutResult.rows[0].statement_timeout;
        
        if (statementTimeout === '0') {
          issues.push({
            severity: 'medium',
            message: 'No statement timeout configured, which could lead to long-running queries',
            remediation: 'Set a reasonable statement_timeout value'
          });
        }
      } finally {
        client.release();
      }
    } catch (error) {
      secure = false;
      issues.push({
        severity: 'critical',
        message: `Failed to verify connection security: ${error instanceof Error ? error.message : 'Unknown error'}`,
        remediation: 'Check database connection parameters and server availability'
      });
    }
    
    return { secure, issues };
  }
  
  /**
   * Validate a SQL query for security risks
   */
  validateQuery(query: string): ValidationResult {
    const risks: SecurityRisk[] = [];
    let valid = true;
    
    // Check for dangerous operations in SQL queries
    const dangerousPatterns = [
      { pattern: /;.*;/i, description: 'Multiple statements (potential SQL injection)' },
      { pattern: /EXECUTE\s+.*?CONCAT/i, description: 'Dynamic SQL execution with concatenation' },
      { pattern: /DROP\s+TABLE/i, description: 'DROP TABLE operation' },
      { pattern: /DROP\s+DATABASE/i, description: 'DROP DATABASE operation' },
      { pattern: /TRUNCATE\s+TABLE/i, description: 'TRUNCATE TABLE operation' },
      { pattern: /DELETE\s+FROM.*?WHERE/i, description: 'DELETE operation' },
      // UNION-based SQL injection patterns
      { pattern: /UNION\s+ALL\s+SELECT/i, description: 'UNION ALL injection attempt' },
      { pattern: /UNION\s+SELECT.*?FROM\s+information_schema/i, description: 'UNION injection with information_schema access' },
      { pattern: /UNION\s+SELECT.*?0x[0-9a-f]+/i, description: 'UNION injection with hex encoding' },
      // Detection of information_schema access in various forms
      { pattern: /FROM\s+information_schema/i, description: 'Information schema access, potential database enumeration attempt' },
      { pattern: /SELECT.*?FROM\s+pg_catalog/i, description: 'PostgreSQL system catalog access, potential database enumeration' },
      // SQL Comments that might be used to hide malicious code
      { pattern: /\/\*.+?\*\//i, description: 'SQL comment block, may indicate SQL injection attempt' },
      // Blind SQL injection techniques
      { pattern: /CASE\s+WHEN\s+\(.*?\)\s+THEN.*?ELSE/i, description: 'CASE WHEN statement, potential blind SQL injection' },
      { pattern: /WAITFOR\s+DELAY/i, description: 'WAITFOR DELAY, potential time-based SQL injection' },
      { pattern: /pg_sleep\s*\(/i, description: 'pg_sleep function, potential time-based SQL injection' }
      // Add more patterns as needed
    ];
    
    // Scan for dangerous patterns
    for (const check of dangerousPatterns) {
      if (check.pattern.test(query)) {
        risks.push({
          type: 'dangerous_operation',
          description: check.description
        });
        valid = false;
      }
    }
    
    // Check for SQL comments which might indicate tampering
    if (/--.*$/m.test(query) || /\/\*[\s\S]+?\*\//g.test(query)) {
      risks.push({
        type: 'comment_detection',
        description: 'SQL comments detected, might indicate SQL injection attempt'
      });
    }
    
    return { valid, risks };
  }
  
  /**
   * Sanitize a parameter to prevent SQL injection
   * Note: This is a basic implementation. Drizzle ORM and parameterized queries
   * should be the primary defense against SQL injection.
   */
  sanitizeParameter(param: any): any {
    if (param === null || param === undefined) {
      return null;
    }
    
    if (typeof param === 'string') {
      // Remove dangerous SQL characters
      return param.replace(/['";\\\\]/g, '');
    }
    
    return param;
  }
  
  /**
   * Verify user access to a database resource
   */
  async verifyUserAccess(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      // Get user role
      const userQuery = await db.execute(sql`
        SELECT role FROM users WHERE id = ${userId}
      `);
      
      if (userQuery.rows.length === 0) {
        this.logDatabaseActivity('Access denied - user not found', userId, { resource, action });
        return false;
      }
      
      const userRole = userQuery.rows[0].role;
      
      // Super admin can do everything
      if (userRole === 'super_admin') {
        return true;
      }
      
      // Check resource-specific permissions
      // This is a simplified example - in a real system, this would query a permissions table
      let hasAccess = false;
      
      switch (resource) {
        case 'users':
          // Admin can read all users but only modify non-admin users
          if (userRole === 'admin') {
            hasAccess = action === 'read' || (action === 'write' && userId !== null);
          }
          break;
          
        case 'posts':
          // Admins can do everything with posts
          // Regular users can only read posts or modify their own
          if (userRole === 'admin') {
            hasAccess = true;
          } else {
            hasAccess = action === 'read';
          }
          break;
          
        // Add more resources as needed
          
        default:
          // Default deny for unknown resources
          hasAccess = false;
      }
      
      this.logDatabaseActivity(
        hasAccess ? 'Access granted' : 'Access denied',
        userId,
        { resource, action, role: userRole }
      );
      
      return hasAccess;
    } catch (error) {
      console.error('Error verifying user access:', error);
      this.logDatabaseActivity('Access verification error', userId, {
        resource,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Default to deny on error
      return false;
    }
  }
  
  /**
   * Assess the security of the database configuration
   */
  async assessSecurityConfiguration(): Promise<SecurityAssessment> {
    const issues: SecurityIssue[] = [];
    
    try {
      const client = await pool.connect();
      try {
        // Connection security checks
        const connectionIssues: SecurityIssue[] = [];
        const sslResult = await client.query("SHOW ssl");
        const sslEnabled = sslResult.rows[0].ssl === 'on';
        
        if (!sslEnabled) {
          connectionIssues.push({
            severity: 'high',
            message: 'Database connection is not using SSL/TLS encryption',
            remediation: 'Enable SSL in PostgreSQL configuration'
          });
        }
        
        // Access control checks
        const accessControlIssues: SecurityIssue[] = [];
        
        // Check for default roles with too many privileges
        const defaultRolesCheck = await client.query(`
          SELECT rolname, rolsuper, rolcreaterole, rolcreatedb 
          FROM pg_roles 
          WHERE rolname IN ('postgres', 'public')
        `);
        
        for (const role of defaultRolesCheck.rows) {
          if (role.rolsuper || role.rolcreaterole || role.rolcreatedb) {
            accessControlIssues.push({
              severity: 'high',
              message: `Default role '${role.rolname}' has excessive privileges`,
              remediation: 'Revoke unnecessary privileges from default roles'
            });
          }
        }
        
        // Query protection checks
        const queryProtectionIssues: SecurityIssue[] = [];
        
        // Check if prepared statements are enabled
        const preparedStmtResult = await client.query("SHOW standard_conforming_strings");
        if (preparedStmtResult.rows[0].standard_conforming_strings !== 'on') {
          queryProtectionIssues.push({
            severity: 'medium',
            message: 'Standard conforming strings are not enabled, which may affect query safety',
            remediation: 'Set standard_conforming_strings=on in PostgreSQL configuration'
          });
        }
        
        // Data encryption checks
        const dataEncryptionIssues: SecurityIssue[] = [];
        
        // Audit logging checks
        const auditLoggingIssues: SecurityIssue[] = [];
        
        // Check if logging is enabled
        const loggingResult = await client.query("SHOW log_statement");
        if (loggingResult.rows[0].log_statement === 'none') {
          auditLoggingIssues.push({
            severity: 'medium',
            message: 'SQL statement logging is disabled',
            remediation: 'Enable log_statement for better auditing'
          });
        }
        
        // Calculate scores based on issues
        const connectionScore = calculateScore(connectionIssues);
        const accessControlScore = calculateScore(accessControlIssues);
        const queryProtectionScore = calculateScore(queryProtectionIssues);
        const dataEncryptionScore = calculateScore(dataEncryptionIssues);
        const auditLoggingScore = calculateScore(auditLoggingIssues);
        
        // Generate recommendations
        const recommendations: string[] = [];
        
        // Add all remediation advice to recommendations
        [...connectionIssues, ...accessControlIssues, ...queryProtectionIssues, 
         ...dataEncryptionIssues, ...auditLoggingIssues].forEach(issue => {
          if (issue.remediation) {
            recommendations.push(issue.remediation);
          }
        });
        
        // Calculate overall score (weighted average)
        const overallScore = (
          connectionScore * 0.25 +
          accessControlScore * 0.25 +
          queryProtectionScore * 0.2 +
          dataEncryptionScore * 0.15 +
          auditLoggingScore * 0.15
        );
        
        return {
          overallScore: Math.round(overallScore),
          categories: {
            connectionSecurity: { score: connectionScore, issues: connectionIssues },
            accessControl: { score: accessControlScore, issues: accessControlIssues },
            queryProtection: { score: queryProtectionScore, issues: queryProtectionIssues },
            dataEncryption: { score: dataEncryptionScore, issues: dataEncryptionIssues },
            auditLogging: { score: auditLoggingScore, issues: auditLoggingIssues }
          },
          recommendations: recommendations
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error assessing database security configuration:', error);
      
      return {
        overallScore: 0,
        categories: {
          connectionSecurity: { score: 0, issues: [{ severity: 'critical', message: 'Assessment failed' }] },
          accessControl: { score: 0, issues: [{ severity: 'critical', message: 'Assessment failed' }] },
          queryProtection: { score: 0, issues: [{ severity: 'critical', message: 'Assessment failed' }] },
          dataEncryption: { score: 0, issues: [{ severity: 'critical', message: 'Assessment failed' }] },
          auditLogging: { score: 0, issues: [{ severity: 'critical', message: 'Assessment failed' }] }
        },
        recommendations: ['Fix database connection to enable security assessment']
      };
    }
  }
  
  /**
   * Log database activity for security auditing
   */
  logDatabaseActivity(action: string, userId?: number, details?: any): void {
    const timestamp = new Date();
    const logEntry = {
      timestamp,
      action,
      userId,
      details
    };
    
    // Write to specific database security log file
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.securityLogFile, logLine);
    } catch (error) {
      console.error('Failed to write to database security log:', error);
    }
    
    // Also use the main security logging system
    logSecurityEvent({
      type: 'DATABASE_ACTIVITY',
      action,
      userId,
      details
    });
    
    // Log to console for development visibility
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DATABASE SECURITY] ${timestamp.toISOString()} - ${action}${userId ? ` (User: ${userId})` : ''}`);
    }
  }
  
  /**
   * Retrieve the security audit log
   */
  async getSecurityAuditLog(days: number = 7): Promise<AuditLogEntry[]> {
    try {
      // Read from the log file
      if (!fs.existsSync(this.securityLogFile)) {
        return [];
      }
      
      const logContent = fs.readFileSync(this.securityLogFile, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim() !== '');
      
      // Parse each line as JSON
      const entries: AuditLogEntry[] = logLines.map(line => {
        try {
          const entry = JSON.parse(line);
          entry.timestamp = new Date(entry.timestamp);
          return entry;
        } catch (e) {
          console.error('Error parsing log entry:', e);
          return null;
        }
      }).filter(entry => entry !== null);
      
      // Filter by date if days parameter is provided
      if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return entries.filter(entry => entry.timestamp >= cutoffDate);
      }
      
      return entries;
    } catch (error) {
      console.error('Error retrieving security audit log:', error);
      return [];
    }
  }
}

/**
 * Helper function to calculate a score based on security issues
 */
function calculateScore(issues: SecurityIssue[]): number {
  if (issues.length === 0) {
    return 100; // Perfect score if no issues
  }
  
  // Count issues by severity
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  issues.forEach(issue => {
    counts[issue.severity]++;
  });
  
  // Calculate penalty points (more severe issues have more weight)
  const penaltyPoints = 
    counts.critical * 25 +
    counts.high * 15 +
    counts.medium * 7 +
    counts.low * 3;
  
  // Calculate score (100 - penalty points, minimum 0)
  return Math.max(0, 100 - penaltyPoints);
}

// Create and export singleton instance
export const databaseSecurity = new DatabaseSecurity();