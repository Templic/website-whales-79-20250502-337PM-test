/**
 * IncidentManager.ts
 * 
 * A streamlined incident response system for PCI compliance (Phase 3).
 * This system implements PCI requirements 12.10 (incident response plan)
 * and 10.8 (timely detection and reporting) in a resource-efficient manner.
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { log } from '../../utils/logger';
import { eventAggregator, EventCategory } from './EventAggregator';
import { recordAuditEvent } from '../secureAuditTrail';

// Constants for configuration
const INCIDENT_CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const INCIDENTS_DIR = path.join(process.cwd(), 'logs', 'incidents');
const RESPONSE_TEMPLATES_DIR = path.join(process.cwd(), 'server', 'security', 'monitoring', 'templates');

// Incident severity levels
export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Incident status tracking
export enum IncidentStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  MITIGATED = 'mitigated',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// Incident source categories
export enum IncidentSource {
  SECURITY_SCAN = 'security_scan',
  ANOMALY_DETECTION = 'anomaly_detection',
  MANUAL_REPORT = 'manual_report',
  SYSTEM_ALERT = 'system_alert'
}

// Incident data structure
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: EventCategory;
  source: IncidentSource;
  timestamp: string;
  lastUpdated: string;
  assignedTo?: string;
  affectedComponents: string[];
  relatedEvents: string[];
  actions: IncidentAction[];
  evidenceReferences: string[];
  resolutionSummary?: string;
  integrityHash: string;
}

// Incident action for tracking response steps
export interface IncidentAction {
  id: string;
  description: string;
  type: 'detection' | 'containment' | 'eradication' | 'recovery';
  timestamp: string;
  performedBy?: string;
  outcome?: string;
  automaticAction: boolean;
}

// Response procedure template
export interface ResponseTemplate {
  category: EventCategory;
  severity: IncidentSeverity[];
  title: string;
  description: string;
  containmentSteps: string[];
  eradicationSteps: string[];
  recoverySteps: string[];
  requiredEvidence: string[];
  notificationList: string[];
}

/**
 * Incident management system for security events
 */
