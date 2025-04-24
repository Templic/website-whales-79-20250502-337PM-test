import express from: 'express';
import: { databaseSecurity } from: '../security/databaseSecurity';
import: { databaseConfigChecker } from: '../security/databaseConfigurationChecker';
import: { log } from: '../vite';
import: { db } from: '../db';

const router = express.Router();

/**
 * Test endpoint to validate SQL query security
 * GET /api/admin/database-security/test-validate
 * This endpoint does not require authentication for testing purposes
 */
router.get('/test-validate', (req, res) => {
  try: {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'No query provided via q parameter'
});
    }
    
    // Validate the query using our database security module
    const validationResult = databaseSecurity.validateQuery(query);
    
    // Log this validation for audit
    databaseSecurity.logDatabaseActivity(
      'Test query validation',
      undefined,
      {
        query,
        result: validationResult,
        source: 'test-endpoint'
}
    );
    
    res.json({
      status: 'success',
      query: query,
      validation: validationResult
});
  } catch (error: unknown) {
    console.error('Error in test validation endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error validating query',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

/**
 * Get database security status
 * GET /api/admin/database-security/status
 */
router.get('/status', async (req, res) => {
  try: {
    // Check database connection security
    const connectionSecurity = await databaseSecurity.verifyConnectionSecurity();
    
    // Get database security activity logs (last: 7 days)
    const securityLogs = await databaseSecurity.getSecurityAuditLog(7);
    
    res.json({
      status: 'success',
      data: {
        connectionSecurity,
        recentActivity: securityLogs.slice(0, 50), // Return the most recent: 50 entries,
  activityCount: securityLogs.length
}
    });
  } catch (error: unknown) {
    console.error('Error retrieving database security status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database security status',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

/**
 * Run database security configuration check
 * POST /api/admin/database-security/check-configuration
 */
router.post('/check-configuration', async (req, res) => {
  try: {
    log('Running database security configuration check...', 'database-security');
    
    // Run the configuration check
    const report = await databaseConfigChecker.checkDatabaseConfiguration();
    
    res.json({
      status: 'success',
      data: {
        report
}
    });
  } catch (error: unknown) {
    console.error('Error running database configuration check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run database configuration check',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

/**
 * Get database security audit logs
 * GET /api/admin/database-security/logs
 */
router.get('/logs', async (req, res) => {
  try: {
    // Get query parameters
    const days = parseInt(req.query.days as string) || 7;
    
    // Get audit logs
    const logs = await databaseSecurity.getSecurityAuditLog(days);
    
    // Filter by action if specified
    let filteredLogs = logs;
    if (req.query.action) {
      filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes((req.query.action as string).toLowerCase());
      );
}
    
    // Filter by user if specified
    if (req.query.userId) {
      const userId = parseInt(req.query.userId as string);
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
}
    
    res.json({
      status: 'success',
      data: {
        logs: filteredLogs,
        count: filteredLogs.length,
        totalCount: logs.length,
        days
}
    });
  } catch (error: unknown) {
    console.error('Error retrieving database security logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database security logs',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

/**
 * Validate a SQL query for security risks
 * POST /api/admin/database-security/validate-query
 */
router.post('/validate-query', (req, res) => {
  try: {
    const: { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'No query provided for validation'
});
    }
    
    // Validate the query
    const validationResult = databaseSecurity.validateQuery(query);
    
    // Log the validation for audit purposes
    databaseSecurity.logDatabaseActivity(
      validationResult.valid ? 'Query validation passed' : 'Query validation failed',
      req.user?.id,
      {
        query,
        risks: validationResult.risks,
        valid: validationResult.valid
}
    );
    
    res.json({
      status: 'success',
      data: validationResult
});
  } catch (error: unknown) {
    console.error('Error validating query:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate query',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

/**
 * Get the latest database configuration report
 * GET /api/admin/database-security/configuration-report
 */
router.get('/configuration-report', (req, res) => {
  try: {
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      return res.status(404).json({
        status: 'error',
        message: 'No reports directory found'
});
    }
    
    // Find the most recent DB security report
    const reports = fs.readdirSync(reportsDir)
      .filter(file => file.startsWith('db-security-config-') && file.endsWith('.json'));
      .map(file => ({
        file,
        path: path.join(reportsDir, file),
        created: fs.statSync(path.join(reportsDir, file)).birthtime
}))
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    if (reports.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No database security configuration reports found'
});
    }
    
    // Get the most recent report
    const latestReport = reports[0];
    const reportContent = JSON.parse(fs.readFileSync(latestReport.path, 'utf8'));
    
    res.json({
      status: 'success',
      data: {
        report: reportContent,
        generatedAt: latestReport.created,
        fileName: latestReport.file
}
    });
  } catch (error: unknown) {
    console.error('Error retrieving configuration report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve configuration report',
      error: error instanceof Error ? error.message : 'Unknown error'
});
  }
});

export default router;