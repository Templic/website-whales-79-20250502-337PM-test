import React, { createContext, useContext, useState, useEffect } from 'react';

type Contrast = 'default' | 'high' | 'dark';

type AccessibilityContextType = {
  // Text Size
  textSize: number;
  setTextSize: (size: number) => void;
  
  // Contrast
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
  
  // Reduced Motion
  reducedMotion: boolean;
  setReducedMotion: (reducedMotion: boolean) => void;
  
  // Voice Navigation
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Auto Hide Navigation 
  autoHideNav: boolean;
  setAutoHideNav: (autoHide: boolean) => void;
  
  // Panel State
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [textSize, setTextSize] = useState<number>(() => {
    const saved = localStorage.getItem('accessibilityTextSize');
    return saved ? parseInt(saved, 10) : 100;
  });
  
  const [contrast, setContrast] = useState<Contrast>(() => {
    const saved = localStorage.getItem('accessibilityContrast');
    return (saved as Contrast) || 'default';
  });
  
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('accessibilityReducedMotion');
    return saved ? saved === 'true' : false;
  });
  
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('accessibilityVoiceEnabled');
    return saved ? saved === 'true' : false;
  });
  
  const [autoHideNav, setAutoHideNav] = useState<boolean>(() => {
    const saved = localStorage.getItem('accessibilityAutoHideNav');
    return saved ? saved === 'true' : true; // Default to true
  });
  
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibilityTextSize', textSize.toString());
    document.documentElement.style.setProperty('--accessibility-text-scale', `${textSize / 100}`);
  }, [textSize]);
  
  useEffect(() => {
    localStorage.setItem('accessibilityContrast', contrast);
    // Apply contrast classes to root element
    const root = document.documentElement;
    root.classList.remove('contrast-default', 'contrast-high', 'contrast-dark');
    root.classList.add(`contrast-${contrast}`);
  }, [contrast]);
  
  useEffect(() => {
    localStorage.setItem('accessibilityReducedMotion', reducedMotion.toString());
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);
  
  useEffect(() => {
    localStorage.setItem('accessibilityVoiceEnabled', voiceEnabled.toString());
    // Initialize voice recognition if enabled
    if (voiceEnabled) {
      // Voice recognition logic would go here
      console.log('Voice navigation enabled');
    }
  }, [voiceEnabled]);
  
  useEffect(() => {
    localStorage.setItem('accessibilityAutoHideNav', autoHideNav.toString());
  }, [autoHideNav]);
  
  // Panel toggle functions
  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);
  const togglePanel = () => setIsPanelOpen(prev => !prev);
  
  // Set reduced motion based on user's OS preference on initial load
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && localStorage.getItem('accessibilityReducedMotion') === null) {
      setReducedMotion(true);
    }
    
    // Check for OS contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    if (highContrastQuery.matches && localStorage.getItem('accessibilityContrast') === null) {
      setContrast('high');
    }
    
    // Check for dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeQuery.matches && localStorage.getItem('accessibilityContrast') === null) {
      setContrast('dark');
    }
  }, []);
  
  // Listen for OS changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (localStorage.getItem('accessibilityReducedMotion') === null) {
        setReducedMotion(mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Create context value
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
    togglePanel
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
};

export default AccessibilityContext;