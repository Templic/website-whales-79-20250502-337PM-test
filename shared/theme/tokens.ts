/**
 * Theme Tokens
 * 
 * This module defines the theme token structure used throughout the application.
 * Theme tokens provide a centralized way to define design values.
 */

/**
 * ThemeTokens interface defines the structure of a theme
 * This includes colors, typography, spacing, shadows, etc.
 */
export interface ThemeTokens {
  // Base colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  
  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Muted colors
  muted: string;
  mutedForeground: string;
  
  // Destructive colors
  destructive: string;
  destructiveForeground: string;
  
  // Border and focus ring
  border: string;
  input: string;
  ring: string;
  
  // Typography tokens
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
    letterSpacing: Record<string, string>;
  };
  
  // Spacing tokens
  spacing: Record<string, string>;
  
  // Border radius tokens
  radius: Record<string, string>;
  
  // Shadow tokens
  shadows: Record<string, string>;
  
  // Animation tokens
  animation: Record<string, string>;
  
  // Component-specific tokens
  components: {
    button: {
      primary: Record<string, string>;
      secondary: Record<string, string>;
      accent: Record<string, string>;
      destructive: Record<string, string>;
      ghost: Record<string, string>;
      link: Record<string, string>;
    };
    card: Record<string, string>;
    input: Record<string, string>;
    badge: Record<string, Record<string, string>>;
    tooltip: Record<string, string>;
    [key: string]: any; // Allow for additional component tokens
  };
  
  // Z-index values
  zIndices: Record<string, string>;
  
  // Allow for additional token categories
  [key: string]: any;
}

/**
 * Mode represents the theme display mode (light or dark)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * ThemePreferences represents user preferences for theme display
 */
export interface ThemePreferences {
  mode: ThemeMode;
  themeId?: number; // ID of the user's preferred theme
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: 'default' | 'large' | 'larger';
}