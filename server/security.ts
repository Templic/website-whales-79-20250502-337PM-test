import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Create logs directory and security logs subdirectory if they don't exist
const logsDir = path.join(process.cwd(), 'logs');
const securityLogsDir = path.join(logsDir, 'security');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(securityLogsDir)) {
  fs.mkdirSync(securityLogsDir, { recursive: true });
}

const securityLogFile = path.join(securityLogsDir, 'security.log');

// Function to write security logs to file
export function logSecurityEvent(type: string, level: 'info' | 'warn' | 'error', details?: Record<string, string>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    level,
    details: details || {}
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(securityLogFile, logLine);
  } catch (error) {
    console.error('Failed to write to security log file:', error);
  }
  
  // Also log to console for monitoring
  console.log(`[SECURITY] ${timestamp} - ${level.toUpperCase()}: ${type} ${details ? JSON.stringify(details) : ''}`);
}

// Handler for the security log API endpoint
export function handleSecurityLog(req: Request, res: Response): void;
export function handleSecurityLog(type: string, level: 'info' | 'warn' | 'error', details?: Record<string, string>): void;
export function handleSecurityLog(reqOrEvent: Request | string, resOrLevel?: Response | 'info' | 'warn' | 'error', details?: Record<string, string>): void {
  try {
    // If this is a direct event call with type and level
    if (typeof reqOrEvent === 'string' && typeof resOrLevel === 'string') {
      // Log the security event directly
      logSecurityEvent(reqOrEvent, resOrLevel as 'info' | 'warn' | 'error', details);
      return;
    }
    
    // This is a request
    const req = reqOrEvent as Request;
    const res = resOrLevel as Response;
    
    // Validate user is authenticated (if applicable)
    if (req.isAuthenticated && !req.isAuthenticated()) {
      // Still log the attempt, but mark it as unauthorized
      logSecurityEvent('UNAUTHORIZED_ATTEMPT', 'warn', {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : 'unknown'
      });
      
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    
    // Log the security event from request body
    logSecurityEvent('SECURITY_SETTING_CHANGE', 'info', {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : 'unknown',
      userId: req.user?.id ? String(req.user.id) : 'unknown',
      userRole: req.user?.role ? String(req.user.role) : 'unknown'
    });
    
    res.status(200).json({ message: 'Security event logged successfully' });
  } catch (error) {
    console.error('Error handling security log:', error);
    if (resOrLevel && typeof resOrLevel !== 'string') {
      resOrLevel.status(500).json({ message: 'Failed to log security event' });
    }
  }
}

// Function to rotate log files (called periodically)
export function rotateSecurityLogs(): void {
  try {
    if (fs.existsSync(securityLogFile)) {
      const stats = fs.statSync(securityLogFile);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Rotate when file exceeds 10 MB
      if (fileSizeInMB > 10) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const rotatedLogFile = path.join(securityLogsDir, `security-${timestamp}.log`);
        
        fs.renameSync(securityLogFile, rotatedLogFile);
        
        // Create a new log file with initialization entry
        logSecurityEvent('LOG_ROTATION', 'info', {
          message: `Log file rotated from ${securityLogFile} to ${rotatedLogFile}`
        });
        
        // Clean up old log files (keep only the 5 most recent)
        const logFiles = fs.readdirSync(securityLogsDir)
          .filter(file => file.startsWith('security-') && file.endsWith('.log'))
          .map(file => path.join(securityLogsDir, file));
        
        if (logFiles.length > 5) {
          // Sort by modification time (oldest first)
          logFiles.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());
          
          // Remove older files
          for (let i = 0; i < logFiles.length - 5; i++) {
            fs.unlinkSync(logFiles[i]);
            console.log(`Deleted old security log file: ${logFiles[i]}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error rotating security logs:', error);
  }
}