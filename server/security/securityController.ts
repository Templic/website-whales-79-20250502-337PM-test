/**
 * Security Controller
 * 
 * Handles security operations including security settings management,
 * security event logging, vulnerability scanning, and security reports.
 */

import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { forceSecurityScan } from '../securityScan';
import { 
  detectSecurityPackages, 
  detectCommonSecurityIssues, 
  generateSecurityReport,
  calculateRiskMetrics
} from './scanUtils';

// Define AsyncHandler type
type AsyncHandler = (req: Request, res: Response) => Promise<void>;

// Security settings management
export interface SecuritySettings {
  enforceStrictTransportSecurity: boolean;
  enableContentSecurityPolicy: boolean;
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enableXSSProtection: boolean;
  enableSecurityHeaders: boolean;
  enableSanitization: boolean;
  logSecurityEvents: boolean;
  autoRunSecurityScans: boolean;
  preventCredentialExposure: boolean;
  requireStrongPasswords: boolean;
  lockAccountAfterFailedAttempts: boolean;
  requireMFA: boolean;
  sessionTimeout: number; // in minutes
  passwordExpiryDays: number; // 0 means never expire
}

// Default security settings
export const defaultSecuritySettings: SecuritySettings = {
  enforceStrictTransportSecurity: true,
  enableContentSecurityPolicy: true,
  enableRateLimiting: true,
  enableCSRFProtection: true,
  enableSQLInjectionProtection: true,
  enableXSSProtection: true,
  enableSecurityHeaders: true,
  enableSanitization: true,
  logSecurityEvents: true,
  autoRunSecurityScans: true,
  preventCredentialExposure: true,
  requireStrongPasswords: true,
  lockAccountAfterFailedAttempts: true,
  requireMFA: false, // Off by default as it requires implementation
  sessionTimeout: 60,
  passwordExpiryDays: 90
};

// Security log event types
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'PERMISSION_DENIED'
  | 'UNAUTHORIZED_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_FAILURE'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SECURITY_SETTING_CHANGED'
  | 'SECURITY_SCAN_STARTED'
  | 'SECURITY_SCAN_COMPLETED'
  | 'SECURITY_VULNERABILITY_DETECTED'
  | 'SECURITY_SETTING_VALIDATION_FAILED';

// Security event data interface
export interface SecurityEventData {
  type: SecurityEventType;
  timestamp?: string;
  userId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

// Security log constants
const LOGS_DIR = path.join(process.cwd(), 'logs');
const SECURITY_LOGS_DIR = path.join(LOGS_DIR, 'security');
const SECURITY_LOG_FILE = path.join(SECURITY_LOGS_DIR, 'security.log');
const SECURITY_SETTINGS_FILE = path.join(SECURITY_LOGS_DIR, 'security-settings.json');
const SCAN_RESULTS_DIR = path.join(SECURITY_LOGS_DIR, 'scan-results');

// Ensure log directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

if (!fs.existsSync(SECURITY_LOGS_DIR)) {
  fs.mkdirSync(SECURITY_LOGS_DIR, { recursive: true });
}

if (!fs.existsSync(SCAN_RESULTS_DIR)) {
  fs.mkdirSync(SCAN_RESULTS_DIR, { recursive: true });
}

// Initialize security settings
let securitySettings: SecuritySettings;

try {
  if (fs.existsSync(SECURITY_SETTINGS_FILE)) {
    const settingsData = fs.readFileSync(SECURITY_SETTINGS_FILE, 'utf8');
    securitySettings = JSON.parse(settingsData);
  } else {
    securitySettings = { ...defaultSecuritySettings };
    fs.writeFileSync(SECURITY_SETTINGS_FILE, JSON.stringify(securitySettings, null, 2));
  }
} catch (error) {
  console.error('Error initializing security settings:', error);
  securitySettings = { ...defaultSecuritySettings };
}

/**
 * Log a security event
 * @param event The security event to log
 */
export function logSecurityEvent(event: SecurityEventData): void {
  try {
    if (!securitySettings.logSecurityEvents) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const eventWithTimestamp = { ...event, timestamp: timestamp };
    const logEntry = `${timestamp} [${event.severity.toUpperCase()}] [${event.type}] ${JSON.stringify(eventWithTimestamp)}\n`;
    
    // Append to log file
    fs.appendFileSync(SECURITY_LOG_FILE, logEntry);
    
    // Log to console for critical events
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn(`[SECURITY] ${event.type}: ${event.details}`);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get security settings
 */
export const getSecuritySettings: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  logSecurityEvent({
    type: 'SECURITY_SETTING_CHANGED',
    userId: req.session?.user?.id,
    userRole: req.session?.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    details: 'Security settings viewed',
    severity: 'low'
  });
  
  res.json({ success: true, settings: securitySettings });
});

/**
 * Update a security setting
 */
export const updateSecuritySetting: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  const { setting, value } = req.body;
  
