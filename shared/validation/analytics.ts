/**
 * Validation Analytics Module
 * 
 * This module provides tools for tracking and analyzing validation issues,
 * helping to identify common problems and improve form UX.
 */

import { ValidationError, ValidationContext, ValidationSeverity } from './validationTypes';

/**
 * Validation event type
 */
export enum ValidationEventType {
  STARTED = 'validation_started',
  COMPLETED = 'validation_completed',
  ERROR = 'validation_error',
  SUCCESS = 'validation_success',
  FIELD_FOCUSED = 'field_focused',
  FIELD_BLURRED = 'field_blurred',
  FIELD_CHANGED = 'field_changed',
  FORM_SUBMITTED = 'form_submitted',
  FORM_RESET = 'form_reset'
}

/**
 * Validation event
 */
export interface ValidationEvent {
  type: ValidationEventType;
  timestamp: number;
  formId?: string;
  fieldId?: string;
  errors?: ValidationError[];
  metadata?: Record<string, any>;
  duration?: number;
}

/**
 * Error frequency data
 */
export interface ErrorFrequencyData {
  errorCode: string;
  count: number;
  fields: {
    field: string;
    count: number;
  }[];
}

/**
 * Field frequency data
 */
export interface FieldErrorData {
  field: string;
  errorCount: number;
  errorCodes: {
    code: string;
    count: number;
  }[];
  averageResolutionTime?: number;
}

/**
 * Completion rate data
 */
export interface CompletionRateData {
  field: string;
  attemptCount: number;
  successCount: number;
  completionRate: number;
  averageAttempts: number;
}

/**
 * Session data
 */
export interface ValidationSessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  formId: string;
  completionStatus: 'completed' | 'abandoned' | 'in_progress';
  totalErrors: number;
  totalFields: number;
  totalValidations: number;
  fieldInteractions: {
    field: string;
    focusCount: number;
    blurCount: number;
    changeCount: number;
    errorCount: number;
    timeSpent: number;
  }[];
}

/**
 * Validation analytics data
 */
export interface ValidationAnalyticsData {
  mostFrequentErrors: ErrorFrequencyData[];
  fieldErrorRates: FieldErrorData[];
  completionRates: CompletionRateData[];
  sessions: ValidationSessionData[];
  totalSessions: number;
  totalCompletedSessions: number;
  totalAbandonedSessions: number;
  averageSessionDuration: number;
  averageErrorsPerSession: number;
}

/**
 * Validation analytics configuration
 */
export interface ValidationAnalyticsConfig {
  enabled: boolean;
  trackFieldInteractions: boolean;
  trackValidationTime: boolean;
  maxSessionsToKeep: number;
  maxEventsToKeep: number;
  samplingRate: number; // 0-1, 1 means track everything
}

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: ValidationAnalyticsConfig = {
  enabled: true,
  trackFieldInteractions: true,
  trackValidationTime: true,
  maxSessionsToKeep: 100,
  maxEventsToKeep: 1000,
  samplingRate: 1
};

/**
 * Validation analytics service
 */
export class ValidationAnalytics {
  private events: ValidationEvent[];
  private sessions: Map<string, ValidationSessionData>;
  private config: ValidationAnalyticsConfig;
  private currentSessionId: string | null;
  private persistence: ValidationAnalyticsPersistence | null;
  
  constructor(
    config: Partial<ValidationAnalyticsConfig> = {},
    persistence: ValidationAnalyticsPersistence | null = null
  ) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.events = [];
    this.sessions = new Map();
    this.currentSessionId = null;
    this.persistence = persistence;
    
