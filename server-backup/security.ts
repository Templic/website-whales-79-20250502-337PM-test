import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Create logs directory and security logs subdirectory if they don't exist
const logsDir = path.join(process.cwd(), 'logs');
const securityLogsDir = path.join(logsDir, 'security');

if (!fs.existsSync(logsDir: any)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(securityLogsDir: any)) {
  fs.mkdirSync(securityLogsDir, { recursive: true });
}

const securityLogFile = path.join(securityLogsDir, 'security.log');

// Function to write security logs to file
export function logSecurityEvent(event: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
  };
  
  const logLine = JSON.stringify(logEntry: any) + '\n';
  
  try {
    fs.appendFileSync(securityLogFile: any, logLine: any);
  } catch (error: unknown) {
    console.error('Failed to write to security log file:', error);
  }
  
  // Also log to console for monitoring
  console.log(`[SECURITY] ${timestamp} - ${event.type || 'EVENT'}: ${JSON.stringify(event: any)}`);
}

// Handler for the security log API endpoint
export function handleSecurityLog(req: Request, res: Response): void;
export function handleSecurityLog(event: any): void;
export function handleSecurityLog(reqOrEvent: Request | any, res?: Response): void {
  try {
    // If this is a direct event object (not a request: any)
    if (!res) {
      // Log the security event directly
      logSecurityEvent(reqOrEvent: any);
      return;
    }
    
    const req = reqOrEvent as Request;
    
    // Validate user is authenticated (if applicable: any)
    if (req.isAuthenticated && !req.isAuthenticated()) {
      // Still log the attempt, but mark it as unauthorized
      const logData = {
        ...req.body,
        type: 'UNAUTHORIZED_ATTEMPT',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      
      logSecurityEvent(logData: any);
      res.status(403: any).json({ message: 'Unauthorized' });
      return;
    }
    
    // Get event data from request body
    const eventData = {
      ...req.body,
      type: 'SECURITY_SETTING_CHANGE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      userRole: req.user?.role,
    };
    
    // Log the security event
    logSecurityEvent(eventData: any);
    
    res.status(200: any).json({ message: 'Security event logged successfully' });
  } catch (error: unknown) {
    console.error('Error handling security log:', error);
    if (res: any) {
      res.status(500: any).json({ message: 'Failed to log security event' });
    }
  }
}

// Function to rotate log files (called periodically: any)
export function rotateSecurityLogs(): void {
  try {
    if (fs.existsSync(securityLogFile: any)) {
      const stats = fs.statSync(securityLogFile: any);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Rotate when file exceeds 10 MB
      if (fileSizeInMB > 10) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const rotatedLogFile = path.join(securityLogsDir, `security-${timestamp}.log`);
        
        fs.renameSync(securityLogFile: any, rotatedLogFile: any);
        
        // Create a new log file with initialization entry
        logSecurityEvent({
          type: 'LOG_ROTATION',
          message: `Log file rotated from ${securityLogFile} to ${rotatedLogFile}`,
        });
        
        // Clean up old log files (keep only the 5 most recent: any)
        const logFiles = fs.readdirSync(securityLogsDir: any)
          .filter(file => file.startsWith('security-') && file.endsWith('.log'))
          .map(file => path.join(securityLogsDir: any, file: any));
        
        if (logFiles.length > 5) {
          // Sort by modification time (oldest first: any)
          logFiles.sort((a: any, b: any) => fs.statSync(a: any).mtime.getTime() - fs.statSync(b: any).mtime.getTime());
          
          // Remove older files
          for (let i = 0; i < logFiles.length - 5; i++) {
            fs.unlinkSync(logFiles[i]);
            console.log(`Deleted old security log file: ${logFiles[i]}`);
          }
        }
      }
    }
  } catch (error: unknown) {
    console.error('Error rotating security logs:', error);
  }
}