/**
 * SecurityDashboardLayout Component
 * 
 * Provides a consistent layout structure for security dashboard pages,
 * including header, navigation, main content area, and optional sidebar.
 */

import React, { ReactNode } from 'react';
import { useSecurityTheme } from '../theme/SecurityThemeProvider';

// Props for the SecurityDashboardLayout component
export interface SecurityDashboardLayoutProps {
  /**
   * Dashboard title
   */
  title: string;
  
  /**
   * Optional subtitle
   */
  subtitle?: string;
  
  /**
   * Main content
   */
  children: ReactNode;
  
  /**
   * Optional sidebar content
   */
  sidebar?: ReactNode;
  
  /**
   * Optional actions to display in the header
   */
  actions?: ReactNode;
  
  /**
   * Whether the sidebar is expanded
   */
  sidebarExpanded?: boolean;
  
  /**
   * Callback when sidebar expansion state changes
   */
  onSidebarExpandedChange?: (expanded: boolean) => void;
  
  /**
   * Optional class name
   */
  className?: string;
}

/**
 * SecurityDashboardLayout Component
 * 
 * Provides a consistent layout for security dashboard pages
 */
export function SecurityDashboardLayout({
  title,
  subtitle,
  children,
  sidebar,
  actions,
  sidebarExpanded = true,
  onSidebarExpandedChange,
  className = '',
}: SecurityDashboardLayoutProps) {
  // Access the security theme
  const { theme } = useSecurityTheme();
  
  // Styles for the layout
  const styles = {
    container: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      height: '100%',
      width: '100%',
      backgroundColor: theme.colors.background.default,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily,
    },
    header: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      borderBottom: `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}`,
      backgroundColor: theme.colors.background.paper,
    },
    titleContainer: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
    },
    title: {
      fontSize: theme.typography.dashboardTitle.fontSize,
      fontWeight: theme.typography.dashboardTitle.fontWeight,
      margin: 0,
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: theme.typography.body.fontSize,
      margin: `${theme.spacing.xs} 0 0 0`,
      color: theme.colors.text.secondary,
    },
    actionsContainer: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
    },
    content: {
      display: 'flex' as const,
      flexGrow: 1,
      height: '100%',
      overflow: 'hidden' as const,
    },
    mainContent: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      overflowY: 'auto' as const,
      height: '100%',
    },
    sidebarContainer: {
      width: sidebarExpanded ? '300px' : '60px',
      borderRight: `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}`,
      backgroundColor: theme.colors.background.paper,
      transition: 'width 0.3s ease-in-out',
      height: '100%',
      overflow: 'hidden' as const,
    },
    sidebarContent: {
      width: '300px', // Keep content width fixed
      height: '100%',
      overflowY: 'auto' as const,
      padding: sidebarExpanded ? theme.spacing.md : `${theme.spacing.md} 0`,
      transition: 'padding 0.3s ease-in-out',
    },
    toggleButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      padding: theme.spacing.sm,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: '100%',
      borderTop: `${theme.shape.borderWidth.thin} solid ${theme.colors.text.disabled}`,
    },
  };
  
  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (onSidebarExpandedChange) {
      onSidebarExpandedChange(!sidebarExpanded);
    }
  };
  
  return (
    <div className={`security-dashboard-layout ${className}`} style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        
        {actions && <div style={styles.actionsContainer}>{actions}</div>}
      </header>
      
      <div style={styles.content}>
        {sidebar && (
          <aside style={styles.sidebarContainer}>
            <div style={styles.sidebarContent}>
              {sidebar}
            </div>
            
            {onSidebarExpandedChange && (
              <button
                style={styles.toggleButton}
                onClick={handleSidebarToggle}
                aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarExpanded ? '←' : '→'}
              </button>
            )}
          </aside>
        )}
        
        <main style={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}