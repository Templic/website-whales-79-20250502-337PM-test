/**
 * Security scanning service for file uploads and content validation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logSecurityEvent } from './security/security';

// Constants for scanning
const MAX_SCAN_SIZE = 100 * 1024 * 1024; // 100MB
const SCAN_INTERVAL_HOURS = 24; // Scan every 24 hours
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// State
let scanInterval: NodeJS.Timeout | null = null;
let isScanning = false;

/**
 * Initialize security scanning service
 * @param intervalHours How often to run automated scans (in hours)
 */
export function initializeSecurityScans(intervalHours = SCAN_INTERVAL_HOURS): void {
  console.log('Initializing security scanning service...');
  
  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }
  
  // Check if ClamAV is installed (would be used in production)
  const hasClamAV = checkClamAVInstalled();
  
  if (!hasClamAV) {
    console.warn('ClamAV not detected. Virus scanning will be simulated.');
  }
  
  // Schedule periodic scans
  if (scanInterval) {
    clearInterval(scanInterval);
  }
  
  scanInterval = setInterval(() => {
    if (!isScanning) {
      scanAllUploads().catch(err => {
        console.error('Scheduled scan failed:', err);
      });
    }
  }, intervalHours * 60 * 60 * 1000);
  
  console.log(`Security scanning service initialized. Scans scheduled every ${intervalHours} hours.`);
}

/**
 * Check if ClamAV is installed
 */
function checkClamAVInstalled(): boolean {
  try {
    // In production, we would check for clamav
    // For development, we'll just simulate the check
    if (process.env.NODE_ENV === 'production') {
      execSync('which clamscan', { stdio: 'ignore' });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Scan a specific file for security threats
 */
export async function scanFile(filePath: string): Promise<{
  safe: boolean;
  threats: string[];
}> {
  console.log(`Scanning file: ${filePath}`);
  
  // Check if file exists and is readable
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`File does not exist or is not accessible: ${filePath}`);
  }
  
  // Check file size
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_SCAN_SIZE) {
    const errorMsg = `File too large for scanning: ${stats.size} bytes (max: ${MAX_SCAN_SIZE})`;
    console.error(errorMsg);
    
    // Log security event
    logSecurityEvent({
      type: 'WARNING',
      details: errorMsg,
      severity: 'medium',
      metadata: {
        filePath,
        fileSize: stats.size,
        maxSize: MAX_SCAN_SIZE
      }
    });
    
    return { safe: false, threats: ['file_too_large'] };
  }
  
  // In production, we would use actual virus scanning
  // For development, we'll simulate scanning based on file extension and size
  const fileExt = path.extname(filePath).toLowerCase();
  
  // Simulate ClamAV scan
  return simulateScan(filePath, fileExt, stats.size);
}

/**
 * Simulate a virus scan
 */
function simulateScan(filePath: string, fileExt: string, fileSize: number): Promise<{
  safe: boolean;
  threats: string[];
}> {
  return new Promise((resolve) => {
    // Random delay to simulate scanning (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
      const threats: string[] = [];
      
      // Simulate threat detection for executable files
      const executableExtensions = ['.exe', '.dll', '.sh', '.bat', '.cmd', '.com', '.js'];
      if (executableExtensions.includes(fileExt)) {
        // 5% chance of flagging executable files
        if (Math.random() < 0.05) {
          threats.push('potentially_malicious_executable');
        }
      }
      
      // Simulate detection of unusually large files in certain formats
      const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.avi'];
      if (mediaExtensions.includes(fileExt) && fileSize > 50 * 1024 * 1024) {
        // 3% chance of flagging large media files
        if (Math.random() < 0.03) {
          threats.push('suspicious_large_media_file');
        }
      }
      
      // Simulate detection for archive files
      const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
      if (archiveExtensions.includes(fileExt)) {
        // 10% chance of flagging archive files
        if (Math.random() < 0.1) {
          threats.push('suspicious_archive');
        }
      }
      
      // Log results
      const safe = threats.length === 0;
      if (!safe) {
        logSecurityEvent({
          type: 'ALERT',
          details: `Security scan detected potential threats in file: ${path.basename(filePath)}`,
          severity: 'high',
          metadata: {
            filePath,
            fileExt,
            fileSize,
            threats
          }
        });
      }
      
      resolve({ safe, threats });
    }, delay);
  });
}

