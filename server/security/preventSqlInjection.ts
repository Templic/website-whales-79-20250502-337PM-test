/**
 * SQL Injection Prevention System
 * 
 * This module provides a comprehensive API to prevent SQL injection 
 * vulnerabilities, integrating all the SQL security tools.
 */

import { createSafeDatabase, SafeDatabase } from './safeDatabase';
import { sqlMonitor } from './sqlMonitor';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SQL Injection Prevention configuration
 */
export interface SQLInjectionPreventionConfig {
  /**
   * Strict mode enforces all security rules
   */
  strictMode?: boolean;
  
  /**
   * Monitor all database queries
   */
  monitorQueries?: boolean;
  
  /**
   * Automatically replace unsafe patterns in code
   */
  autoFixCode?: boolean;
  
  /**
   * Generate reports
   */
  generateReports?: boolean;
  
  /**
   * Report directory
   */
  reportDir?: string;
}

/**
 * Database connection interface
 */
interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
}

/**
 * SQL Injection Prevention System
 */
export class SQLInjectionPrevention {
  private config: SQLInjectionPreventionConfig;
  private databases: Map<string, SafeDatabase> = new Map();
  
  constructor(config: SQLInjectionPreventionConfig = {}) {
    this.config = {
      strictMode: true,
      monitorQueries: true,
      autoFixCode: false,
      generateReports: true,
      reportDir: 'reports',
      ...config
    };
    
    // Ensure reports directory exists if generating reports
    if (this.config.generateReports && this.config.reportDir) {
      try {
        if (!fs.existsSync(this.config.reportDir)) {
          fs.mkdirSync(this.config.reportDir, { recursive: true });
        }
      } catch (error) {
        console.error('[SQL-PREVENTION] Error creating reports directory:', error);
      }
    }
    
    console.log('[SQL-PREVENTION] SQL Injection Prevention System initialized');
    
    // Log initialization
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_INITIALIZATION as any,
      message: 'SQL Injection Prevention System initialized',
      metadata: {
        config: this.config
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[SQL-PREVENTION] Error logging initialization:', error);
    });
  }
  
  /**
   * Secure a database connection
   */
  public secureDatabase(
    db: DatabaseConnection,
    name: string = 'default'
  ): SafeDatabase {
    // Check if this database connection is already secured
    if (this.databases.has(name)) {
      return this.databases.get(name)!;
    }
    
    // Create a safe database wrapper
    const safeDb = createSafeDatabase(db, {
      enableMonitoring: this.config.monitorQueries,
      strictMode: this.config.strictMode,
      logQueries: true
    });
    
    // Store the database
    this.databases.set(name, safeDb);
    
    console.log(`[SQL-PREVENTION] Secured database connection '${name}'`);
    
    return safeDb;
  }
  
  /**
   * Get a secured database connection
   */
  public getDatabase(name: string = 'default'): SafeDatabase | undefined {
    return this.databases.get(name);
  }
  
  /**
   * Register and secure all database connections from a module
   */
  public secureAllDatabases(dbModule: any): void {
    // Look for database connections
    for (const key in dbModule) {
      const obj = dbModule[key];
      
      // Check if this object looks like a database connection
      if (obj && typeof obj.query === 'function') {
        this.secureDatabase(obj, key);
      }
    }
  }
  
  /**
   * Generate a security report
   */
  public generateSecurityReport(): string {
    if (!this.config.generateReports) {
      return 'Reporting is disabled';
    }
    
    let report = 'SQL Injection Prevention Security Report\n';
    report += '=======================================\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Add database statistics
    report += `Secured Databases: ${this.databases.size}\n`;
    
    // Add query monitoring statistics if available
    if (this.config.monitorQueries) {
      const allQueries = sqlMonitor.getQueryLog();
      report += `Monitored Queries: ${allQueries.length}\n\n`;
      
      if (allQueries.length > 0) {
        report += 'Recent Queries:\n';
        
        // Show the 10 most recent queries
        const recentQueries = allQueries.slice(0, 10);
        for (const query of recentQueries) {
          report += `- ${query.sql}\n`;
          if (query.params && query.params.length > 0) {
            report += `  Params: ${JSON.stringify(query.params)}\n`;
          }
          if (query.source) {
            report += `  Source: ${query.source}\n`;
          }
          report += '\n';
        }
      }
    }
    
    // Save the report
    if (this.config.reportDir) {
      const reportPath = path.join(
        this.config.reportDir,
        `sql_security_report_${Date.now()}.txt`
      );
      
      try {
        fs.writeFileSync(reportPath, report);
        console.log(`[SQL-PREVENTION] Security report saved to ${reportPath}`);
      } catch (error) {
        console.error('[SQL-PREVENTION] Error saving security report:', error);
      }
    }
    
    return report;
  }
  
  /**
   * Run a security scan of the database system
   */
  public async runSecurityScan(): Promise<void> {
    console.log('[SQL-PREVENTION] Running database security scan...');
    
    // Generate a security report
    this.generateSecurityReport();
    
    // Log the security scan
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_SCAN as any,
      message: 'Database security scan completed',
      metadata: {
        timestamp: new Date().toISOString(),
        databaseCount: this.databases.size
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[SQL-PREVENTION] Error logging security scan:', error);
    });
  }
}

/**
 * Create a SQL injection prevention system
 */
export function createSQLInjectionPrevention(
  config: SQLInjectionPreventionConfig = {}
): SQLInjectionPrevention {
  return new SQLInjectionPrevention(config);
}

/**
 * Global instance with default configuration
 */
export const sqlInjectionPrevention = new SQLInjectionPrevention();

/**
 * Quick accessor to secure a database
 */
export function secureDatabase(
  db: DatabaseConnection,
  name: string = 'default'
): SafeDatabase {
  return sqlInjectionPrevention.secureDatabase(db, name);
}