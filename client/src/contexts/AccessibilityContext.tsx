import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define accessibility preferences interface
interface AccessibilityPreferences {
  textSize: 'normal' | 'large' | 'larger';
  contrast: 'default' | 'high' | 'inverted';
  reducedMotion: boolean;
  voiceEnabled: boolean;
}

// Define the context value interface
interface AccessibilityContextValue {
  // Preferences
  textSize: 'normal' | 'large' | 'larger';
  contrast: 'default' | 'high' | 'inverted';
  reducedMotion: boolean;
  voiceEnabled: boolean;
  
  // Panel state
  isPanelOpen: boolean;
  
  // Methods
  setTextSize: (size: 'normal' | 'large' | 'larger') => void;
  setContrast: (contrast: 'default' | 'high' | 'inverted') => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  togglePanel: () => void;
  
  // CSS classes based on current settings
  textSizeClass: string;
  contrastClass: string;
}

// Create the context
const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

// Define props for provider component
interface AccessibilityProviderProps {
  children: ReactNode;
}

// Local storage key
const STORAGE_KEY = 'cosmic-accessibility-preferences';

// Default preferences
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textSize: 'normal',
  contrast: 'default',
  reducedMotion: false,
  voiceEnabled: false
};

// Provider component
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  // Initialize state with defaults or saved preferences
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem(STORAGE_KEY);
      if (savedPrefs) {
        try {
          return JSON.parse(savedPrefs) as AccessibilityPreferences;
        } catch (e) {
          console.error('Failed to parse saved accessibility preferences:', e);
        }
      }
    }
    return DEFAULT_PREFERENCES;
  });
  
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Extract individual preferences
  const { textSize, contrast, reducedMotion, voiceEnabled } = preferences;
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences]);
  
  // Apply reduced motion preference to body
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (reducedMotion) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    }
  }, [reducedMotion]);
  
  // Apply contrast preference to body
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove all contrast classes first
      document.body.classList.remove('contrast-default', 'contrast-high', 'contrast-inverted');
      // Add the current contrast class
      document.body.classList.add(`contrast-${contrast}`);
    }
  }, [contrast]);
  
  // Methods to update preferences
  const setTextSize = useCallback((size: 'normal' | 'large' | 'larger') => {
    setPreferences(prev => ({ ...prev, textSize: size }));
  }, []);
  
  const setContrast = useCallback((newContrast: 'default' | 'high' | 'inverted') => {
    setPreferences(prev => ({ ...prev, contrast: newContrast }));
  }, []);
  
  const setReducedMotion = useCallback((value: boolean) => {
    setPreferences(prev => ({ ...prev, reducedMotion: value }));
  }, []);
  
  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => ({ ...prev, voiceEnabled: enabled }));
  }, []);
  
  // Toggle accessibility panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);
  
  // Compute CSS classes based on settings
  const textSizeClass = `text-size-${textSize}`;
  const contrastClass = `contrast-${contrast}`;
  
  // Context value
  const value: AccessibilityContextValue = {
    textSize,
    contrast,
    reducedMotion,
    voiceEnabled,
    isPanelOpen,
    setTextSize,
    setContrast,
    setReducedMotion,
    setVoiceEnabled,
    togglePanel,
    textSizeClass,
    contrastClass
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Custom hook for using the context
export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}