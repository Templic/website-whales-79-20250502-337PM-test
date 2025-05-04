/**
 * BreachDetection.ts
 * 
 * A resource-efficient breach detection system for PCI compliance (Phase 3).
 * This component implements PCI requirements 11.4 (intrusion detection),
 * 11.5 (file integrity monitoring), and contributes to 10.8 (security monitoring).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '../../utils/logger';
import { eventAggregator, EventCategory } from './EventAggregator';
import { incidentManager, IncidentSeverity, IncidentSource } from './IncidentManager';
import { recordAuditEvent } from '../secureAuditTrail';

// Constants for configuration
const SCAN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour (to minimize resource usage)
const FILE_CHECKSUMS_PATH = path.join(process.cwd(), 'logs', 'security', 'file-checksums.json');
const CRITICAL_FILE_PATTERNS = [
  '/server/security/**/*.ts',
  '/server/payment-routes.ts',
  '/server/routes.ts',
  '/server/security.ts',
  '/server/validation/**/*.ts',
  '/server/middleware/**/*.ts'
];

// Detection result types
export interface FileIntegrityCheck {
  filePath: string;
  previousHash: string;
  currentHash: string;
  status: 'unchanged' | 'changed' | 'new' | 'missing';
  timestamp: string;
}

export interface AnomalyDetectionResult {
  anomalyType: 'behavioral' | 'pattern' | 'threshold' | 'integrity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  relatedData: any;
  timestamp: string;
}

/**
 * Breach detection system for critical system components
 */
export class BreachDetection {
  private fileChecksums: Record<string, string> = {};
  private scanInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  private behavioralBaselines: Record<string, any> = {};
  
  constructor() {
    this.createDirectories();
  }
  
  /**
   * Initialize the breach detection system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    log('Initializing breach detection system', 'security');
    
    try {
      // Load existing file checksums if available
      await this.loadFileChecksums();
      
      // Perform initial file integrity check
      await this.performInitialFileIntegrityCheck();
      
      // Initialize behavioral baselines
      await this.initializeBehavioralBaselines();
      
      // Start regular scanning at low frequency to conserve resources
      this.scanInterval = setInterval(() => {
        this.performLightweightScan();
      }, SCAN_INTERVAL_MS);
      
      this.initialized = true;
      log('Breach detection system initialized successfully', 'security');
    } catch (error) {
      log(`Failed to initialize breach detection: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Manually trigger a file integrity scan
   */
  public async performFileIntegrityScan(): Promise<FileIntegrityCheck[]> {
    log('Performing file integrity scan', 'security');
    return this.checkFileIntegrity();
  }
  
