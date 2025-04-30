/**
 * Theme Context Provider
 * 
 * This context provides theme management capabilities throughout the application:
 * - Stores the currently active theme and related settings
 * - Provides methods to change the theme
 * - Persists theme preferences in localStorage
 * - Integrates with theme APIs for remote storage
 * - Manages theme loading state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import type { Theme } from '../../shared/schema';

// Default minimal theme for fallback
const defaultTheme: Theme = {
  id: 0,
  name: 'Default',
  description: 'Default system theme',
  isPublic: true,
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '4px',
  tokens: {},
  tags: ['default', 'system'],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: null
};

// Available theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Context type definition
export interface ThemeContextType {
  currentTheme: Theme;
  themeMode: ThemeMode;
  isLoading: boolean;
  userThemes: Theme[];
  publicThemes: Theme[];
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  applyThemeToDOM: (theme: Theme) => void;
  refreshThemes: () => void;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  currentTheme: defaultTheme,
  themeMode: 'system',
  isLoading: false,
  userThemes: [],
  publicThemes: [],
  setTheme: () => {},
  setThemeMode: () => {},
  applyThemeToDOM: () => {},
  refreshThemes: () => {},
});

// The theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userThemes, setUserThemes] = useState<Theme[]>([]);
  const [publicThemes, setPublicThemes] = useState<Theme[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Initialize theme API hooks
  const {
    usePublicThemes,
    useUserThemes,
    useRecordThemeUsage
  } = useThemeAPI();
  
  // Fetch public themes
  const { data: publicThemesData, isLoading: isLoadingPublic, refetch: refetchPublic } = usePublicThemes();
  
  // Fetch user themes if user is logged in
  const { data: userThemesData, isLoading: isLoadingUser, refetch: refetchUser } = useUserThemes(userId || '');
  
  // Theme usage recording mutation
  const { mutate: recordUsage } = useRecordThemeUsage();
  
  // On initial mount, load user ID and stored theme preference
  useEffect(() => {
    // Check if user is logged in 
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        setUserId(user.id);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    
    // Load previously selected theme mode preference
    const storedThemeMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (storedThemeMode) {
      setThemeMode(storedThemeMode);
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
    }
    
    // Load previously selected theme, if any
    const storedTheme = localStorage.getItem('currentTheme');
    if (storedTheme) {
      try {
        const theme = JSON.parse(storedTheme);
        setCurrentTheme(theme);
        applyThemeToDOM(theme);
      } catch (e) {
        console.error("Error parsing stored theme:", e);
        setCurrentTheme(defaultTheme);
        applyThemeToDOM(defaultTheme);
      }
    } else {
      setCurrentTheme(defaultTheme);
      applyThemeToDOM(defaultTheme);
    }
  }, []);
  
  // Update state when theme data is loaded
  useEffect(() => {
    if (publicThemesData) {
      setPublicThemes(publicThemesData as Theme[]);
    }
    
    if (userThemesData) {
      setUserThemes(userThemesData as Theme[]);
    }
    
    // If data is loaded and we're using the default theme, try to switch to a loaded theme
    if (!isLoadingPublic && publicThemesData && publicThemesData.length > 0 && currentTheme.id === 0) {
      const firstTheme = publicThemesData[0] as Theme;
      setCurrentTheme(firstTheme);
      applyThemeToDOM(firstTheme);
      localStorage.setItem('currentTheme', JSON.stringify(firstTheme));
    }
    
    // Update loading state
    setIsLoading(isLoadingPublic || (userId && isLoadingUser));
  }, [publicThemesData, userThemesData, isLoadingPublic, isLoadingUser, userId]);
  
  // Handle theme mode changes
  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('themeMode', themeMode);
    
    // Apply correct theme variant
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (themeMode === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System - check media preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [themeMode]);
  
  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);
  
  // Function to set the current theme
  const setTheme = (theme: Theme) => {
    // Record usage if theme is not the default
    if (theme.id !== 0) {
      recordUsage(theme.id);
    }
    
    // Set the theme state
    setCurrentTheme(theme);
    
    // Save theme to localStorage
    localStorage.setItem('currentTheme', JSON.stringify(theme));
    
    // Apply the theme to the DOM
    applyThemeToDOM(theme);
  };
  
  // Function to refresh themes from the server
  const refreshThemes = () => {
    refetchPublic();
    if (userId) {
      refetchUser();
    }
  };
  
  // Function to apply theme CSS variables to the document
  const applyThemeToDOM = (theme: Theme) => {
    // Get the root element
    const root = document.documentElement;
    
    // Set basic color variables
    root.style.setProperty('--color-primary', theme.primaryColor || '#3b82f6');
    root.style.setProperty('--color-accent', theme.accentColor || '#10b981');
    root.style.setProperty('--color-background', theme.backgroundColor || '#ffffff');
    root.style.setProperty('--color-text', theme.textColor || '#111827');
    root.style.setProperty('--font-family', theme.fontFamily || 'Inter, sans-serif');
    root.style.setProperty('--border-radius', theme.borderRadius || '4px');
    
    // Apply advanced token values if available
    if (theme.tokens && typeof theme.tokens === 'object') {
      Object.entries(theme.tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--${key}`, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects like 'colors.primary.500'
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue === 'string') {
              root.style.setProperty(`--${key}-${nestedKey}`, nestedValue);
            }
          });
        }
      });
    }
  };
  
  // Context value
  const contextValue: ThemeContextType = {
    currentTheme,
    themeMode,
    isLoading,
    userThemes,
    publicThemes,
    setTheme,
    setThemeMode,
    applyThemeToDOM,
    refreshThemes
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;