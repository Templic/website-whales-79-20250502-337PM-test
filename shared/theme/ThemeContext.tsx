/**
 * Theme Context
 * 
 * This module provides a React context for theme management.
 * It handles theme state, mode switching, and token application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeTokens, ThemeMode, ThemePreferences } from './tokens';
import { defaultLightTokens, defaultDarkTokens } from './defaultThemes';

// Context interface
interface ThemeContextType {
  tokens: ThemeTokens;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTokens: (tokens: ThemeTokens) => void;
  preferences: ThemePreferences;
  setPreferences: (preferences: Partial<ThemePreferences>) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  applyTokensToDOM: (tokens: ThemeTokens) => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  tokens: defaultLightTokens,
  mode: 'system',
  setMode: () => {},
  setTokens: () => {},
  preferences: { mode: 'system' },
  setPreferences: () => {},
  isHighContrast: false,
  isReducedMotion: false,
  applyTokensToDOM: () => {},
});

// Provider props interface
interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  initialTokens?: ThemeTokens;
  initialPreferences?: ThemePreferences;
}

// Storage keys
const THEME_PREFERENCES_KEY = 'theme-preferences';
const THEME_TOKENS_KEY = 'theme-tokens';

/**
 * ThemeProvider component 
 * 
 * Provides theme context to the application
 */
export const ThemeProvider = ({
  children,
  initialMode = 'system',
  initialTokens,
  initialPreferences,
}: ThemeProviderProps) => {
  // Load preferences from localStorage or use defaults
  const loadPreferences = (): ThemePreferences => {
    if (typeof window === 'undefined') {
      return { mode: initialMode };
    }
    
    try {
      const savedPrefs = localStorage.getItem(THEME_PREFERENCES_KEY);
      if (savedPrefs) {
        return JSON.parse(savedPrefs);
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
    
    return initialPreferences || { mode: initialMode };
  };
  
  // Load tokens from localStorage or use defaults
  const loadTokens = (mode: ThemeMode): ThemeTokens => {
    if (initialTokens) {
      return initialTokens;
    }
    
    if (typeof window === 'undefined') {
      return mode === 'dark' ? defaultDarkTokens : defaultLightTokens;
    }
    
    try {
      const savedTokens = localStorage.getItem(THEME_TOKENS_KEY);
      if (savedTokens) {
        return JSON.parse(savedTokens);
      }
    } catch (error) {
      console.error('Error loading theme tokens:', error);
    }
    
    return mode === 'dark' ? defaultDarkTokens : defaultLightTokens;
  };
  
  // Get the effective mode based on system preference if needed
  const getEffectiveMode = (mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode as 'light' | 'dark';
  };
  
  // State
  const [preferences, setPreferencesState] = useState<ThemePreferences>(loadPreferences);
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(getEffectiveMode(preferences.mode));
  const [tokens, setTokensState] = useState<ThemeTokens>(loadTokens(effectiveMode));
  
  // Apply tokens to DOM by setting CSS variables
  const applyTokensToDOM = (tokens: ThemeTokens) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply color tokens
    root.style.setProperty('--background', tokens.background);
    root.style.setProperty('--foreground', tokens.foreground);
    root.style.setProperty('--card', tokens.card);
    root.style.setProperty('--card-foreground', tokens.cardForeground);
    root.style.setProperty('--popover', tokens.popover);
    root.style.setProperty('--popover-foreground', tokens.popoverForeground);
    root.style.setProperty('--primary', tokens.primary);
    root.style.setProperty('--primary-foreground', tokens.primaryForeground);
    root.style.setProperty('--secondary', tokens.secondary);
    root.style.setProperty('--secondary-foreground', tokens.secondaryForeground);
    root.style.setProperty('--accent', tokens.accent);
    root.style.setProperty('--accent-foreground', tokens.accentForeground);
    root.style.setProperty('--muted', tokens.muted);
    root.style.setProperty('--muted-foreground', tokens.mutedForeground);
    root.style.setProperty('--destructive', tokens.destructive);
    root.style.setProperty('--destructive-foreground', tokens.destructiveForeground);
    root.style.setProperty('--border', tokens.border);
    root.style.setProperty('--input', tokens.input);
    root.style.setProperty('--ring', tokens.ring);
    
    // Apply typography tokens
    if (tokens.typography) {
      Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
        root.style.setProperty(`--font-family-${key}`, value);
      });
      
      // Apply font size tokens
      Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, value);
      });
    }
    
    // Apply border radius tokens
    Object.entries(tokens.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius${key === 'DEFAULT' ? '' : `-${key}`}`, value);
    });
    
    // Apply animation tokens
    if (preferences.reducedMotion) {
      // If reduced motion is enabled, set all animations to 'none'
      root.style.setProperty('--transition', 'none');
    } else {
      root.style.setProperty('--transition', tokens.animation.DEFAULT);
    }
    
    // Set high contrast class if needed
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Set the theme attribute
    root.setAttribute('data-theme', effectiveMode);
  };
  
  // Update preferences
  const setPreferences = (newPrefs: Partial<ThemePreferences>) => {
    setPreferencesState(prev => {
      const updated = { ...prev, ...newPrefs };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_PREFERENCES_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving theme preferences:', error);
        }
      }
      
      return updated;
    });
  };
  
  // Set theme mode
  const setMode = (mode: ThemeMode) => {
    setPreferences({ mode });
  };
  
  // Set theme tokens
  const setTokens = (newTokens: ThemeTokens) => {
    setTokensState(newTokens);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_TOKENS_KEY, JSON.stringify(newTokens));
      } catch (error) {
        console.error('Error saving theme tokens:', error);
      }
    }
    
    // Apply to DOM
    applyTokensToDOM(newTokens);
  };
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (preferences.mode === 'system') {
        const newMode = mediaQuery.matches ? 'dark' : 'light';
        setEffectiveMode(newMode);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.mode]);
  
  // Update effective mode when preferences change
  useEffect(() => {
    const newEffectiveMode = getEffectiveMode(preferences.mode);
    setEffectiveMode(newEffectiveMode);
    
    // If using system default, load the appropriate default tokens
    if (preferences.mode === 'system') {
      const defaultTokens = newEffectiveMode === 'dark' ? defaultDarkTokens : defaultLightTokens;
      setTokensState(defaultTokens);
      applyTokensToDOM(defaultTokens);
    }
  }, [preferences.mode]);
  
  // Apply tokens whenever they change
  useEffect(() => {
    applyTokensToDOM(tokens);
  }, [tokens, preferences.highContrast, preferences.reducedMotion]);
  
  // Apply tokens on initial render
  useEffect(() => {
    applyTokensToDOM(tokens);
  }, []);
  
  // Context value
  const contextValue: ThemeContextType = {
    tokens,
    mode: preferences.mode,
    setMode,
    setTokens,
    preferences,
    setPreferences,
    isHighContrast: preferences.highContrast || false,
    isReducedMotion: preferences.reducedMotion || false,
    applyTokensToDOM,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook
 * 
 * Custom hook to use the theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};