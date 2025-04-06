import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logSecurityEvent, handleSecurityLog, rotateSecurityLogs } from './security';
import { scanProject } from './security/securityScan';
import { User } from '@shared/schema';

// Add the user property to express-session
declare module 'express-session' {
  interface SessionData {
    user?: User; // Add user property to session using the User type from schema.ts
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define user roles and permissions
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Define security permission actions
enum SecurityPermission {
  VIEW_SETTINGS = 'view_security_settings',
  MODIFY_SETTINGS = 'modify_security_settings',
  VIEW_LOGS = 'view_security_logs',
  RUN_SCAN = 'run_security_scan',
  VIEW_SCAN_RESULTS = 'view_scan_results'
}

// Role-based permission matrix
const rolePermissions: Record<UserRole, SecurityPermission[]> = {
  [UserRole.USER]: [],
  [UserRole.ADMIN]: [
    SecurityPermission.VIEW_SETTINGS,
    SecurityPermission.VIEW_LOGS,
    SecurityPermission.VIEW_SCAN_RESULTS
  ],
  [UserRole.SUPER_ADMIN]: [
    SecurityPermission.VIEW_SETTINGS,
    SecurityPermission.MODIFY_SETTINGS,
    SecurityPermission.VIEW_LOGS,
    SecurityPermission.RUN_SCAN,
    SecurityPermission.VIEW_SCAN_RESULTS
  ]
};

// Auth middleware for checking permissions
const checkPermission = (requiredPermission: SecurityPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.session?.user?.role as UserRole;
    
    // Check if user is authenticated
    if (!userRole) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        details: `Unauthenticated user attempted to access ${req.path}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        severity: 'medium'
      });
      
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has required permission
    const hasPermission = rolePermissions[userRole]?.includes(requiredPermission);
    
    if (!hasPermission) {
      logSecurityEvent({
        type: 'PERMISSION_DENIED',
        details: `User with role ${userRole} attempted to access resource requiring ${requiredPermission}`,
        userId: req.session?.user?.id,
        userRole,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        severity: 'high'
      });
      
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // User has required permission, proceed
    next();
  };
};

const SECURITY_SETTINGS_FILE = path.join(__dirname, '../config/security_settings.json');
const SECURITY_LOG_FILE = path.join(__dirname, '../logs/security/security.log');

// Create directories if they don't exist
const securityConfigDir = path.dirname(SECURITY_SETTINGS_FILE);
const securityLogDir = path.dirname(SECURITY_LOG_FILE);

if (!fs.existsSync(securityConfigDir)) {
  fs.mkdirSync(securityConfigDir, { recursive: true });
}

if (!fs.existsSync(securityLogDir)) {
  fs.mkdirSync(securityLogDir, { recursive: true });
}

// Default security settings
const defaultSecuritySettings = {
  CONTENT_SECURITY_POLICY: true,
  HTTPS_ENFORCEMENT: true,
  AUDIO_DOWNLOAD_PROTECTION: true,
  ADVANCED_BOT_PROTECTION: true,
  TWO_FACTOR_AUTHENTICATION: false
};

// Initialize or load security settings
const initializeSecuritySettings = () => {
  try {
    if (!fs.existsSync(SECURITY_SETTINGS_FILE)) {
      fs.writeFileSync(
        SECURITY_SETTINGS_FILE,
        JSON.stringify(defaultSecuritySettings, null, 2),
        'utf8'
      );
      console.log(`Security settings file created at ${SECURITY_SETTINGS_FILE}`);
    }
    return JSON.parse(fs.readFileSync(SECURITY_SETTINGS_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to initialize security settings:', error);
    return defaultSecuritySettings;
  }
};

// Get current security settings
const getSecuritySettings = () => {
  try {
    return JSON.parse(fs.readFileSync(SECURITY_SETTINGS_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to read security settings:', error);
    return defaultSecuritySettings;
  }
};

// Update security settings
const updateSecuritySettings = (newSettings: any) => {
  try {
    const currentSettings = getSecuritySettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    fs.writeFileSync(
      SECURITY_SETTINGS_FILE,
      JSON.stringify(updatedSettings, null, 2),
      'utf8'
    );
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update security settings:', error);
    throw error;
  }
};

// Parse and get security events from log file
const getSecurityStats = () => {
  try {
    if (!fs.existsSync(SECURITY_LOG_FILE)) {
      return { 
        total: 0,
        byType: {},
        bySetting: {},
        recentEvents: []
      };
    }

    const logContent = fs.readFileSync(SECURITY_LOG_FILE, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim() !== '');

    const events = logLines.map(line => {
      try {
        // Skip the timestamp prefix (e.g., "[SECURITY] 2023-01-01T00:00:00.000Z - ")
        const jsonStart = line.indexOf('- ') + 2;
        const jsonContent = line.substring(jsonStart);
        return JSON.parse(jsonContent);
      } catch (e) {
        console.error('Failed to parse security log line:', e);
        return null;
      }
    }).filter(event => event !== null);

    // Count events by type
    const byType: { [key: string]: number } = {};
    const bySetting: { [key: string]: number } = {};

    events.forEach(event => {
      if (event.type) {
        byType[event.type] = (byType[event.type] || 0) + 1;
      }
      if (event.setting) {
        bySetting[event.setting] = (bySetting[event.setting] || 0) + 1;
      }
    });

    return {
      total: events.length,
      byType,
      bySetting,
      recentEvents: events.slice(-50).reverse() // Get last 50 events in reverse chronological order
    };
  } catch (error) {
    console.error('Failed to get security stats:', error);
    return { 
      total: 0,
      byType: {},
      bySetting: {},
      recentEvents: []
    };
  }
};

// Import rate limiters
import { securityLimiter } from './middleware/rateLimit';

// Setup security routes with rate limiting
const securityRouter = Router();
securityRouter.use(securityLimiter); // Apply rate limiting to all security routes

let latestScanResult: any = null;

// Get security settings
securityRouter.get(
  '/settings', 
  checkPermission(SecurityPermission.VIEW_SETTINGS),
  async (req: Request, res: Response) => {
    try {
      const settings = getSecuritySettings();
      
      // Log successful access
      logSecurityEvent({
        type: 'SECURITY_SETTINGS_ACCESS',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: 'Security settings accessed',
        severity: 'low'
      });
      
      res.json({ message: 'Security settings retrieved successfully', settings });
    } catch (error) {
      console.error('Error retrieving security settings:', error);
      res.status(500).json({ message: 'Failed to retrieve security settings' });
    }
  }
);

// Update security settings
securityRouter.post(
  '/settings/update', 
  checkPermission(SecurityPermission.MODIFY_SETTINGS),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      const userRole = req.session?.user?.role;
      
      // Enhanced input validation with more strict requirements
      const schema = z.object({
        setting: z.string()
          .min(3, 'Setting name must be at least 3 characters')
          .max(100, 'Setting name must be at most 100 characters')
          .refine(
            (val) => Object.keys(defaultSecuritySettings).includes(val),
            { message: 'Invalid security setting name' }
          ),
        value: z.boolean({ 
          required_error: 'Value must be a boolean', 
          invalid_type_error: 'Value must be a boolean'
        })
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        // Log validation failure
        logSecurityEvent({
          type: 'SECURITY_SETTING_VALIDATION_FAILED',
          userId,
          userRole,
          details: `Input validation failed: ${JSON.stringify(validationResult.error.errors)}`,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path,
          method: req.method,
          severity: 'medium'
        });
        
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        });
      }
      
      const { setting, value } = validationResult.data;
      
      // Update setting
      const newSettings = { [setting]: value };
      const updatedSettings = updateSecuritySettings(newSettings);
      
      // Log the change
      logSecurityEvent({
        type: 'SECURITY_SETTING_CHANGED',
        setting,
        value,
        userId,
        userRole,
        details: `Security setting "${setting}" was ${value ? 'enabled' : 'disabled'}`,
        severity: setting === 'TWO_FACTOR_AUTHENTICATION' ? 'high' : 'medium'
      });
      
      res.json({ 
        message: 'Security setting updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating security setting:', error);
      
      // Log the error
      logSecurityEvent({
        type: 'SECURITY_SETTING_UPDATE_ERROR',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: `Error updating security setting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      });
      
