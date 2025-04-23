import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type ContrastType = 'default' | 'high' | 'dark';

interface AccessibilityContextType {
  // Accessibility panel state
  isAccessibilityOpen: boolean;
  openAccessibilityPanel: () => void;
  closeAccessibilityPanel: () => void;
  
  // Text size
  textSize: number;
  setTextSize: (size: number) => void;
  
  // Contrast
  contrast: ContrastType;
  setContrast: (contrast: ContrastType) => void;
  
  // Reduced motion
  reducedMotion: boolean;
  setReducedMotion: (reducedMotion: boolean) => void;
  toggleReducedMotion: () => void;
  
  // Voice navigation
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Auto-hide navigation
  autoHideNav: boolean;
  setAutoHideNav: (autoHide: boolean) => void;
}

const defaultValues: AccessibilityContextType = {
  isAccessibilityOpen: false,
  openAccessibilityPanel: () => {},
  closeAccessibilityPanel: () => {},
  
  textSize: 100,
  setTextSize: () => {},
  
  contrast: 'default',
  setContrast: () => {},
  
  reducedMotion: false,
  setReducedMotion: () => {},
  toggleReducedMotion: () => {},
  
  voiceEnabled: false,
  setVoiceEnabled: () => {},
  
  autoHideNav: true,
  setAutoHideNav: () => {},
};

const AccessibilityContext = createContext<AccessibilityContextType>(defaultValues);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [textSize, setTextSizeState] = useState(100);
  const [contrast, setContrastState] = useState<ContrastType>('default');
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState(false);
  const [autoHideNav, setAutoHideNavState] = useState(true);
  
  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('accessibility_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.textSize) setTextSizeState(parsed.textSize);
        if (parsed.contrast) setContrastState(parsed.contrast);
        if (parsed.reducedMotion !== undefined) setReducedMotionState(parsed.reducedMotion);
        if (parsed.voiceEnabled !== undefined) setVoiceEnabledState(parsed.voiceEnabled);
        if (parsed.autoHideNav !== undefined) setAutoHideNavState(parsed.autoHideNav);
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);
  
  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify({
        textSize,
        contrast,
        reducedMotion,
        voiceEnabled,
        autoHideNav,
      }));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }, [textSize, contrast, reducedMotion, voiceEnabled, autoHideNav]);
  
  // Panel controls
  const openAccessibilityPanel = useCallback(() => {
    setIsAccessibilityOpen(true);
  }, []);
  
  const closeAccessibilityPanel = useCallback(() => {
    setIsAccessibilityOpen(false);
  }, []);
  
  // Text size control
  const setTextSize = useCallback((size: number) => {
    const clamped = Math.min(Math.max(size, 75), 200);
    setTextSizeState(clamped);
  }, []);
  
  // Contrast control
  const setContrast = useCallback((value: ContrastType) => {
    setContrastState(value);
  }, []);
  
  // Reduced motion controls
  const setReducedMotion = useCallback((value: boolean) => {
    setReducedMotionState(value);
  }, []);
  
  const toggleReducedMotion = useCallback(() => {
    setReducedMotionState(prev => !prev);
  }, []);
  
  // Voice control
  const setVoiceEnabled = useCallback((value: boolean) => {
    setVoiceEnabledState(value);
  }, []);
  
  // Auto-hide nav control
  const setAutoHideNav = useCallback((value: boolean) => {
    setAutoHideNavState(value);
  }, []);
  
  // Accessibility context value
  const value = {
    isAccessibilityOpen,
    openAccessibilityPanel,
    closeAccessibilityPanel,
    
    textSize,
    setTextSize,
    
    contrast,
    setContrast,
    
    reducedMotion,
    setReducedMotion,
    toggleReducedMotion,
    
    voiceEnabled,
    setVoiceEnabled,
    
    autoHideNav,
    setAutoHideNav,
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);