  // Validate the setting exists
  if (!(setting in securitySettings)) {
    logSecurityEvent({
      type: 'SECURITY_SETTING_VALIDATION_FAILED',
      userId: req.session?.user?.id,
      userRole: req.session?.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      details: `Invalid security setting: ${setting}`,
      severity: 'medium'
    });
    
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid security setting' 
    });
  }
  
  // Update the setting
  const oldValue = (securitySettings as unknown)[setting];
  (securitySettings as unknown)[setting] = value;
  
  // Save updated settings
  fs.writeFileSync(SECURITY_SETTINGS_FILE, JSON.stringify(securitySettings, null, 2));
  
  logSecurityEvent({
    type: 'SECURITY_SETTING_CHANGED',
    userId: req.session?.user?.id,
    userRole: req.session?.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    details: `Security setting "${setting}" changed from ${oldValue} to ${value}`,
    severity: 'medium',
    metadata: { setting, oldValue, newValue: value }
  });
  
  res.json({ 
    success: true, 
    message: 'Security setting updated successfully', 
    setting, 
    value 
  });
});

/**
 * Reset security settings to defaults
 */
export const resetSecuritySettings: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  securitySettings = { ...defaultSecuritySettings };
  fs.writeFileSync(SECURITY_SETTINGS_FILE, JSON.stringify(securitySettings, null, 2));
  
  logSecurityEvent({
    type: 'SECURITY_SETTING_CHANGED',
    userId: req.session?.user?.id,
    userRole: req.session?.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    details: 'Security settings reset to defaults',
    severity: 'medium'
  });
  
  res.json({ 
    success: true, 
    message: 'Security settings reset to defaults', 
    settings: securitySettings 
  });
});

/**
 * Get security logs
 */
export const getSecurityLogs: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 100, severity, type, startDate, endDate } = req.query;
  
  try {
    if (!fs.existsSync(SECURITY_LOG_FILE)) {
      // @ts-ignore - Response type issue
  return res.json({ success: true, logs: [] });
    }
    
    // Read the log file
    const logContent = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim() !== '');
    
    // Parse and filter logs
    let logs = logLines.map(line => {
      try {
        const timestampEndIndex = line.indexOf(' [');
        const timestamp = line.substring(0, timestampEndIndex);
        const jsonStartIndex = line.indexOf('{');
        const jsonData = line.substring(jsonStartIndex);
        return JSON.parse(jsonData);
      } catch (error) {
        return null;
      }
    }).filter(log => log !== null);
    
    // Apply filters if provided
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    if (startDate) {
      const startDateTime = new Date(startDate as string).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= startDateTime);
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate as string).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= endDateTime);
    }
    
    // Limit the number of logs returned
    logs = logs.slice(-parseInt(limit as string));
    
    logSecurityEvent({
      type: 'SECURITY_SETTING_CHANGED',
      userId: req.session?.user?.id,
      userRole: req.session?.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      details: 'Security logs viewed',
      severity: 'low'
    });
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error getting security logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving security logs' 
    });
  }
});

/**
 * Run a security scan
 */
export const runSecurityScan: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  logSecurityEvent({
    type: 'SECURITY_SCAN_STARTED',
    userId: req.session?.user?.id,
    userRole: req.session?.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    details: 'Manual security scan initiated',
    severity: 'low'
  });
  
  try {
    // Run the security scan
    const scanResults = await forceSecurityScan();
    
    // Enhance with additional security package information
    const packageInfo = await detectSecurityPackages();
    
    // Find additional code issues
    const commonIssues = await detectCommonSecurityIssues();
    
    // Merge vulnerabilities
    const allVulnerabilities = [
      ...scanResults.vulnerabilities,
      ...commonIssues
    ];
    
    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(allVulnerabilities);
    
    // Create enhanced scan results
    const enhancedResults = {
      ...scanResults,
      vulnerabilities: allVulnerabilities,
      securityPackages: packageInfo,
      riskMetrics,
      timestamp: new Date().toISOString()
    };
    
    // Save scan results
    const scanTimestamp = new Date().toISOString().replace(/:/g, '-');
    const scanResultFile = path.join(SCAN_RESULTS_DIR, `scan-${scanTimestamp}.json`);
    fs.writeFileSync(scanResultFile, JSON.stringify(enhancedResults, null, 2));
    
    // Generate markdown report
    const reportFile = path.join(SCAN_RESULTS_DIR, `report-${scanTimestamp}.md`);
    await generateSecurityReport(allVulnerabilities, reportFile);
    
    logSecurityEvent({
      type: 'SECURITY_SCAN_COMPLETED',
      userId: req.session?.user?.id,
      userRole: req.session?.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      details: `Security scan completed with ${allVulnerabilities.length} issues found`,
      severity: 'low',
      metadata: {
        criticalIssues: scanResults.criticalIssues,
        highIssues: scanResults.highIssues,
        mediumIssues: scanResults.mediumIssues,
        lowIssues: scanResults.lowIssues,
        scanResultFile,
        reportFile
      }
    });
    
    res.json({
      success: true,
      message: 'Security scan completed',
      results: enhancedResults,
      reportFile
    });
  } catch (error) {
    console.error('Error running security scan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error running security scan',
      error: (error as Error).message
    });
  }
});

