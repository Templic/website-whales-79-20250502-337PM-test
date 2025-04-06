import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logSecurityEvent, handleSecurityLog, rotateSecurityLogs } from './security';
import { scanProject } from './securityScan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Setup security routes
const securityRouter = Router();
let latestScanResult: any = null;

// Get security settings
securityRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.user?.role;
    
    // Only admin and super_admin roles can access security settings
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_SETTINGS_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const settings = getSecuritySettings();
    res.json({ message: 'Security settings retrieved successfully', settings });
  } catch (error) {
    console.error('Error retrieving security settings:', error);
    res.status(500).json({ message: 'Failed to retrieve security settings' });
  }
});

// Update security settings
securityRouter.post('/settings/update', async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.user?.role;
    const userId = req.session?.user?.id || 0;
    
    // Only admin and super_admin roles can update security settings
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_SETTINGS_UPDATE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Validate input
    const schema = z.object({
      setting: z.string(),
      value: z.boolean()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
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
      userRole
    });
    
    res.json({ 
      message: 'Security setting updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating security setting:', error);
    res.status(500).json({ message: 'Failed to update security setting' });
  }
});

// Get security stats
securityRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.user?.role;
    
    // Only admin and super_admin roles can access security stats
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_STATS_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const stats = getSecurityStats();
    res.json({ message: 'Security statistics retrieved successfully', stats });
  } catch (error) {
    console.error('Error retrieving security stats:', error);
    res.status(500).json({ message: 'Failed to retrieve security statistics' });
  }
});

// Run security scan
securityRouter.post('/scan/run', async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.user?.role;
    
    // Only admin and super_admin roles can run security scans
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_SCAN_RUN',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const scanResult = await scanProject();
    latestScanResult = scanResult;
    
    // Log the scan event
    logSecurityEvent({
      type: 'SECURITY_SCAN',
      ...scanResult
    });
    
    res.json({ 
      message: 'Security scan completed successfully',
      result: scanResult
    });
  } catch (error) {
    console.error('Error running security scan:', error);
    res.status(500).json({ message: 'Failed to run security scan' });
  }
});

// Get latest scan results
securityRouter.get('/scan/latest', async (req: Request, res: Response) => {
  try {
    const userRole = req.session?.user?.role;
    
    // Only admin and super_admin roles can access scan results
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ATTEMPT',
        setting: 'SECURITY_SCAN_RESULTS_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (!latestScanResult) {
      // Run a new scan if none available
      latestScanResult = await scanProject();
      
      // Log the scan event
      logSecurityEvent({
        type: 'SECURITY_SCAN',
        ...latestScanResult
      });
    }
    
    res.json({ 
      message: 'Latest security scan results retrieved successfully',
      result: latestScanResult
    });
  } catch (error) {
    console.error('Error retrieving latest security scan results:', error);
    res.status(500).json({ message: 'Failed to retrieve latest security scan results' });
  }
});

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