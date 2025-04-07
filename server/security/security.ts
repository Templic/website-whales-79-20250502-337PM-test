/**
 * security.ts
 * 
 * Common security utility functions
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECURITY_LOG_FILE = path.join(__dirname, '../../logs/security/security.log');

// Ensure logs directory exists
const securityLogDir = path.dirname(SECURITY_LOG_FILE);
if (!fs.existsSync(securityLogDir)) {
  fs.mkdirSync(securityLogDir, { recursive: true });
}

/**
 * Log security events to a dedicated log file
 */
export const logSecurityEvent = (eventData: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[SECURITY] ${timestamp} - ${JSON.stringify(eventData)}\n`;
    
    fs.appendFileSync(SECURITY_LOG_FILE, logEntry);
    console.log(`Security event logged: ${eventData.type}`);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Handle security log management (called from scheduled tasks)
 */
export const handleSecurityLog = () => {
  try {
    // Check log file size
    if (fs.existsSync(SECURITY_LOG_FILE)) {
      const stats = fs.statSync(SECURITY_LOG_FILE);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // If log file is larger than 5MB, rotate it
      if (fileSizeInMB > 5) {
        rotateSecurityLogs();
      }
    }
  } catch (error) {
    console.error('Error handling security logs:', error);
  }
};

/**
 * Rotate security logs to prevent excessive disk usage
 */
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