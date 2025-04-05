import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  // Text size
  textSize: number;
  setTextSize: (size: number) => void;
  
  // Contrast
  contrast: 'default' | 'high' | 'dark';
  setContrast: (mode: 'default' | 'high' | 'dark') => void;
  
  // Motion
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  
  // Voice control
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Navigation auto-hide
  autoHideNav: boolean;
  setAutoHideNav: (autoHide: boolean) => void;
  
  // Panel controls
  isAccessibilityOpen: boolean;
  openAccessibilityPanel: () => void;
  closeAccessibilityPanel: () => void;
  toggleAccessibilityPanel: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Core accessibility settings
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('accessibility-text-size');
    return saved ? parseInt(saved, 10) : 100;
  });
  
  const [contrast, setContrast] = useState<'default' | 'high' | 'dark'>(() => {
    const saved = localStorage.getItem('accessibility-contrast');
    return (saved as 'default' | 'high' | 'dark') || 'default';
  });
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('accessibility-reduced-motion');
    return saved === 'true';
  });
  
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('accessibility-voice-enabled');
    return saved === 'true';
  });
  
  // Navigation settings
  const [autoHideNav, setAutoHideNav] = useState(() => {
    const saved = localStorage.getItem('accessibility-auto-hide-nav');
    // Default to true for auto-hiding navigation
    return saved ? saved === 'true' : true;
  });
  
  // Panel state
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  
  // Text size effect
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}%`;
    localStorage.setItem('accessibility-text-size', textSize.toString());
    
    return () => {
      document.documentElement.style.fontSize = "100%";
    };
  }, [textSize]);
  
  // Contrast effect
  useEffect(() => {
    if (contrast === "high") {
      document.documentElement.classList.add("high-contrast");
      document.documentElement.classList.remove("dark-mode");
    } else if (contrast === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast", "dark-mode");
    }
    
    localStorage.setItem('accessibility-contrast', contrast);
    
    return () => {
      document.documentElement.classList.remove("high-contrast", "dark-mode");
    };
  }, [contrast]);
  
  // Reduced motion effect
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
    
    localStorage.setItem('accessibility-reduced-motion', reducedMotion.toString());
    
    return () => {
      document.documentElement.classList.remove("reduced-motion");
    };
  }, [reducedMotion]);
  
  // Save voice preference
  useEffect(() => {
    localStorage.setItem('accessibility-voice-enabled', voiceEnabled.toString());
  }, [voiceEnabled]);
  
  // Save nav auto-hide preference
  useEffect(() => {
    localStorage.setItem('accessibility-auto-hide-nav', autoHideNav.toString());
    
    // Add or remove auto-hide class on the navigation
    if (autoHideNav) {
      document.documentElement.classList.add("nav-auto-hide");
    } else {
      document.documentElement.classList.remove("nav-auto-hide");
    }
  }, [autoHideNav]);
  
  // Panel control functions
  const openAccessibilityPanel = () => setIsAccessibilityOpen(true);
  const closeAccessibilityPanel = () => setIsAccessibilityOpen(false);
  const toggleAccessibilityPanel = () => setIsAccessibilityOpen(prev => !prev);
  
  const value = {
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
    isAccessibilityOpen,
    openAccessibilityPanel,
    closeAccessibilityPanel,
    toggleAccessibilityPanel,
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}