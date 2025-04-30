/**
 * ThemeContext.tsx
 * 
 * A centralized theme provider component that handles theme switching,
 * persistence, and accessibility preferences for the TypeScript Error
 * Management Platform.
 * 
 * This provider uses React Context to make theme information accessible
 * throughout the application and handles both theme appearance (light/dark/blackout)
 * and accessibility preferences (contrast, motion).
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { themeTokenMappings, baseTokens, highContrastTokens, motionPresets } from './tokens';

// Define allowed theme types
export type ThemeMode = 'light' | 'dark' | 'blackout' | 'system';
export type ThemeContrast = 'standard' | 'high' | 'maximum';
export type ThemeMotion = 'full' | 'reduced' | 'none';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  contrast: ThemeContrast;
  setContrast: (contrast: ThemeContrast) => void;
  motion: ThemeMotion;
  setMotion: (motion: ThemeMotion) => void;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
  systemTheme: Exclude<ThemeMode, 'system'>;
  tokens: typeof baseTokens;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => null,
  contrast: 'standard',
  setContrast: () => null,
  motion: 'full',
  setMotion: () => null,
  resolvedTheme: 'dark',
  systemTheme: 'dark',
  tokens: baseTokens,
});

// Local storage keys for persistence
const THEME_KEY = 'cosmic-theme-preference';
const CONTRAST_KEY = 'cosmic-contrast-preference';
const MOTION_KEY = 'cosmic-motion-preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // State for theme settings
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<Exclude<ThemeMode, 'system'>>('dark');
  const [contrast, setContrastState] = useState<ThemeContrast>('standard');
  const [motion, setMotionState] = useState<ThemeMotion>('full');

  // Get resolved theme (accounting for 'system' preference)
  const resolvedTheme: Exclude<ThemeMode, 'system'> = 
    theme === 'system' ? systemTheme : theme as Exclude<ThemeMode, 'system'>;

  // Theme setter with persistence
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'blackout');
    if (newTheme !== 'system') {
      document.documentElement.classList.add(newTheme);
    } else {
      document.documentElement.classList.add(systemTheme);
    }
  }, [systemTheme]);

  // Contrast setter with persistence
  const setContrast = useCallback((newContrast: ThemeContrast) => {
    setContrastState(newContrast);
    localStorage.setItem(CONTRAST_KEY, newContrast);
    
    // Apply contrast to document
    document.documentElement.classList.remove(
      'contrast-standard', 
      'contrast-high', 
      'contrast-maximum'
    );
    document.documentElement.classList.add(`contrast-${newContrast}`);
  }, []);

  // Motion setter with persistence
  const setMotion = useCallback((newMotion: ThemeMotion) => {
    setMotionState(newMotion);
    localStorage.setItem(MOTION_KEY, newMotion);
    
    // Apply motion to document
    document.documentElement.classList.remove(
      'motion-full', 
      'motion-reduced', 
      'motion-none'
    );
    document.documentElement.classList.add(`motion-${newMotion}`);
    
    // Also respect OS setting for reduced motion
    if (newMotion === 'reduced' || newMotion === 'none') {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, []);

  // Initialize from local storage and system preferences
  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const savedContrast = localStorage.getItem(CONTRAST_KEY) as ThemeContrast | null;
    const savedMotion = localStorage.getItem(MOTION_KEY) as ThemeMotion | null;
    
    // Set initial values
    if (savedTheme) setThemeState(savedTheme);
    if (savedContrast) setContrastState(savedContrast);
    if (savedMotion) setMotionState(savedMotion);
    
    // Detect system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // If using system theme, apply the system theme
      if (theme === 'system') {
        document.documentElement.classList.remove('light', 'dark', 'blackout');
        document.documentElement.classList.add(newSystemTheme);
      }
    };
    
    // Initial detection
    updateSystemTheme(mediaQuery);
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    // Detect system motion preference
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateSystemMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only auto-update if the user hasn't explicitly set a preference
      if (!savedMotion) {
        const newMotion = e.matches ? 'reduced' : 'full';
        setMotionState(newMotion);
        document.documentElement.classList.remove('motion-full', 'motion-reduced', 'motion-none');
        document.documentElement.classList.add(`motion-${newMotion}`);
      }
    };
    
    // Initial motion detection
    updateSystemMotion(motionMediaQuery);
    
    // Listen for system motion preference changes
    motionMediaQuery.addEventListener('change', updateSystemMotion);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
      motionMediaQuery.removeEventListener('change', updateSystemMotion);
    };
  }, [theme]);

  // Value object for context
  const value = {
    theme,
    setTheme,
    contrast,
    setContrast,
    motion,
    setMotion,
    resolvedTheme,
    systemTheme,
    tokens: baseTokens
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme
export const useTheme = () => useContext(ThemeContext);

// Export for use with TypeScript
export default ThemeContext;