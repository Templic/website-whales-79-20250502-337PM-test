import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  // Text size settings
  textSize: number;
  setTextSize: (size: number) => void;
  
  // Display settings
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  customColors: boolean;
  setCustomColors: (enabled: boolean) => void;
  
  // Motion settings
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  
  // Sound settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Panel state
  isPanelOpen: boolean;
  toggleAccessibilityPanel: () => void;
  
  // Presets
  applyDefaultSettings: () => void;
  applyHighContrastSettings: () => void;
  applyEasierReadingSettings: () => void;
  applyReducedMotionSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Text size settings
  const [textSize, setTextSizeState] = useState<number>(1);
  
  // Display settings
  const [darkMode, setDarkModeState] = useState<boolean>(true);
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [customColors, setCustomColorsState] = useState<boolean>(false);
  
  // Motion settings
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);
  
  // Sound settings
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(false);
  
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('accessibility-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Apply saved settings
          if (parsedSettings.textSize !== undefined) setTextSizeState(parsedSettings.textSize);
          if (parsedSettings.darkMode !== undefined) setDarkModeState(parsedSettings.darkMode);
          if (parsedSettings.highContrast !== undefined) setHighContrastState(parsedSettings.highContrast);
          if (parsedSettings.customColors !== undefined) setCustomColorsState(parsedSettings.customColors);
          if (parsedSettings.reducedMotion !== undefined) setReducedMotionState(parsedSettings.reducedMotion);
          if (parsedSettings.soundEnabled !== undefined) setSoundEnabledState(parsedSettings.soundEnabled);
          if (parsedSettings.voiceEnabled !== undefined) setVoiceEnabledState(parsedSettings.voiceEnabled);
        }
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    // Skip saving on initial render
    const saveSettings = () => {
      try {
        const settings = {
          textSize,
          darkMode,
          highContrast,
          customColors,
          reducedMotion,
          soundEnabled,
          voiceEnabled
        };
        localStorage.setItem('accessibility-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving accessibility settings:', error);
      }
    };
    
    saveSettings();
  }, [textSize, darkMode, highContrast, customColors, reducedMotion, soundEnabled, voiceEnabled]);
  
  // Apply settings to the document
  useEffect(() => {
    // Apply text size
    document.documentElement.style.setProperty('--text-size-factor', textSize.toString());
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    
    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    
    // Apply custom colors
    if (customColors) {
      document.documentElement.classList.add('theme-cosmic');
    } else {
      document.documentElement.classList.remove('theme-cosmic');
    }
  }, [textSize, darkMode, highContrast, customColors, reducedMotion]);
  
  // Setter functions with localStorage persistence
  const setTextSize = (size: number) => {
    setTextSizeState(size);
  };
  
  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
  };
  
  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
  };
  
  const setCustomColors = (enabled: boolean) => {
    setCustomColorsState(enabled);
  };
  
  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
  };
  
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
  };
  
  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
  };
  
  const toggleAccessibilityPanel = () => {
    setIsPanelOpen(prev => !prev);
  };
  
  // Preset configurations
  const applyDefaultSettings = () => {
    setTextSize(1);
    setDarkMode(true);
    setHighContrast(false);
    setCustomColors(false);
    setReducedMotion(false);
    setSoundEnabled(true);
    setVoiceEnabled(false);
  };
  
  const applyHighContrastSettings = () => {
    setTextSize(1);
    setDarkMode(true);
    setHighContrast(true);
    setCustomColors(false);
    setReducedMotion(false);
  };
  
  const applyEasierReadingSettings = () => {
    setTextSize(1.15);
    setDarkMode(true);
    setHighContrast(true);
    setCustomColors(false);
    setReducedMotion(false);
  };
  
  const applyReducedMotionSettings = () => {
    setReducedMotion(true);
    setSoundEnabled(false);
  };
  
  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        darkMode,
        setDarkMode,
        highContrast,
        setHighContrast,
        customColors,
        setCustomColors,
        reducedMotion,
        setReducedMotion,
        soundEnabled,
        setSoundEnabled,
        voiceEnabled,
        setVoiceEnabled,
        isPanelOpen,
        toggleAccessibilityPanel,
        applyDefaultSettings,
        applyHighContrastSettings,
        applyEasierReadingSettings,
        applyReducedMotionSettings
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}