    // Load persisted data if available
    this.loadPersistedData();
  }
  
  /**
   * Track a validation event
   */
  trackEvent(event: Omit<ValidationEvent, 'timestamp'>): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) {
      return;
    }
    
    // Create full event with timestamp
    const fullEvent: ValidationEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    // Add to events
    this.events.push(fullEvent);
    
    // Trim events if needed
    if (this.events.length > this.config.maxEventsToKeep) {
      this.events = this.events.slice(-this.config.maxEventsToKeep);
    }
    
    // Update session data
    this.updateSessionData(fullEvent);
    
    // Persist data
    this.persistData();
  }
  
  /**
   * Start a validation session
   */
  startSession(formId: string): string {
    if (!this.config.enabled) {
      return '';
    }
    
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create session data
    const sessionData: ValidationSessionData = {
      sessionId,
      startTime: Date.now(),
      formId,
      completionStatus: 'in_progress',
      totalErrors: 0,
      totalFields: 0,
      totalValidations: 0,
      fieldInteractions: []
    };
    
    // Store session
    this.sessions.set(sessionId, sessionData);
    
    // Set as current session
    this.currentSessionId = sessionId;
    
    // Trim sessions if needed
    if (this.sessions.size > this.config.maxSessionsToKeep) {
      // Remove oldest session
      const oldestSessionKey = Array.from(this.sessions.keys())
        .sort((a, b) => this.sessions.get(a)!.startTime - this.sessions.get(b)!.startTime)[0];
      
      if (oldestSessionKey) {
        this.sessions.delete(oldestSessionKey);
      }
    }
    
    // Track session start event
    this.trackEvent({
      type: ValidationEventType.STARTED,
      formId,
      metadata: {
        sessionId
      }
    });
    
    // Persist data
    this.persistData();
    
    return sessionId;
  }
  
  /**
   * End a validation session
   */
  endSession(
    sessionId: string, 
    status: 'completed' | 'abandoned' = 'completed'
  ): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Get session
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    // Update session
    session.endTime = Date.now();
    session.completionStatus = status;
    
    // Track session end event
    this.trackEvent({
      type: status === 'completed' 
        ? ValidationEventType.SUCCESS 
        : ValidationEventType.ERROR,
      formId: session.formId,
      metadata: {
        sessionId,
        duration: session.endTime - session.startTime,
        totalErrors: session.totalErrors,
        totalFields: session.totalFields,
        totalValidations: session.totalValidations
      }
    });
    
    // Clear current session if it matches
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    
    // Persist data
    this.persistData();
  }
  
  /**
   * Update session data based on an event
   */
  private updateSessionData(event: ValidationEvent): void {
    // If no session ID in event metadata and no current session, return
    const sessionId = event.metadata?.sessionId || this.currentSessionId;
    
    if (!sessionId) {
      return;
    }
    
    // Get session
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    // Update session based on event type
    switch (event.type) {
      case ValidationEventType.ERROR:
        if (event.errors) {
          session.totalErrors += event.errors.length;
          
          // Update field errors
          if (event.fieldId) {
            const fieldInteraction = this.getOrCreateFieldInteraction(session, event.fieldId);
            fieldInteraction.errorCount += event.errors.length;
          }
        }
        break;
        
      case ValidationEventType.FIELD_FOCUSED:
        if (event.fieldId) {
          const fieldInteraction = this.getOrCreateFieldInteraction(session, event.fieldId);
          fieldInteraction.focusCount += 1;
        }
        break;
        
      case ValidationEventType.FIELD_BLURRED:
        if (event.fieldId) {
          const fieldInteraction = this.getOrCreateFieldInteraction(session, event.fieldId);
          fieldInteraction.blurCount += 1;
          
          // Update time spent if we have focus time in metadata
          const focusTime = event.metadata?.focusTime;
          
          if (focusTime && typeof focusTime === 'number') {
            fieldInteraction.timeSpent += focusTime;
          }
        }
        break;
        
      case ValidationEventType.FIELD_CHANGED:
        if (event.fieldId) {
          const fieldInteraction = this.getOrCreateFieldInteraction(session, event.fieldId);
          fieldInteraction.changeCount += 1;
        }
        break;
        
      case ValidationEventType.COMPLETED:
        session.totalValidations += 1;
        
        // If the event has a duration, update field interaction time
        if (event.duration && event.fieldId) {
          const fieldInteraction = this.getOrCreateFieldInteraction(session, event.fieldId);
          fieldInteraction.timeSpent += event.duration;
        }
        break;
    }
  }
  
  /**
   * Get or create a field interaction record
   */
  private getOrCreateFieldInteraction(
    session: ValidationSessionData, 
    fieldId: string
  ): ValidationSessionData['fieldInteractions'][0] {
    // Find existing field interaction
    let fieldInteraction = session.fieldInteractions.find(f => f.field === fieldId);
    
    // Create if not found
    if (!fieldInteraction) {
      fieldInteraction = {
        field: fieldId,
        focusCount: 0,
        blurCount: 0,
        changeCount: 0,
        errorCount: 0,
        timeSpent: 0
      };
      
      session.fieldInteractions.push(fieldInteraction);
      session.totalFields += 1;
    }
    
    return fieldInteraction;
  }
  
  /**
   * Get analytics data
   */
  getAnalytics(): ValidationAnalyticsData {
    // Calculate most frequent errors
    const errorCounts: Record<string, { count: number, fields: Record<string, number> }> = {};
    
    // Calculate field error rates
    const fieldErrors: Record<string, { 
      count: number, 
      codes: Record<string, number>,
      resolutionTimes: number[]
    }> = {};
    
    // Calculate completion rates
    const fieldAttempts: Record<string, { 
      attempts: number, 
      successes: number 
    }> = {};
    
    // Process events
    for (const event of this.events) {
      switch (event.type) {
        case ValidationEventType.ERROR:
          if (event.errors) {
            for (const error of event.errors) {
              // Update error counts
              const errorCode = error.code;
              
              if (!errorCounts[errorCode]) {
                errorCounts[errorCode] = { count: 0, fields: {} };
              }
              
              errorCounts[errorCode].count += 1;
              
              // Update field counts for this error
              const field = error.field;
              
              if (!errorCounts[errorCode].fields[field]) {
                errorCounts[errorCode].fields[field] = 0;
              }
              
              errorCounts[errorCode].fields[field] += 1;
              
              // Update field error data
              if (!fieldErrors[field]) {
                fieldErrors[field] = { count: 0, codes: {}, resolutionTimes: [] };
              }
              
              fieldErrors[field].count += 1;
              
              if (!fieldErrors[field].codes[errorCode]) {
                fieldErrors[field].codes[errorCode] = 0;
              }
              
              fieldErrors[field].codes[errorCode] += 1;
            }
          }
          break;
          
        case ValidationEventType.FIELD_CHANGED:
          if (event.fieldId) {
            // Update field attempts
            if (!fieldAttempts[event.fieldId]) {
              fieldAttempts[event.fieldId] = { attempts: 0, successes: 0 };
            }
            
            fieldAttempts[event.fieldId].attempts += 1;
          }
          break;
          
        case ValidationEventType.SUCCESS:
          if (event.fieldId) {
            // Update field successes
            if (!fieldAttempts[event.fieldId]) {
              fieldAttempts[event.fieldId] = { attempts: 0, successes: 0 };
            }
            
            fieldAttempts[event.fieldId].successes += 1;
            
            // If we have resolution time in metadata, add it
            if (event.metadata?.resolutionTime) {
              const field = event.fieldId;
              
              if (!fieldErrors[field]) {
                fieldErrors[field] = { count: 0, codes: {}, resolutionTimes: [] };
              }
              
              fieldErrors[field].resolutionTimes.push(event.metadata.resolutionTime);
            }
          }
          break;
      }
    }
    
    // Convert error counts to array and sort
    const mostFrequentErrors: ErrorFrequencyData[] = Object.entries(errorCounts)
      .map(([errorCode, data]) => ({
        errorCode,
        count: data.count,
        fields: Object.entries(data.fields)
          .map(([field, count]) => ({ field, count }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => b.count - a.count);
    
    // Convert field errors to array and sort
    const fieldErrorRates: FieldErrorData[] = Object.entries(fieldErrors)
      .map(([field, data]) => ({
        field,
        errorCount: data.count,
        errorCodes: Object.entries(data.codes)
          .map(([code, count]) => ({ code, count }))
          .sort((a, b) => b.count - a.count),
        averageResolutionTime: data.resolutionTimes.length > 0
          ? data.resolutionTimes.reduce((sum, time) => sum + time, 0) / data.resolutionTimes.length
          : undefined
      }))
      .sort((a, b) => b.errorCount - a.errorCount);
    
    // Convert completion rates to array and sort
    const completionRates: CompletionRateData[] = Object.entries(fieldAttempts)
      .map(([field, data]) => ({
        field,
        attemptCount: data.attempts,
        successCount: data.successes,
        completionRate: data.attempts > 0 ? data.successes / data.attempts : 0,
        averageAttempts: data.successes > 0 ? data.attempts / data.successes : Infinity
      }))
      .sort((a, b) => a.completionRate - b.completionRate);
    
    // Calculate session metrics
    const sessions = Array.from(this.sessions.values());
    const completedSessions = sessions.filter(s => s.completionStatus === 'completed');
    const abandonedSessions = sessions.filter(s => s.completionStatus === 'abandoned');
    
    const sessionDurations = sessions
      .filter(s => s.endTime !== undefined)
      .map(s => s.endTime! - s.startTime);
    
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;
    
    const averageErrorsPerSession = sessions.length > 0
      ? sessions.reduce((sum, session) => sum + session.totalErrors, 0) / sessions.length
      : 0;
    
    return {
      mostFrequentErrors,
      fieldErrorRates,
      completionRates,
      sessions,
      totalSessions: sessions.length,
      totalCompletedSessions: completedSessions.length,
      totalAbandonedSessions: abandonedSessions.length,
      averageSessionDuration,
      averageErrorsPerSession
    };
  }
  
  /**
   * Get session data
   */
  getSession(sessionId: string): ValidationSessionData | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
  
  /**
   * Get events
   */
  getEvents(): ValidationEvent[] {
    return [...this.events];
  }
  
  /**
   * Reset analytics data
   */
  reset(): void {
    this.events = [];
    this.sessions = new Map();
    this.currentSessionId = null;
    
    // Persist empty data
    this.persistData();
  }
  
  /**
   * Persist analytics data
   */
  private persistData(): void {
    if (!this.persistence) {
      return;
    }
    
    const data = {
      events: this.events,
      sessions: Array.from(this.sessions.entries())
    };
    
    this.persistence.saveData(data);
  }
  
  /**
   * Load persisted data
   */
  private loadPersistedData(): void {
    if (!this.persistence) {
      return;
    }
    
    const data = this.persistence.loadData();
    
    if (data) {
      this.events = data.events || [];
      this.sessions = new Map(data.sessions || []);
    }
  }
}

/**
 * Interface for persisting analytics data
 */
export interface ValidationAnalyticsPersistence {
  saveData(data: any): void;
  loadData(): any;
}

/**
 * Local storage persistence for analytics data
 */
export class LocalStoragePersistence implements ValidationAnalyticsPersistence {
  private storageKey: string;
  
  constructor(storageKey: string = 'validation_analytics') {
    this.storageKey = storageKey;
  }
  
  saveData(data: any): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save validation analytics data:', e);
      }
    }
  }
  
  loadData(): any {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error('Failed to load validation analytics data:', e);
        return null;
      }
    }
    
    return null;
  }
}

