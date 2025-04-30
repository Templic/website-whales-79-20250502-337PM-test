import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../../shared/schema';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { useToast } from '@/hooks/use-toast';

interface ThemeContextType {
  currentTheme: Theme | null;
  setCurrentTheme: (theme: Theme) => void;
  isLoading: boolean;
  error: Error | null;
  defaultTheme: Theme | null;
  applyTokensToDocument: (theme: Theme) => void;
  resetToDefaultTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // State for managing the current theme
  const [currentTheme, setCurrentThemeState] = useState<Theme | null>(null);
  const [defaultTheme, setDefaultTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // API hook for fetching themes
  const { useGetThemes } = useThemeAPI();
  
  // Local storage hook for persisting theme selection
  const [storedThemeId, setStoredThemeId] = useLocalStorage<number | null>('theme-id', null);
  
  // Fetch themes from the API
  const { data: themes = [], isLoading: isLoadingThemes, error: themesError } = useGetThemes();
  
  // Initialize the theme based on the stored ID or default
  useEffect(() => {
    if (isLoadingThemes) return;
    
    if (themesError) {
      setError(themesError instanceof Error ? themesError : new Error('Failed to load themes'));
      setIsLoading(false);
      return;
    }
    
    try {
      // Find the default system theme
      const systemDefault = themes.find((theme: Theme) => !theme.userId && theme.isPublic);
      
      if (systemDefault) {
        setDefaultTheme(systemDefault);
      }
      
      // If there's a stored theme ID, try to use that theme
      if (storedThemeId) {
        const savedTheme = themes.find((theme: Theme) => theme.id === storedThemeId);
        
        if (savedTheme) {
          setCurrentThemeState(savedTheme);
          applyTokensToDocument(savedTheme);
        } else {
          // If the stored theme is no longer available, fall back to default
          if (systemDefault) {
            setCurrentThemeState(systemDefault);
            applyTokensToDocument(systemDefault);
            setStoredThemeId(systemDefault.id);
          }
        }
      } else if (systemDefault) {
        // If no theme is stored, use the default
        setCurrentThemeState(systemDefault);
        applyTokensToDocument(systemDefault);
        setStoredThemeId(systemDefault.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred initializing the theme'));
      console.error('Error initializing theme:', err);
    } finally {
      setIsLoading(false);
    }
  }, [themes, isLoadingThemes, themesError, storedThemeId, setStoredThemeId]);
  
  // Set the current theme and persist the selection
  const setCurrentTheme = (theme: Theme) => {
    setCurrentThemeState(theme);
    setStoredThemeId(theme.id);
    applyTokensToDocument(theme);
    
    toast({
      title: 'Theme Applied',
      description: `"${theme.name}" has been applied.`,
    });
  };
  
  // Reset to the default theme
  const resetToDefaultTheme = () => {
    if (defaultTheme) {
      setCurrentThemeState(defaultTheme);
      setStoredThemeId(defaultTheme.id);
      applyTokensToDocument(defaultTheme);
      
      toast({
        title: 'Default Theme Restored',
        description: 'The default theme has been applied.',
      });
    }
  };
  
  // Apply theme tokens to the document
  const applyTokensToDocument = (theme: Theme) => {
    // Get the document root element
    const root = document.documentElement;
    
    // Apply color tokens
    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor);
      root.style.setProperty('--primary-foreground', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff');
    }
    
    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor);
      root.style.setProperty('--accent-foreground', isLightColor(theme.accentColor) ? '#000000' : '#ffffff');
    }
    
    if (theme.backgroundColor) {
      root.style.setProperty('--background', theme.backgroundColor);
    }
    
    if (theme.textColor) {
      root.style.setProperty('--foreground', theme.textColor);
    }
    
    // Apply border radius if specified
    if (theme.borderRadius) {
      root.style.setProperty('--radius', theme.borderRadius);
    }
    
    // Apply font family if specified
    if (theme.fontFamily) {
      root.style.setProperty('--font-family', theme.fontFamily);
    }
    
    // Apply any other custom tokens from the theme
    if (theme.tokens) {
      try {
        const tokens = typeof theme.tokens === 'string' 
          ? JSON.parse(theme.tokens)
          : theme.tokens;
          
        Object.entries(tokens).forEach(([key, value]) => {
          if (typeof value === 'string') {
            root.style.setProperty(`--${key}`, value);
          }
        });
      } catch (err) {
        console.error('Error parsing theme tokens:', err);
      }
    }
  };
  
  // Helper to determine if a color is light or dark
  const isLightColor = (color: string): boolean => {
    // Remove the hash if it exists
    color = color.replace('#', '');
    
    // Handle hex shorthand (e.g. #FFF)
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // YIQ equation to determine brightness
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
  };
  
  const contextValue: ThemeContextType = {
    currentTheme,
    setCurrentTheme,
    isLoading,
    error,
    defaultTheme,
    applyTokensToDocument,
    resetToDefaultTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;