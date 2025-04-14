import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for contrast modes
type ContrastMode = 'default' | 'high' | 'dark';

// Define the context interface
interface AccessibilityContextType {
  // Text size
  textSize: number;
  setTextSize: (size: number) => void;
  
  // Contrast mode
  contrast: ContrastMode;
  setContrast: (mode: ContrastMode) => void;
  
  // Reduced motion
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  
  // Voice features
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Navigation autoHide
  autoHideNav: boolean;
  setAutoHideNav: (autoHide: boolean) => void;
  
  // Panel State
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

// Create the context with default values
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Custom hook to access the context
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Storage key for saved preferences
const STORAGE_KEY = 'cosmic-accessibility-preferences';

// Provider component
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Load saved preferences or use defaults
  const loadSavedPreferences = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading accessibility preferences:', err);
    }
    
    return null;
  };
  
  // Initialize state with saved preferences or defaults
  const savedPrefs = loadSavedPreferences();
  
  const [textSize, setTextSizeState] = useState<number>(savedPrefs?.textSize || 100);
  const [contrast, setContrastState] = useState<ContrastMode>(savedPrefs?.contrast || 'default');
  const [reducedMotion, setReducedMotionState] = useState<boolean>(savedPrefs?.reducedMotion || false);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(savedPrefs?.voiceEnabled || false);
  const [autoHideNav, setAutoHideNavState] = useState<boolean>(savedPrefs?.autoHideNav || true);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  
  // Save preferences when they change
  useEffect(() => {
    const preferences = {
      textSize,
      contrast,
      reducedMotion,
      voiceEnabled,
      autoHideNav,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (err) {
      console.error('Error saving accessibility preferences:', err);
    }
  }, [textSize, contrast, reducedMotion, voiceEnabled, autoHideNav]);
  
  // Apply text size to root element
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize / 100}rem`;
    
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [textSize]);
  
  // Apply contrast mode classes
  useEffect(() => {
    const classList = document.documentElement.classList;
    
    // Remove all contrast classes
    classList.remove('contrast-high', 'contrast-dark');
    
    // Add the current contrast class
    if (contrast === 'high') {
      classList.add('contrast-high');
    } else if (contrast === 'dark') {
      classList.add('contrast-dark');
    }
  }, [contrast]);
  
  // Apply reduced motion preference
  useEffect(() => {
    const classList = document.documentElement.classList;
    
    if (reducedMotion) {
      classList.add('reduce-motion');
    } else {
      classList.remove('reduce-motion');
    }
  }, [reducedMotion]);
  
  // Wrapper functions to update state
  const setTextSize = (size: number) => setTextSizeState(size);
  const setContrast = (mode: ContrastMode) => setContrastState(mode);
  const setReducedMotion = (reduced: boolean) => setReducedMotionState(reduced);
  const setVoiceEnabled = (enabled: boolean) => setVoiceEnabledState(enabled);
  const setAutoHideNav = (autoHide: boolean) => setAutoHideNavState(autoHide);
  
  // Panel control functions
  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);
  const togglePanel = () => setIsPanelOpen(prev => !prev);
  
  // Create context value object
  const contextValue: AccessibilityContextType = {
    textSize,
    setTextSize,
    contrast,
    setContrast,
    reducedMotion,
    setReducedMotion,
    voiceEnabled,
    setVoiceEnabled,
    autoHideNav,
    setAutoHideNav,
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}