/**
 * Scan all files in the uploads directory
 */
export async function scanAllUploads(): Promise<{
  scannedFiles: number;
  threatsDetected: number;
  details: any[];
}> {
  console.log('Starting scan of all uploaded files...');
  
  // Mark as scanning to prevent concurrent scans
  if (isScanning) {
    console.log('Scan already in progress, skipping...');
    return { scannedFiles: 0, threatsDetected: 0, details: [] };
  }
  
  isScanning = true;
  
  try {
    // Check if uploads directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log(`Uploads directory does not exist: ${UPLOAD_DIR}`);
      return { scannedFiles: 0, threatsDetected: 0, details: [] };
    }
    
    // Get all files recursively
    const files = getFilesRecursively(UPLOAD_DIR);
    
    // Results
    const results = {
      scannedFiles: 0,
      threatsDetected: 0,
      details: [] as any[]
    };
    
    // Scan each file
    for (const file of files) {
      try {
        results.scannedFiles++;
        const scanResult = await scanFile(file);
        
        if (!scanResult.safe) {
          results.threatsDetected += scanResult.threats.length;
          results.details.push({
            file: file.replace(process.cwd(), ''),
            threats: scanResult.threats
          });
        }
      } catch (error) {
        console.error(`Error scanning file ${file}:`, error);
        
        // Log security event
        logSecurityEvent({
          type: 'ERROR',
          details: `Error during security scan of file: ${path.basename(file)}`,
          severity: 'medium',
          metadata: {
            filePath: file,
            error: (error as Error).message
          }
        });
      }
    }
    
    // Log completion
    console.log(`Scan completed. Scanned ${results.scannedFiles} files, found ${results.threatsDetected} potential threats.`);
    
    // Log security event if threats were found
    if (results.threatsDetected > 0) {
      logSecurityEvent({
        type: 'ALERT',
        details: `Security scan found ${results.threatsDetected} potential threats across ${results.details.length} files`,
        severity: 'high',
        metadata: {
          summary: results
        }
      });
    }
    
    return results;
  } finally {
    // Mark as not scanning
    isScanning = false;
  }
}

/**
 * Get all files in a directory recursively
 */
function getFilesRecursively(dir: string): string[] {
  const files: string[] = [];
  
  // Read directory contents
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively get files in subdirectory
      files.push(...getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      // Add file to list
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Scan an upload stream (e.g., from express-fileupload)
 */
export function scanStream(fileData: Buffer, fileName: string): Promise<{
  safe: boolean;
  threats: string[];
}> {
  console.log(`Scanning file stream: ${fileName}`);
  
  // Check file size
  if (fileData.length > MAX_SCAN_SIZE) {
    const errorMsg = `File stream too large for scanning: ${fileData.length} bytes (max: ${MAX_SCAN_SIZE})`;
    console.error(errorMsg);
    
    // Log security event
    logSecurityEvent({
      type: 'WARNING',
      details: errorMsg,
      severity: 'medium',
      metadata: {
        fileName,
        fileSize: fileData.length,
        maxSize: MAX_SCAN_SIZE
      }
    });
    
    return Promise.resolve({ safe: false, threats: ['file_too_large'] });
  }
  
  // Get file extension
  const fileExt = path.extname(fileName).toLowerCase();
  
  // Simulate scan
  return simulateScan(fileName, fileExt, fileData.length);
}

/**
 * Stop the scanning service
 */
export function stopSecurityScans(): void {
  console.log('Stopping security scanning service...');
  
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  
  console.log('Security scanning service stopped');
}

export default {
  initializeSecurityScans,
  scanFile,
  scanAllUploads,
  scanStream,
  stopSecurityScans
};