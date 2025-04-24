/**
 * Security Theme Provider
 * 
 * This component provides a consistent theme for security-related components,
 * including color schemes, typography, and spacing specifically designed for
 * security dashboards and controls.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Security theme color scheme
 */
interface SecurityColorScheme {
  // Primary security colors
  primary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  
  // Secondary security colors
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  
  // Security status colors
  status: {
    safe: string;
    warning: string;
    danger: string;
    critical: string;
    info: string;
    unknown: string;
  };
  
  // Background colors
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

/**
 * Security theme typography
 */
interface SecurityTypography {
  fontFamily: string;
  dashboardTitle: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  sectionTitle: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  cardTitle: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  body: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  small: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  code: {
    fontSize: string;
    fontFamily: string;
    lineHeight: number;
  };
}

/**
 * Security theme spacing
 */
interface SecuritySpacing {
  unit: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Security theme shape
 */
interface SecurityShape {
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  borderWidth: {
    thin: string;
    medium: string;
    thick: string;
  };
}

/**
 * Security theme shadows
 */
interface SecurityShadows {
  low: string;
  medium: string;
  high: string;
}

/**
 * Security theme mode
 */
type SecurityThemeMode = 'light' | 'dark' | 'high-contrast';

/**
 * Security theme
 */
export interface SecurityTheme {
  mode: SecurityThemeMode;
  colors: SecurityColorScheme;
  typography: SecurityTypography;
  spacing: SecuritySpacing;
  shape: SecurityShape;
  shadows: SecurityShadows;
}

/**
 * Light theme color scheme
 */
const lightColors: SecurityColorScheme = {
  primary: {
    main: '#1a56db',
    light: '#2563eb',
    dark: '#1e429f',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#4f46e5',
    light: '#6366f1',
    dark: '#4338ca',
    contrastText: '#ffffff',
  },
  status: {
    safe: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    critical: '#991b1b',
    info: '#2563eb',
    unknown: '#6b7280',
  },
  background: {
    default: '#f9fafb',
    paper: '#ffffff',
    elevated: '#f3f4f6',
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    disabled: '#9ca3af',
  },
};

/**
 * Dark theme color scheme
 */
const darkColors: SecurityColorScheme = {
  primary: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  status: {
    safe: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    critical: '#b91c1c',
    info: '#3b82f6',
    unknown: '#9ca3af',
  },
  background: {
    default: '#111827',
    paper: '#1f2937',
    elevated: '#374151',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#e5e7eb',
    disabled: '#9ca3af',
  },
};

/**
 * High-contrast theme color scheme
 */
const highContrastColors: SecurityColorScheme = {
  primary: {
    main: '#ffffff',
    light: '#eeeeee',
    dark: '#cccccc',
    contrastText: '#000000',
  },
  secondary: {
    main: '#ffff00',
    light: '#ffffaa',
    dark: '#cccc00',
    contrastText: '#000000',
  },
  status: {
    safe: '#00ff00',
    warning: '#ffff00',
    danger: '#ff0000',
    critical: '#ff00ff',
    info: '#00ffff',
    unknown: '#ffffff',
  },
  background: {
    default: '#000000',
    paper: '#111111',
    elevated: '#222222',
  },
  text: {
    primary: '#ffffff',
    secondary: '#eeeeee',
    disabled: '#aaaaaa',
  },
};

/**
 * Typography configuration
 */
const typography: SecurityTypography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  dashboardTitle: {
    fontSize: '1.875rem',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  small: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  code: {
    fontSize: '0.875rem',
    fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    lineHeight: 1.7,
  },
};

/**
 * Spacing configuration
 */
const spacing: SecuritySpacing = {
  unit: 4,
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

/**
 * Shape configuration
 */
const shape: SecurityShape = {
  borderRadius: {
    small: '0.25rem',
    medium: '0.375rem',
    large: '0.5rem',
  },
  borderWidth: {
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
};

/**
 * Shadows configuration
 */
const shadows: SecurityShadows = {
  low: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  high: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

/**
 * Create light theme
 */
const lightTheme: SecurityTheme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  shape,
  shadows,
};

/**
 * Create dark theme
 */
const darkTheme: SecurityTheme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  shape,
  shadows,
};

/**
 * Create high-contrast theme
 */
const highContrastTheme: SecurityTheme = {
  mode: 'high-contrast',
  colors: highContrastColors,
  typography,
  spacing,
  shape,
  shadows,
};

// Security theme context
interface SecurityThemeContextType {
  theme: SecurityTheme;
  setTheme: (mode: SecurityThemeMode) => void;
}

// Create a context for the security theme
const SecurityThemeContext = createContext<SecurityThemeContextType | undefined>(undefined);

// Provider props
interface SecurityThemeProviderProps {
  children: ReactNode;
  initialMode?: SecurityThemeMode;
}

/**
 * Security Theme Provider Component
 * 
 * Provides theme context for security components
 */
export function SecurityThemeProvider({
  children,
  initialMode = 'light',
}: SecurityThemeProviderProps) {
  // State to store the current theme
  const [currentTheme, setCurrentTheme] = useState<SecurityTheme>(
    initialMode === 'dark' ? darkTheme :
    initialMode === 'high-contrast' ? highContrastTheme :
    lightTheme
  );
  
  // Function to update the theme
  const setTheme = (mode: SecurityThemeMode) => {
    setCurrentTheme(
      mode === 'dark' ? darkTheme :
      mode === 'high-contrast' ? highContrastTheme :
      lightTheme
    );
  };
  
  return (
    <SecurityThemeContext.Provider value={{ theme: currentTheme, setTheme }}>
      {children}
    </SecurityThemeContext.Provider>
  );
}

/**
 * Hook to use the security theme
 */
export function useSecurityTheme() {
  const context = useContext(SecurityThemeContext);
  
  if (context === undefined) {
    throw new Error('useSecurityTheme must be used within a SecurityThemeProvider');
  }
  
  return context;
}