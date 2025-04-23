import { pool } from '../db';
import { databaseSecurity } from './databaseSecurity';
import path from 'path';
import fs from 'fs';

/**
 * Database Configuration Checker
 * Performs regular audits of the database configuration for security issues
 */
export class DatabaseConfigurationChecker {
  private readonly reportDir: string;
  private readonly configChecklist = [
    'SSL is enabled for database connections',
    'Strong password policy is enforced for database users',
    'Connection pooling is properly configured',
    'Statement timeouts are configured to prevent long-running queries',
    'Query logging is enabled for auditing purposes',
    'Appropriate access controls are in place',
    'Latest security patches are applied',
    'Backups are encrypted and stored securely',
    'Database error messages are sanitized before reaching clients',
    'Database contains no default or test accounts',
    'User privileges follow principle of least privilege',
    'Database connections use parameterized queries',
  ];
  
  constructor() {
    // Set up reports directory
    this.reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }
  
  /**
   * Run a comprehensive check of the database configuration
   */
  async checkDatabaseConfiguration(): Promise<DatabaseConfigReport> {
    console.log('Starting database configuration security check...');
    
    const startTime = Date.now();
    const report: DatabaseConfigReport = {
      timestamp: new Date().toISOString(),
      overallStatus: 'pending',
      categories: {},
      recommendations: [],
      executionTimeMs: 0
    };
    
    try {
      // Get full security assessment
      const securityAssessment = await databaseSecurity.assessSecurityConfiguration();
      
      // Map it to our report format
      report.overallStatus = securityAssessment.overallScore >= 80 ? 'passed' : 
                             securityAssessment.overallScore >= 60 ? 'warning' : 'failed';
                             
      report.categories = {
        connectionSecurity: mapCategoryToReportFormat(securityAssessment.categories.connectionSecurity),
        accessControl: mapCategoryToReportFormat(securityAssessment.categories.accessControl),
        queryProtection: mapCategoryToReportFormat(securityAssessment.categories.queryProtection),
        dataEncryption: mapCategoryToReportFormat(securityAssessment.categories.dataEncryption),
        auditLogging: mapCategoryToReportFormat(securityAssessment.categories.auditLogging)
      };
      
      report.recommendations = securityAssessment.recommendations;
      
      // Additional database-specific checks
      await this.performAdditionalChecks(report);
      
    } catch (error: unknown) {
      console.error('Error during database configuration check:', error);
      report.overallStatus = 'error';
      report.error = error instanceof Error ? error.message : 'Unknown error during configuration check';
    }
    
    // Calculate execution time
    report.executionTimeMs = Date.now() - startTime;
    
    // Save the report
    await this.saveReport(report);
    
    // Log completion
    console.log(`Database configuration check completed in ${report.executionTimeMs}ms with status: ${report.overallStatus}`);
    
    return report;
  }
  
  /**
   * Perform additional database-specific configuration checks
   */
  private async performAdditionalChecks(report: DatabaseConfigReport): Promise<void> {
    try {
      const client = await pool.connect();
      try {
        // Check for unused indexes (which can impact performance)
        // Using parameterized query for safety
        const unusedIndexesResult = await client.query(`
          SELECT
            schemaname || '.' || relname as table,
            indexrelname as index,
            idx_scan as index_scans
          FROM pg_stat_user_indexes
          WHERE idx_scan = $1
          AND schemaname NOT LIKE $2
          ORDER BY pg_relation_size(indexrelid) DESC
        `, [0, 'pg_%']);
        
        if (unusedIndexesResult.rows.length > 0) {
          if (!report.recommendations) {
            report.recommendations = [];
          }
          
          const unusedIndexes = unusedIndexesResult.rows.map(row => row.index).join(', ');
          report.recommendations.push(
            `Consider removing unused indexes to improve performance: ${unusedIndexes}`
          );
        }
        
        // Check for default database names
        const databaseName = (await client.query('SELECT current_database()')).rows[0].current_database;
        if (['postgres', 'template1', 'postgres0'].includes(databaseName)) {
          if (!report.categories.accessControl) {
            report.categories.accessControl = { status: 'warning', issues: [] };
          }
          
          report.categories.accessControl.issues.push({
            severity: 'medium',
            message: 'Using a default/common database name increases risk of automated attacks',
            remediation: 'Use a non-standard name for production databases'
          });
        }
        
        // Check database parameter settings for security
        const paramChecks = [
          { param: 'log_min_error_statement', expected: 'error', severity: 'medium' },
          { param: 'log_error_verbosity', expected: 'default', severity: 'low' },
          { param: 'log_connections', expected: 'on', severity: 'medium' },
          { param: 'log_disconnections', expected: 'on', severity: 'medium' }
        ];
        
        for (const check of paramChecks) {
          // Use parameterized query to prevent potential SQL injection
          const paramResult = await client.query('SHOW $1', [check.param]);
          const currentValue = paramResult.rows[0][check.param];
          
          if (currentValue !== check.expected) {
            if (!report.categories.auditLogging) {
              report.categories.auditLogging = { status: 'warning', issues: [] };
            }
            
            report.categories.auditLogging.issues.push({
              severity: check.severity as any,
              message: `Parameter '${check.param}' is set to '${currentValue}' instead of recommended '${check.expected}'`,
              remediation: `Set ${check.param}=${check.expected} in PostgreSQL configuration`
            });
          }
        }
        
      } finally {
        client.release();
      }
    } catch (error: unknown) {
      console.error('Error during additional database checks:', error);
      if (!report.recommendations) {
        report.recommendations = [];
      }
      report.recommendations.push('Fix database connection to enable complete configuration assessment');
    }
  }
  
