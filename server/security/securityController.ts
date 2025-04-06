/**
 * securityController.ts
 * 
 * Controller for security-related API endpoints
 */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanProject } from '../securityScan';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECURITY_SETTINGS_FILE = path.join(__dirname, '../../config/security_settings.json');
const SECURITY_LOG_FILE = path.join(__dirname, '../../logs/security/security.log');

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
  TWO_FACTOR_AUTHENTICATION: false,
  RATE_LIMITING: true,
  CSRF_PROTECTION: true,
  XSS_PROTECTION: true,
  SQL_INJECTION_PROTECTION: true
};

// Log security events
export const logSecurityEvent = (eventData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[SECURITY] ${timestamp} - ${JSON.stringify(eventData)}\n`;
    
    fs.appendFileSync(SECURITY_LOG_FILE, logEntry);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Rotate security logs (called from a scheduled task)
export const rotateSecurityLogs = () => {
  try {
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const rotatedLogFile = path.join(securityLogDir, `security-${timestamp}.log`);
      
      fs.renameSync(SECURITY_LOG_FILE, rotatedLogFile);
      console.log(`Security log rotated to ${rotatedLogFile}`);
    }
  } catch (error) {
    console.error('Failed to rotate security logs:', error);
  }
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

// Store the latest scan result
let latestScanResult: any = null;

/**
 * Get security settings
 */
export const getSettings = (req: Request, res: Response) => {
  try {
    // Check authorization (admin or super_admin only)
    if (!req.isAuthenticated || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      // Log unauthorized attempt
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
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error retrieving security settings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve security settings' });
  }
};

/**
 * Update a security setting
 */
export const updateSetting = (req: Request, res: Response) => {
  try {
    // Check authorization (admin or super_admin only)
    if (!req.isAuthenticated || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      // Log unauthorized attempt
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
        success: false, 
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
      userId: req.user.id,
      userRole: req.user.role
    });
    
    res.json({ 
      success: true,
      message: 'Security setting updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating security setting:', error);
    res.status(500).json({ success: false, message: 'Failed to update security setting' });
  }
};

/**
 * Get security statistics
 */
export const getStats = (req: Request, res: Response) => {
  try {
    // Check authorization (admin or super_admin only)
    if (!req.isAuthenticated || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      // Log unauthorized attempt
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
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error retrieving security stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve security statistics' });
  }
};

/**
 * Get latest scan results
 */
export const getLatestScan = (req: Request, res: Response) => {
  try {
    // Check authorization (admin or super_admin only)
    if (!req.isAuthenticated || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      // Log unauthorized attempt
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
      return res.status(404).json({ 
        success: false, 
        message: 'No scan results available. Run a scan first.' 
      });
    }
    
    res.json({ 
      success: true,
      result: latestScanResult
    });
  } catch (error) {
    console.error('Error retrieving latest security scan results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve latest security scan results' 
    });
  }
};

/**
 * Run a new security scan
 */
export const runScan = async (req: Request, res: Response) => {
  try {
    // Check authorization (admin or super_admin only)
    if (!req.isAuthenticated || !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      // Log unauthorized attempt
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
      userId: req.user.id,
      userRole: req.user.role,
      ...scanResult
    });
    
    res.json({ 
      success: true,
      message: 'Security scan completed successfully',
      result: scanResult
    });
  } catch (error) {
    console.error('Error running security scan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run security scan' 
    });
  }
};

// Initialize security settings on module load
initializeSecuritySettings();