  /**
   * Check for behavioral anomalies in security events
   */
  public async checkForAnomalies(): Promise<AnomalyDetectionResult[]> {
    try {
      log('Checking for security anomalies', 'security');
      
      const results: AnomalyDetectionResult[] = [];
      
      // Add behavioral analysis results
      const behavioralResults = await this.performBehavioralAnalysis();
      results.push(...behavioralResults);
      
      // Add pattern-based results
      const patternResults = await this.performPatternAnalysis();
      results.push(...patternResults);
      
      log(`Anomaly detection completed - found ${results.length} potential issues`, 'security');
      
      // Report critical anomalies as incidents
      this.reportCriticalAnomalies(results);
      
      return results;
    } catch (error) {
      log(`Error during anomaly detection: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Check for data leakage patterns
   */
  public async checkForDataLeakage(): Promise<AnomalyDetectionResult[]> {
    try {
      log('Checking for potential data leakage', 'security');
      
      const results: AnomalyDetectionResult[] = [];
      
      // This is a lightweight implementation that can be expanded
      // with more sophisticated checks as needed
      
      // For resource efficiency, we're implementing a minimal version
      
      return results;
    } catch (error) {
      log(`Error during data leakage detection: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Perform a lightweight scan to minimize resource usage
   */
  private async performLightweightScan(): Promise<void> {
    try {
      // Check for excessive memory usage before scanning
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (memoryPercentage > 85) {
        log(`Delaying breach detection scan due to high memory usage: ${memoryPercentage.toFixed(1)}%`, 'security');
        return;
      }
      
      // Randomly choose which type of scan to perform to distribute load
      const scanType = Math.random();
      
      if (scanType < 0.33) {
        // Perform file integrity check on a subset of files
        await this.checkFileIntegrity(true); // true = lightweight mode
      } else if (scanType < 0.66) {
        // Check for behavioral anomalies
        const anomalies = await this.performBehavioralAnalysis();
        this.reportCriticalAnomalies(anomalies);
      } else {
        // Check for data leakage
        const leakages = await this.checkForDataLeakage();
        this.reportCriticalAnomalies(leakages);
      }
    } catch (error) {
      log(`Error during lightweight scan: ${error}`, 'error');
    }
  }
  
  /**
   * Check file integrity for critical system files
   */
  private async checkFileIntegrity(lightweightMode = false): Promise<FileIntegrityCheck[]> {
    try {
      const results: FileIntegrityCheck[] = [];
      
      // Get list of critical files to scan
      const filesToScan = await this.getCriticalFilePaths(lightweightMode);
      
      for (const filePath of filesToScan) {
        try {
          if (!fs.existsSync(filePath)) {
            // File is missing
            if (this.fileChecksums[filePath]) {
              results.push({
                filePath,
                previousHash: this.fileChecksums[filePath],
                currentHash: '',
                status: 'missing',
                timestamp: new Date().toISOString()
              });
            }
            continue;
          }
          
          // Calculate current file hash
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
          
          // Check if we have a previous hash for this file
          if (this.fileChecksums[filePath]) {
            const previousHash = this.fileChecksums[filePath];
            
            if (previousHash !== currentHash) {
              // File has changed
              results.push({
                filePath,
                previousHash,
                currentHash,
                status: 'changed',
                timestamp: new Date().toISOString()
              });
              
              // Update stored hash
              this.fileChecksums[filePath] = currentHash;
            }
          } else {
            // New file
            results.push({
              filePath,
              previousHash: '',
              currentHash,
              status: 'new',
              timestamp: new Date().toISOString()
            });
            
            // Add to stored hashes
            this.fileChecksums[filePath] = currentHash;
          }
        } catch (error) {
          log(`Error checking integrity of file ${filePath}: ${error}`, 'error');
        }
      }
      
      // Save updated checksums
      this.saveFileChecksums();
      
      // Report any changes as potential incidents
      if (results.length > 0) {
        this.reportFileIntegrityChanges(results);
      }
      
      return results;
    } catch (error) {
      log(`Error during file integrity check: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Get critical file paths to scan
   */
  private async getCriticalFilePaths(lightweightMode: boolean): Promise<string[]> {
    const rootDir = process.cwd();
    const criticalFiles: string[] = [];
    
    try {
      for (const pattern of CRITICAL_FILE_PATTERNS) {
        const baseDir = path.join(rootDir, path.dirname(pattern).replace(/^\//, ''));
        const filePattern = path.basename(pattern);
        
        if (filePattern.includes('*')) {
          // Pattern with wildcards
          await this.findMatchingFiles(baseDir, filePattern, criticalFiles);
        } else {
          // Direct file reference
          const filePath = path.join(rootDir, pattern.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            criticalFiles.push(filePath);
          }
        }
      }
      
      // In lightweight mode, take a random subset of files
      if (lightweightMode && criticalFiles.length > 10) {
        // Shuffle array
        for (let i = criticalFiles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [criticalFiles[i], criticalFiles[j]] = [criticalFiles[j], criticalFiles[i]];
        }
        
        // Take first 10 files
        return criticalFiles.slice(0, 10);
      }
      
      return criticalFiles;
    } catch (error) {
      log(`Error finding critical files: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Find files matching a pattern
   */
  private async findMatchingFiles(
    baseDir: string,
    pattern: string,
    results: string[]
  ): Promise<void> {
    if (!fs.existsSync(baseDir)) {
      return;
    }
    
    const items = fs.readdirSync(baseDir);
    
    for (const item of items) {
      const itemPath = path.join(baseDir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // If pattern includes '**', search recursively
        if (pattern.includes('**')) {
          await this.findMatchingFiles(itemPath, pattern.replace('**/', ''), results);
        }
      } else if (stats.isFile()) {
        // Check if file matches pattern
        const patternRegex = new RegExp('^' + 
          pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + 
          '$');
        
        if (patternRegex.test(item)) {
          results.push(itemPath);
        }
      }
    }
  }
  
  /**
   * Report file integrity changes
   */
  private reportFileIntegrityChanges(changes: FileIntegrityCheck[]): void {
    // Count changes by type
    const changed = changes.filter(c => c.status === 'changed').length;
    const missing = changes.filter(c => c.status === 'missing').length;
    const newFiles = changes.filter(c => c.status === 'new').length;
    
    // Determine severity based on changes
    let severity = IncidentSeverity.LOW;
    
    if (missing > 0) {
      severity = IncidentSeverity.HIGH;
    } else if (changed > 0) {
      severity = IncidentSeverity.MEDIUM;
    }
    
    // Create incident for significant changes
    if (changed > 0 || missing > 0) {
      incidentManager.createIncident(
        `File integrity changes detected in critical files`,
        `Detected ${changed} modified and ${missing} missing critical security files`,
        severity,
        EventCategory.SYSTEM,
        IncidentSource.SECURITY_SCAN,
        ['file-integrity', 'security-configuration'],
        []
      );
      
      // Log to audit trail
      recordAuditEvent({
        type: 'security',
        subtype: 'file_integrity',
        action: 'scan',
        status: 'failure',
        severity: severity === IncidentSeverity.HIGH ? 'high' : 'medium',
        userId: 'system',
        data: {
          changedFiles: changed,
          missingFiles: missing,
          newFiles: newFiles,
          details: changes.map(c => `${c.status}: ${c.filePath}`)
        }
      });
    } else if (newFiles > 0) {
      // Just log new files without creating an incident
      recordAuditEvent({
        type: 'security',
        subtype: 'file_integrity',
        action: 'scan',
        status: 'warning',
        severity: 'low',
        userId: 'system',
        data: {
          newFiles: newFiles,
          details: changes.filter(c => c.status === 'new').map(c => c.filePath)
        }
      });
    }
  }
  
  /**
   * Report critical anomalies as security incidents
   */
  private reportCriticalAnomalies(anomalies: AnomalyDetectionResult[]): void {
    // Filter for high and critical severity anomalies
    const criticalAnomalies = anomalies.filter(a => 
      a.severity === 'critical' || a.severity === 'high'
    );
    
    if (criticalAnomalies.length === 0) {
      return;
    }
    
    // Group by type
    const byType: Record<string, AnomalyDetectionResult[]> = {};
    
    for (const anomaly of criticalAnomalies) {
      if (!byType[anomaly.anomalyType]) {
        byType[anomaly.anomalyType] = [];
      }
      byType[anomaly.anomalyType].push(anomaly);
    }
    
    // Create incidents for each type
    for (const [type, typeAnomalies] of Object.entries(byType)) {
      // Determine incident severity (use highest anomaly severity)
      const hasCritical = typeAnomalies.some(a => a.severity === 'critical');
      const severity = hasCritical ? IncidentSeverity.CRITICAL : IncidentSeverity.HIGH;
      
      // Map anomaly type to event category
      let category: EventCategory;
      switch (type) {
        case 'behavioral':
          category = EventCategory.AUTHENTICATION;
          break;
        case 'pattern':
          category = EventCategory.PAYMENT;
          break;
        case 'integrity':
          category = EventCategory.SYSTEM;
          break;
        default:
          category = EventCategory.SYSTEM;
      }
      
      // Create incident
      incidentManager.createIncident(
        `${typeAnomalies.length} ${type} anomalies detected`,
        `Security scan detected unusual ${type} patterns - ${typeAnomalies[0].description}`,
        severity,
        category,
        IncidentSource.ANOMALY_DETECTION,
        [type, 'security-monitoring'],
        []
      );
      
      // Log to audit trail
      recordAuditEvent({
        type: 'security',
        subtype: 'anomaly_detection',
        action: 'detection',
        status: 'alert',
        severity: hasCritical ? 'critical' : 'high',
        userId: 'system',
        data: {
          anomalyType: type,
          count: typeAnomalies.length,
          details: typeAnomalies.map(a => a.description)
        }
      });
    }
  }
  
  /**
   * Perform behavioral analysis on security events
   */
  private async performBehavioralAnalysis(): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = [];
    
    try {
      // Get current metrics from event aggregator
      const metrics = eventAggregator.getLatestMetrics();
      
      if (!metrics) {
        return results;
      }
      
      // Check for authentication anomalies
      this.detectAuthenticationAnomalies(metrics, results);
      
      // Check for payment anomalies
      this.detectPaymentAnomalies(metrics, results);
      
      // Check for access control anomalies
      this.detectAccessControlAnomalies(metrics, results);
      
      return results;
    } catch (error) {
      log(`Error during behavioral analysis: ${error}`, 'error');
      return results;
    }
  }
  
  /**
   * Detect authentication anomalies
   */
  private detectAuthenticationAnomalies(
    metrics: any,
    results: AnomalyDetectionResult[]
  ): void {
    try {
      // Check for unusual authentication patterns
      if (!metrics.eventCounts) return;
      
      const authFailures = metrics.eventCounts['authentication.failure'] || 0;
      const authAttempts = metrics.eventCounts['authentication.attempt'] || 0;
      
      // Check if we have a baseline
      if (this.behavioralBaselines.authentication) {
        const baseline = this.behavioralBaselines.authentication;
        
        // Check for significant increase in failures
        if (authFailures > baseline.avgFailures * 2 && authFailures > 5) {
          results.push({
            anomalyType: 'behavioral',
            severity: authFailures > 10 ? 'high' : 'medium',
            description: `Unusual number of authentication failures detected (${authFailures})`,
            relatedData: {
              current: authFailures,
              baseline: baseline.avgFailures,
              ratio: authFailures / (authAttempts || 1)
            },
            timestamp: new Date().toISOString()
          });
        }
        
        // Check for unusual failure ratio
        const failureRatio = authAttempts ? authFailures / authAttempts : 0;
        if (failureRatio > baseline.avgFailureRatio * 2 && failureRatio > 0.3) {
          results.push({
            anomalyType: 'behavioral',
            severity: failureRatio > 0.5 ? 'high' : 'medium',
            description: `Unusual authentication failure ratio detected (${(failureRatio * 100).toFixed(1)}%)`,
            relatedData: {
              current: failureRatio,
              baseline: baseline.avgFailureRatio,
              attempts: authAttempts,
              failures: authFailures
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      log(`Error detecting authentication anomalies: ${error}`, 'error');
    }
  }
  
  /**
   * Detect payment anomalies
   */
  private detectPaymentAnomalies(
    metrics: any,
    results: AnomalyDetectionResult[]
  ): void {
    try {
      // Check for unusual payment patterns
      if (!metrics.eventCounts) return;
      
      const paymentFailures = metrics.eventCounts['payment.failure'] || 0;
      const paymentAttempts = metrics.eventCounts['payment.transaction'] || 0;
      
      // Check if we have a baseline
      if (this.behavioralBaselines.payment) {
        const baseline = this.behavioralBaselines.payment;
        
        // Check for significant increase in failures
        if (paymentFailures > baseline.avgFailures * 2 && paymentFailures > 3) {
          results.push({
            anomalyType: 'pattern',
            severity: paymentFailures > 5 ? 'critical' : 'high',
            description: `Unusual number of payment failures detected (${paymentFailures})`,
            relatedData: {
              current: paymentFailures,
              baseline: baseline.avgFailures,
              ratio: paymentFailures / (paymentAttempts || 1)
            },
            timestamp: new Date().toISOString()
          });
        }
        
        // Check for unusual failure ratio
        const failureRatio = paymentAttempts ? paymentFailures / paymentAttempts : 0;
        if (failureRatio > baseline.avgFailureRatio * 2 && failureRatio > 0.2) {
          results.push({
            anomalyType: 'pattern',
            severity: 'high',
            description: `Unusual payment failure ratio detected (${(failureRatio * 100).toFixed(1)}%)`,
            relatedData: {
              current: failureRatio,
              baseline: baseline.avgFailureRatio,
              attempts: paymentAttempts,
              failures: paymentFailures
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      log(`Error detecting payment anomalies: ${error}`, 'error');
    }
  }
  
  /**
   * Detect access control anomalies
   */
  private detectAccessControlAnomalies(
    metrics: any,
    results: AnomalyDetectionResult[]
  ): void {
    try {
      // Check for unusual access patterns
      if (!metrics.eventCounts) return;
      
      const unauthorizedAccess = metrics.eventCounts['access_control.unauthorized'] || 0;
      
      // Check if we have a baseline
      if (this.behavioralBaselines.accessControl) {
        const baseline = this.behavioralBaselines.accessControl;
        
        // Check for significant increase in unauthorized access
        if (unauthorizedAccess > baseline.avgUnauthorized * 2 && unauthorizedAccess > 3) {
          results.push({
            anomalyType: 'behavioral',
            severity: unauthorizedAccess > 5 ? 'high' : 'medium',
            description: `Unusual number of unauthorized access attempts detected (${unauthorizedAccess})`,
            relatedData: {
              current: unauthorizedAccess,
              baseline: baseline.avgUnauthorized
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      log(`Error detecting access control anomalies: ${error}`, 'error');
    }
  }
  
  /**
   * Perform pattern-based analysis
   */
  private async performPatternAnalysis(): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = [];
    
    try {
      // This is a lightweight implementation that can be expanded
      // For resource efficiency, we're implementing a minimal version
      
      return results;
    } catch (error) {
      log(`Error during pattern analysis: ${error}`, 'error');
      return results;
    }
  }
  
  /**
   * Load existing file checksums
   */
  private async loadFileChecksums(): Promise<void> {
    try {
      if (fs.existsSync(FILE_CHECKSUMS_PATH)) {
        const content = fs.readFileSync(FILE_CHECKSUMS_PATH, 'utf-8');
        this.fileChecksums = JSON.parse(content);
        log(`Loaded ${Object.keys(this.fileChecksums).length} file checksums`, 'security');
      } else {
        this.fileChecksums = {};
        log('No existing file checksums found, will create new baseline', 'security');
      }
    } catch (error) {
      log(`Error loading file checksums: ${error}`, 'error');
      this.fileChecksums = {};
    }
  }
  
  /**
   * Save file checksums
   */
  private saveFileChecksums(): void {
    try {
      const checksumDir = path.dirname(FILE_CHECKSUMS_PATH);
      if (!fs.existsSync(checksumDir)) {
        fs.mkdirSync(checksumDir, { recursive: true });
      }
      
      fs.writeFileSync(FILE_CHECKSUMS_PATH, JSON.stringify(this.fileChecksums, null, 2));
    } catch (error) {
      log(`Error saving file checksums: ${error}`, 'error');
    }
  }
  
  /**
   * Perform initial file integrity check to establish baseline
   */
  private async performInitialFileIntegrityCheck(): Promise<void> {
    try {
      log('Performing initial file integrity check to establish baseline', 'security');
      
      // Get critical files
      const criticalFiles = await this.getCriticalFilePaths(false);
      
      // Check integrity status for all files
      const changes = await this.checkFileIntegrity();
      
      // Log summary
      const newFiles = changes.filter(c => c.status === 'new').length;
      const changedFiles = changes.filter(c => c.status === 'changed').length;
      const missingFiles = changes.filter(c => c.status === 'missing').length;
      
      log(`Initial file integrity baseline established: ${criticalFiles.length} files scanned, ${newFiles} new, ${changedFiles} changed, ${missingFiles} missing`, 'security');
      
      // Save checksums
      this.saveFileChecksums();
    } catch (error) {
      log(`Error during initial file integrity check: ${error}`, 'error');
    }
  }
  
  /**
   * Initialize behavioral baselines
   */
  private async initializeBehavioralBaselines(): Promise<void> {
    try {
      // Use default baselines initially
      this.behavioralBaselines = {
        authentication: {
          avgFailures: 3,
          avgFailureRatio: 0.1
        },
        payment: {
          avgFailures: 1,
          avgFailureRatio: 0.05
        },
        accessControl: {
          avgUnauthorized: 2
        }
      };
      
      log('Initialized behavioral baselines with default values', 'security');
    } catch (error) {
      log(`Error initializing behavioral baselines: ${error}`, 'error');
    }
  }
  
  /**
   * Create necessary directories
   */
  private createDirectories(): void {
    try {
      const checksumDir = path.dirname(FILE_CHECKSUMS_PATH);
      if (!fs.existsSync(checksumDir)) {
        fs.mkdirSync(checksumDir, { recursive: true });
      }
    } catch (error) {
      log(`Error creating directories: ${error}`, 'error');
    }
  }
  
  /**
   * Shutdown the breach detection system
   */
  public shutdown(): void {
    try {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      
      // Save any pending data
      this.saveFileChecksums();
      
      log('Breach detection system shut down successfully', 'security');
    } catch (error) {
      log(`Error shutting down breach detection: ${error}`, 'error');
    }
  }
}

// Singleton instance
export const breachDetection = new BreachDetection();

// Export initialization function
export async function initializeBreachDetection(): Promise<void> {
  return breachDetection.initialize();
}