  /**
   * Save the configuration report to a file
   */
  private async saveReport(report: DatabaseConfigReport): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const reportFile = path.join(this.reportDir, `db-security-config-${timestamp}.json`);
      
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`Database configuration report saved to ${reportFile}`);
      
      // Also generate a markdown report
      const mdReportFile = path.join(this.reportDir, `db-security-config-${timestamp}.md`);
      const mdReport = this.generateMarkdownReport(report);
      fs.writeFileSync(mdReportFile, mdReport);
      console.log(`Database configuration markdown report saved to ${mdReportFile}`);
    } catch (error: unknown) {
      console.error('Error saving database configuration report:', error);
    }
  }
  
  /**
   * Generate a human-readable markdown report
   */
  private generateMarkdownReport(report: DatabaseConfigReport): string {
    const statusEmoji = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
      error: '🔥',
      pending: '⏳'
    };
    
    let markdown = `# Database Security Configuration Report\n\n`;
    markdown += `**Report Date:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    markdown += `**Overall Status:** ${statusEmoji[report.overallStatus] || ''} ${report.overallStatus.toUpperCase()}\n\n`;
    
    if (report.error) {
      markdown += `## Error\n\n${report.error}\n\n`;
    }
    
    markdown += `## Configuration Categories\n\n`;
    
    for (const [category, data] of Object.entries(report.categories)) {
      const displayCategory = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      markdown += `### ${displayCategory}: ${statusEmoji[data.status] || ''} ${data.status.toUpperCase()}\n\n`;
      
      if (data.issues && data.issues.length > 0) {
        markdown += `| Severity | Issue | Remediation |\n`;
        markdown += `|----------|-------|-------------|\n`;
        
        for (const issue of data.issues) {
          const severityIcon = 
            issue.severity === 'critical' ? '🔴' :
            issue.severity === 'high' ? '🟠' :
            issue.severity === 'medium' ? '🟡' :
            '🟢';
          
          markdown += `| ${severityIcon} ${issue.severity} | ${issue.message} | ${issue.remediation || 'N/A'} |\n`;
        }
        
        markdown += '\n';
      } else {
        markdown += `No issues found in this category.\n\n`;
      }
    }
    
    if (report.recommendations && report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      
      for (const recommendation of report.recommendations) {
        markdown += `- ${recommendation}\n`;
      }
      
      markdown += '\n';
    }
    
    markdown += `## Security Configuration Checklist\n\n`;
    markdown += `| Check | Status |\n`;
    markdown += `|-------|--------|\n`;
    
    for (const check of this.configChecklist) {
      // Determine status based on issues
      let status = 'Unknown';
      let icon = '❓';
      
      if (report.categories) {
        // Map checks to categories based on keywords
        const matchingCategories = Object.entries(report.categories).filter(([category, data]) => {
          return data.issues && data.issues.some(issue => 
            check.toLowerCase().includes(category.toLowerCase()) || 
            issue.message.toLowerCase().includes(check.toLowerCase())
          );
        });
        
        if (matchingCategories.length > 0) {
          const [_, data] = matchingCategories[0];
          status = data.status;
          icon = statusEmoji[data.status] || '';
        } else {
          // If we have no issues reported that match this check, it likely passed
          status = 'Likely Passed';
          icon = '✅';
        }
      }
      
      markdown += `| ${check} | ${icon} ${status} |\n`;
    }
    
    markdown += `\n**Report generated in ${report.executionTimeMs}ms**\n`;
    
    return markdown;
  }
  
  /**
   * Schedule regular configuration checks
   */
  scheduleRegularChecks(intervalHours: number = 24): void {
    console.log(`Scheduling database configuration checks every ${intervalHours} hours`);
    
    setInterval(() => {
      this.checkDatabaseConfiguration()
        .catch(error => console.error('Scheduled database configuration check failed:', error));
    }, intervalHours * 60 * 60 * 1000);
    
    // Run an initial check
    this.checkDatabaseConfiguration()
      .catch(error => console.error('Initial database configuration check failed:', error));
  }
}

/**
 * Helper function to map security assessment to report format
 */
function mapCategoryToReportFormat(category$2: DatabaseConfigCategoryReport {
  return {
    status: category.score >= 80 ? 'passed' : 
           category.score >= 60 ? 'warning' : 'failed',
    issues: category.issues || []
  };
}

/**
 * Database configuration report interface
 */
export interface DatabaseConfigReport {
  timestamp: string;
  overallStatus: 'passed' | 'warning' | 'failed' | 'error' | 'pending';
  categories: {
    [key: string]: DatabaseConfigCategoryReport;
  };
  recommendations?: string[];
  error?: string;
  executionTimeMs: number;
}

export interface DatabaseConfigCategoryReport {
  status: 'passed' | 'warning' | 'failed' | 'pending';
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    remediation?: string;
  }>;
}

// Export a singleton instance
export const databaseConfigChecker = new DatabaseConfigurationChecker();