      res.status(500).json({ message: 'Failed to update security setting' });
    }
  }
);

// Get security stats
securityRouter.get(
  '/stats', 
  checkPermission(SecurityPermission.VIEW_LOGS),
  async (req: Request, res: Response) => {
    try {
      const stats = getSecurityStats();
      
      // Log access
      logSecurityEvent({
        type: 'SECURITY_STATS_ACCESS',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: 'Security statistics accessed',
        severity: 'low'
      });
      
      res.json({ message: 'Security statistics retrieved successfully', stats });
    } catch (error) {
      console.error('Error retrieving security stats:', error);
      res.status(500).json({ message: 'Failed to retrieve security statistics' });
    }
  }
);

// Run security scan
securityRouter.post(
  '/scan/run', 
  checkPermission(SecurityPermission.RUN_SCAN),
  async (req: Request, res: Response) => {
    try {
      // Add brute force protection - check if a scan was run recently
      const SCAN_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const lastScanTime = latestScanResult?.timestamp 
        ? new Date(latestScanResult.timestamp).getTime() 
        : 0;
      
      if (now - lastScanTime < SCAN_COOLDOWN_MS) {
        const remainingMinutes = Math.ceil((SCAN_COOLDOWN_MS - (now - lastScanTime)) / 60000);
        
        return res.status(429).json({ 
          message: `Security scan rate limit exceeded. Please try again in ${remainingMinutes} minute(s).` 
        });
      }
      
      const scanResult = await scanProject();
      latestScanResult = scanResult;
      
      // Log the scan event
      logSecurityEvent({
        type: 'SECURITY_SCAN',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: `Security scan completed with ${scanResult.totalIssues} issues found`,
        severity: scanResult.criticalIssues > 0 ? 'critical' : 
                scanResult.highIssues > 0 ? 'high' : 
                scanResult.mediumIssues > 0 ? 'medium' : 'low'
      });
      
      res.json({ 
        message: 'Security scan completed successfully',
        result: scanResult
      });
    } catch (error) {
      console.error('Error running security scan:', error);
      
      // Log error
      logSecurityEvent({
        type: 'SECURITY_SCAN_ERROR',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: `Error running security scan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      });
      
      res.status(500).json({ message: 'Failed to run security scan' });
    }
  }
);

// Get latest scan results
securityRouter.get(
  '/scan/latest', 
  checkPermission(SecurityPermission.VIEW_SCAN_RESULTS),
  async (req: Request, res: Response) => {
    try {
      // Log access
      logSecurityEvent({
        type: 'SECURITY_SCAN_RESULTS_ACCESS',
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        details: 'Security scan results accessed',
        severity: 'low'
      });
      
      if (!latestScanResult) {
        // Run a new scan if none available but only if user has permission
        if (rolePermissions[req.session?.user?.role as UserRole]?.includes(SecurityPermission.RUN_SCAN)) {
          latestScanResult = await scanProject();
          
          // Log the scan event
          logSecurityEvent({
            type: 'SECURITY_SCAN',
            userId: req.session?.user?.id,
            userRole: req.session?.user?.role,
            details: `Automatic security scan completed with ${latestScanResult.totalIssues} issues found`,
            severity: latestScanResult.criticalIssues > 0 ? 'critical' : 
                    latestScanResult.highIssues > 0 ? 'high' : 
                    latestScanResult.mediumIssues > 0 ? 'medium' : 'low'
          });
        } else {
          return res.status(404).json({ message: 'No scan results available. Please request a scan first.' });
        }
      }
      
      res.json({ 
        message: 'Latest security scan results retrieved successfully',
        result: latestScanResult
      });
    } catch (error) {
      console.error('Error retrieving latest security scan results:', error);
      res.status(500).json({ message: 'Failed to retrieve latest security scan results' });
    }
  }
);

// Test endpoints for development (these should be removed in production)
const testSecurityRouter = Router();

// Test endpoint to get security settings without authentication
testSecurityRouter.get('/security/settings', (req, res) => {
  const settings = getSecuritySettings();
  res.json({ message: 'Security settings retrieved successfully', settings });
});

// Test endpoint to get security stats without authentication
testSecurityRouter.get('/security/stats', (req, res) => {
  const stats = getSecurityStats();
  res.json({ message: 'Security statistics retrieved successfully', stats });
});

// Test endpoint to run a security scan without authentication
testSecurityRouter.get('/security/scan', async (req, res) => {
  try {
    const scanResult = await scanProject();
    latestScanResult = scanResult;
    
    // Log the scan event
    logSecurityEvent({
      type: 'SECURITY_SCAN',
      ...scanResult
    });
    
    res.json({ 
      message: 'Security scan completed successfully',
      timestamp: scanResult.timestamp,
      summary: {
        totalIssues: scanResult.totalIssues,
        criticalIssues: scanResult.criticalIssues,
        highIssues: scanResult.highIssues,
        mediumIssues: scanResult.mediumIssues,
        lowIssues: scanResult.lowIssues
      },
      vulnerabilities: scanResult.vulnerabilities
    });
  } catch (error) {
    console.error('Error running security scan:', error);
    res.status(500).json({ message: 'Failed to run security scan' });
  }
});

// Test endpoint to simulate an unauthorized access event for testing
testSecurityRouter.get('/security/simulate-unauthorized', (req, res) => {
  logSecurityEvent({
    type: 'UNAUTHORIZED_ATTEMPT',
    setting: 'API_ACCESS',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method
  });
  
  res.json({ message: 'Unauthorized access event logged successfully' });
});

// Initialize security settings on module load
initializeSecuritySettings();

export { securityRouter, testSecurityRouter };