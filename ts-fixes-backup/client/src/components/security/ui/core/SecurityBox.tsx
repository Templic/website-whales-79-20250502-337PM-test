/**
 * SecurityBox Component
 * 
 * A base container component for security dashboard elements that applies
 * consistent styling, accessibility, and behavioral patterns.
 */

import React, { ReactNode, forwardRef } from 'react';
import { useSecurityTheme } from '../theme/SecurityThemeProvider';

// Security status levels for visual indicators
export type SecurityStatus = 'safe' | 'warning' | 'danger' | 'critical' | 'info' | 'unknown';

// Style variants for different uses
export type SecurityBoxVariant = 'default' | 'elevated' | 'outlined' | 'flat';

// SecurityBox props
export interface SecurityBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content of the SecurityBox
   */
  children: ReactNode;
  
  /**
   * Optional security status to visually indicate
   */
  status?: SecurityStatus;
  
  /**
   * Visual style variant
   */
  variant?: SecurityBoxVariant;
  
  /**
   * Whether to show a status indicator
   */
  showStatusIndicator?: boolean;
  
  /**
   * Whether the box is expandable
   */
  expandable?: boolean;
  
  /**
   * Whether the box is currently expanded (only used when expandable is true)
   */
  expanded?: boolean;
  
  /**
   * Callback when expand state changes (only used when expandable is true)
   */
  onExpandChange?: (expanded: boolean) => void;
  
  /**
   * Whether the box is interactive
   */
  interactive?: boolean;
  
  /**
   * Whether the box should have a border
   */
  bordered?: boolean;
  
  /**
   * Whether the box should have a shadow
   */
  shadowed?: boolean;
  
  /**
   * Optional title for the box
   */
  title?: string;
  
  /**
   * Optional description for the box
   */
  description?: string;
}

/**
 * SecurityBox Component
 * 
 * A base container for security dashboard elements with consistent styling
 */
export const SecurityBox = forwardRef<HTMLDivElement, SecurityBoxProps>(
  (
    {
      children,
      status = 'unknown',
      variant = 'default',
      showStatusIndicator = false,
      expandable = false,
      expanded = false,
      onExpandChange,
      interactive = false,
      bordered = true,
      shadowed = true,
      title,
      description,
      className = '',
      ...props
    },
    ref
  ) => {
    // Access the security theme
    const { theme } = useSecurityTheme();
    
    // Generate styles based on theme and props
    const boxStyles = {
      // Base styles
      container: {
        fontFamily: theme.typography.fontFamily,
        borderRadius: theme.shape.borderRadius.medium,
        padding: theme.spacing.md,
        position: 'relative' as const,
        transition: 'all 0.2s ease-in-out',
      },
      
      // Variant-specific styles
      variant: {
        default: {
          backgroundColor: theme.colors.background.paper,
          border: bordered ? `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}` : 'none',
          boxShadow: shadowed ? theme.shadows.low : 'none',
        },
        elevated: {
          backgroundColor: theme.colors.background.paper,
          border: bordered ? `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}` : 'none',
          boxShadow: shadowed ? theme.shadows.medium : 'none',
        },
        outlined: {
          backgroundColor: 'transparent',
          border: `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}`,
          boxShadow: 'none',
        },
        flat: {
          backgroundColor: theme.colors.background.elevated,
          border: 'none',
          boxShadow: 'none',
        },
      },
      
      // Status indicator styles
      statusIndicator: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        position: 'absolute' as const,
        top: '16px',
        right: '16px',
        backgroundColor: theme.colors.status[status],
      },
      
      // Title styles
      title: {
        fontSize: theme.typography.cardTitle.fontSize,
        fontWeight: theme.typography.cardTitle.fontWeight,
        marginTop: 0,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text.primary,
      },
      
      // Description styles
      description: {
        fontSize: theme.typography.small.fontSize,
        lineHeight: theme.typography.small.lineHeight,
        marginTop: 0,
        marginBottom: theme.spacing.md,
        color: theme.colors.text.secondary,
      },
    };
    
    // Combine styles based on variant
    const combinedStyles = {
      ...boxStyles.container,
      ...boxStyles.variant[variant],
      cursor: interactive ? 'pointer' : 'default',
    };
    
    // Handle expand/collapse click
    const handleExpandClick = () => {
      if (expandable && onExpandChange) {
        onExpandChange(!expanded);
      }
    };
    
    return (
      <div
        ref={ref}
        onClick={handleExpandClick}
        className={`security-box ${className} ${interactive ? 'interactive' : ''} ${expandable ? 'expandable' : ''} ${status}`}
        style={combinedStyles}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        {...props}
      >
        {showStatusIndicator && (
          <div
            className="security-box-status-indicator"
            style={boxStyles.statusIndicator}
            aria-label={`Status: ${status}`}
          />
        )}
        
        {title && (
          <h3 className="security-box-title" style={boxStyles.title}>
            {title}
          </h3>
        )}
        
        {description && (
          <p className="security-box-description" style={boxStyles.description}>
            {description}
          </p>
        )}
        
        <div className="security-box-content">
          {children}
        </div>
      </div>
    );
  }
);

// Display name for debugging
SecurityBox.displayName = 'SecurityBox';