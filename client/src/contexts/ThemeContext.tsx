import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../../shared/schema';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { useLocalStorage } from '@/hooks/use-local-storage';

type ThemeContextType = {
  currentTheme: Theme | null;
  setCurrentTheme: (theme: Theme) => void;
  isLoading: boolean;
  availableThemes: Theme[];
  systemThemes: Theme[];
  userThemes: Theme[];
  publicThemes: Theme[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme,
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme || null);
  const [storedThemeId, setStoredThemeId] = useLocalStorage<number | null>('themeId', null);
  
  const { useGetThemes } = useThemeAPI();
  const { data: themes = [], isLoading } = useGetThemes();
  
  // Filter themes into different categories
  const systemThemes = themes.filter((theme: Theme) => !theme.userId);
  const userThemes = themes.filter((theme: Theme) => theme.userId);
  const publicThemes = themes.filter((theme: Theme) => theme.isPublic);
  
  // Load theme from local storage on initial load
  useEffect(() => {
    if (storedThemeId && themes.length > 0) {
      const savedTheme = themes.find((theme: Theme) => theme.id === storedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, [storedThemeId, themes]);
  
  // Update stored theme ID when current theme changes
  useEffect(() => {
    if (currentTheme) {
      setStoredThemeId(currentTheme.id);
      
      // Apply theme to document
      applyThemeToDocument(currentTheme);
    }
  }, [currentTheme, setStoredThemeId]);
  
  // Helper function to apply theme to document
  const applyThemeToDocument = (theme: Theme) => {
    // Apply CSS custom properties to the document root
    const root = document.documentElement;
    
    // Basic colors
    root.style.setProperty('--theme-primary', theme.primaryColor || '#3b82f6');
    root.style.setProperty('--theme-accent', theme.accentColor || '#10b981');
    root.style.setProperty('--theme-background', theme.backgroundColor || '#ffffff');
    root.style.setProperty('--theme-text', theme.textColor || '#111827');
    
    // Border radius
    root.style.setProperty('--theme-radius', theme.borderRadius || '0.5rem');
    
    // Font family
    if (theme.fontFamily) {
      root.style.setProperty('--theme-font-family', theme.fontFamily);
    }
    
    // Apply any additional tokens from the tokens object
    if (theme.tokens) {
      Object.entries(theme.tokens).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
    
    // Add a theme class to the body for other styling hooks
    document.body.className = document.body.className
      .split(' ')
      .filter(className => !className.startsWith('theme-'))
      .join(' ');
      
    document.body.classList.add(`theme-${theme.id}`);
  };
  
  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setCurrentTheme,
        isLoading,
        availableThemes: themes,
        systemThemes,
        userThemes,
        publicThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};