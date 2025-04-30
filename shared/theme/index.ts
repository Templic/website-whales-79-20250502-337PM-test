/**
 * Theme System - Main Exports
 * 
 * This file exports all the components and utilities of the theme system,
 * making them available through a single import.
 */

// Token System
export * from './tokens';

// Theme Provider
export { 
  ThemeProvider, 
  useTheme, 
  type ThemeMode, 
  type ThemeContrast, 
  type ThemeMotion 
} from './ThemeContext';

// Privacy Controls
export {
  setThemePrivacyOptions,
  getThemePrivacyOptions,
  resetPrivacyOptions,
  clearAllThemeData
} from './privacyControls';

// Font Loading
export {
  loadFonts,
  preloadCriticalFonts,
  type FontLoadOptions
} from './fontLoader';

// CSS Generation
export {
  generateThemeVariables,
  getThemeVariablesObject,
  injectThemeVariables,
  applyThemeVariablesInline
} from './cssVariables';

// Common theme utilities
export const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark') || 
         document.documentElement.classList.contains('blackout');
};

export const isHighContrast = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('contrast-high') || 
         document.documentElement.classList.contains('contrast-maximum');
};

export const isReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('motion-reduced') || 
         document.documentElement.classList.contains('motion-none') ||
         document.documentElement.classList.contains('reduced-motion');
};