import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface AccessibilityContextType {
  // High contrast mode
  highContrast: boolean;
  setHighContrast: (highContrast: boolean) => void;
  toggleHighContrast: () => void;
  
  // Reduced motion
  reducedMotion: boolean;
  setReducedMotion: (reducedMotion: boolean) => void;
  toggleReducedMotion: () => void;
  
  // Text size adjustments
  textSizeScale: number;
  setTextSizeScale: (scale: number) => void;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  resetTextSize: () => void;
  
  // Screen reader support
  screenReaderMode: boolean;
  setScreenReaderMode: (screenReaderMode: boolean) => void;
  toggleScreenReaderMode: () => void;
  
  // Update the entire settings object at once
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
}

// Separate interface for the settings structure
interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  textSizeScale: number;
  screenReaderMode: boolean;
}

// Default values for accessibility settings
const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  textSizeScale: 1,
  screenReaderMode: false,
};

// Storage key for persisting settings
const STORAGE_KEY = 'accessibility_settings';

// Create context with default values
const AccessibilityContext = createContext<AccessibilityContextType>({
  highContrast: defaultSettings.highContrast,
  setHighContrast: () => {},
  toggleHighContrast: () => {},
  
  reducedMotion: defaultSettings.reducedMotion,
  setReducedMotion: () => {},
  toggleReducedMotion: () => {},
  
  textSizeScale: defaultSettings.textSizeScale,
  setTextSizeScale: () => {},
  increaseTextSize: () => {},
  decreaseTextSize: () => {},
  resetTextSize: () => {},
  
  screenReaderMode: defaultSettings.screenReaderMode,
  setScreenReaderMode: () => {},
  toggleScreenReaderMode: () => {},
  
  updateAccessibilitySettings: () => {},
});

// Provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load saved settings from localStorage, or use defaults
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Failed to parse accessibility settings from localStorage', error);
      return defaultSettings;
    }
  });
  
  // Check for user's system preferences for reduced motion and high contrast
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
    
    // Check for prefers-contrast: more (high contrast)
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');
    if (prefersHighContrast.matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
    
    // Apply initial CSS variables
    updateCssVariables(settings.textSizeScale);
  }, []);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      updateCssVariables(settings.textSizeScale);
    } catch (error) {
      console.error('Failed to save accessibility settings to localStorage', error);
    }
  }, [settings]);
  
  // Function to update CSS variables for text size
  const updateCssVariables = (scale: number) => {
    document.documentElement.style.setProperty('--text-size-scale', scale.toString());
  };
  
  // High contrast methods
  const setHighContrast = useCallback((highContrast: boolean) => {
    setSettings(prev => ({ ...prev, highContrast }));
  }, []);
  
  const toggleHighContrast = useCallback(() => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);
  
  // Reduced motion methods
  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion }));
  }, []);
  
  const toggleReducedMotion = useCallback(() => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);
  
  // Text size methods
  const setTextSizeScale = useCallback((textSizeScale: number) => {
    const clamped = Math.min(Math.max(textSizeScale, 0.8), 1.5);
    setSettings(prev => ({ ...prev, textSizeScale: clamped }));
  }, []);
  
  const increaseTextSize = useCallback(() => {
    setSettings(prev => {
      const newScale = Math.min(prev.textSizeScale + 0.1, 1.5);
      return { ...prev, textSizeScale: newScale };
    });
  }, []);
  
  const decreaseTextSize = useCallback(() => {
    setSettings(prev => {
      const newScale = Math.max(prev.textSizeScale - 0.1, 0.8);
      return { ...prev, textSizeScale: newScale };
    });
  }, []);
  
  const resetTextSize = useCallback(() => {
    setSettings(prev => ({ ...prev, textSizeScale: 1 }));
  }, []);
  
  // Screen reader support methods
  const setScreenReaderMode = useCallback((screenReaderMode: boolean) => {
    setSettings(prev => ({ ...prev, screenReaderMode }));
  }, []);
  
  const toggleScreenReaderMode = useCallback(() => {
    setSettings(prev => ({ ...prev, screenReaderMode: !prev.screenReaderMode }));
  }, []);
  
  // Update all settings at once
  const updateAccessibilitySettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Combine all methods and settings
  const value = {
    highContrast: settings.highContrast,
    setHighContrast,
    toggleHighContrast,
    
    reducedMotion: settings.reducedMotion,
    setReducedMotion,
    toggleReducedMotion,
    
    textSizeScale: settings.textSizeScale,
    setTextSizeScale,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize,
    
    screenReaderMode: settings.screenReaderMode,
    setScreenReaderMode,
    toggleScreenReaderMode,
    
    updateAccessibilitySettings,
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook for using the accessibility context
export const useAccessibility = () => useContext(AccessibilityContext);

export default AccessibilityContext;