/**
 * Get latest security scan results
 */
export const getLatestScanResults: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(SCAN_RESULTS_DIR)) {
      // @ts-ignore - Response type issue
  return res.json({ 
        success: true, 
        message: 'No scan results found', 
        results: null 
      });
    }
    
    // Get list of scan result files
    const files = fs.readdirSync(SCAN_RESULTS_DIR)
      .filter(file => file.startsWith('scan-') && file.endsWith('.json'))
      .sort();
    
    if (files.length === 0) {
      // @ts-ignore - Response type issue
  return res.json({ 
        success: true, 
        message: 'No scan results found', 
        results: null 
      });
    }
    
    // Get the most recent scan
    const latestScanFile = path.join(SCAN_RESULTS_DIR, files[files.length - 1]);
    const scanData = fs.readFileSync(latestScanFile, 'utf8');
    const scanResults = JSON.parse(scanData);
    
    logSecurityEvent({
      type: 'SECURITY_SETTING_CHANGED',
      userId: req.session?.user?.id,
      userRole: req.session?.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      details: 'Security scan results viewed',
      severity: 'low'
    });
    
    res.json({ 
      success: true, 
      results: scanResults 
    });
  } catch (error) {
    console.error('Error getting scan results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving scan results' 
    });
  }
});

/**
 * Get security stats summary
 */
export const getSecurityStats: AsyncHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get count of security logs by severity
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalEvents = 0;
    
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const logContent = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim() !== '');
      
      totalEvents = logLines.length;
      
      // Count events by severity
      for (const line of logLines) {
        if (line.includes('[CRITICAL]')) criticalCount++;
        else if (line.includes('[HIGH]')) highCount++;
        else if (line.includes('[MEDIUM]')) mediumCount++;
        else if (line.includes('[LOW]')) lowCount++;
      }
    }
    
    // Get latest scan results if available
    let latestScan = null;
    let securityScore = 100; // Default to perfect score if no scan available
    
    if (fs.existsSync(SCAN_RESULTS_DIR)) {
      const files = fs.readdirSync(SCAN_RESULTS_DIR)
        .filter(file => file.startsWith('scan-') && file.endsWith('.json'))
        .sort();
      
      if (files.length > 0) {
        const latestScanFile = path.join(SCAN_RESULTS_DIR, files[files.length - 1]);
        const scanData = fs.readFileSync(latestScanFile, 'utf8');
        latestScan = JSON.parse(scanData);
        
        // Get security score from scan if available
        if (latestScan.riskMetrics && typeof latestScan.riskMetrics.securityScore === 'number') {
          securityScore = latestScan.riskMetrics.securityScore;
        } else {
          // Calculate score based on vulnerabilities
          const totalIssues = latestScan.totalIssues || 0;
          const criticalIssues = latestScan.criticalIssues || 0;
          const highIssues = latestScan.highIssues || 0;
          
          // Formula: Start with 100, subtract weighted issues
          securityScore = Math.max(0, 100 - (criticalIssues * 10) - (highIssues * 5) - (totalIssues - criticalIssues - highIssues));
        }
      }
    }
    
    res.json({
      success: true,
      stats: {
        securityScore,
        logStats: {
          totalEvents,
          criticalCount,
          highCount,
          mediumCount,
          lowCount
        },
        latestScanTimestamp: latestScan ? latestScan.timestamp : null,
        vulnerabilities: latestScan ? {
          total: latestScan.totalIssues,
          critical: latestScan.criticalIssues,
          high: latestScan.highIssues,
          medium: latestScan.mediumIssues,
          low: latestScan.lowIssues
        } : null,
        settingsEnabled: Object.entries(securitySettings)
          .filter(([key, value]) => typeof value === 'boolean' && value === true)
          .map(([key]) => key)
      }
    });
  } catch (error) {
    console.error('Error getting security stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving security statistics' 
    });
  }
});