export class IncidentManager {
  private incidents: Map<string, SecurityIncident> = new Map();
  private responseTemplates: Map<string, ResponseTemplate> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    this.createIncidentsDirectory();
  }

  /**
   * Initialize the incident manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    log('Initializing incident response system', 'security');
    
    try {
      // Load existing incidents
      await this.loadExistingIncidents();
      
      // Load response templates
      await this.loadResponseTemplates();
      
      // Start regular checking for new incidents
      this.checkInterval = setInterval(() => {
        this.checkForNewIncidents();
      }, INCIDENT_CHECK_INTERVAL_MS);
      
      this.initialized = true;
      log('Incident response system initialized successfully', 'security');
    } catch (error) {
      log(`Failed to initialize incident manager: ${error}`, 'error');
    }
  }

  /**
   * Create a new security incident
   */
  public createIncident(
    title: string,
    description: string,
    severity: IncidentSeverity,
    category: EventCategory,
    source: IncidentSource,
    affectedComponents: string[] = [],
    relatedEvents: string[] = []
  ): SecurityIncident {
    const timestamp = new Date().toISOString();
    const id = this.generateIncidentId(timestamp, category, severity);
    
    // Create incident record
    const incident: SecurityIncident = {
      id,
      title,
      description,
      severity,
      status: IncidentStatus.NEW,
      category,
      source,
      timestamp,
      lastUpdated: timestamp,
      affectedComponents,
      relatedEvents,
      actions: [],
      evidenceReferences: [],
      integrityHash: ''
    };
    
    // Add initial detection action
    this.addIncidentAction(incident, {
      id: this.generateActionId(incident.id, 'detection'),
      description: `Incident detected: ${title}`,
      type: 'detection',
      timestamp,
      automaticAction: true
    });
    
    // Apply response template if available
    this.applyResponseTemplate(incident);
    
    // Generate integrity hash
    incident.integrityHash = this.generateIntegrityHash(incident);
    
    // Save the incident
    this.incidents.set(id, incident);
    this.saveIncident(incident);
    
    // Log the new incident
    log(`New security incident created: ${id} - ${title} (${severity})`, 'security');
    
    // Record in audit trail
    recordAuditEvent({
      type: 'security',
      subtype: 'incident',
      action: 'created',
      status: 'success',
      severity: 'high',
      userId: 'system',
      data: {
        incidentId: id,
        title,
        severity,
        category
      }
    });
    
    return incident;
  }

  /**
   * Update an existing incident
   */
  public updateIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): SecurityIncident | null {
    const incident = this.incidents.get(incidentId);
    
    if (!incident) {
      log(`Cannot update incident - ID not found: ${incidentId}`, 'error');
      return null;
    }
    
    // Apply updates
    const updatedIncident = {
      ...incident,
      ...updates,
      id: incident.id, // Prevent ID changes
      lastUpdated: new Date().toISOString()
    };
    
    // Generate new integrity hash
    updatedIncident.integrityHash = this.generateIntegrityHash(updatedIncident);
    
    // Save updated incident
    this.incidents.set(incidentId, updatedIncident);
    this.saveIncident(updatedIncident);
    
    // Log the update
    log(`Security incident updated: ${incidentId} - Status: ${updatedIncident.status}`, 'security');
    
    // Record in audit trail
    recordAuditEvent({
      type: 'security',
      subtype: 'incident',
      action: 'updated',
      status: 'success',
      severity: 'medium',
      userId: updates.assignedTo || 'system',
      data: {
        incidentId,
        status: updatedIncident.status,
        updates: Object.keys(updates).join(',')
      }
    });
    
    return updatedIncident;
  }

  /**
   * Add an action to an incident
   */
  public addIncidentAction(
    incident: SecurityIncident,
    action: IncidentAction
  ): SecurityIncident {
    // Add action to the incident
    incident.actions.push(action);
    incident.lastUpdated = new Date().toISOString();
    
    // Update integrity hash
    incident.integrityHash = this.generateIntegrityHash(incident);
    
    // Save updated incident
    this.incidents.set(incident.id, incident);
    this.saveIncident(incident);
    
    // Log the action
    log(`Action added to incident ${incident.id}: ${action.description}`, 'security');
    
    // Record in audit trail for significant actions
    if (action.type === 'containment' || action.type === 'recovery') {
      recordAuditEvent({
        type: 'security',
        subtype: 'incident',
        action: action.type,
        status: 'success',
        severity: 'medium',
        userId: action.performedBy || 'system',
        data: {
          incidentId: incident.id,
          actionId: action.id,
          description: action.description
        }
      });
    }
    
    return incident;
  }

  /**
   * Get all incidents matching specified filters
   */
  public getIncidents(
    status?: IncidentStatus,
    severity?: IncidentSeverity,
    category?: EventCategory
  ): SecurityIncident[] {
    let result = Array.from(this.incidents.values());
    
    // Apply filters if specified
    if (status) {
      result = result.filter(incident => incident.status === status);
    }
    
    if (severity) {
      result = result.filter(incident => incident.severity === severity);
    }
    
    if (category) {
      result = result.filter(incident => incident.category === category);
    }
    
    // Sort by timestamp (newest first)
    result.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return result;
  }

  /**
   * Get a specific incident by ID
   */
  public getIncident(incidentId: string): SecurityIncident | null {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Check for new incidents based on aggregated events
   */
  private checkForNewIncidents(): void {
    try {
      // Check for anomalies in the latest metrics
      const anomaly = eventAggregator.checkForAnomalies();
      
      if (anomaly) {
        const [category, subtype] = anomaly.category.split('.');
        
        // Create a new incident for the anomaly
        this.createIncident(
          `Unusual ${category} activity detected: ${subtype}`,
          `Detected ${anomaly.count} ${category}.${subtype} events, exceeding threshold of ${anomaly.threshold}`,
          this.determineSeverity(category, subtype, anomaly.count),
          this.mapToEventCategory(category),
          IncidentSource.ANOMALY_DETECTION,
          [category],
          []
        );
      }
    } catch (error) {
      log(`Error checking for new incidents: ${error}`, 'error');
    }
  }

  /**
   * Determine incident severity based on event type and count
   */
  private determineSeverity(
    category: string,
    subtype: string,
    count: number
  ): IncidentSeverity {
    // Payment failures are always high or critical
    if (category === 'payment' && subtype === 'failure') {
      return count > 10 ? IncidentSeverity.CRITICAL : IncidentSeverity.HIGH;
    }
    
    // Authentication failures severity depends on count
    if (category === 'authentication' && subtype === 'failure') {
      if (count > 20) return IncidentSeverity.HIGH;
      if (count > 10) return IncidentSeverity.MEDIUM;
      return IncidentSeverity.LOW;
    }
    
    // Access control issues are serious
    if (category === 'access_control' && subtype === 'unauthorized') {
      return IncidentSeverity.HIGH;
    }
    
    // Data modification of sensitive data is critical
    if (category === 'data_modification' && subtype === 'sensitive') {
      return IncidentSeverity.CRITICAL;
    }
    
    // Default based on count
    if (count > 30) return IncidentSeverity.HIGH;
    if (count > 15) return IncidentSeverity.MEDIUM;
    return IncidentSeverity.LOW;
  }

  /**
   * Map event category string to enum
   */
  private mapToEventCategory(category: string): EventCategory {
    switch (category) {
      case 'payment': return EventCategory.PAYMENT;
      case 'authentication': return EventCategory.AUTHENTICATION;
      case 'access_control': return EventCategory.ACCESS_CONTROL;
      case 'data_modification': return EventCategory.DATA_MODIFICATION;
      default: return EventCategory.SYSTEM;
    }
  }

  /**
   * Apply response template to a new incident
   */
  private applyResponseTemplate(incident: SecurityIncident): void {
    // Find matching template
    let template: ResponseTemplate | undefined;
    
    for (const [_, tmpl] of this.responseTemplates) {
      if (tmpl.category === incident.category && 
          tmpl.severity.includes(incident.severity)) {
        template = tmpl;
        break;
      }
    }
    
    if (!template) return;
    
    // Add containment steps as actions
    for (const step of template.containmentSteps) {
      this.addIncidentAction(incident, {
        id: this.generateActionId(incident.id, 'containment'),
        description: step,
        type: 'containment',
        timestamp: new Date().toISOString(),
        automaticAction: false
      });
    }
    
    // Add eradication steps as actions
    for (const step of template.eradicationSteps) {
      this.addIncidentAction(incident, {
        id: this.generateActionId(incident.id, 'eradication'),
        description: step,
        type: 'eradication',
        timestamp: new Date().toISOString(),
        automaticAction: false
      });
    }
    
    // Add recovery steps as actions
    for (const step of template.recoverySteps) {
      this.addIncidentAction(incident, {
        id: this.generateActionId(incident.id, 'recovery'),
        description: step,
        type: 'recovery',
        timestamp: new Date().toISOString(),
        automaticAction: false
      });
    }
  }

  /**
   * Generate a unique incident ID
   */
  private generateIncidentId(
    timestamp: string,
    category: EventCategory,
    severity: IncidentSeverity
  ): string {
    const datePart = timestamp.split('T')[0].replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INC-${datePart}-${category.substring(0, 3).toUpperCase()}-${severity.substring(0, 1).toUpperCase()}${randomPart}`;
  }

  /**
   * Generate a unique action ID
   */
  private generateActionId(incidentId: string, actionType: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.floor(Math.random() * 1000).toString(36);
    return `${incidentId}-${actionType.substring(0, 3)}-${timestamp}${randomPart}`;
  }

  /**
   * Generate integrity hash for an incident
   */
  private generateIntegrityHash(incident: SecurityIncident): string {
    const { integrityHash, ...incidentWithoutHash } = incident;
    const data = JSON.stringify(incidentWithoutHash);
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Save incident to disk
   */
  private saveIncident(incident: SecurityIncident): void {
    try {
      const filePath = path.join(INCIDENTS_DIR, `${incident.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(incident, null, 2));
      
      // Also update index file
      this.updateIncidentIndex();
    } catch (error) {
      log(`Error saving incident ${incident.id}: ${error}`, 'error');
    }
  }

  /**
   * Update the incident index file
   */
  private updateIncidentIndex(): void {
    try {
      const indexPath = path.join(INCIDENTS_DIR, 'incident-index.json');
      const index = Array.from(this.incidents.values()).map(incident => ({
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        category: incident.category,
        timestamp: incident.timestamp,
        lastUpdated: incident.lastUpdated
      }));
      
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      log(`Error updating incident index: ${error}`, 'error');
    }
  }

  /**
   * Load existing incidents from disk
   */
  private async loadExistingIncidents(): Promise<void> {
    try {
      if (!fs.existsSync(INCIDENTS_DIR)) {
        return;
      }
      
      const files = fs.readdirSync(INCIDENTS_DIR)
        .filter(file => file.endsWith('.json') && file !== 'incident-index.json');
      
      for (const file of files) {
        try {
          const filePath = path.join(INCIDENTS_DIR, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const incident = JSON.parse(content) as SecurityIncident;
          
          // Verify integrity hash
          const originalHash = incident.integrityHash;
          const calculatedHash = this.generateIntegrityHash(incident);
          
          if (originalHash !== calculatedHash) {
            log(`Integrity check failed for incident ${incident.id}`, 'security');
            // Still load it, but mark it
            incident.title = `[INTEGRITY WARNING] ${incident.title}`;
          }
          
          this.incidents.set(incident.id, incident);
        } catch (error) {
          log(`Error loading incident file ${file}: ${error}`, 'error');
        }
      }
      
      log(`Loaded ${this.incidents.size} existing security incidents`, 'security');
    } catch (error) {
      log(`Error loading existing incidents: ${error}`, 'error');
    }
  }

  /**
   * Load response templates
   */
  private async loadResponseTemplates(): Promise<void> {
    try {
      // Check if templates directory exists
      if (!fs.existsSync(RESPONSE_TEMPLATES_DIR)) {
        // Create directory and initialize with default templates
        this.createDefaultTemplates();
      }
      
      const files = fs.readdirSync(RESPONSE_TEMPLATES_DIR)
        .filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        try {
          const filePath = path.join(RESPONSE_TEMPLATES_DIR, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const template = JSON.parse(content) as ResponseTemplate;
          
          this.responseTemplates.set(file.replace('.json', ''), template);
        } catch (error) {
          log(`Error loading template file ${file}: ${error}`, 'error');
        }
      }
      
      log(`Loaded ${this.responseTemplates.size} incident response templates`, 'security');
    } catch (error) {
      log(`Error loading response templates: ${error}`, 'error');
    }
  }

  /**
   * Create default response templates
   */
  private createDefaultTemplates(): void {
    try {
      if (!fs.existsSync(RESPONSE_TEMPLATES_DIR)) {
        fs.mkdirSync(RESPONSE_TEMPLATES_DIR, { recursive: true });
      }
      
      // Payment incident template
      const paymentTemplate: ResponseTemplate = {
        category: EventCategory.PAYMENT,
        severity: [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
        title: 'Payment Processing Incident',
        description: 'Response procedures for payment processing security incidents',
        containmentSteps: [
          'Suspend affected payment processing channels',
          'Isolate affected systems',
          'Preserve evidence including logs and transaction records',
          'Notify payment processor security team'
        ],
        eradicationSteps: [
          'Identify root cause of the incident',
          'Apply necessary patches or fixes',
          'Reset compromised credentials if applicable',
          'Conduct security review of affected components'
        ],
        recoverySteps: [
          'Gradually restore payment processing capabilities',
          'Monitor closely for any additional anomalies',
          'Update security rules based on findings',
          'Document lessons learned'
        ],
        requiredEvidence: [
          'Transaction logs',
          'System access logs',
          'Network traffic logs',
          'Database query logs'
        ],
        notificationList: [
          'Security team',
          'Fraud department',
          'Payment processor',
          'Executive management'
        ]
      };
      
      // Authentication incident template
      const authTemplate: ResponseTemplate = {
        category: EventCategory.AUTHENTICATION,
        severity: [IncidentSeverity.HIGH, IncidentSeverity.MEDIUM],
        title: 'Authentication Security Incident',
        description: 'Response procedures for authentication and access security incidents',
        containmentSteps: [
          'Lock affected user accounts',
          'Enable additional logging for authentication systems',
          'Apply IP blocking for suspicious sources',
          'Preserve all authentication logs'
        ],
        eradicationSteps: [
          'Reset credentials for affected accounts',
          'Review authentication rules and policies',
          'Apply additional authentication factors if applicable',
          'Update access control lists'
        ],
        recoverySteps: [
          'Gradually restore account access with monitoring',
          'Implement additional authentication monitoring',
          'Document incident in security knowledge base',
          'Update security awareness training'
        ],
        requiredEvidence: [
          'Authentication logs',
          'Account activity timelines',
          'IP address information',
          'User agent details'
        ],
        notificationList: [
          'Security team',
          'System administrators',
          'Affected users',
          'IT management'
        ]
      };
      
      // Data modification incident template
      const dataTemplate: ResponseTemplate = {
        category: EventCategory.DATA_MODIFICATION,
        severity: [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
        title: 'Sensitive Data Security Incident',
        description: 'Response procedures for incidents involving sensitive data modification or access',
        containmentSteps: [
          'Restrict access to affected data systems',
          'Take database snapshots for forensic analysis',
          'Enable transaction logging at highest detail level',
          'Isolate affected application components'
        ],
        eradicationSteps: [
          'Identify unauthorized modifications',
          'Restore data from verified backups if needed',
          'Fix vulnerabilities that allowed the incident',
          'Review data access controls'
        ],
        recoverySteps: [
          'Validate data integrity with checksum verification',
          'Gradually restore service with additional monitoring',
          'Implement enhanced data access monitoring',
          'Update data protection procedures'
        ],
        requiredEvidence: [
          'Database transaction logs',
          'Data access logs',
          'API call records',
          'User session information'
        ],
        notificationList: [
          'Security team',
          'Data protection officer',
          'Legal department',
          'Executive management'
        ]
      };
      
      // Save templates
      fs.writeFileSync(
        path.join(RESPONSE_TEMPLATES_DIR, 'payment-incident.json'),
        JSON.stringify(paymentTemplate, null, 2)
      );
      
      fs.writeFileSync(
        path.join(RESPONSE_TEMPLATES_DIR, 'authentication-incident.json'),
        JSON.stringify(authTemplate, null, 2)
      );
      
      fs.writeFileSync(
        path.join(RESPONSE_TEMPLATES_DIR, 'data-incident.json'),
        JSON.stringify(dataTemplate, null, 2)
      );
      
      log('Created default incident response templates', 'security');
    } catch (error) {
      log(`Error creating default templates: ${error}`, 'error');
    }
  }

  /**
   * Create incidents directory if it doesn't exist
   */
  private createIncidentsDirectory(): void {
    try {
      if (!fs.existsSync(INCIDENTS_DIR)) {
        fs.mkdirSync(INCIDENTS_DIR, { recursive: true });
      }
    } catch (error) {
      log(`Error creating incidents directory: ${error}`, 'error');
    }
  }

  /**
   * Cleanup resources when shutting down
   */
  public shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Ensure all incidents are saved
    for (const incident of this.incidents.values()) {
      this.saveIncident(incident);
    }
    
    log('Incident manager shut down successfully', 'security');
  }
}

// Singleton instance
export const incidentManager = new IncidentManager();

// Export initialization function
export function initializeIncidentManager(): Promise<void> {
  return incidentManager.initialize();
}

// Export convenience function for creating incidents
export function createSecurityIncident(
  title: string,
  description: string,
  severity: IncidentSeverity,
  category: EventCategory,
  source: IncidentSource,
  affectedComponents: string[] = [],
  relatedEvents: string[] = []
): SecurityIncident {
  return incidentManager.createIncident(
    title,
    description,
    severity,
    category,
    source,
    affectedComponents,
    relatedEvents
  );
}