/**
 * Create validation analytics hooks for React components
 */
export function createAnalyticsHooks(analytics: ValidationAnalytics) {
  /**
   * Track form submission
   */
  function trackFormSubmission(
    formId: string, 
    success: boolean, 
    errors?: ValidationError[]
  ): void {
    analytics.trackEvent({
      type: success ? ValidationEventType.SUCCESS : ValidationEventType.ERROR,
      formId,
      errors: success ? undefined : errors,
      metadata: {
        sessionId: analytics.getCurrentSessionId()
      }
    });
  }
  
  /**
   * Track field interaction
   */
  function trackFieldInteraction(
    formId: string, 
    fieldId: string, 
    eventType: ValidationEventType,
    metadata?: Record<string, any>
  ): void {
    analytics.trackEvent({
      type: eventType,
      formId,
      fieldId,
      metadata: {
        ...metadata,
        sessionId: analytics.getCurrentSessionId()
      }
    });
  }
  
  /**
   * Track validation event
   */
  function trackValidation(
    formId: string,
    success: boolean,
    fieldId?: string,
    errors?: ValidationError[],
    duration?: number
  ): void {
    analytics.trackEvent({
      type: ValidationEventType.COMPLETED,
      formId,
      fieldId,
      errors: success ? undefined : errors,
      duration,
      metadata: {
        success,
        sessionId: analytics.getCurrentSessionId()
      }
    });
  }
  
  return {
    trackFormSubmission,
    trackFieldInteraction,
    trackValidation,
    startSession: analytics.startSession.bind(analytics),
    endSession: analytics.endSession.bind(analytics),
    getAnalytics: analytics.getAnalytics.bind(analytics)
  };
}

/**
 * Create an analytics dashboard component for React
 */
export function createAnalyticsDashboard(analytics: ValidationAnalytics) {
  // This would be a React component in a real implementation
  // For demonstration purposes, returning the analytics data structure
  return function getAnalyticsDashboardData() {
    return analytics.getAnalytics();
  };
}