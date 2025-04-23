/**
 * SecurityEventCard Component
 * 
 * Displays a single security event with formatting appropriate to its severity,
 * category, and content. Used in security event lists, timelines, and notifications.
 */

import React, { useState } from 'react';
import { SecurityBox, SecurityStatus } from './SecurityBox';
import { useSecurityTheme } from '../theme/SecurityThemeProvider';

// Security event severity mapping to visual status
const severityToStatus: Record<string, SecurityStatus> = {
  CRITICAL: 'critical',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
  INFO: 'info',
  UNKNOWN: 'unknown',
};

// Security event interface matching backend
export interface SecurityEvent {
  /**
   * Unique identifier for the event
   */
  id: string;
  
  /**
   * Event timestamp
   */
  timestamp: number;
  
  /**
   * Event severity level
   */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'UNKNOWN';
  
  /**
   * Event category
   */
  category: string;
  
  /**
   * Event message
   */
  message: string;
  
  /**
   * Source of the event
   */
  source?: string;
  
  /**
   * Additional metadata for the event
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether the event has been acknowledged
   */
  acknowledged?: boolean;
  
  /**
   * User who acknowledged the event
   */
  acknowledgedBy?: string;
  
  /**
   * Timestamp when the event was acknowledged
   */
  acknowledgedAt?: number;
  
  /**
   * Optional block ID if event is stored in blockchain
   */
  blockId?: string;
}

// Props for the SecurityEventCard component
export interface SecurityEventCardProps {
  /**
   * The security event to display
   */
  event: SecurityEvent;
  
  /**
   * Whether the card is selected
   */
  selected?: boolean;
  
  /**
   * Click handler for the card
   */
  onClick?: (event: SecurityEvent) => void;
  
  /**
   * Acknowledge handler
   */
  onAcknowledge?: (event: SecurityEvent) => void;
  
  /**
   * Whether to show detailed event information
   */
  detailed?: boolean;
  
  /**
   * CSS class name for custom styling
   */
  className?: string;
}

/**
 * Format a timestamp as a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

/**
 * SecurityEventCard Component
 * 
 * Displays a security event with appropriate formatting and interactions
 */
export function SecurityEventCard({
  event,
  selected = false,
  onClick,
  onAcknowledge,
  detailed = false,
  className = '',
}: SecurityEventCardProps) {
  // Access the security theme
  const { theme } = useSecurityTheme();
  
  // State for expanded details
  const [expanded, setExpanded] = useState(detailed);
  
  // Determine status from severity
  const status = severityToStatus[event.severity] || 'unknown';
  
  // Styles specific to this component
  const styles = {
    header: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: theme.spacing.sm,
    },
    category: {
      display: 'inline-block' as const,
      fontSize: theme.typography.small.fontSize,
      fontWeight: 600,
      backgroundColor: theme.colors.background.elevated,
      color: theme.colors.text.secondary,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.shape.borderRadius.small,
      marginRight: theme.spacing.sm,
    },
    metadata: {
      backgroundColor: theme.colors.background.elevated,
      padding: theme.spacing.sm,
      borderRadius: theme.shape.borderRadius.small,
      marginTop: theme.spacing.sm,
      fontSize: theme.typography.small.fontSize,
      fontFamily: theme.typography.code.fontFamily,
      whiteSpace: 'pre-wrap' as const,
      overflowX: 'auto' as const,
    },
    timestamp: {
      fontSize: theme.typography.small.fontSize,
      color: theme.colors.text.secondary,
    },
    message: {
      fontSize: theme.typography.body.fontSize,
      margin: `${theme.spacing.sm} 0`,
      wordBreak: 'break-word' as const,
    },
    footer: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: theme.spacing.md,
      fontSize: theme.typography.small.fontSize,
      color: theme.colors.text.secondary,
    },
    button: {
      backgroundColor: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
      border: 'none',
      borderRadius: theme.shape.borderRadius.small,
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: theme.typography.small.fontSize,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    expandButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.small.fontSize,
      cursor: 'pointer',
      padding: theme.spacing.xs,
    },
    acknowledged: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      fontSize: theme.typography.small.fontSize,
      color: theme.colors.text.secondary,
    },
    source: {
      backgroundColor: theme.colors.background.elevated,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.small.fontSize,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.shape.borderRadius.small,
      display: 'inline-block' as const,
      marginLeft: theme.spacing.sm,
    },
    selected: {
      borderColor: theme.colors.primary.main,
      borderWidth: theme.shape.borderWidth.medium,
    },
  };
  
  // Format the relative time
  const relativeTime = formatRelativeTime(event.timestamp);
  
  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };
  
  // Handle acknowledge
  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAcknowledge) {
      onAcknowledge(event);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Determine if we should show metadata
  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;
  
  return (
    <SecurityBox
      status={status}
      showStatusIndicator
      variant={selected ? 'elevated' : 'default'}
      interactive={!!onClick}
      onClick={handleClick}
      className={`security-event-card ${className} ${selected ? 'selected' : ''}`}
      style={selected ? styles.selected : undefined}
      aria-selected={selected}
    >
      <div style={styles.header}>
        <div>
          <span style={styles.category} title={`Event Category: ${event.category}`}>
            {event.category}
          </span>
          {event.source && (
            <span style={styles.source} title={`Event Source: ${event.source}`}>
              {event.source}
            </span>
          )}
        </div>
        <span style={styles.timestamp} title={new Date(event.timestamp).toLocaleString()}>
          {relativeTime}
        </span>
      </div>
      
      <p style={styles.message}>{event.message}</p>
      
      {expanded && hasMetadata && (
        <div style={styles.metadata}>
          {JSON.stringify(event.metadata, null, 2)}
        </div>
      )}
      
      <div style={styles.footer}>
        <div>
          {hasMetadata && (
            <button
              style={styles.expandButton}
              onClick={toggleExpanded}
              aria-expanded={expanded}
              title={expanded ? 'Hide details' : 'Show details'}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
        
        <div>
          {event.acknowledged ? (
            <div style={styles.acknowledged} title={`Acknowledged by ${event.acknowledgedBy} on ${new Date(event.acknowledgedAt || 0).toLocaleString()}`}>
              Acknowledged {event.acknowledgedBy ? `by ${event.acknowledgedBy}` : ''}
            </div>
          ) : onAcknowledge ? (
            <button
              style={styles.button}
              onClick={handleAcknowledge}
              aria-label="Acknowledge this security event"
            >
              Acknowledge
            </button>
          ) : null}
        </div>
      </div>
    </SecurityBox>
  );
}