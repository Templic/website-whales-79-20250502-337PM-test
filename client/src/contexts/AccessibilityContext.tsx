import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the accessibility preferences interface
interface AccessibilityPreferences {
  textSize: number;      // 1 = normal, 0.85 = small, 1.15 = large, 1.3 = x-large
  highContrast: boolean; // Higher contrast mode
  reducedMotion: boolean; // Reduced animations
  voiceEnabled: boolean; // Text-to-speech for compatible content
  soundEnabled: boolean; // Background sounds and effects
  customColors: boolean; // Allow custom color schemes
  
  // Visual preferences
  darkMode: boolean;     // Dark mode preference 
  
  // Panel state
  isAccessibilityPanelOpen: boolean; // Whether the accessibility panel is open
}

// Define context interface with state and updater functions
interface AccessibilityContextType {
  // State
  textSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  customColors: boolean;
  darkMode: boolean;
  isAccessibilityPanelOpen: boolean;
  
  // Actions
  setTextSize: (size: number) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCustomColors: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  toggleAccessibilityPanel: () => void;
  
  // Presets
  applyDefaultSettings: () => void;
  applyHighContrastSettings: () => void;
  applyEasierReadingSettings: () => void;
  applyReducedMotionSettings: () => void;
}

// Create the context with a default undefined value
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Hook for consuming the context
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
}

// Default accessibility preferences
const defaultPreferences: AccessibilityPreferences = {
  textSize: 1,
  highContrast: false,
  reducedMotion: false,
  voiceEnabled: false,
  soundEnabled: true,
  customColors: false,
  darkMode: true,
  isAccessibilityPanelOpen: false,
};

// Provider component that wraps the app
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Try to load preferences from localStorage, otherwise use defaults
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('accessibility-preferences');
      return savedPreferences 
        ? { ...defaultPreferences, ...JSON.parse(savedPreferences) }
        : defaultPreferences;
    }
    return defaultPreferences;
  });
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    }
  }, [preferences]);
  
  // Apply CSS variables for text size
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--text-size-factor', preferences.textSize.toString());
      
      // Apply classes for other preferences
      if (preferences.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      if (preferences.reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
      
      if (preferences.darkMode) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    }
  }, [preferences.textSize, preferences.highContrast, preferences.reducedMotion, preferences.darkMode]);
  
  // Setting updater functions
  const setTextSize = (size: number) => {
    setPreferences(prev => ({ ...prev, textSize: size }));
  };
  
  const setHighContrast = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, highContrast: enabled }));
  };
  
  const setReducedMotion = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, reducedMotion: enabled }));
  };
  
  const setVoiceEnabled = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, voiceEnabled: enabled }));
  };
  
  const setSoundEnabled = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, soundEnabled: enabled }));
  };
  
  const setCustomColors = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, customColors: enabled }));
  };
  
  const setDarkMode = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, darkMode: enabled }));
  };
  
  const toggleAccessibilityPanel = () => {
    setPreferences(prev => ({
      ...prev,
      isAccessibilityPanelOpen: !prev.isAccessibilityPanelOpen
    }));
  };
  
  // Preset setting functions
  const applyDefaultSettings = () => {
    setPreferences({
      ...defaultPreferences,
      isAccessibilityPanelOpen: preferences.isAccessibilityPanelOpen
    });
  };
  
  const applyHighContrastSettings = () => {
    setPreferences(prev => ({
      ...prev,
      highContrast: true,
      textSize: 1.15,
      customColors: true
    }));
  };
  
  const applyEasierReadingSettings = () => {
    setPreferences(prev => ({
      ...prev,
      textSize: 1.15,
      highContrast: true,
      reducedMotion: true
    }));
  };
  
  const applyReducedMotionSettings = () => {
    setPreferences(prev => ({
      ...prev,
      reducedMotion: true,
      soundEnabled: false
    }));
  };
  
  // Construct the value object
  const value: AccessibilityContextType = {
    ...preferences,
    setTextSize,
    setHighContrast,
    setReducedMotion,
    setVoiceEnabled,
    setSoundEnabled,
    setCustomColors,
    setDarkMode,
    toggleAccessibilityPanel,
    applyDefaultSettings,
    applyHighContrastSettings,
    applyEasierReadingSettings,
    applyReducedMotionSettings
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}